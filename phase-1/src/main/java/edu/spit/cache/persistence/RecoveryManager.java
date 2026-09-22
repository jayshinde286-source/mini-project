package edu.spit.cache.persistence;

import edu.spit.cache.core.CacheEngine;
import edu.spit.cache.core.CacheEntry;

import java.io.IOException;
import java.util.Comparator;
import java.util.List;

/** Responsible for replaying the Write-Ahead Log to rebuild in-memory cache state upon startup. */
public final class RecoveryManager {
    public RecoveryReport replayWal(WriteAheadLog wal, CacheEngine engine) throws IOException {
        long start = System.currentTimeMillis();
        WalReadResult readResult = wal.readAll();
        
        engine.clear();
        int applied = 0;

        List<WalRecord> sortedRecords = readResult.records().stream()
                .sorted(Comparator.comparingLong(WalRecord::sequence))
                .toList();

        long now = System.currentTimeMillis();

        for (WalRecord rec : sortedRecords) {
            switch (rec.operation()) {
                case PUT -> {
                    if (rec.expiresAtEpochMillis() == 0 || rec.expiresAtEpochMillis() > now) {
                        CacheEntry entry = CacheEntry.of(
                                rec.key(),
                                rec.value(),
                                rec.sequence(),
                                (rec.expiresAtEpochMillis() > 0) ? (rec.expiresAtEpochMillis() - rec.timestamp()) : 0L
                        );
                        engine.put(entry);
                        applied++;
                    }
                }
                case DELETE -> {
                    engine.delete(rec.key());
                    applied++;
                }
                case CLEAR -> {
                    engine.clear();
                    applied++;
                }
            }
        }

        List<CacheEntry> expiredPurged = engine.purgeExpired(now);
        long elapsed = System.currentTimeMillis() - start;

        return new RecoveryReport(
                readResult.validCount() + readResult.corruptedCount(),
                applied,
                readResult.corruptedCount(),
                expiredPurged.size(),
                elapsed,
                readResult.errors()
        );
    }
}
