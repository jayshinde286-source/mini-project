package edu.spit.cache.benchmark;

record BenchmarkResult(
        String pattern,
        String policy,
        double hitRate,
        double operationsPerSecond,
        long p50Nanos,
        long p95Nanos,
        long p99Nanos,
        long evictions) { }
