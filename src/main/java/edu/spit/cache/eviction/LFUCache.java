package edu.spit.cache.eviction;

import java.util.HashMap;
import java.util.Iterator;
import java.util.LinkedHashSet;
import java.util.Map;

/** O(1)-average LFU cache with LRU tie-breaking inside each frequency bucket. */
public final class LFUCache implements CachePolicy {
    private record Value(String value, int frequency) { }

    private final int capacity;
    private final Map<String, Value> values = new HashMap<>();
    private final Map<Integer, LinkedHashSet<String>> frequencies = new HashMap<>();
    private int minimumFrequency;
    private long hits;
    private long misses;
    private long evictions;

    public LFUCache(int capacity) {
        if (capacity <= 0) throw new IllegalArgumentException("capacity must be positive");
        this.capacity = capacity;
    }

    @Override
    public synchronized String get(String key) {
        Value old = values.get(key);
        if (old == null) {
            misses++;
            return null;
        }
        hits++;
        touch(key, old);
        return old.value();
    }

    @Override
    public synchronized void put(String key, String value) {
        Value old = values.get(key);
        if (old != null) {
            values.put(key, new Value(value, old.frequency()));
            touch(key, values.get(key));
            return;
        }
        if (values.size() == capacity) {
            Iterator<String> iterator = frequencies.get(minimumFrequency).iterator();
            String victim = iterator.next();
            iterator.remove();
            values.remove(victim);
            evictions++;
        }
        values.put(key, new Value(value, 1));
        frequencies.computeIfAbsent(1, ignored -> new LinkedHashSet<>()).add(key);
        minimumFrequency = 1;
    }

    private void touch(String key, Value old) {
        int frequency = old.frequency();
        LinkedHashSet<String> bucket = frequencies.get(frequency);
        bucket.remove(key);
        if (bucket.isEmpty()) {
            frequencies.remove(frequency);
            if (minimumFrequency == frequency) minimumFrequency++;
        }
        values.put(key, new Value(old.value(), frequency + 1));
        frequencies.computeIfAbsent(frequency + 1, ignored -> new LinkedHashSet<>()).add(key);
    }

    @Override
    public synchronized void delete(String key) {
        Value old = values.remove(key);
        if (old == null) return;
        LinkedHashSet<String> bucket = frequencies.get(old.frequency());
        bucket.remove(key);
        if (bucket.isEmpty()) frequencies.remove(old.frequency());
        minimumFrequency = frequencies.keySet().stream().min(Integer::compareTo).orElse(0);
    }

    @Override public synchronized int size() { return values.size(); }
    @Override public int capacity() { return capacity; }
    @Override public synchronized long hits() { return hits; }
    @Override public synchronized long misses() { return misses; }
    @Override public synchronized long evictions() { return evictions; }
    @Override public String name() { return "LFU"; }
}
