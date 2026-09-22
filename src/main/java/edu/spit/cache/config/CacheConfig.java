package edu.spit.cache.config;

import java.nio.file.Path;

/** Immutable runtime configuration. System properties make the CLI easy to demo. */
public record CacheConfig(
        Path walPath,
        Path snapshotPath,
        Path auditPath,
        DurabilityMode durabilityMode,
        boolean asynchronousEvents,
        int eventJournalCapacity,
        long transactionTimeoutMillis,
        long expirySweepMillis) {

    public CacheConfig {
        if (walPath == null || snapshotPath == null || auditPath == null || durabilityMode == null) {
            throw new IllegalArgumentException("paths and durability mode are required");
        }
        if (eventJournalCapacity <= 0) throw new IllegalArgumentException("event journal capacity must be positive");
        if (transactionTimeoutMillis <= 0) throw new IllegalArgumentException("transaction timeout must be positive");
        if (expirySweepMillis <= 0) throw new IllegalArgumentException("expiry sweep interval must be positive");
    }

    public static CacheConfig defaults() {
        return new CacheConfig(
                Path.of("data/cache-v2.wal"),
                Path.of("data/cache.snapshot"),
                Path.of("data/cache-events.jsonl"),
                DurabilityMode.ALWAYS,
                true,
                256,
                30_000,
                1_000);
    }

    public static CacheConfig fromSystemProperties() {
        CacheConfig defaults = defaults();
        return new CacheConfig(
                Path.of(System.getProperty("cache.wal", defaults.walPath().toString())),
                Path.of(System.getProperty("cache.snapshot", defaults.snapshotPath().toString())),
                Path.of(System.getProperty("cache.audit", defaults.auditPath().toString())),
                DurabilityMode.parse(System.getProperty("cache.durability", defaults.durabilityMode().name())),
                Boolean.parseBoolean(System.getProperty("cache.events.async", Boolean.toString(defaults.asynchronousEvents()))),
                positiveInt("cache.events.capacity", defaults.eventJournalCapacity()),
                positiveLong("cache.tx.timeout.ms", defaults.transactionTimeoutMillis()),
                positiveLong("cache.expiry.sweep.ms", defaults.expirySweepMillis()));
    }

    private static int positiveInt(String key, int fallback) {
        int value = Integer.parseInt(System.getProperty(key, Integer.toString(fallback)));
        if (value <= 0) throw new IllegalArgumentException(key + " must be positive");
        return value;
    }

    private static long positiveLong(String key, long fallback) {
        long value = Long.parseLong(System.getProperty(key, Long.toString(fallback)));
        if (value <= 0) throw new IllegalArgumentException(key + " must be positive");
        return value;
    }
}
