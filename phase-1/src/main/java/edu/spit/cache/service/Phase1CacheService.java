package edu.spit.cache.service;

import edu.spit.cache.core.CacheEngine;
import edu.spit.cache.core.CacheEntry;
import edu.spit.cache.core.LookupResult;
import edu.spit.cache.event.CacheEvent;
import edu.spit.cache.event.CacheEventType;
import edu.spit.cache.event.EventBus;
import edu.spit.cache.metrics.CacheMetrics;
import edu.spit.cache.persistence.RecoveryManager;
import edu.spit.cache.persistence.RecoveryReport;
import edu.spit.cache.persistence.WalOperation;
import edu.spit.cache.persistence.WalRecord;
import edu.spit.cache.persistence.WriteAheadLog;

import java.io.IOException;
import java.nio.file.Path;

/** Public service facade unifying CacheEngine, WAL durability, EventBus and Metrics for Phase 1. */
public final class Phase1CacheService implements AutoCloseable {
    private final CacheEngine engine = new CacheEngine();
    private final EventBus eventBus = new EventBus();
    private final CacheMetrics metrics = new CacheMetrics();
    private final RecoveryManager recoveryManager = new RecoveryManager();
    private final WriteAheadLog wal;

    public Phase1CacheService(Path walPath) throws IOException {
        this.eventBus.register(metrics);
        this.wal = new WriteAheadLog(walPath);
        // Automatically replay WAL on startup
        recover();
    }

    public synchronized boolean put(String key, String value, long ttlMs) throws IOException {
        long now = System.currentTimeMillis();
        long expiresAt = (ttlMs > 0) ? (now + ttlMs) : 0L;
        
        // 1. WAL append first (Durability rule)
        WalRecord rec = wal.append(WalOperation.PUT, key, value, expiresAt);

        // 2. Update memory state
        CacheEntry entry = CacheEntry.of(key, value, rec.sequence(), ttlMs);
        CacheEngine.PutResult res = engine.put(entry);

        // 3. Publish domain event
        eventBus.publish(CacheEvent.create(CacheEventType.PUT, key, value));
        return res.applied();
    }

    public synchronized String get(String key) {
        long now = System.currentTimeMillis();
        LookupResult res = engine.lookup(key, now);
        if (res.isHit()) {
            eventBus.publish(CacheEvent.create(CacheEventType.HIT, key, res.entry().value().text()));
            return res.entry().value().text();
        } else if (res.isExpired()) {
            eventBus.publish(CacheEvent.create(CacheEventType.EXPIRE, key, res.expiredEntry().value().text()));
            eventBus.publish(CacheEvent.create(CacheEventType.MISS, key, null));
            return null;
        } else {
            eventBus.publish(CacheEvent.create(CacheEventType.MISS, key, null));
            return null;
        }
    }

    public synchronized boolean delete(String key) throws IOException {
        // 1. WAL append DELETE
        wal.append(WalOperation.DELETE, key, null, 0L);

        // 2. Delete from memory
        CacheEngine.DeleteResult res = engine.delete(key);

        // 3. Publish event
        if (res.applied()) {
            eventBus.publish(CacheEvent.create(CacheEventType.DELETE, key, null));
        }
        return res.applied();
    }

    public synchronized void clear() throws IOException {
        wal.append(WalOperation.CLEAR, null, null, 0L);
        engine.clear();
        eventBus.publish(CacheEvent.create(CacheEventType.CLEAR, null, null));
    }

    public synchronized RecoveryReport recover() throws IOException {
        RecoveryReport report = recoveryManager.replayWal(wal, engine);
        eventBus.publish(CacheEvent.create(CacheEventType.RECOVER, null, report.formatSummary()));
        return report;
    }

    public CacheEngine getEngine() {
        return engine;
    }

    public WriteAheadLog getWal() {
        return wal;
    }

    public CacheMetrics getMetrics() {
        return metrics;
    }

    public EventBus getEventBus() {
        return eventBus;
    }

    public int getActiveKeyCount() {
        return engine.size();
    }

    @Override
    public synchronized void close() throws IOException {
        if (wal != null) {
            wal.close();
        }
    }
}
