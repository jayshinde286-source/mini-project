package edu.spit.cache.core;

/** Distinguishes a miss from an entry removed because its TTL elapsed. */
public record LookupResult(CacheEntry entry, CacheEntry expiredEntry) {
    public boolean hit() { return entry != null; }
    public boolean expired() { return expiredEntry != null; }
}
