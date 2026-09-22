package edu.spit.cache.test;

import java.util.LinkedHashMap;
import java.util.Map;

/** Dependency-free test runner suitable for labs, CI, and offline evaluation. */
public final class AllTests {
    private AllTests() { }

    public static void main(String[] args) throws Exception {
        Map<String, TestSupport.CheckedRunnable> tests = new LinkedHashMap<>();
        tests.put("config rejects invalid values", UnitTests::configRejectsInvalidValues);
        tests.put("engine map/index invariant", UnitTests::engineKeepsMapAndIndexConsistent);
        tests.put("engine rejects stale replay", UnitTests::engineRejectsStaleReplay);
        tests.put("B-tree split/range/delete", UnitTests::bTreeSplitsRangesAndDeletes);
        tests.put("LRU eviction", UnitTests::lruEvictsLeastRecent);
        tests.put("LFU eviction", UnitTests::lfuEvictsLeastFrequent);
        tests.put("WAL checksum and Unicode", UnitTests::walRoundTripsUnicodeAndDetectsChecksumDamage);
        tests.put("snapshot metadata", UnitTests::snapshotRoundTripsMetadata);
        tests.put("event ordering and failure isolation", UnitTests::eventBusPreservesOrderAndIsolatesFailures);
        tests.put("standalone restart recovery", IntegrationTests::standaloneWritesRecoverAfterRestart);
        tests.put("incomplete transaction ignored", IntegrationTests::incompleteTransactionIsIgnoredDuringRecovery);
        tests.put("committed transaction recovery", IntegrationTests::committedTransactionRecoversAtomically);
        tests.put("damaged transaction rejected atomically", IntegrationTests::damagedCommittedTransactionIsRejectedAsAUnit);
        tests.put("exclusive WAL writer lock", IntegrationTests::secondWriterForSameWalIsRejected);
        tests.put("compare-and-set version check", IntegrationTests::compareAndSetRejectsStaleVersion);
        tests.put("TTL expiry and recovery", IntegrationTests::ttlExpiresAndIsNotRecovered);
        tests.put("event-driven metrics", IntegrationTests::eventMetricsAreProjectedFromOperations);
        tests.put("transaction write conflict", IntegrationTests::transactionDetectsWriteConflict);
        tests.put("transaction timeout", IntegrationTests::transactionTimeoutReleasesLocks);
        tests.put("checkpoint and WAL compaction", IntegrationTests::checkpointCompactionKeepsSequenceAndState);
        tests.put("operational CLI", IntegrationTests::commandLineExposesOperationalCommands);
        tests.put("concurrent writer invariants", IntegrationTests::concurrentWritersPreserveInvariants);

        int passed = 0;
        long started = System.nanoTime();
        for (Map.Entry<String, TestSupport.CheckedRunnable> test : tests.entrySet()) {
            try {
                test.getValue().run();
                passed++;
                System.out.printf("PASS  %s%n", test.getKey());
            } catch (Throwable failure) {
                System.err.printf("FAIL  %s: %s%n", test.getKey(), failure);
                failure.printStackTrace(System.err);
                System.exit(1);
            }
        }
        double seconds = (System.nanoTime() - started) / 1_000_000_000.0;
        System.out.printf("All %d tests passed in %.3f s.%n", passed, seconds);
    }
}
