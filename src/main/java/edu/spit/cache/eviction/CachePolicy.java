package edu.spit.cache.eviction;

/** Contract shared by bounded cache-policy implementations and the benchmark harness. */
public interface CachePolicy {
    String get(String key);
    void put(String key, String value);
    void delete(String key);
    int size();
    int capacity();
    long hits();
    long misses();
    long evictions();
    String name();

    default double hitRatePercent() {
        long requests = hits() + misses();
        return requests == 0 ? 0 : 100.0 * hits() / requests;
    }
}
