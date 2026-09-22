package edu.spit.cache.test;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;

/** Utility methods for Phase 1 test suite execution and isolated temp environments. */
public final class TestSupport {
    private TestSupport() {}

    public static Path createTempDir(String prefix) throws IOException {
        return Files.createTempDirectory(prefix);
    }

    public static void deleteRecursively(Path dir) throws IOException {
        if (!Files.exists(dir)) return;
        try (var stream = Files.walk(dir)) {
            stream.sorted(Comparator.reverseOrder()).forEach(path -> {
                try {
                    Files.deleteIfExists(path);
                } catch (IOException ignored) {}
            });
        }
    }

    public static void assertTrue(boolean condition, String message) {
        if (!condition) {
            throw new AssertionError("Assertion Failed: " + message);
        }
    }

    public static void assertEquals(Object expected, Object actual, String message) {
        if (expected == null && actual == null) return;
        if (expected != null && expected.equals(actual)) return;
        throw new AssertionError("Assertion Failed: " + message + " | Expected: " + expected + ", Actual: " + actual);
    }
}
