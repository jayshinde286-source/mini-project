package edu.spit.cache.metrics;

import edu.spit.cache.event.CacheEvent;
import edu.spit.cache.event.CacheEventListener;

import java.util.concurrent.atomic.LongAdder;

/** Event-driven metrics projection: core code publishes facts; this subscriber counts them. */
public final class CacheMetrics implements CacheEventListener {
    private final LongAdder hits = new LongAdder();
    private final LongAdder misses = new LongAdder();
    private final LongAdder puts = new LongAdder();
    private final LongAdder deletes = new LongAdder();
    private final LongAdder expirations = new LongAdder();
    private final LongAdder casSuccesses = new LongAdder();
    private final LongAdder casRejections = new LongAdder();
    private final LongAdder transactionCommits = new LongAdder();
    private final LongAdder transactionRollbacks = new LongAdder();
    private final LongAdder transactionConflicts = new LongAdder();
    private final LongAdder snapshots = new LongAdder();
    private final LongAdder recoveries = new LongAdder();

    @Override
    public void onEvent(CacheEvent event) {
        switch (event.type()) {
            case HIT -> hits.increment();
            case MISS -> misses.increment();
            case PUT -> puts.increment();
            case DELETE -> deletes.increment();
            case EXPIRED -> expirations.increment();
            case CAS_SUCCEEDED -> casSuccesses.increment();
            case CAS_REJECTED -> casRejections.increment();
            case TRANSACTION_COMMITTED -> transactionCommits.increment();
            case TRANSACTION_ROLLED_BACK, TRANSACTION_TIMED_OUT -> transactionRollbacks.increment();
            case TRANSACTION_CONFLICT -> transactionConflicts.increment();
            case SNAPSHOT_CREATED -> snapshots.increment();
            case RECOVERY_COMPLETED -> recoveries.increment();
            default -> { }
        }
    }

    public MetricsSnapshot snapshot() {
        return new MetricsSnapshot(
                hits.sum(), misses.sum(), puts.sum(), deletes.sum(), expirations.sum(),
                casSuccesses.sum(), casRejections.sum(), transactionCommits.sum(),
                transactionRollbacks.sum(), transactionConflicts.sum(), snapshots.sum(), recoveries.sum());
    }
}
