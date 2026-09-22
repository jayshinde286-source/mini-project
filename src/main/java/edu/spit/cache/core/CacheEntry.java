package edu.spit.cache.core;

import edu.spit.cache.api.CacheValue;

/** Internal value stored by the engine. Version is the WAL sequence that created it. */
public record CacheEntry(
        String key,
        String value,
        long version,
        long createdAtEpochMillis,
        long expiresAtEpochMillis) {

    public CacheEntry {
        if (key == null || key.isBlank()) throw new IllegalArgumentException("key must not be blank");
        if (value == null) throw new IllegalArgumentException("value must not be null");
        if (version < 0) throw new IllegalArgumentException("version must not be negative");
    }

    public boolean isExpired(long nowEpochMillis) {
        return expiresAtEpochMillis > 0 && nowEpochMillis >= expiresAtEpochMillis;
    }

    public CacheValue toPublicValue() {
        return new CacheValue(value, version, createdAtEpochMillis, expiresAtEpochMillis);
    }
}
