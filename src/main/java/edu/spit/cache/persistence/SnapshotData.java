package edu.spit.cache.persistence;

import edu.spit.cache.core.CacheEntry;

import java.util.Map;

public record SnapshotData(long lastWalSequence, long createdAtEpochMillis, Map<String, CacheEntry> entries) {
    public SnapshotData {
        entries = Map.copyOf(entries);
    }

    public static SnapshotData empty() { return new SnapshotData(0, 0, Map.of()); }
}
