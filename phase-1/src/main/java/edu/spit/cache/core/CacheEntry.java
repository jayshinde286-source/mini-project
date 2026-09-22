package edu.spit.cache.core;

import edu.spit.cache.api.CacheValue;

/** Internal cache entry representation with monotonic versioning and optional TTL expiration. */
public record CacheEntry(
        String key,
        CacheValue value,
        long version,
        long createdAtEpochMillis,
        long expiresAtEpochMillis
) {
    public boolean isExpired(long nowEpochMillis) {
        return expiresAtEpochMillis > 0 && nowEpochMillis >= expiresAtEpochMillis;
    }

    public static CacheEntry of(String key, String valueText, long version, long ttlMs) {
        long now = System.currentTimeMillis();
        long expiresAt = (ttlMs > 0) ? (now + ttlMs) : 0L;
        return new CacheEntry(key, CacheValue.of(valueText), version, now, expiresAt);
    }
}
