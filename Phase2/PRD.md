# SPIT Cache Module — Product Requirements Document (PRD)
## Persistent Event-Driven In-Memory Cache Architecture
**Academic Year:** 2026–27 | **Semester:** V | **Subject:** Mini Project (PR1)  
**Institution:** Sardar Patel Institute of Technology (SPIT), Andheri (W), Mumbai  
**Department:** Computer Science and Engineering  

---

## 1. Executive Summary & Overview
The **SPIT Cache Module** is an enterprise-grade, event-driven in-memory key-value cache engine paired with real-time durability through Write-Ahead Logging (WAL), deterministic periodic snapshotting, and crash-recovery subsystems. It is designed to bridge the gap between high-throughput, volatile caching architectures (such as pure Memcached or in-memory hash maps) and durable, ACID-compliant transactional persistence systems (such as LSM-Tree storage engines and append-only logs).

### Problem Statement
Standard volatile in-memory caches suffer catastrophic state erasure upon power loss, OS termination, or node hardware failures. Conversely, persistent transactional databases incur significant disk I/O latency for read-heavy workloads. The SPIT Cache Module solves this trade-off by maintaining an O(1) in-memory hash-indexed storage layer backed by asynchronous Write-Ahead Logging (WAL) with CRC32 checksum integrity verification, deterministic checkpoint snapshots, an event-driven decoupled notification pipeline, and a modern telemetry management console.

---

## 2. Stakeholders & User Personas
1. **Systems Engineer / Infrastructure Developer**: Requires predictable microsecond-level cache operations, tunable eviction bounds (LRU / FIFO), and zero-loss crash resilience.
2. **Backend Application Developer**: Interacts via REST and event listeners, expecting atomic key-value operations, TTL countdown enforcement, and transactional durability guarantees.
3. **Database Administrator (DBA) / DevOps Engineer**: Monitors real-time cache hit/miss metrics, memory utilization, compaction states, WAL disk usage, and triggers manual or automated recovery audits.
4. **Academic Evaluator & Viva Examiner**: Evaluates algorithmic correctness, design patterns (Observer, Strategy, Memento, Chain of Responsibility), UML conformance, and benchmark metrics.

---

## 3. Product Scope & Functional Requirements

### 3.1 Core In-Memory Storage & Eviction (Module 1)
- **FR-1.1**: Key-value pairs support arbitrary string or JSON-structured payloads.
- **FR-1.2**: Capacity bounded by configurable threshold $N$ (default: 50–1000 entries for testbed; dynamically expandable).
- **FR-1.3**: Deterministic Least Recently Used (LRU) eviction algorithm executing in $O(1)$ time complexity using a doubly-linked hash map.
- **FR-1.4**: First-In First-Out (FIFO) and Least Frequently Used (LFU) configurable eviction policies.
- **FR-1.5**: Fine-grained millisecond and second TTL (Time-To-Live) countdown with both passive lazy expiration (checked on read) and active sweeper cleanup.

### 3.2 Write-Ahead Logging (WAL) & Persistence (Module 2)
- **FR-2.1**: Synchronous or immediate micro-batched append of all mutation operations (`SET`, `UPDATE`, `DELETE`, `EXPIRE`, `CLEAR`) before in-memory state acknowledgment.
- **FR-2.2**: Binary or structured append-only record format with:
  - Sequence Transaction ID (`txnId` / `lsn`)
  - Timestamp (epoch milliseconds)
  - Operation Opcode (`SET`, `DEL`, `EVICT`)
  - Key length and payload length
  - Payload data
  - CRC32 checksum trailer for bit-rot and partial-write detection
- **FR-2.3**: Checksum verification on boot and continuous append. Corruption triggers isolation of bad blocks.

### 3.3 Snapshot Store & Compaction (Module 3)
- **FR-3.1**: Point-in-time state checkpointing (`BinarySnapshotStore`) persisting active cache contents without blocking concurrent read operations.
- **FR-3.2**: Log Truncation / Compaction: Following a verified snapshot creation, historical WAL logs prior to the checkpoint LSN are safely trimmed to reclaim disk space.

### 3.4 Crash Recovery Subsystem (Module 4)
- **FR-4.1**: Cold-boot two-phase recovery sequence:
  1. Load the latest verified snapshot file into the in-memory cache index.
  2. Replay all WAL records generated after the snapshot timestamp up to the last valid CRC32 record.
- **FR-4.2**: Fault-tolerance verification under dirty shutdown, SIGKILL, and partial write simulations.

### 3.5 Event-Driven Architecture (Module 5)
- **FR-5.1**: Decoupled Publisher-Subscriber Event Bus emitting structured lifecycle events:
  - `CACHE_HIT`, `CACHE_MISS`, `CACHE_PUT`, `CACHE_UPDATE`, `CACHE_DELETE`
  - `CACHE_EVICTED`, `TTL_EXPIRED`, `WAL_APPENDED`, `SNAPSHOT_CREATED`, `RECOVERY_COMPLETED`
- **FR-5.2**: Non-blocking asynchronous event dispatch to registered monitoring subscribers.

### 3.6 Web Management Console & Telemetry (Module 6)
- **FR-6.1**: Interactive Dashboard featuring real-time statistics: Total Entries, Active Entries, Expired Keys, Hit/Miss Ratio, Memory Pressure, WAL Disk Size.
- **FR-6.2**: Live Event Stream table with real-time filtering, event type segregation, pause/resume streaming, and JSON export.
- **FR-6.3**: WAL Inspector with byte-level checksum badges, payload inspection, and transaction timeline.
- **FR-6.4**: Diagnostic Recovery Simulator to trigger simulated crash and replay state transitions in real time.
- **FR-6.5**: Command Palette (`Cmd+K` / `Ctrl+K`) for global navigation and rapid cache operations.
- **FR-6.6**: Dual-theme UI support: Obsidian Dark and Pure Clean Slate Light, persisting user preference in `localStorage`.

---

## 4. Non-Functional Requirements (NFR)
| Metric | Requirement Target | Verification Method |
|---|---|---|
| **Cache Latency** | Read $O(1) \le 5\mu s$ (in-memory); Write $O(1) \le 2ms$ with disk sync | JMH / Performance Profiler |
| **Durability (RPO)** | Zero acknowledged write data loss ($RPO = 0$) | Crash-kill and cold restart tests |
| **Availability (RTO)** | Cold recovery of $10,000$ keys in $< 250ms$ | Recovery benchmark timer |
| **Memory Overhead** | Double-linked node metadata $\le 64$ bytes per entry | Heap profiling (JConsole / Chrome DevTools) |
| **UI Responsiveness** | First Contentful Paint $< 0.8s$, 60 FPS charts | Chrome Lighthouse & Web Vitals |
| **Browser Compatibility** | Chrome, Edge, Safari, Firefox modern releases | Cross-browser verification |

---

## 5. System Architecture
```
+-----------------------------------------------------------------------+
|                 Modern Web Telemetry UI (Phase 2 / Phase 3)            |
|    - Dashboard   - Cache Table   - Event Stream   - WAL Explorer      |
|    - Recovery Console   - Metrics & Analytics   - Command Palette      |
+-----------------------------------+-----------------------------------+
                                    | REST / WebSocket / JSON-RPC
                                    v
+-----------------------------------------------------------------------+
|                    REST API & Controller Gateway                       |
+------------------+--------------------------------+-------------------+
                   |                                |
                   v                                v
+------------------------------------+  +-------------------------------+
|     Concurrent Cache Engine        |  |       Event Bus System        |
| - Hash Index (O(1))                |  | - Async Event Dispatcher      |
| - Doubly-Linked LRU List (O(1))    |  | - Event Subscribers (Metrics) |
| - Active / Passive TTL Sweeper     |  | - Audit Trail Recorder        |
+------------------+-----------------+  +-------------------------------+
                   | Mutate Events
                   v
+-----------------------------------------------------------------------+
|                Durability & Persistence Subsystems                    |
| +------------------------------+   +--------------------------------+ |
| |    Write-Ahead Log (WAL)     |   |     Binary Snapshot Store      | |
| | - Append-Only Disk Engine    |   | - Point-in-Time Checkpointer   | |
| | - CRC32 Integrity Trailer    |   | - Atomic Write & Replace       | |
| +------------------------------+   +--------------------------------+ |
|                                |                                      |
|                                v                                      |
|                 Recovery Manager & Crash Replayer                    |
+-----------------------------------------------------------------------+
```

---

## 6. Acceptance Criteria
- **AC-1**: Cache reads and writes strictly follow O(1) time complexity.
- **AC-2**: All state mutations generate an append-only WAL record with a valid CRC32 checksum before the mutation is committed.
- **AC-3**: Crashing the cache process and triggering recovery reconstitutes $100\%$ of active, non-expired keys and values.
- **AC-4**: Expiration countdown visually ticks down in real time and transitions to `EXPIRED` status with appropriate eviction handling.
- **AC-5**: The UI delivers a commercial dark/light theme experience, responsive layouts, data exports (JSON & CSV), and instant `Cmd+K` command shortcuts.
- **AC-6**: **Zero-Crash Resilience Guarantee**: Complete runtime immunity to unhandled exceptions via React `ErrorBoundary` and backend defensive wrappers; the application gracefully self-heals without ever white-screening or crashing.
- **AC-7**: **Live Concurrency & Hardware Latency Benchmarker**: Interactive in-browser and backend stress tester measuring genuine microsecond percentiles ($p50$, $p90$, $p99$) and throughput ops/sec using `process.hrtime.bigint()`.
- **AC-8**: **Cryptographic SHA-256 Tamper-Evident Audit Chain**: All administrative events are cryptographically hash-chained with automated verification via `GET /api/audit/verify`.
- **AC-9**: **Hardware Memory Profiler & Hot-Keys Heatmap**: Live V8 process heap visualizer, Tiered Storage latency savings calculator (~900x speedup), and real-time LFU access frequency rankings.
