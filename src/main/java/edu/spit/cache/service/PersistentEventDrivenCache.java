package edu.spit.cache.service;

import edu.spit.cache.api.CacheValue;
import edu.spit.cache.api.CompareAndSetResult;
import edu.spit.cache.config.CacheConfig;
import edu.spit.cache.core.CacheEngine;
import edu.spit.cache.core.CacheEntry;
import edu.spit.cache.core.InvariantReport;
import edu.spit.cache.core.LookupResult;
import edu.spit.cache.event.AuditLogListener;
import edu.spit.cache.event.CacheEvent;
import edu.spit.cache.event.CacheEventType;
import edu.spit.cache.event.EventBus;
import edu.spit.cache.event.InMemoryEventJournal;
import edu.spit.cache.metrics.CacheMetrics;
import edu.spit.cache.metrics.MetricsSnapshot;
import edu.spit.cache.persistence.RecoveryManager;
import edu.spit.cache.persistence.RecoveryReport;
import edu.spit.cache.persistence.SnapshotManager;
import edu.spit.cache.persistence.WalDraft;
import edu.spit.cache.persistence.WalOperation;
import edu.spit.cache.persistence.WalRecord;
import edu.spit.cache.persistence.WriteAheadLog;
import edu.spit.cache.transaction.TransactionManager;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.locks.ReentrantLock;

/** Public facade that enforces WAL-before-memory ordering and owns the module lifecycle. */
public final class PersistentEventDrivenCache implements AutoCloseable {
    public static final String PROJECT_TITLE = "PERSISTENT EVENT-DRIVEN MEMORY CACHE MODULE";

    private final CacheConfig config;
    private final CacheEngine engine;
    private final WriteAheadLog wal;
    private final SnapshotManager snapshots;
    private final EventBus events;
    private final InMemoryEventJournal eventJournal;
    private final CacheMetrics metrics;
    private final AuditLogListener audit;
    private final TransactionManager transactions;
    private final ReentrantLock mutationLock;
    private final ScheduledExecutorService maintenance;
    private final RecoveryReport recoveryReport;
    private final long startedAtNanos = System.nanoTime();
    private final AtomicBoolean closed = new AtomicBoolean();

    private PersistentEventDrivenCache(
            CacheConfig config,
            CacheEngine engine,
            WriteAheadLog wal,
            SnapshotManager snapshots,
            EventBus events,
            InMemoryEventJournal eventJournal,
            CacheMetrics metrics,
            AuditLogListener audit,
            TransactionManager transactions,
            ReentrantLock mutationLock,
            RecoveryReport recoveryReport) {
        this.config = config;
        this.engine = engine;
        this.wal = wal;
        this.snapshots = snapshots;
        this.events = events;
        this.eventJournal = eventJournal;
        this.metrics = metrics;
        this.audit = audit;
        this.transactions = transactions;
        this.mutationLock = mutationLock;
        this.recoveryReport = recoveryReport;
        this.maintenance = Executors.newSingleThreadScheduledExecutor(runnable -> {
            Thread thread = new Thread(runnable, "cache-maintenance");
            thread.setDaemon(true);
            return thread;
        });
        maintenance.scheduleWithFixedDelay(
                this::runMaintenanceSafely,
                config.expirySweepMillis(),
                config.expirySweepMillis(),
                TimeUnit.MILLISECONDS);
    }

    public static PersistentEventDrivenCache open(CacheConfig config) throws IOException {
        CacheEngine engine = new CacheEngine();
        WriteAheadLog wal = new WriteAheadLog(config.walPath(), config.durabilityMode());
        SnapshotManager snapshots = new SnapshotManager(config.snapshotPath());
        EventBus events = new EventBus(config.asynchronousEvents());
        CacheMetrics metrics = new CacheMetrics();
        InMemoryEventJournal journal = new InMemoryEventJournal(config.eventJournalCapacity());
        AuditLogListener audit = new AuditLogListener(config.auditPath());
        events.subscribe(metrics);
        events.subscribe(journal);
        events.subscribe(audit);
        ReentrantLock mutationLock = new ReentrantLock(true);
        RecoveryReport recovery = RecoveryManager.recover(wal, snapshots, engine, System.currentTimeMillis());
        TransactionManager transactions = new TransactionManager(
                engine, wal, events, mutationLock, config.transactionTimeoutMillis());
        PersistentEventDrivenCache module = new PersistentEventDrivenCache(
                config, engine, wal, snapshots, events, journal, metrics, audit,
                transactions, mutationLock, recovery);
        events.publish(
                CacheEventType.RECOVERY_COMPLETED,
                "",
                "",
                "recovery applied " + recovery.walOperationsApplied() + " WAL operation(s)",
                Map.of(
                        "snapshotEntries", Integer.toString(recovery.snapshotEntriesRestored()),
                        "walApplied", Integer.toString(recovery.walOperationsApplied()),
                        "rejectedTransactionBatches", Integer.toString(recovery.rejectedTransactionBatches()),
                        "checksumFailures", Integer.toString(recovery.checksumFailures())));
        return module;
    }

    public CacheValue put(String key, String value) throws IOException { return put(key, value, 0); }

    public CacheValue put(String key, String value, long ttlMillis) throws IOException {
        requireKey(key);
        if (value == null) throw new IllegalArgumentException("value must not be null");
        if (ttlMillis < 0) throw new IllegalArgumentException("TTL must not be negative");
        ensureOpen();
        mutationLock.lock();
        try {
            long expiresAt = ttlMillis == 0 ? 0 : System.currentTimeMillis() + ttlMillis;
            WalRecord record = wal.append(WalDraft.standalone(WalOperation.SET, key, value, expiresAt));
            CacheEntry entry = new CacheEntry(key, value, record.sequence(), record.timestampEpochMillis(), expiresAt);
            engine.put(entry);
            events.publish(CacheEventType.PUT, key, "", "value persisted", attributes(entry));
            return entry.toPublicValue();
        } finally {
            mutationLock.unlock();
        }
    }

    public Optional<CacheValue> get(String key) {
        requireKey(key);
        ensureOpen();
        LookupResult lookup = engine.lookup(key, System.currentTimeMillis());
        if (lookup.expired()) events.publish(CacheEventType.EXPIRED, key, "", "TTL elapsed");
        if (lookup.hit()) {
            events.publish(CacheEventType.HIT, key, "", "cache hit");
            return Optional.of(lookup.entry().toPublicValue());
        }
        events.publish(CacheEventType.MISS, key, "", "cache miss");
        return Optional.empty();
    }

    public boolean delete(String key) throws IOException {
        requireKey(key);
        ensureOpen();
        mutationLock.lock();
        try {
            WalRecord record = wal.append(WalDraft.standalone(WalOperation.DELETE, key, "", 0));
            boolean deleted = engine.delete(key, record.sequence()).applied();
            events.publish(CacheEventType.DELETE, key, "", deleted ? "value deleted" : "delete was idempotent");
            return deleted;
        } finally {
            mutationLock.unlock();
        }
    }

    /** expectedVersion=-1 means create only if the key is absent. */
    public CompareAndSetResult compareAndSet(String key, long expectedVersion, String value, long ttlMillis) throws IOException {
        requireKey(key);
        if (value == null) throw new IllegalArgumentException("value must not be null");
        if (ttlMillis < 0) throw new IllegalArgumentException("TTL must not be negative");
        ensureOpen();
        mutationLock.lock();
        try {
            long now = System.currentTimeMillis();
            CacheEntry current = engine.peek(key, now);
            long observed = current == null ? -1 : current.version();
            if (observed != expectedVersion) {
                CacheValue observedValue = current == null ? null : current.toPublicValue();
                events.publish(CacheEventType.CAS_REJECTED, key, "", "expected " + expectedVersion + " but observed " + observed);
                return CompareAndSetResult.mismatch(observed, observedValue);
            }
            long expiresAt = ttlMillis == 0 ? 0 : now + ttlMillis;
            WalRecord record = wal.append(WalDraft.standalone(WalOperation.CAS, key, value, expiresAt));
            CacheEntry updated = new CacheEntry(key, value, record.sequence(), record.timestampEpochMillis(), expiresAt);
            engine.put(updated);
            events.publish(CacheEventType.CAS_SUCCEEDED, key, "", "optimistic update succeeded", attributes(updated));
            return CompareAndSetResult.success(updated.toPublicValue());
        } finally {
            mutationLock.unlock();
        }
    }

    public Map<String, CacheValue> range(String first, String last) {
        ensureOpen();
        Map<String, CacheEntry> entries = engine.range(first, last, System.currentTimeMillis());
        Map<String, CacheValue> result = new LinkedHashMap<>();
        entries.forEach((key, value) -> result.put(key, value.toPublicValue()));
        events.publish(
                CacheEventType.RANGE_QUERIED,
                first + ".." + last,
                "",
                "range returned " + result.size() + " value(s)");
        return Collections.unmodifiableMap(result);
    }

    public Map<String, CacheValue> all() {
        ensureOpen();
        Map<String, CacheValue> result = new LinkedHashMap<>();
        engine.snapshotEntries(System.currentTimeMillis()).forEach((key, entry) -> result.put(key, entry.toPublicValue()));
        return Collections.unmodifiableMap(result);
    }

    public CheckpointReport checkpoint(boolean compactWal) throws IOException {
        ensureOpen();
        mutationLock.lock();
        try {
            Map<String, CacheEntry> entries = engine.snapshotEntries(System.currentTimeMillis());
            long sequence = wal.lastSequence();
            snapshots.write(sequence, entries);
            events.publish(CacheEventType.SNAPSHOT_CREATED, "", "", "snapshot contains " + entries.size() + " entries");
            int compacted = 0;
            if (compactWal) {
                compacted = wal.compactUpTo(sequence);
                events.publish(CacheEventType.WAL_COMPACTED, "", "", "removed " + compacted + " WAL record(s)");
            }
            return new CheckpointReport(entries.size(), sequence, compacted);
        } finally {
            mutationLock.unlock();
        }
    }

    public InvariantReport validate() {
        InvariantReport report = engine.validate(System.currentTimeMillis());
        events.publish(CacheEventType.INVARIANT_CHECKED, "", "", report.healthy() ? "healthy" : String.join("; ", report.problems()));
        return report;
    }

    public ModuleInfo info() {
        return new ModuleInfo(
                PROJECT_TITLE,
                engine.size(System.currentTimeMillis()),
                transactions.activeCount(),
                wal.lastSequence(),
                wal.path(),
                snapshots.path(),
                config.durabilityMode(),
                config.asynchronousEvents());
    }

    public MetricsSnapshot metrics() {
        drainEventsForRead();
        return metrics.snapshot();
    }
    public List<CacheEvent> recentEvents(int limit) {
        drainEventsForRead();
        return eventJournal.latest(limit);
    }
    public EventBus.Statistics eventStatistics() { return events.statistics(); }
    public DiagnosticsReport diagnostics() throws IOException {
        ensureOpen();
        InvariantReport invariants = validate();
        MetricsSnapshot currentMetrics = metrics();
        return new DiagnosticsReport(
                System.currentTimeMillis(),
                TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - startedAtNanos),
                info(),
                invariants,
                currentMetrics,
                recoveryReport,
                events.statistics(),
                fileSize(config.walPath()),
                fileSize(config.snapshotPath()),
                fileSize(config.auditPath()));
    }
    public TransactionManager transactions() { return transactions; }
    public RecoveryReport recoveryReport() { return recoveryReport; }
    public boolean awaitEvents(Duration timeout) throws InterruptedException { return events.awaitQuiescence(timeout); }

    private void runMaintenanceSafely() {
        try {
            for (CacheEntry entry : engine.purgeExpired(System.currentTimeMillis())) {
                events.publish(CacheEventType.EXPIRED, entry.key(), "", "background TTL sweep");
            }
            transactions.reapTimedOut();
        } catch (Exception ignored) {
            // Maintenance is best-effort; the foreground path still performs lazy expiry and timeout checks.
        }
    }

    private static Map<String, String> attributes(CacheEntry entry) {
        return Map.of(
                "version", Long.toString(entry.version()),
                "expiresAt", Long.toString(entry.expiresAtEpochMillis()));
    }

    private static long fileSize(Path path) throws IOException {
        return Files.exists(path) ? Files.size(path) : 0;
    }

    private void drainEventsForRead() {
        try {
            events.awaitQuiescence(Duration.ofSeconds(2));
        } catch (InterruptedException interrupted) {
            Thread.currentThread().interrupt();
        }
    }

    private static void requireKey(String key) {
        if (key == null || key.isBlank()) throw new IllegalArgumentException("key must not be blank");
    }

    private void ensureOpen() {
        if (closed.get()) throw new IllegalStateException("cache module is closed");
    }

    @Override
    public void close() throws IOException {
        if (!closed.compareAndSet(false, true)) return;
        maintenance.shutdownNow();
        try {
            events.awaitQuiescence(Duration.ofSeconds(3));
        } catch (InterruptedException interrupted) {
            Thread.currentThread().interrupt();
        }
        events.close();
        audit.close();
        wal.close();
    }
}
