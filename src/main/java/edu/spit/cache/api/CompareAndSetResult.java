package edu.spit.cache.api;

/** Result of an optimistic concurrency update. */
public record CompareAndSetResult(boolean updated, long observedVersion, CacheValue value) {
    public static CompareAndSetResult mismatch(long observedVersion, CacheValue value) {
        return new CompareAndSetResult(false, observedVersion, value);
    }

    public static CompareAndSetResult success(CacheValue value) {
        return new CompareAndSetResult(true, value.version(), value);
    }
}
