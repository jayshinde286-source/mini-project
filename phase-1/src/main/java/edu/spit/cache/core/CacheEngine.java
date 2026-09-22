package edu.spit.cache.core;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.locks.ReentrantReadWriteLock;

/** Thread-safe primary in-memory key-value state engine for Phase 1. */
public final class CacheEngine {
    public record PutResult(boolean applied, CacheEntry previous, CacheEntry current) {}
    public record DeleteResult(boolean applied, CacheEntry removed) {}

    private final Map<String, CacheEntry> store = new ConcurrentHashMap<>();
    private final ReentrantReadWriteLock lock = new ReentrantReadWriteLock(true);

    public PutResult put(CacheEntry entry) {
        lock.writeLock().lock();
        try {
            CacheEntry previous = store.get(entry.key());
            if (previous != null && previous.version() > entry.version()) {
                return new PutResult(false, previous, previous);
            }
            store.put(entry.key(), entry);
            return new PutResult(true, previous, entry);
        } finally {
            lock.writeLock().unlock();
        }
    }

    public DeleteResult delete(String key) {
        lock.writeLock().lock();
        try {
            CacheEntry previous = store.remove(key);
            if (previous == null) {
                return new DeleteResult(false, null);
            }
            return new DeleteResult(true, previous);
        } finally {
            lock.writeLock().unlock();
        }
    }

    public LookupResult lookup(String key, long nowEpochMillis) {
        lock.writeLock().lock();
        try {
            CacheEntry entry = store.get(key);
            if (entry == null) {
                return new LookupResult(null, null);
            }
            if (entry.isExpired(nowEpochMillis)) {
                store.remove(key);
                return new LookupResult(null, entry);
            }
            return new LookupResult(entry, null);
        } finally {
            lock.writeLock().unlock();
        }
    }

    public void clear() {
        lock.writeLock().lock();
        try {
            store.clear();
        } finally {
            lock.writeLock().unlock();
        }
    }

    public int size() {
        return store.size();
    }

    public Map<String, CacheEntry> snapshotEntries(long nowEpochMillis) {
        lock.writeLock().lock();
        try {
            purgeExpiredUnderLock(nowEpochMillis);
            return Collections.unmodifiableMap(new LinkedHashMap<>(store));
        } finally {
            lock.writeLock().unlock();
        }
    }

    public List<CacheEntry> purgeExpired(long nowEpochMillis) {
        lock.writeLock().lock();
        try {
            return purgeExpiredUnderLock(nowEpochMillis);
        } finally {
            lock.writeLock().unlock();
        }
    }

    private List<CacheEntry> purgeExpiredUnderLock(long nowEpochMillis) {
        List<CacheEntry> expired = new ArrayList<>();
        store.values().removeIf(entry -> {
            boolean exp = entry.isExpired(nowEpochMillis);
            if (exp) expired.add(entry);
            return exp;
        });
        return expired;
    }
}
