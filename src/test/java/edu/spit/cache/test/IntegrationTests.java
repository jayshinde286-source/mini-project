package edu.spit.cache.test;

import edu.spit.cache.api.CacheValue;
import edu.spit.cache.cli.CommandHandler;
import edu.spit.cache.config.CacheConfig;
import edu.spit.cache.service.PersistentEventDrivenCache;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.PrintStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.ConcurrentModificationException;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

final class IntegrationTests {
    private IntegrationTests() { }

    static void standaloneWritesRecoverAfterRestart() throws Exception {
        Path directory = Files.createTempDirectory("cache-recovery-test");
        CacheConfig config = TestSupport.config(directory);
        try {
            try (PersistentEventDrivenCache cache = PersistentEventDrivenCache.open(config)) {
                cache.put("hello key", "value, with spaces");
                cache.put("gone", "x");
                cache.delete("gone");
            }
            try (PersistentEventDrivenCache cache = PersistentEventDrivenCache.open(config)) {
                TestSupport.equal("value, with spaces", cache.get("hello key").orElseThrow().value());
                TestSupport.check(cache.get("gone").isEmpty(), "deleted key recovered");
                TestSupport.check(cache.validate().healthy(), "recovered state is unhealthy");
            }
        } finally { TestSupport.deleteTree(directory); }
    }

    static void incompleteTransactionIsIgnoredDuringRecovery() throws Exception {
        Path directory = Files.createTempDirectory("cache-incomplete-tx-test");
        CacheConfig config = TestSupport.config(directory);
        try {
            String id;
            try (PersistentEventDrivenCache cache = PersistentEventDrivenCache.open(config)) {
                id = cache.transactions().begin();
                cache.transactions().set(id, "unsafe", "value");
                // Simulated crash: close without COMMIT. Only BEGIN reached the WAL because writes are buffered.
            }
            try (PersistentEventDrivenCache cache = PersistentEventDrivenCache.open(config)) {
                TestSupport.check(cache.get("unsafe").isEmpty(), "uncommitted value recovered");
            }
        } finally { TestSupport.deleteTree(directory); }
    }

    static void committedTransactionRecoversAtomically() throws Exception {
        Path directory = Files.createTempDirectory("cache-committed-tx-test");
        CacheConfig config = TestSupport.config(directory);
        try {
            try (PersistentEventDrivenCache cache = PersistentEventDrivenCache.open(config)) {
                String id = cache.transactions().begin();
                cache.transactions().set(id, "account:A", "5000");
                cache.transactions().set(id, "account:B", "15000");
                cache.transactions().commit(id);
            }
            try (PersistentEventDrivenCache cache = PersistentEventDrivenCache.open(config)) {
                TestSupport.equal("5000", cache.get("account:A").orElseThrow().value());
                TestSupport.equal("15000", cache.get("account:B").orElseThrow().value());
            }
        } finally { TestSupport.deleteTree(directory); }
    }

    static void damagedCommittedTransactionIsRejectedAsAUnit() throws Exception {
        Path directory = Files.createTempDirectory("cache-damaged-committed-tx-test");
        CacheConfig config = TestSupport.config(directory);
        try {
            try (PersistentEventDrivenCache cache = PersistentEventDrivenCache.open(config)) {
                String id = cache.transactions().begin();
                cache.transactions().set(id, "account:A", "5000");
                cache.transactions().set(id, "account:B", "15000");
                cache.transactions().commit(id);
            }
            List<String> lines = Files.readAllLines(config.walPath(), StandardCharsets.UTF_8);
            for (int index = 0; index < lines.size(); index++) {
                String line = lines.get(index);
                if (!line.contains("\tTX_SET\t")) continue;
                char last = line.charAt(line.length() - 1);
                lines.set(index, line.substring(0, line.length() - 1) + (last == '0' ? '1' : '0'));
                break;
            }
            Files.write(config.walPath(), lines, StandardCharsets.UTF_8);
            try (PersistentEventDrivenCache cache = PersistentEventDrivenCache.open(config)) {
                TestSupport.check(cache.get("account:A").isEmpty(), "partial transaction key A recovered");
                TestSupport.check(cache.get("account:B").isEmpty(), "partial transaction key B recovered");
                TestSupport.equal(1, cache.recoveryReport().checksumFailures());
                TestSupport.equal(1, cache.recoveryReport().rejectedTransactionBatches());
            }
        } finally { TestSupport.deleteTree(directory); }
    }

    static void secondWriterForSameWalIsRejected() throws Exception {
        Path directory = Files.createTempDirectory("cache-exclusive-writer-test");
        CacheConfig config = TestSupport.config(directory);
        try (PersistentEventDrivenCache first = PersistentEventDrivenCache.open(config)) {
            TestSupport.expect(java.io.IOException.class, () -> PersistentEventDrivenCache.open(config));
            first.put("still", "healthy");
            TestSupport.equal("healthy", first.get("still").orElseThrow().value());
        } finally { TestSupport.deleteTree(directory); }
    }

    static void compareAndSetRejectsStaleVersion() throws Exception {
        Path directory = Files.createTempDirectory("cache-cas-test");
        try (PersistentEventDrivenCache cache = PersistentEventDrivenCache.open(TestSupport.config(directory))) {
            CacheValue first = cache.put("counter", "1");
            TestSupport.check(!cache.compareAndSet("counter", first.version() - 1, "wrong", 0).updated(), "stale CAS succeeded");
            var success = cache.compareAndSet("counter", first.version(), "2", 0);
            TestSupport.check(success.updated(), "correct CAS failed");
            TestSupport.equal("2", cache.get("counter").orElseThrow().value());
        } finally { TestSupport.deleteTree(directory); }
    }

    static void ttlExpiresAndIsNotRecovered() throws Exception {
        Path directory = Files.createTempDirectory("cache-ttl-test");
        CacheConfig config = TestSupport.config(directory, 2_000, 10_000);
        try {
            try (PersistentEventDrivenCache cache = PersistentEventDrivenCache.open(config)) {
                cache.put("otp", "123456", 40);
                Thread.sleep(70);
                TestSupport.check(cache.get("otp").isEmpty(), "expired value was returned");
            }
            try (PersistentEventDrivenCache cache = PersistentEventDrivenCache.open(config)) {
                TestSupport.check(cache.get("otp").isEmpty(), "expired value recovered after restart");
            }
        } finally { TestSupport.deleteTree(directory); }
    }

    static void eventMetricsAreProjectedFromOperations() throws Exception {
        Path directory = Files.createTempDirectory("cache-metrics-test");
        try (PersistentEventDrivenCache cache = PersistentEventDrivenCache.open(TestSupport.config(directory))) {
            cache.put("a", "1");
            cache.get("a");
            cache.get("missing");
            cache.delete("a");
            var metrics = cache.metrics();
            TestSupport.equal(1L, metrics.hits());
            TestSupport.equal(1L, metrics.misses());
            TestSupport.equal(1L, metrics.puts());
            TestSupport.equal(1L, metrics.deletes());
            TestSupport.check(cache.recentEvents(20).size() >= 5, "event journal did not receive events");
        } finally { TestSupport.deleteTree(directory); }
    }

    static void transactionDetectsWriteConflict() throws Exception {
        Path directory = Files.createTempDirectory("cache-conflict-test");
        try (PersistentEventDrivenCache cache = PersistentEventDrivenCache.open(TestSupport.config(directory))) {
            String first = cache.transactions().begin();
            String second = cache.transactions().begin();
            cache.transactions().set(first, "shared", "one");
            TestSupport.expect(ConcurrentModificationException.class, () -> cache.transactions().set(second, "shared", "two"));
            cache.transactions().rollback(second);
            cache.transactions().commit(first);
            TestSupport.equal("one", cache.get("shared").orElseThrow().value());
        } finally { TestSupport.deleteTree(directory); }
    }

    static void transactionTimeoutReleasesLocks() throws Exception {
        Path directory = Files.createTempDirectory("cache-timeout-test");
        CacheConfig config = TestSupport.config(directory, 40, 10_000);
        try (PersistentEventDrivenCache cache = PersistentEventDrivenCache.open(config)) {
            String first = cache.transactions().begin();
            cache.transactions().set(first, "shared", "one");
            Thread.sleep(70);
            TestSupport.expect(IllegalStateException.class, () -> cache.transactions().set(first, "another", "x"));
            String second = cache.transactions().begin();
            cache.transactions().set(second, "shared", "two");
            cache.transactions().commit(second);
            TestSupport.equal("two", cache.get("shared").orElseThrow().value());
        } finally { TestSupport.deleteTree(directory); }
    }

    static void checkpointCompactionKeepsSequenceAndState() throws Exception {
        Path directory = Files.createTempDirectory("cache-checkpoint-test");
        CacheConfig config = TestSupport.config(directory);
        long snapshotSequence;
        try {
            try (PersistentEventDrivenCache cache = PersistentEventDrivenCache.open(config)) {
                cache.put("a", "1");
                cache.put("b", "2");
                snapshotSequence = cache.checkpoint(true).walSequence();
            }
            try (PersistentEventDrivenCache cache = PersistentEventDrivenCache.open(config)) {
                TestSupport.equal("1", cache.get("a").orElseThrow().value());
                CacheValue next = cache.put("c", "3");
                TestSupport.check(next.version() > snapshotSequence, "WAL sequence restarted after compaction");
            }
            try (PersistentEventDrivenCache cache = PersistentEventDrivenCache.open(config)) {
                TestSupport.equal(3, cache.all().size());
            }
        } finally { TestSupport.deleteTree(directory); }
    }

    static void commandLineExposesOperationalCommands() throws Exception {
        Path directory = Files.createTempDirectory("cache-cli-test");
        try (PersistentEventDrivenCache cache = PersistentEventDrivenCache.open(TestSupport.config(directory))) {
            String script = "SET name Jay Shinde\nGET name\nMETRICS\nHEALTH\nINFO\nDIAGNOSTICS\nEXIT\n";
            ByteArrayOutputStream bytes = new ByteArrayOutputStream();
            new CommandHandler(cache).run(
                    new ByteArrayInputStream(script.getBytes(StandardCharsets.UTF_8)),
                    new PrintStream(bytes, true, StandardCharsets.UTF_8));
            String output = bytes.toString(StandardCharsets.UTF_8);
            TestSupport.check(output.contains("Jay Shinde"), "CLI did not return the value");
            TestSupport.check(output.contains("HEALTHY"), "CLI health command failed");
            TestSupport.check(output.contains("STORAGE walBytes="), "CLI diagnostics omitted storage evidence");
            TestSupport.check(output.contains("EVENTS published="), "CLI diagnostics omitted event evidence");
            TestSupport.check(output.contains(PersistentEventDrivenCache.PROJECT_TITLE), "CLI omitted project title");
        } finally { TestSupport.deleteTree(directory); }
    }

    static void concurrentWritersPreserveInvariants() throws Exception {
        Path directory = Files.createTempDirectory("cache-concurrency-test");
        try (PersistentEventDrivenCache cache = PersistentEventDrivenCache.open(TestSupport.config(directory))) {
            var executor = Executors.newFixedThreadPool(4);
            for (int thread = 0; thread < 4; thread++) {
                int owner = thread;
                executor.submit(() -> {
                    for (int i = 0; i < 25; i++) cache.put("t" + owner + ":" + i, "v" + i);
                    return null;
                });
            }
            executor.shutdown();
            TestSupport.check(executor.awaitTermination(10, TimeUnit.SECONDS), "concurrent test timed out");
            TestSupport.equal(100, cache.all().size());
            TestSupport.check(cache.validate().healthy(), "concurrent writers broke invariants");
        } finally { TestSupport.deleteTree(directory); }
    }
}
