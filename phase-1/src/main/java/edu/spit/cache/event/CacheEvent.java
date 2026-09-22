package edu.spit.cache.event;

/** Immutable domain event notification envelope. */
public record CacheEvent(
        CacheEventType type,
        String key,
        String payload,
        long timestamp
) {
    public static CacheEvent create(CacheEventType type, String key, String payload) {
        return new CacheEvent(type, key, payload, System.currentTimeMillis());
    }
}
