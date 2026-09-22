package edu.spit.cache.event;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;

/** Bounded recent-event view used by the CLI and tests. */
public final class InMemoryEventJournal implements CacheEventListener {
    private final int capacity;
    private final Deque<CacheEvent> events = new ArrayDeque<>();

    public InMemoryEventJournal(int capacity) {
        if (capacity <= 0) throw new IllegalArgumentException("capacity must be positive");
        this.capacity = capacity;
    }

    @Override
    public synchronized void onEvent(CacheEvent event) {
        if (events.size() == capacity) events.removeFirst();
        events.addLast(event);
    }

    public synchronized List<CacheEvent> latest(int limit) {
        if (limit <= 0) return List.of();
        List<CacheEvent> copy = new ArrayList<>(events);
        return List.copyOf(copy.subList(Math.max(0, copy.size() - limit), copy.size()));
    }

    public synchronized int size() { return events.size(); }
}
