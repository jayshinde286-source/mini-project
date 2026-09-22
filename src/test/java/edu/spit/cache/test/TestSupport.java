package edu.spit.cache.test;

import edu.spit.cache.config.CacheConfig;
import edu.spit.cache.config.DurabilityMode;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;
import java.util.Objects;

final class TestSupport {
    @FunctionalInterface interface CheckedRunnable { void run() throws Exception; }

    private TestSupport() { }

    static CacheConfig config(Path directory) {
        return config(directory, 2_000, 10_000);
    }

    static CacheConfig config(Path directory, long transactionTimeoutMillis, long sweepMillis) {
        return new CacheConfig(
                directory.resolve("cache.wal"),
                directory.resolve("cache.snapshot"),
                directory.resolve("events.jsonl"),
                DurabilityMode.OS_BUFFERED,
                false,
                128,
                transactionTimeoutMillis,
                sweepMillis);
    }

    static void equal(Object expected, Object actual) {
        if (!Objects.equals(expected, actual)) throw new AssertionError("expected " + expected + ", got " + actual);
    }

    static void check(boolean condition, String message) {
        if (!condition) throw new AssertionError(message);
    }

    static <T extends Throwable> void expect(Class<T> type, CheckedRunnable runnable) throws Exception {
        try {
            runnable.run();
        } catch (Throwable actual) {
            if (type.isInstance(actual)) return;
            throw new AssertionError("expected " + type.getSimpleName() + ", got " + actual, actual);
        }
        throw new AssertionError("expected " + type.getSimpleName() + " but nothing was thrown");
    }

    static void deleteTree(Path directory) throws IOException {
        if (!Files.exists(directory)) return;
        try (var paths = Files.walk(directory)) {
            for (Path path : paths.sorted(Comparator.reverseOrder()).toList()) Files.deleteIfExists(path);
        }
    }
}
