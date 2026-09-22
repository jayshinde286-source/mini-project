package edu.spit.cache.core;

import edu.spit.cache.index.BTreeIndex;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.locks.ReentrantReadWriteLock;

/** Thread-safe primary state engine. The map provides exact lookup; the B-tree provides ordering. */
public final class CacheEngine {
    public record PutResult(boolean applied, CacheEntry previous, CacheEntry current) {}
    public record DeleteResult(boolean applied, CacheEntry removed) {}

    private final Map<String, CacheEntry> store = new LinkedHashMap<>();
    private final BTreeIndex<CacheEntry> index = new BTreeIndex<>();
    private final ReentrantReadWriteLock lock = new ReentrantReadWriteLock(true);

    public PutResult put(CacheEntry entry) {
        lock.writeLock().lock();
        try {
            CacheEntry previous = store.get(entry.key());
            if (previous != null && previous.version() > entry.version()) {
                return new PutResult(false, previous, previous);
            }
            store.put(entry.key(), entry);
            index.put(entry.key(), entry);
            return new PutResult(true, previous, entry);
        } finally {
            lock.writeLock().unlock();
        }
    }

    public DeleteResult delete(String key, long deleteVersion) {
        requireKey(key);
        lock.writeLock().lock();
        try {
            CacheEntry previous = store.get(key);
            if (previous == null) return new DeleteResult(false, null);
            if (deleteVersion >= 0 && previous.version() > deleteVersion) return new DeleteResult(false, previous);
            store.remove(key);
            index.delete(key);
            return new DeleteResult(true, previous);
        } finally {
            lock.writeLock().unlock();
        }
    }

    public LookupResult lookup(String key, long nowEpochMillis) {
        requireKey(key);
        lock.writeLock().lock();
        try {
            CacheEntry entry = store.get(key);
            if (entry == null) return new LookupResult(null, null);
            if (!entry.isExpired(nowEpochMillis)) return new LookupResult(entry, null);
            store.remove(key);
            index.delete(key);
            return new LookupResult(null, entry);
        } finally {
            lock.writeLock().unlock();
        }
    }

    /** Used while an external mutation lock is held for compare-and-set validation. */
    public CacheEntry peek(String key, long nowEpochMillis) {
        return lookup(key, nowEpochMillis).entry();
    }

    public Map<String, CacheEntry> range(String first, String last, long nowEpochMillis) {
        requireKey(first);
        requireKey(last);
        lock.writeLock().lock();
        try {
            purgeExpiredUnderLock(nowEpochMillis);
            return index.rangeQuery(first, last);
        } finally {
            lock.writeLock().unlock();
        }
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

    public int size(long nowEpochMillis) { return snapshotEntries(nowEpochMillis).size(); }

    public InvariantReport validate(long nowEpochMillis) {
        lock.writeLock().lock();
        try {
            purgeExpiredUnderLock(nowEpochMillis);
            Map<String, CacheEntry> indexed = index.snapshot();
            List<String> problems = new ArrayList<>();
            if (store.size() != indexed.size()) problems.add("map/index size mismatch");
            for (Map.Entry<String, CacheEntry> entry : store.entrySet()) {
                if (!entry.getValue().equals(indexed.get(entry.getKey()))) {
                    problems.add("index mismatch for key " + entry.getKey());
                }
            }
            return new InvariantReport(problems.isEmpty(), store.size(), indexed.size(), problems);
        } finally {
            lock.writeLock().unlock();
        }
    }

    private List<CacheEntry> purgeExpiredUnderLock(long nowEpochMillis) {
        List<CacheEntry> expired = new ArrayList<>();
        for (CacheEntry entry : new ArrayList<>(store.values())) {
            if (entry.isExpired(nowEpochMillis)) {
                store.remove(entry.key());
                index.delete(entry.key());
                expired.add(entry);
            }
        }
        return expired;
    }

    private static void requireKey(String key) {
        if (key == null || key.isBlank()) throw new IllegalArgumentException("key must not be blank");
    }
}
