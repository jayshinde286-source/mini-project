package edu.spit.cache.event;

import java.util.Map;

/** Immutable event envelope. Event IDs preserve publication order. */
public record CacheEvent(
        long eventId,
        long timestampEpochMillis,
        CacheEventType type,
        String key,
        String transactionId,
        String detail,
        Map<String, String> attributes) {

    public CacheEvent {
        if (eventId <= 0) throw new IllegalArgumentException("event ID must be positive");
        if (type == null) throw new IllegalArgumentException("event type is required");
        key = key == null ? "" : key;
        transactionId = transactionId == null ? "" : transactionId;
        detail = detail == null ? "" : detail;
        attributes = attributes == null ? Map.of() : Map.copyOf(attributes);
    }
}
