package edu.spit.cache.eviction;

import java.util.LinkedHashMap;
import java.util.Map;

/** Bounded least-recently-used cache; get/put/delete are O(1) average. */
public final class LRUCache implements CachePolicy {
    private final int capacity;
    private final LinkedHashMap<String, String> values;
    private long hits;
    private long misses;
    private long evictions;

    public LRUCache(int capacity) {
        if (capacity <= 0) throw new IllegalArgumentException("capacity must be positive");
        this.capacity = capacity;
        values = new LinkedHashMap<>(capacity, 0.75f, true) {
            @Override
            protected boolean removeEldestEntry(Map.Entry<String, String> eldest) {
                boolean remove = size() > LRUCache.this.capacity;
                if (remove) evictions++;
                return remove;
            }
        };
    }

    @Override public synchronized String get(String key) {
        String value = values.get(key);
        if (value == null) misses++; else hits++;
        return value;
    }
    @Override public synchronized void put(String key, String value) { values.put(key, value); }
    @Override public synchronized void delete(String key) { values.remove(key); }
    @Override public synchronized int size() { return values.size(); }
    @Override public int capacity() { return capacity; }
    @Override public synchronized long hits() { return hits; }
    @Override public synchronized long misses() { return misses; }
    @Override public synchronized long evictions() { return evictions; }
    @Override public String name() { return "LRU"; }
}
