# 03. Existing & Related Systems Study

---

## 1. Academic Disclaimer & Project Positioning

> **IMPORTANT ACADEMIC STATEMENT:**  
> * **WE ARE NOT CLAIMING TO INVENT CACHING.**
> * **WE ARE NOT CLAIMING TO REPLACE REDIS, DATABASES OR PRODUCTION CACHE SYSTEMS.**
> * This is an **educational, systems-focused Third-Year Computer Science Mini-Project** designed to integrate, model, and demonstrate fundamental systems concepts (durability logs, snapshotting, event sourcing, eviction heuristics, and concurrency primitives) in a single, transparent, and modular Java implementation.

---

## 2. Review of Related Approaches

In Phase I, we analyzed four major categories of key-value storage architectures:

```
┌────────────────────────────────────────────────────────────────────────────┐
│                  COMPARATIVE TAXONOMY OF APPROACHES                        │
├───────────────────────┬────────────────────────────────────────────────────┤
│ 1. Raw Data Structure │ java.util.HashMap / ConcurrentHashMap              │
├───────────────────────┼────────────────────────────────────────────────────┤
│ 2. In-Memory Cache    │ Guava Cache / Caffeine / Memcached                 │
├───────────────────────┼────────────────────────────────────────────────────┤
│ 3. Storage Engine     │ RocksDB / LevelDB / BerkeleyDB                     │
├───────────────────────┼────────────────────────────────────────────────────┤
│ 4. Proposed Module    │ Persistent Event-Driven Memory Cache Module        │
└───────────────────────┴────────────────────────────────────────────────────┘
```

---

### A. Standard Java Collections (`java.util.HashMap` / `ConcurrentHashMap`)

* **Architecture Overview**: Implements a standard in-memory hash table using buckets of linked nodes and balanced red-black trees for hash collisions.
* **Strengths**:
  * Near-instantaneous memory lookups ($O(1)$ amortized time complexity).
  * Standard JDK library component with zero dependencies.
* **Limitations**:
  * **Strictly Volatile**: Memory state is wiped completely upon JVM exit or process crash.
  * **No Built-in Expiry/Eviction**: Lacks native TTL support or memory-bounding algorithms.
  * **Zero Observability**: Provides no lifecycle events, mutation logging, or metrics hooks.
  * **No Recovery Protocol**: Rebuilding data requires manual full reload from an external database.

---

### B. Typical In-Memory Caching Libraries (e.g., Google Guava, Caffeine, Memcached)

* **Architecture Overview**: Sophisticated memory-resident caches optimized for high concurrent read/write throughput and advanced eviction policies (e.g., TinyLFU, W-TinyLFU, LRU).
* **Strengths**:
  * Exceptional concurrent throughput and low cache hit latency.
  * Robust automatic eviction and TTL expiration policies.
  * Built-in statistical recording (hits, misses, evictions).
* **Limitations**:
  * **Volatile-First Focus**: Designed as ephemeral layers in front of databases; they do not natively provide persistent crash-recovery logs (WAL) or snapshot restoration.
  * **Coupled Architecture**: Often tightly coupled to specific memory models rather than exposing a clean educational event bus architecture for domain monitoring.
  * **Complex Internal Machinery**: Difficult for undergraduate systems students to dissect, modify, crash-test, and inspect recovery invariants directly.

---

### C. Persistent Storage Engines (e.g., RocksDB, LevelDB, SQLite)

* **Architecture Overview**: Storage engines utilizing Log-Structured Merge-trees (LSM-trees) or B-trees designed for persistent disk storage, high durability, and crash recovery.
* **Strengths**:
  * Strong durability guarantees (ACID transactions, write-ahead logs, and SSTables).
  * Seamless recovery after unexpected termination.
* **Limitations**:
  * **Disk-Oriented I/O Path**: Designed primarily as database storage engines rather than lightweight, in-memory cache modules.
  * **High Complexity & Native Dependencies**: Heavy C/C++ native bindings (JNI) or large binaries that obscure pure systems-level understanding.
  * **Lacks Event-Driven Cache Semantics**: Lacks decoupled cache event buses for real-time observability.

---

### D. Our Proposed Module (Persistent Event-Driven Memory Cache)

* **Architecture Overview**: A lightweight, modular Java subsystem combining the memory speed of a cache with the crash durability of an append-only WAL, decoupled event notifications, TTL/eviction algorithms, and versioned concurrency control.
* **Strengths**:
  * **Fast RAM Access**: Retains direct in-memory lookup performance.
  * **Guaranteed Durability**: Sequential WAL logging with CRC32 checksums ensures complete crash recovery.
  * **First-Class Observability**: Built-in event bus emits domain events for real-time monitoring and JSON audit trails.
  * **Controlled Memory**: Configurable TTL sweeper alongside O(1) LRU/LFU eviction.
  * **Educational Clarity**: 100% pure Java 17, zero external dependencies, designed for white-box inspection, unit testing, and demonstration.

---

## 3. Comprehensive Comparison Table

| Feature / Dimension | Standard Java HashMap | Typical Memory Cache (e.g., Guava) | Storage Engine (e.g., RocksDB) | **Our Proposed Module** |
|---|---|---|---|---|
| **Primary Storage Medium** | RAM (Heap) | RAM (Heap) | Disk / Flash (SSD) | **RAM + Disk (WAL/Snap)** |
| **Read Latency** | $< 1 \text{ µs}$ | $< 5 \text{ µs}$ | $50 \text{ µs} - 2 \text{ ms}$ | **$< 5 \text{ µs}$ (RAM)** |
| **Crash Durability** | ❌ None | ❌ None | ✅ Full (LSM/WAL) | **✅ Full (WAL + Snapshot)** |
| **Automated Recovery** | ❌ None | ❌ None | ✅ Yes | **✅ Yes (Replay Engine)** |
| **Data Integrity Checks** | ❌ None | ❌ None | ✅ CRC32 / Block checks | **✅ CRC32 Checksums** |
| **TTL Expiration** | ❌ None | ✅ Yes | ⚠️ Limited / Compaction | **✅ Yes (Lazy + Sweep)** |
| **Eviction Policies** | ❌ None | ✅ Yes (LRU/W-TinyLFU) | ❌ N/A (Disk bounds) | **✅ Yes (LRU & LFU)** |
| **Event-Driven Bus** | ❌ None | ⚠️ Basic Callbacks | ❌ None | **✅ Decoupled Event Bus** |
| **Metrics & JSON Audit** | ❌ None | ⚠️ Basic Stats | ⚠️ Internal Counters | **✅ Metrics + JSONL Audit** |
| **Concurrency Control** | ⚠️ Explicit Locks | ✅ Lock-Free / Striped | ✅ MVCC / File Locks | **✅ CAS + Key Locks** |
| **Ordered Indexing** | ❌ None | ❌ None | ✅ B-Tree / SSTable | **✅ B-Tree Range Queries** |
| **External Dependencies** | Zero (JDK) | External JARs | Heavy C++ Native JNI | **Zero (Pure JDK 17)** |
| **Educational Value** | Basic data structure | Black-box library | Industrial storage engine | **High (White-box system)** |

---

## 4. Key Takeaways from the Literature Study

1. **Trade-off Resolution**: Pure memory caches neglect durability, while storage engines sacrifice memory-centric simplicity. Our module combines both without heavy infrastructure.
2. **Pedagogical Alignment**: By building the core components from scratch in standard Java, we gain deep mastery over operating system interactions (file flushing, file locks), data structures (B-trees, doubly linked lists, frequency buckets), and concurrent state machines.
