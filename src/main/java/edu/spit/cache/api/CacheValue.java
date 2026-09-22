package edu.spit.cache.api;

/** Public immutable view of a cached value and its concurrency/TTL metadata. */
public record CacheValue(
        String value,
        long version,
        long createdAtEpochMillis,
        long expiresAtEpochMillis) {

    public boolean expires() { return expiresAtEpochMillis > 0; }

    public long ttlMillis(long nowEpochMillis) {
        if (!expires()) return -1;
        return Math.max(0, expiresAtEpochMillis - nowEpochMillis);
    }
}
