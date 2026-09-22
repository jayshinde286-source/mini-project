package edu.spit.cache.event;

/** Subscriber interface for listening to cache events. */
@FunctionalInterface
public interface CacheEventListener {
    void onEvent(CacheEvent event);
}
