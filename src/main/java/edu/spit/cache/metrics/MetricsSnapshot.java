package edu.spit.cache.metrics;

/** Immutable operational metrics view. */
public record MetricsSnapshot(
        long hits,
        long misses,
        long puts,
        long deletes,
        long expirations,
        long casSuccesses,
        long casRejections,
        long transactionCommits,
        long transactionRollbacks,
        long transactionConflicts,
        long snapshots,
        long recoveries) {

    public double hitRatePercent() {
        long total = hits + misses;
        return total == 0 ? 0.0 : 100.0 * hits / total;
    }
}
