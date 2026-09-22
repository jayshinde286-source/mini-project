# Technical Evidence & Artifacts Inventory

---

## 1. Repository Audit Summary

This document provides a factual, non-fabricated inventory of all components, features, tests, build configurations, and reports present within the project repository.

```
┌────────────────────────────────────────────────────────────────────────────┐
│                    REPOSITORY FEATURE VERIFICATION MATRIX                  │
├──────────────────────────────────────┬─────────────────────────────────────┤
│ Total Automated Tests in Test Suite  │ 22 Tests (100% Passing)             │
│ Test Execution Duration              │ ~0.34 seconds                       │
│ Primary Programming Language         │ Java 17 (Zero External Dependencies)│
│ Build Tooling Support                │ GNU Make (`Makefile`) & Maven       │
└──────────────────────────────────────┴─────────────────────────────────────┘
```

---

## 2. Feature-by-Feature Evidence Table

| Feature / Subsystem | Status | Evidence Description | Relevant File / Path | Demonstration Method |
|---|---|---|---|---|
| **Build Configuration** | **IMPLEMENTED** | Standard Maven `pom.xml` and automated GNU `Makefile` supporting zero-dependency build, test, and JAR packaging. | [`Makefile`](file:///Users/jayshinde/Documents/mini%20project/Makefile), [`pom.xml`](file:///Users/jayshinde/Documents/mini%20project/pom.xml) | Run `make verify` in terminal. |
| **In-Memory Cache Engine** | **IMPLEMENTED** | Thread-safe key-value store with versioning, TTL checks, and state invariant checks. | [`src/main/java/edu/spit/cache/core/CacheEngine.java`](file:///Users/jayshinde/Documents/mini%20project/src/main/java/edu/spit/cache/core/CacheEngine.java) | Executed via `UnitTests.java` and `make demo`. |
| **Write-Ahead Log (WAL)** | **IMPLEMENTED** | Append-only sequential log with CRC32 polynomial checksums and OS-level exclusive file lock. | [`src/main/java/edu/spit/cache/persistence/WriteAheadLog.java`](file:///Users/jayshinde/Documents/mini%20project/src/main/java/edu/spit/cache/persistence/WriteAheadLog.java) | Verified by `WAL checksum and Unicode` test. |
| **Crash Recovery Engine** | **IMPLEMENTED** | Replays snapshot + WAL entries idempotently and detects corrupted bytes or torn writes. | [`src/main/java/edu/spit/cache/persistence/RecoveryManager.java`](file:///Users/jayshinde/Documents/mini%20project/src/main/java/edu/spit/cache/persistence/RecoveryManager.java) | Verified by `standalone restart recovery` test. |
| **Snapshot Manager & Compaction** | **IMPLEMENTED** | Creates atomic binary snapshots and compacts older WAL entries. | [`src/main/java/edu/spit/cache/persistence/SnapshotManager.java`](file:///Users/jayshinde/Documents/mini%20project/src/main/java/edu/spit/cache/persistence/SnapshotManager.java) | Verified by `checkpoint and WAL compaction` test. |
| **Ordered Event Bus** | **IMPLEMENTED** | In-memory pub-sub dispatcher with listener exception isolation and ordered event delivery. | [`src/main/java/edu/spit/cache/event/EventBus.java`](file:///Users/jayshinde/Documents/mini%20project/src/main/java/edu/spit/cache/event/EventBus.java) | Verified by `event ordering and failure isolation` test. |
| **Circular Event Journal** | **IMPLEMENTED** | Ring buffer capturing recent domain events for CLI inspection. | [`src/main/java/edu/spit/cache/event/InMemoryEventJournal.java`](file:///Users/jayshinde/Documents/mini%20project/src/main/java/edu/spit/cache/event/InMemoryEventJournal.java) | Query via `JOURNAL` command in CLI. |
| **JSONL Audit Logger** | **IMPLEMENTED** | Appends structured JSON lines for every mutation to `audit.jsonl`. | [`src/main/java/edu/spit/cache/event/AuditLogListener.java`](file:///Users/jayshinde/Documents/mini%20project/src/main/java/edu/spit/cache/event/AuditLogListener.java) | Inspect generated audit file after writes. |
| **Observability Metrics** | **IMPLEMENTED** | Event-derived telemetry tracking hits, misses, hit ratio, and operation counts. | [`src/main/java/edu/spit/cache/metrics/CacheMetrics.java`](file:///Users/jayshinde/Documents/mini%20project/src/main/java/edu/spit/cache/metrics/CacheMetrics.java) | Query via `METRICS` command in CLI. |
| **LRU Eviction Policy** | **IMPLEMENTED** | $O(1)$ Least Recently Used eviction using a doubly linked hash map. | [`src/main/java/edu/spit/cache/eviction/LRUCache.java`](file:///Users/jayshinde/Documents/mini%20project/src/main/java/edu/spit/cache/eviction/LRUCache.java) | Verified by `LRU eviction` unit test. |
| **LFU Eviction Policy** | **IMPLEMENTED** | $O(1)$ Least Frequently Used eviction with frequency lists and LRU tie-breaker. | [`src/main/java/edu/spit/cache/eviction/LFUCache.java`](file:///Users/jayshinde/Documents/mini%20project/src/main/java/edu/spit/cache/eviction/LFUCache.java) | Verified by `LFU eviction` unit test. |
| **B-Tree Ordered Range Index** | **IMPLEMENTED** | Multi-way balanced search tree supporting inclusive range scans (`SCAN`). | [`src/main/java/edu/spit/cache/index/BTreeIndex.java`](file:///Users/jayshinde/Documents/mini%20project/src/main/java/edu/spit/cache/index/BTreeIndex.java) | Verified by `B-tree split/range/delete` test. |
| **Optimistic Concurrency (CAS)** | **IMPLEMENTED** | Version-checked compare-and-set preventing race conditions. | [`src/main/java/edu/spit/cache/core/CacheEngine.java`](file:///Users/jayshinde/Documents/mini%20project/src/main/java/edu/spit/cache/core/CacheEngine.java) | Verified by `compare-and-set version check` test. |
| **Multi-Key Transactions** | **IMPLEMENTED** | 2-Phase key-locked atomic transactions with rollback and WAL batching. | [`src/main/java/edu/spit/cache/transaction/TransactionManager.java`](file:///Users/jayshinde/Documents/mini%20project/src/main/java/edu/spit/cache/transaction/TransactionManager.java) | Verified by `committed transaction recovery` test. |
| **Interactive CLI Shell** | **IMPLEMENTED** | Full interactive command-line interface with script execution. | [`src/main/java/edu/spit/cache/cli/CommandHandler.java`](file:///Users/jayshinde/Documents/mini%20project/src/main/java/edu/spit/cache/cli/CommandHandler.java) | Run `make run` or `make demo`. |
| **Benchmark Harness** | **IMPLEMENTED** | Synthetic benchmark driver testing LRU/LFU under uniform and Zipfian distributions. | [`src/main/java/edu/spit/cache/benchmark/Benchmark.java`](file:///Users/jayshinde/Documents/mini%20project/src/main/java/edu/spit/cache/benchmark/Benchmark.java) | Run `make benchmark`. |
| **Web UI Dashboard** | **PLANNED** | Graphical real-time web dashboard for browser-based monitoring. | *No repository evidence found yet — planned for later phase.* | Planned for subsequent visual demonstration. |
| **Distributed Replication** | **OUT OF SCOPE** | Multi-node consensus (Raft/Paxos). | *No repository evidence found yet — intentionally declared out of scope.* | Single-node in-process focus. |

---

## 3. Test Suite Verification Output

Executing `make verify` against the repository produces the following verifiable pass output:

```text
PASS  config rejects invalid values
PASS  engine map/index invariant
PASS  engine rejects stale replay
PASS  B-tree split/range/delete
PASS  LRU eviction
PASS  LFU eviction
PASS  WAL checksum and Unicode
PASS  snapshot metadata
PASS  event ordering and failure isolation
PASS  standalone restart recovery
PASS  incomplete transaction ignored
PASS  committed transaction recovery
PASS  damaged transaction rejected atomically
PASS  exclusive WAL writer lock
PASS  compare-and-set version check
PASS  TTL expiry and recovery
PASS  event-driven metrics
PASS  transaction write conflict
PASS  transaction timeout
PASS  checkpoint and WAL compaction
PASS  operational CLI
PASS  concurrent writer invariants
All 22 tests passed in 0.340 s.
Created target/persistent-event-driven-cache-3.0.0.jar
```

---

## 4. Phase-I Evaluation Reports Found in Repository

The `phase-1/reports/` folder contains authenticated departmental documentation:
* `phase-1/reports/Phase1_Weekly_Report_Week1.pdf` — Initial Week 1 problem exploration review.
* `phase-1/reports/Phase1_Weekly_Report_Week2.pdf` — Week 2 literature survey and gap analysis.
* `phase-1/reports/Phase1_Weekly_Report_Week3_CORRECTED.pdf` — Approved milestone sign-off.
