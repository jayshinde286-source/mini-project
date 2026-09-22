package edu.spit.cache.persistence;

import edu.spit.cache.core.CacheEngine;
import edu.spit.cache.core.CacheEntry;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/** Restores a snapshot and replays only valid standalone or committed transaction records. */
public final class RecoveryManager {
    private RecoveryManager() { }

    public static RecoveryReport recover(
            WriteAheadLog wal,
            SnapshotManager snapshots,
            CacheEngine engine,
            long nowEpochMillis) throws IOException {

        SnapshotData snapshot = snapshots.read();
        wal.ensureMinimumSequence(snapshot.lastWalSequence());
        int snapshotRestored = 0;
        int expiredSkipped = 0;
        for (CacheEntry entry : snapshot.entries().values()) {
            if (entry.isExpired(nowEpochMillis)) {
                expiredSkipped++;
            } else {
                engine.put(entry);
                snapshotRestored++;
            }
        }

        WalReadResult read = wal.readAll();
        Map<String, List<WalRecord>> transactionOperations = new HashMap<>();
        Map<String, WalRecord> commitRecords = new HashMap<>();
        Set<String> aborted = new HashSet<>();
        for (WalRecord record : read.records()) {
            if (record.sequence() <= snapshot.lastWalSequence()) continue;
            if (record.operation() == WalOperation.TX_SET || record.operation() == WalOperation.TX_DELETE) {
                transactionOperations.computeIfAbsent(record.transactionId(), ignored -> new ArrayList<>()).add(record);
            }
            if (record.operation() == WalOperation.COMMIT) commitRecords.put(record.transactionId(), record);
            if (record.operation() == WalOperation.ABORT) aborted.add(record.transactionId());
        }
        Set<String> committed = new HashSet<>();
        int rejectedBatches = 0;
        int legacyBatches = 0;
        for (Map.Entry<String, WalRecord> commit : commitRecords.entrySet()) {
            String transactionId = commit.getKey();
            if (aborted.contains(transactionId)) continue;
            List<WalRecord> operations = transactionOperations.getOrDefault(transactionId, List.of());
            TransactionBatchIntegrity.Validation validation =
                    TransactionBatchIntegrity.validate(operations, commit.getValue().value());
            if (validation == TransactionBatchIntegrity.Validation.INVALID) {
                rejectedBatches++;
            } else {
                committed.add(transactionId);
                if (validation == TransactionBatchIntegrity.Validation.LEGACY_UNVERIFIED) legacyBatches++;
            }
        }

        int applied = 0;
        int incompleteSkipped = 0;
        for (WalRecord record : read.records()) {
            if (record.sequence() <= snapshot.lastWalSequence()) continue;
            boolean transactional = !"-".equals(record.transactionId());
            boolean transactionData = record.operation() == WalOperation.TX_SET || record.operation() == WalOperation.TX_DELETE;
            if (transactional && transactionData && !committed.contains(record.transactionId())) {
                incompleteSkipped++;
                continue;
            }
            switch (record.operation()) {
                case SET, CAS, TX_SET -> {
                    if (record.expiresAtEpochMillis() > 0 && nowEpochMillis >= record.expiresAtEpochMillis()) {
                        engine.delete(record.key(), record.sequence());
                        expiredSkipped++;
                    } else {
                        engine.put(new CacheEntry(
                                record.key(), record.value(), record.sequence(),
                                record.timestampEpochMillis(), record.expiresAtEpochMillis()));
                        applied++;
                    }
                }
                case DELETE, EXPIRE, TX_DELETE -> {
                    engine.delete(record.key(), record.sequence());
                    applied++;
                }
                default -> { }
            }
        }
        return new RecoveryReport(
                snapshotRestored,
                applied,
                incompleteSkipped,
                rejectedBatches,
                legacyBatches,
                expiredSkipped,
                read.malformedRecords(),
                read.checksumFailures(),
                snapshot.lastWalSequence(),
                wal.lastSequence());
    }
}
