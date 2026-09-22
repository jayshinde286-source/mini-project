package edu.spit.cache.metrics;

import edu.spit.cache.event.CacheEvent;
import edu.spit.cache.event.CacheEventListener;

import java.util.concurrent.atomic.AtomicLong;

/** Event-derived metrics accumulator for Phase 1. */
public final class CacheMetrics implements CacheEventListener {
    private final AtomicLong hits = new AtomicLong();
    private final AtomicLong misses = new AtomicLong();
    private final AtomicLong puts = new AtomicLong();
    private final AtomicLong deletes = new AtomicLong();
    private final AtomicLong expiries = new AtomicLong();

    @Override
    public void onEvent(CacheEvent event) {
        switch (event.type()) {
            case HIT -> hits.incrementAndGet();
            case MISS -> misses.incrementAndGet();
            case PUT -> puts.incrementAndGet();
            case DELETE -> deletes.incrementAndGet();
            case EXPIRE -> expiries.incrementAndGet();
            default -> {}
        }
    }

    public long getHits() { return hits.get(); }
    public long getMisses() { return misses.get(); }
    public long getPuts() { return puts.get(); }
    public long getDeletes() { return deletes.get(); }
    public long getExpiries() { return expiries.get(); }

    public double getHitRatio() {
        long total = hits.get() + misses.get();
        if (total == 0) return 0.0;
        return (double) hits.get() / total;
    }

    public String formatSummary() {
        return String.format(
                "Metrics | Hits: %d | Misses: %d | Hit Ratio: %.2f%% | Puts: %d | Deletes: %d | Expiries: %d",
                hits.get(), misses.get(), getHitRatio() * 100.0, puts.get(), deletes.get(), expiries.get()
        );
    }
}
