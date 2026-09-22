package edu.spit.cache.api;

/** Immutable value object holding payload string and creation timestamp. */
public record CacheValue(String text, long createdAtEpochMillis) {
    public static CacheValue of(String text) {
        return new CacheValue(text, System.currentTimeMillis());
    }
}
