package edu.spit.cache.transaction;

import edu.spit.cache.core.CacheEngine;
import edu.spit.cache.core.CacheEntry;
import edu.spit.cache.event.CacheEventType;
import edu.spit.cache.event.EventBus;
import edu.spit.cache.persistence.WalDraft;
import edu.spit.cache.persistence.WalOperation;
import edu.spit.cache.persistence.WalRecord;
import edu.spit.cache.persistence.WriteAheadLog;
import edu.spit.cache.persistence.TransactionBatchIntegrity;

import java.io.IOException;
import java.util.ArrayList;
import java.util.ConcurrentModificationException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.locks.ReentrantLock;

/** Buffered transactions with exclusive key locks, timeouts, atomic WAL batches, and event emission. */
public final class TransactionManager {
    private final CacheEngine engine;
    private final WriteAheadLog wal;
    private final EventBus events;
    private final ReentrantLock mutationLock;
    private final long timeoutMillis;
    private final Map<String, Transaction> active = new HashMap<>();
    private final Map<String, String> owners = new HashMap<>();
    private final AtomicLong transactionSequence = new AtomicLong();
    private final ReentrantLock mutex = new ReentrantLock(true);

    public TransactionManager(
            CacheEngine engine,
            WriteAheadLog wal,
            EventBus events,
            ReentrantLock mutationLock,
            long timeoutMillis) {
        this.engine = engine;
        this.wal = wal;
        this.events = events;
        this.mutationLock = mutationLock;
        this.timeoutMillis = timeoutMillis;
    }

    public String begin() throws IOException {
        mutex.lock();
        try {
            long now = System.currentTimeMillis();
            String id = "TX-" + now + "-" + transactionSequence.incrementAndGet();
            wal.append(new WalDraft(id, WalOperation.BEGIN, "", "", 0));
            active.put(id, new Transaction(id, now, timeoutMillis));
            events.publish(CacheEventType.TRANSACTION_BEGAN, "", id, "transaction opened");
            return id;
        } finally {
            mutex.unlock();
        }
    }

    public String read(String id, String key) throws IOException {
        mutex.lock();
        try {
            Transaction transaction = requireActive(id);
            checkTimeout(transaction);
            CacheEntry current = engine.peek(key, System.currentTimeMillis());
            return transaction.pendingValue(key, current == null ? null : current.value());
        } finally {
            mutex.unlock();
        }
    }

    public void set(String id, String key, String value) throws IOException { set(id, key, value, 0); }

    public void set(String id, String key, String value, long ttlMillis) throws IOException {
        if (value == null) throw new IllegalArgumentException("value must not be null");
        if (ttlMillis < 0) throw new IllegalArgumentException("TTL must not be negative");
        long expiresAt = ttlMillis == 0 ? 0 : System.currentTimeMillis() + ttlMillis;
        stage(id, new Transaction.Operation(false, key, value, expiresAt));
    }

    public void delete(String id, String key) throws IOException {
        stage(id, new Transaction.Operation(true, key, "", 0));
    }

    public void commit(String id) throws IOException {
        mutex.lock();
        try {
            Transaction transaction = requireActive(id);
            checkTimeout(transaction);
            mutationLock.lock();
            try {
                List<WalDraft> drafts = new ArrayList<>();
                for (Transaction.Operation operation : transaction.operations) {
                    drafts.add(new WalDraft(
                            id,
                            operation.delete() ? WalOperation.TX_DELETE : WalOperation.TX_SET,
                            operation.key(),
                            operation.value(),
                            operation.expiresAtEpochMillis()));
                }
                String integrityManifest = TransactionBatchIntegrity.manifestForDrafts(drafts);
                drafts.add(new WalDraft(id, WalOperation.COMMIT, "", integrityManifest, 0));
                List<WalRecord> records = wal.appendBatch(drafts);
                for (int i = 0; i < transaction.operations.size(); i++) {
                    Transaction.Operation operation = transaction.operations.get(i);
                    WalRecord record = records.get(i);
                    if (operation.delete()) {
                        engine.delete(operation.key(), record.sequence());
                    } else {
                        engine.put(new CacheEntry(
                                operation.key(), operation.value(), record.sequence(),
                                record.timestampEpochMillis(), operation.expiresAtEpochMillis()));
                    }
                }
                transaction.state = Transaction.State.COMMITTED;
                finish(transaction);
                events.publish(
                        CacheEventType.TRANSACTION_COMMITTED,
                        "",
                        id,
                        "committed " + transaction.operations.size() + " operation(s)",
                        Map.of("operations", Integer.toString(transaction.operations.size())));
            } finally {
                mutationLock.unlock();
            }
        } finally {
            mutex.unlock();
        }
    }

    public void rollback(String id) throws IOException {
        mutex.lock();
        try {
            Transaction transaction = requireActive(id);
            wal.append(new WalDraft(id, WalOperation.ABORT, "", "", 0));
            transaction.state = Transaction.State.ABORTED;
            finish(transaction);
            events.publish(CacheEventType.TRANSACTION_ROLLED_BACK, "", id, "transaction rolled back");
        } finally {
            mutex.unlock();
        }
    }

    public int reapTimedOut() throws IOException {
        mutex.lock();
        try {
            long now = System.currentTimeMillis();
            List<Transaction> expired = active.values().stream().filter(transaction -> transaction.timedOut(now)).toList();
            for (Transaction transaction : expired) {
                wal.append(new WalDraft(transaction.id, WalOperation.ABORT, "", "", 0));
                transaction.state = Transaction.State.TIMED_OUT;
                finish(transaction);
                events.publish(CacheEventType.TRANSACTION_TIMED_OUT, "", transaction.id, "transaction deadline exceeded");
            }
            return expired.size();
        } finally {
            mutex.unlock();
        }
    }

    public int activeCount() {
        mutex.lock();
        try { return active.size(); }
        finally { mutex.unlock(); }
    }

    private void stage(String id, Transaction.Operation operation) throws IOException {
        if (operation.key() == null || operation.key().isBlank()) throw new IllegalArgumentException("key must not be blank");
        mutex.lock();
        try {
            Transaction transaction = requireActive(id);
            checkTimeout(transaction);
            String owner = owners.get(operation.key());
            if (owner != null && !owner.equals(id)) {
                events.publish(CacheEventType.TRANSACTION_CONFLICT, operation.key(), id, "key owned by " + owner);
                throw new ConcurrentModificationException("key is locked by " + owner);
            }
            owners.put(operation.key(), id);
            transaction.lockedKeys.add(operation.key());
            transaction.operations.add(operation);
        } finally {
            mutex.unlock();
        }
    }

    private Transaction requireActive(String id) {
        Transaction transaction = active.get(id);
        if (transaction == null || transaction.state != Transaction.State.ACTIVE) {
            throw new IllegalArgumentException("unknown or inactive transaction: " + id);
        }
        return transaction;
    }

    private void checkTimeout(Transaction transaction) throws IOException {
        if (!transaction.timedOut(System.currentTimeMillis())) return;
        wal.append(new WalDraft(transaction.id, WalOperation.ABORT, "", "", 0));
        transaction.state = Transaction.State.TIMED_OUT;
        finish(transaction);
        events.publish(CacheEventType.TRANSACTION_TIMED_OUT, "", transaction.id, "transaction deadline exceeded");
        throw new IllegalStateException("transaction timed out: " + transaction.id);
    }

    private void finish(Transaction transaction) {
        transaction.lockedKeys.forEach(key -> owners.remove(key, transaction.id));
        active.remove(transaction.id);
    }
}
