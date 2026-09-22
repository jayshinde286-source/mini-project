package edu.spit.cache.event;

/** Domain event types emitted by the cache module in Phase 1. */
public enum CacheEventType {
    PUT,
    DELETE,
    CLEAR,
    HIT,
    MISS,
    EXPIRE,
    RECOVER
}
