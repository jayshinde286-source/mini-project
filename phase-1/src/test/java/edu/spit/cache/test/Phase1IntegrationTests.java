package edu.spit.cache.test;

import edu.spit.cache.persistence.RecoveryReport;
import edu.spit.cache.service.Phase1CacheService;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.List;

/** Integration test suite demonstrating WAL crash recovery durability for Phase 1. */
public final class Phase1IntegrationTests {

    public static void runAll() throws Exception {
        System.out.println("Running Phase 1 Integration Tests...");
        testProcessCrashAndRecoveryReplay();
        testCorruptedWalHandling();
        testDurabilityAcrossServiceRestart();
        System.out.println("-> ALL PHASE 1 INTEGRATION TESTS PASSED SUCCESSFULLY!\n");
    }

    private static void testProcessCrashAndRecoveryReplay() throws Exception {
        Path tempDir = TestSupport.createTempDir("phase1_crash_test");
        Path walPath = tempDir.resolve("crash_demo.wal");

        try {
            // 1. Initial process writes data
            try (Phase1CacheService service = new Phase1CacheService(walPath)) {
                service.put("session:101", "active_user_jay", 0L);
                service.put("session:102", "active_user_sanchit", 0L);
                service.put("temp:99", "to_be_deleted", 0L);
                service.delete("temp:99");

                TestSupport.assertEquals("active_user_jay", service.get("session:101"), "Session 101 match");
                TestSupport.assertEquals(2, service.getActiveKeyCount(), "2 active keys before crash");
            }

            // 2. Restart service (simulating crash recovery on new JVM instance)
            try (Phase1CacheService service2 = new Phase1CacheService(walPath)) {
                TestSupport.assertEquals(2, service2.getActiveKeyCount(), "2 active keys after restart");
                TestSupport.assertEquals("active_user_jay", service2.get("session:101"), "Replayed session 101");
                TestSupport.assertEquals("active_user_sanchit", service2.get("session:102"), "Replayed session 102");
                TestSupport.assertEquals(null, service2.get("temp:99"), "Deleted key remains deleted after replay");
            }
        } finally {
            TestSupport.deleteRecursively(tempDir);
        }
        System.out.println("  [PASS] testProcessCrashAndRecoveryReplay");
    }

    private static void testCorruptedWalHandling() throws Exception {
        Path tempDir = TestSupport.createTempDir("phase1_corruption_test");
        Path walPath = tempDir.resolve("corrupt_demo.wal");

        try {
            // Write 2 valid records
            try (Phase1CacheService service = new Phase1CacheService(walPath)) {
                service.put("validKey1", "val1", 0L);
                service.put("validKey2", "val2", 0L);
            }

            // Inject a corrupted line manually into the WAL file
            String corruptedLine = "999|123456789|PUT|badKey|badVal|0|999999999\n"; // Bad CRC32 checksum
            Files.writeString(walPath, corruptedLine, StandardOpenOption.APPEND);

            // Re-open service and verify corrupt line is safely skipped
            try (Phase1CacheService service2 = new Phase1CacheService(walPath)) {
                TestSupport.assertEquals(2, service2.getActiveKeyCount(), "Valid keys preserved despite corruption");
                TestSupport.assertEquals("val1", service2.get("validKey1"), "validKey1 restored");
                TestSupport.assertEquals(null, service2.get("badKey"), "badKey skipped due to checksum failure");
            }
        } finally {
            TestSupport.deleteRecursively(tempDir);
        }
        System.out.println("  [PASS] testCorruptedWalHandling");
    }

    private static void testDurabilityAcrossServiceRestart() throws Exception {
        Path tempDir = TestSupport.createTempDir("phase1_restart_test");
        Path walPath = tempDir.resolve("restart_demo.wal");

        try {
            try (Phase1CacheService service = new Phase1CacheService(walPath)) {
                service.put("config:theme", "dark_mode", 0L);
                service.put("config:lang", "en_US", 0L);
            }

            // Re-open service
            try (Phase1CacheService service2 = new Phase1CacheService(walPath)) {
                TestSupport.assertEquals("dark_mode", service2.get("config:theme"), "Theme setting recovered");
                TestSupport.assertEquals("en_US", service2.get("config:lang"), "Language setting recovered");
            }
        } finally {
            TestSupport.deleteRecursively(tempDir);
        }
        System.out.println("  [PASS] testDurabilityAcrossServiceRestart");
    }
}
