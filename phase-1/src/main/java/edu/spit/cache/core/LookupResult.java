package edu.spit.cache.core;

/** Encapsulates the outcome of a cache lookup (hit, miss, or lazy-expired entry). */
public record LookupResult(CacheEntry entry, CacheEntry expiredEntry) {
    public boolean isHit() {
        return entry != null;
    }

    public boolean isExpired() {
        return expiredEntry != null;
    }
}
