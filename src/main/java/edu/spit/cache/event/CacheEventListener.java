package edu.spit.cache.event;

@FunctionalInterface
public interface CacheEventListener {
    void onEvent(CacheEvent event) throws Exception;
}
