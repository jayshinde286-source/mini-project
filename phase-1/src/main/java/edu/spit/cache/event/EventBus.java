package edu.spit.cache.event;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

/** Synchronous event bus for publishing cache state transitions to subscribers. */
public final class EventBus {
    private final List<CacheEventListener> listeners = new CopyOnWriteArrayList<>();

    public void register(CacheEventListener listener) {
        listeners.add(listener);
    }

    public void unregister(CacheEventListener listener) {
        listeners.remove(listener);
    }

    public void publish(CacheEvent event) {
        for (CacheEventListener listener : listeners) {
            try {
                listener.onEvent(event);
            } catch (Exception ex) {
                System.err.println("[EventBus Warning] Listener throw exception: " + ex.getMessage());
            }
        }
    }
}
