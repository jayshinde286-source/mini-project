package edu.spit.cache.test;

import edu.spit.cache.core.CacheEngine;
import edu.spit.cache.core.CacheEntry;
import edu.spit.cache.core.LookupResult;
import edu.spit.cache.event.CacheEvent;
import edu.spit.cache.event.CacheEventType;
import edu.spit.cache.event.EventBus;
import edu.spit.cache.metrics.CacheMetrics;
import edu.spit.cache.persistence.WalOperation;
import edu.spit.cache.persistence.WalRecord;
import edu.spit.cache.persistence.WriteAheadLog;

import java.nio.file.Path;

/** Unit test suite covering core components of Phase 1. */
public final class Phase1UnitTests {

    public static void runAll() throws Exception {
        System.out.println("Running Phase 1 Unit Tests...");
        testCacheEngineBasicOps();
        testCacheEngineTtlExpiry();
        testWalRecordChecksum();
        testEventBusAndMetrics();
        testWalAppendingAndReading();
        System.out.println("-> ALL PHASE 1 UNIT TESTS PASSED SUCCESSFULLY!\n");
    }

    private static void testCacheEngineBasicOps() {
        CacheEngine engine = new CacheEngine();
        CacheEntry entry1 = CacheEntry.of("user:101", "Jay", 1L, 0L);
        engine.put(entry1);

        LookupResult res1 = engine.lookup("user:101", System.currentTimeMillis());
        TestSupport.assertTrue(res1.isHit(), "Expected lookup hit for key user:101");
        TestSupport.assertEquals("Jay", res1.entry().value().text(), "Expected value Jay");

        engine.delete("user:101");
        LookupResult res2 = engine.lookup("user:101", System.currentTimeMillis());
        TestSupport.assertTrue(!res2.isHit(), "Expected lookup miss after delete");
        System.out.println("  [PASS] testCacheEngineBasicOps");
    }

    private static void testCacheEngineTtlExpiry() throws Exception {
        CacheEngine engine = new CacheEngine();
        CacheEntry entry = CacheEntry.of("tempKey", "val", 1L, 50L); // 50ms TTL
        engine.put(entry);

        Thread.sleep(80); // wait for expiry

        LookupResult res = engine.lookup("tempKey", System.currentTimeMillis());
        TestSupport.assertTrue(res.isExpired(), "Expected entry to be expired after TTL");
        System.out.println("  [PASS] testCacheEngineTtlExpiry");
    }

    private static void testWalRecordChecksum() {
        WalRecord rec = WalRecord.create(1L, WalOperation.PUT, "k1", "v1", 0L);
        TestSupport.assertTrue(rec.isValidChecksum(), "Expected valid CRC32 checksum");

        // Test corruption detection
        String raw = rec.serialize();
        String corruptedRaw = raw.replace("v1", "CORRUPTED");
        try {
            WalRecord.parse(corruptedRaw);
            TestSupport.assertTrue(false, "Expected parsing of corrupted line to fail");
        } catch (IllegalArgumentException expected) {
            // Success
        }
        System.out.println("  [PASS] testWalRecordChecksum");
    }

    private static void testEventBusAndMetrics() {
        EventBus bus = new EventBus();
        CacheMetrics metrics = new CacheMetrics();
        bus.register(metrics);

        bus.publish(CacheEvent.create(CacheEventType.HIT, "k1", "v1"));
        bus.publish(CacheEvent.create(CacheEventType.HIT, "k2", "v2"));
        bus.publish(CacheEvent.create(CacheEventType.MISS, "k3", null));

        TestSupport.assertEquals(2L, metrics.getHits(), "Expected 2 hits");
        TestSupport.assertEquals(1L, metrics.getMisses(), "Expected 1 miss");
        TestSupport.assertTrue(Math.abs(metrics.getHitRatio() - (2.0 / 3.0)) < 0.001, "Expected hit ratio ~0.667");
        System.out.println("  [PASS] testEventBusAndMetrics");
    }

    private static void testWalAppendingAndReading() throws Exception {
        Path tempDir = TestSupport.createTempDir("phase1_test_wal");
        Path walPath = tempDir.resolve("test.wal");

        try (WriteAheadLog wal = new WriteAheadLog(walPath)) {
            wal.append(WalOperation.PUT, "k1", "v1", 0L);
            wal.append(WalOperation.PUT, "k2", "v2", 0L);
            wal.append(WalOperation.DELETE, "k1", null, 0L);

            var readResult = wal.readAll();
            TestSupport.assertEquals(3, readResult.validCount(), "Expected 3 valid WAL records");
            TestSupport.assertEquals(0, readResult.corruptedCount(), "Expected 0 corrupted records");
        } finally {
            TestSupport.deleteRecursively(tempDir);
        }
        System.out.println("  [PASS] testWalAppendingAndReading");
    }
}
