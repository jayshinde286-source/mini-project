package edu.spit.cache.benchmark;

import edu.spit.cache.eviction.CachePolicy;
import edu.spit.cache.eviction.LFUCache;
import edu.spit.cache.eviction.LRUCache;

import java.util.Arrays;

/** Repeatable single-process benchmark with hit rate, throughput, latency percentiles, and evictions. */
public final class Benchmark {
    private Benchmark() { }

    public static void main(String[] args) {
        int capacity = args.length > 0 ? Integer.parseInt(args[0]) : 100;
        int requests = args.length > 1 ? Integer.parseInt(args[1]) : 100_000;
        System.out.printf("%-12s %-5s %9s %12s %9s %9s %9s %10s%n",
                "pattern", "type", "hit-rate", "ops/sec", "p50-ns", "p95-ns", "p99-ns", "evictions");
        for (AccessPattern.Type pattern : AccessPattern.Type.values()) {
            print(run(new LRUCache(capacity), pattern, requests));
            print(run(new LFUCache(capacity), pattern, requests));
        }
    }

    static BenchmarkResult run(CachePolicy cache, AccessPattern.Type type, int requests) {
        AccessPattern accesses = new AccessPattern(1_000, type);
        long[] latencies = new long[requests];
        long started = System.nanoTime();
        for (int i = 0; i < requests; i++) {
            String key = accesses.next();
            long operationStart = System.nanoTime();
            if (cache.get(key) == null) cache.put(key, "value-" + key);
            latencies[i] = System.nanoTime() - operationStart;
        }
        double seconds = (System.nanoTime() - started) / 1_000_000_000.0;
        Arrays.sort(latencies);
        return new BenchmarkResult(
                type.name(), cache.name(), cache.hitRatePercent(), requests / seconds,
                percentile(latencies, 0.50), percentile(latencies, 0.95), percentile(latencies, 0.99), cache.evictions());
    }

    private static long percentile(long[] values, double percentile) {
        int index = Math.min(values.length - 1, (int) Math.ceil(percentile * values.length) - 1);
        return values[Math.max(0, index)];
    }

    private static void print(BenchmarkResult result) {
        System.out.printf("%-12s %-5s %8.2f%% %,12.0f %,9d %,9d %,9d %,10d%n",
                result.pattern(), result.policy(), result.hitRate(), result.operationsPerSecond(),
                result.p50Nanos(), result.p95Nanos(), result.p99Nanos(), result.evictions());
    }
}
