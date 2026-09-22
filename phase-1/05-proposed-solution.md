# 05. Proposed Solution

---

## 1. Module Overview

The proposed **Persistent Event-Driven Memory Cache Module** is an in-process, zero-dependency Java subsystem that provides ultra-fast key-value operations backed by durable recovery logging, decoupled event streams, bounded memory eviction, and concurrency primitives.

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                      HIGH-LEVEL ARCHITECTURE FLOW                       │
└─────────────────────────────────────────────────────────────────────────┘

                       [ Client / Demo CLI / App ]
                                    │
                                    ▼
                      [ Public Service Facade / API ]
                                    │
                                    ▼
                         [ Core Cache Engine ]
                                    │
    ┌───────────────────┬───────────┴───────────┬───────────────────┐
    │                   │                       │                   │
    ▼                   ▼                       ▼                   ▼
[ Persistence &     [ Memory & TTL ]      [ Event Bus &       [ Concurrency &
   Recovery ]                              Observability ]      Transactions ]
  - WAL (CRC32)       - Key-Value Map       - Event Bus         - Atomic CAS
  - Snapshots         - B-Tree Index        - Event Journal     - Key Locking
  - Replay Engine     - LRU Policy          - JSONL Audit       - Tx Manager
  - OS File Lock      - LFU Policy          - Metrics Sink      - Rollback
```

---

## 2. Structural Component Breakdown & Verification Status

To ensure complete honesty and transparency regarding the codebase state, the table below provides a component-by-component audit against the active repository:

| Component | Responsibility | Current Repository Status | Primary Class File |
|---|---|---|---|
| **Public Service Facade** | Coordinates engine, WAL, and bus into a unified API (`get`, `put`, `delete`, `checkpoint`). | **IMPLEMENTED** | `edu.spit.cache.service.PersistentEventDrivenCache` |
| **Core Cache Engine** | Primary in-memory store maintaining versioned cache entries, TTL expiration, and state invariants. | **IMPLEMENTED** | `edu.spit.cache.core.CacheEngine` |
| **Write-Ahead Log (WAL)** | Append-only sequential disk log with monotonic sequence IDs, CRC32 checksums, and fsync policies. | **IMPLEMENTED** | `edu.spit.cache.persistence.WriteAheadLog` |
| **Snapshot Manager** | Produces atomic point-in-time binary disk snapshots and enables WAL compaction. | **IMPLEMENTED** | `edu.spit.cache.persistence.SnapshotManager` |
| **Recovery Manager** | Replays snapshots + valid WAL entries upon startup and reports detected corruptions. | **IMPLEMENTED** | `edu.spit.cache.persistence.RecoveryManager` |
| **Exclusive OS Lock** | File-backed OS lock preventing multiple processes from concurrently writing the same WAL. | **IMPLEMENTED** | `edu.spit.cache.persistence.WriteAheadLog` |
| **Event Bus** | Pub-sub bus delivering ordered, immutable domain events with subscriber failure isolation. | **IMPLEMENTED** | `edu.spit.cache.event.EventBus` |
| **Event Journal** | Circular in-memory ring buffer capturing the most recent events for live inspection. | **IMPLEMENTED** | `edu.spit.cache.event.InMemoryEventJournal` |
| **Audit Logger** | Subscriber that streams cache mutation events into an append-only `audit.jsonl` file. | **IMPLEMENTED** | `edu.spit.cache.event.AuditLogListener` |
| **Metrics Collector** | Event-derived projection calculating real-time hits, misses, hit ratio, throughput, and latencies. | **IMPLEMENTED** | `edu.spit.cache.metrics.CacheMetrics` |
| **TTL & Sweeper** | Per-key millisecond TTL with lazy read expiration and proactive background cleaner thread. | **IMPLEMENTED** | `edu.spit.cache.core.CacheEngine` |
| **LRU Eviction Policy** | $O(1)$ Least Recently Used bounded eviction implemented via doubly linked hash map. | **IMPLEMENTED** | `edu.spit.cache.eviction.LRUCache` |
| **LFU Eviction Policy** | $O(1)$ Least Frequently Used bounded eviction with frequency nodes and LRU tie-breaking. | **IMPLEMENTED** | `edu.spit.cache.eviction.LFUCache` |
| **B-Tree Ordered Index** | Multi-way search tree indexing keys for inclusive lexicographical range scans (`scan(from, to)`). | **IMPLEMENTED** | `edu.spit.cache.index.BTreeIndex` |
| **Optimistic CAS** | Atomic versioned compare-and-set preventing race conditions during concurrent updates. | **IMPLEMENTED** | `edu.spit.cache.core.CacheEngine` |
| **Transaction Manager** | Multi-key atomic transactions with exclusive key locking, WAL batching, and rollback. | **IMPLEMENTED** | `edu.spit.cache.transaction.TransactionManager` |
| **Interactive CLI** | Full command-line interface for human interaction, scripting, and diagnostics. | **IMPLEMENTED** | `edu.spit.cache.cli.CommandHandler` |
| **Benchmark Suite** | Synthetic benchmarking harness evaluating throughput and latencies across access patterns. | **IMPLEMENTED** | `edu.spit.cache.benchmark.Benchmark` |
| **Web UI / Graphical Client** | Browser-based real-time dashboard connecting via HTTP/WebSocket to visualize cache state. | **PLANNED** | *Planned for future phase demo* |
| **Distributed Replication** | Multi-node consensus (Raft/Paxos) for distributed cache clustering. | **PLANNED / OUT OF SCOPE** | *Explicitly declared out of scope for Phase I* |

---

## 3. Key Technical Invariants of the Proposed Solution

1. **WAL-Before-Memory Invariant**: No state mutation is ever applied to in-memory maps until the corresponding entry or transaction batch is durably serialized and flushed to the WAL.
2. **Idempotent Replay Invariant**: When replaying WAL records during crash recovery, stale records (those with versions less than or equal to the current snapshot/entry version) are safely ignored.
3. **Eventual Isolation Invariant**: Listener exceptions inside the event bus are isolated and caught; a failing metrics or audit subscriber will never crash the core cache engine or abort a client transaction.
4. **Bounded Memory Invariant**: Configured capacity limits are strictly enforced by eviction algorithms to guarantee predictable heap memory footprints.
