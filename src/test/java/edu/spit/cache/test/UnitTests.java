package edu.spit.cache.test;

import edu.spit.cache.config.CacheConfig;
import edu.spit.cache.core.CacheEngine;
import edu.spit.cache.core.CacheEntry;
import edu.spit.cache.event.CacheEventType;
import edu.spit.cache.event.EventBus;
import edu.spit.cache.eviction.LFUCache;
import edu.spit.cache.eviction.LRUCache;
import edu.spit.cache.index.BTreeIndex;
import edu.spit.cache.persistence.SnapshotManager;
import edu.spit.cache.persistence.WalDraft;
import edu.spit.cache.persistence.WalOperation;
import edu.spit.cache.persistence.WalReadResult;
import edu.spit.cache.persistence.WriteAheadLog;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

final class UnitTests {
    private UnitTests() { }

    static void configRejectsInvalidValues() throws Exception {
        Path directory = Files.createTempDirectory("cache-config-test");
        try {
            TestSupport.expect(IllegalArgumentException.class, () -> new CacheConfig(
                    directory.resolve("a"), directory.resolve("b"), directory.resolve("c"),
                    edu.spit.cache.config.DurabilityMode.ALWAYS, false, 0, 1, 1));
        } finally { TestSupport.deleteTree(directory); }
    }

    static void engineKeepsMapAndIndexConsistent() {
        CacheEngine engine = new CacheEngine();
        engine.put(new CacheEntry("a", "1", 1, 1, 0));
        engine.put(new CacheEntry("b", "2", 2, 2, 0));
        engine.put(new CacheEntry("a", "3", 3, 3, 0));
        TestSupport.equal("3", engine.lookup("a", 10).entry().value());
        TestSupport.equal(2, engine.range("a", "z", 10).size());
        engine.delete("b", 4);
        TestSupport.check(engine.validate(10).healthy(), "engine/index invariant failed");
    }

    static void engineRejectsStaleReplay() {
        CacheEngine engine = new CacheEngine();
        engine.put(new CacheEntry("key", "new", 10, 10, 0));
        TestSupport.check(!engine.put(new CacheEntry("key", "old", 5, 5, 0)).applied(), "stale write was applied");
        TestSupport.equal("new", engine.lookup("key", 20).entry().value());
        TestSupport.check(!engine.delete("key", 7).applied(), "stale delete was applied");
    }

    static void bTreeSplitsRangesAndDeletes() {
        BTreeIndex<String> index = new BTreeIndex<>();
        for (int n = 299; n >= 0; n--) index.put(String.format("k%03d", n), "v" + n);
        TestSupport.equal("v42", index.get("k042"));
        TestSupport.equal(21, index.rangeQuery("k040", "k060").size());
        index.put("k042", "updated");
        TestSupport.equal(300, index.size());
        index.delete("k042");
        TestSupport.equal(null, index.get("k042"));
        TestSupport.equal(299, index.size());
    }

    static void lruEvictsLeastRecent() {
        LRUCache cache = new LRUCache(2);
        cache.put("a", "1"); cache.put("b", "2"); cache.get("a"); cache.put("c", "3");
        TestSupport.equal(null, cache.get("b"));
        TestSupport.equal("1", cache.get("a"));
        TestSupport.equal(1L, cache.evictions());
    }

    static void lfuEvictsLeastFrequent() {
        LFUCache cache = new LFUCache(2);
        cache.put("a", "1"); cache.put("b", "2"); cache.get("a"); cache.put("c", "3");
        TestSupport.equal(null, cache.get("b"));
        TestSupport.equal("1", cache.get("a"));
        TestSupport.equal(1L, cache.evictions());
    }

    static void walRoundTripsUnicodeAndDetectsChecksumDamage() throws Exception {
        Path directory = Files.createTempDirectory("cache-wal-test");
        Path walPath = directory.resolve("cache.wal");
        try {
            try (WriteAheadLog wal = new WriteAheadLog(walPath, edu.spit.cache.config.DurabilityMode.ALWAYS)) {
                wal.append(WalDraft.standalone(WalOperation.SET, "नमस्ते key", "value, spaces ✓", 0));
                WalReadResult read = wal.readAll();
                TestSupport.equal("नमस्ते key", read.records().get(0).key());
                TestSupport.equal("value, spaces ✓", read.records().get(0).value());
            }
            Files.writeString(walPath, "V2\t999\t1\t-\tSET\t0\taw\tYg\tBADCRC\n", StandardCharsets.UTF_8, StandardOpenOption.APPEND);
            try (WriteAheadLog wal = new WriteAheadLog(walPath, edu.spit.cache.config.DurabilityMode.ALWAYS)) {
                TestSupport.equal(1, wal.readAll().checksumFailures());
            }
        } finally { TestSupport.deleteTree(directory); }
    }

    static void snapshotRoundTripsMetadata() throws Exception {
        Path directory = Files.createTempDirectory("cache-snapshot-test");
        try {
            SnapshotManager snapshots = new SnapshotManager(directory.resolve("cache.snapshot"));
            CacheEntry entry = new CacheEntry("key", "value", 9, 100, 500);
            snapshots.write(12, java.util.Map.of(entry.key(), entry));
            var restored = snapshots.read();
            TestSupport.equal(12L, restored.lastWalSequence());
            TestSupport.equal(entry, restored.entries().get("key"));
        } finally { TestSupport.deleteTree(directory); }
    }

    static void eventBusPreservesOrderAndIsolatesFailures() {
        EventBus bus = new EventBus(false);
        try {
            List<Long> order = new ArrayList<>();
            AtomicInteger healthyDeliveries = new AtomicInteger();
            bus.subscribe(event -> { throw new IllegalStateException("listener failure"); });
            bus.subscribe(event -> { order.add(event.eventId()); healthyDeliveries.incrementAndGet(); });
            bus.publish(CacheEventType.PUT, "a", "", "one");
            bus.publish(CacheEventType.DELETE, "a", "", "two");
            TestSupport.equal(List.of(1L, 2L), order);
            TestSupport.equal(2, healthyDeliveries.get());
            TestSupport.equal(2L, bus.statistics().listenerFailures());
        } finally { bus.close(); }
    }
}
