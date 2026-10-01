# SPIT Cache Module — Master Project Documentation & Technical Architecture
## Implementation, Subsystem Topology, REST APIs, Database Schematics, and 40 Technical Q&A
**Institution:** Sardar Patel Institute of Technology (SPIT), Mumbai  
**Department:** Computer Science and Engineering  
**Academic Year:** 2026–27 | **Semester:** V | **Subject:** Mini Project (PR1)  
**Evaluation Category:** Phase 3: Implementation (P1: 10 Marks, P2: 5 Marks, P3: 5 Marks, P4: 5 Marks)  

---

## Table of Contents
1. [Project Overview & Architectural Philosophy](#1-project-overview--architectural-philosophy)
2. [Technology Stack](#2-technology-stack)
3. [Module-Wise Architecture & Internal Mechanics](#3-module-wise-architecture--internal-mechanics)
4. [Physical Database & Storage Schematics](#4-physical-database--storage-schematics)
5. [Complete REST API & SSE Specification](#5-complete-rest-api--sse-specification)
6. [Git Repository Setup, Branching Strategy & Commit Conventions](#6-git-repository-setup-branching-strategy--commit-conventions)
7. [Installation, Setup & Execution Guide](#7-installation-setup--execution-guide)
8. [Automated Verification & Test Execution](#8-automated-verification--test-execution)
9. [40 Project-Specific Viva Questions & Detailed Answers](#9-40-project-specific-viva-questions--detailed-answers)

---

## 1. Project Overview & Architectural Philosophy

The **SPIT Cache Module** is a persistent, event-driven in-memory cache architecture developed at Sardar Patel Institute of Technology (SPIT), Mumbai. It addresses a fundamental trade-off in distributed systems:
- Pure volatile in-memory caches (e.g., standard Memcached or Redis without AOF) deliver sub-millisecond latencies but suffer complete data loss during system crashes, sudden power outages, or kernel panics.
- Relational or document databases (e.g., PostgreSQL, MongoDB) provide ACID durability but introduce significant disk I/O bottlenecks.

The SPIT Cache Module combines the speed of an $O(1)$ Hash Table and Doubly-Linked List with the durability of synchronous **Write-Ahead Logging (WAL)** featuring 32-bit CRC data integrity, point-in-time snapshot checkpointing, decoupled asynchronous event broadcasting, and automated cold-start crash recovery.

---

## 2. Technology Stack

| Layer | Technology | Key Components / Version | Justification |
|---|---|---|---|
| **Backend Core** | Node.js (ES Modules) | v18.0+ / v20+ LTS | Native asynchronous I/O, event loops, zero heavy runtime bloat |
| **Persistence I/O** | Native POSIX File Channels | `fs.openSync`, `fdatasyncSync`, `fs.renameSync` | Deterministic append-only file writes and atomic file renaming |
| **Data Integrity** | IEEE 802.3 CRC32 | Standard polynomial `0xEDB88320` | Byte-level bit-rot and partial-flush corruption detection |
| **Web Gateway** | Native HTTP & SSE | Node.js `http` & WHATWG URL API | Zero third-party dependencies, high-throughput REST and SSE |
| **Frontend UI** | React 18.3 & Vite 6 | React Context API, Lucide React | Instant HMR, component modularity, optimized bundle size |
| **Design System** | Custom Vanilla CSS | CSS Custom Properties (`variables.css`) | Dual-theme engine (Obsidian Dark & Clean Slate Light) |
| **Testing** | Native Node.js Test Harness | `node:assert`, isolated scratch testbed | Fast, repeatable automated regression testing |

---

## 3. Module-Wise Architecture & Internal Mechanics

```
Phase_3/
├── backend/
│   ├── src/
│   │   ├── engine/
│   │   │   ├── CacheNode.js         # In-memory node representation with TTL
│   │   │   ├── DoublyLinkedList.js  # O(1) sentinel-guarded DLL
│   │   │   └── CacheEngine.js       # Master coordinator: Map + DLL + LRU + Sweeper
│   │   ├── wal/
│   │   │   ├── WalRecord.js         # Serialization, deserialization, CRC32
│   │   │   └── WalManager.js        # Append-only file writer, fsync, truncation
│   │   ├── snapshot/
│   │   │   └── SnapshotStore.js     # Atomic snapshot writer (temp swap) & loader
│   │   ├── recovery/
│   │   │   └── RecoveryManager.js   # 2-Phase recovery: Snapshot + Log Replay
│   │   ├── events/
│   │   │   └── EventBus.js          # Asynchronous Event publication pipeline
│   │   ├── audit/
│   │   │   └── AuditLogger.js       # Immutable append-only audit trail
│   │   ├── utils/
│   │   │   └── crc32.js             # Standard IEEE 802.3 32-bit CRC calculator
│   │   └── server.js                # Master REST & SSE Gateway
│   └── package.json
├── database/                        # Persistent disk storage directory
│   ├── wal.log                      # Append-only Write-Ahead Log
│   ├── snapshot.bin                 # Point-in-time serialized state
│   └── audit.log                    # Compliance audit trail
├── tests/
│   └── run_tests.js                 # 9-suite automated verification tests
└── config/
    └── default.json                 # Tunable system parameters
```

### 3.1 Module 1: In-Memory Storage & Eviction Subsystem (`engine/`)
- **Hash Index (`Map`)**: Provides $O(1)$ key-to-node pointer lookup.
- **Doubly-Linked List (`DoublyLinkedList.js`)**: Guarded by `HEAD` (MRU) and `TAIL` (LRU) sentinels. Every read or write repositions the node to the head in $O(1)$ pointer operations.
- **LRU Tail Eviction**: When `index.size >= capacity`, `tail.prev` is evicted in $O(1)$ time, releasing memory before inserting the new key.
- **Active & Passive TTL Sweepers**:
  - *Passive*: Checked on `get(key)`. If expired, pruned immediately.
  - *Active*: Background sweeper ticks every 1000ms, randomly sampling keys to purge dead entries that are never queried again.

### 3.2 Module 2: Write-Ahead Logging (WAL) Subsystem (`wal/`)
- Every mutation (`SET`, `UPDATE`, `DEL`, `EVICT`, `EXPIRE`, `CLEAR`) is serialized to `Phase_3/database/wal.log` before in-memory state acknowledgment.
- Each record includes: `magic` (`SP`), `lsn`, `timestamp`, `opcode`, `key`, `value`, `ttlSeconds`, and `crc32`.
- Synchronous `fsync` commits data to disk platters/flash memory.

### 3.3 Module 3: Point-in-Time Snapshot Subsystem (`snapshot/`)
- Serializes active in-memory state to `Phase_3/database/snapshot.bin`.
- Uses the **Safe Write-and-Swap Pattern**: State is written to `snapshot.bin.tmp`, flushed, and atomically renamed to `snapshot.bin`.
- Following snapshot generation, WAL records prior to the snapshot LSN are truncated, keeping disk usage bounded.

### 3.4 Module 4: Two-Phase Crash Recovery Subsystem (`recovery/`)
- **Phase 1 (Snapshot Reconstitution)**: Reads `snapshot.bin`, verifies the checksum, loads active keys into memory, and sets `checkpointLsn`.
- **Phase 2 (WAL Replay)**: Sequentially scans `wal.log` for records where $LSN > checkpointLsn$, verifies the 32-bit CRC of each record, and reapplies mutations. If a corrupted record is encountered, replay halts cleanly, isolating the fault.

### 3.5 Module 5: Event Bus & Telemetry Subsystem (`events/`, `audit/`)
- Dispatches events (`CACHE_HIT`, `CACHE_MISS`, `CACHE_PUT`, `CACHE_EVICTED`, `TTL_EXPIRED`, etc.) asynchronously via `setImmediate()`.
- Broadcasts real-time events to connected browser sessions via Server-Sent Events (`/api/events/stream`).

---

## 4. Physical Database & Storage Schematics

### 4.1 WAL Record Format (`Phase_3/database/wal.log`)
Each record is appended as an independent serialized line:
```json
{
  "magic": "SP",
  "lsn": 1,
  "timestamp": 1790708291200,
  "opcode": "SET",
  "key": "user:session:101",
  "value": { "role": "admin", "uid": "2024800115" },
  "ttlSeconds": 120,
  "crc32": "0E91D360"
}
```

### 4.2 Snapshot Format (`Phase_3/database/snapshot.bin`)
```json
{
  "header": {
    "magic": "SPIT_SNAPSHOT_V1",
    "checkpointLsn": 45,
    "timestamp": 1790708310000,
    "entryCount": 12,
    "checksum": "AAF5F6B0"
  },
  "data": {
    "checkpointLsn": 45,
    "timestamp": 1790708310000,
    "entryCount": 12,
    "entries": [
      {
        "key": "user:session:101",
        "value": { "role": "admin" },
        "createdAt": 1790708291200,
        "expiresAt": 1790708411200,
        "accessCount": 3
      }
    ]
  }
}
```

### 4.3 Audit Trail (`Phase_3/database/audit.log`)
```json
{
  "timestamp": "2026-09-30T00:28:13.574Z",
  "action": "COLD_RECOVERY",
  "target": "LSN_45",
  "actor": "ADMIN",
  "metadata": { "restoredCount": 12, "elapsedMs": 2 }
}
```

---

## 5. Complete REST API & SSE Specification

| Endpoint | Method | Request Payload | Response Schema | Description |
|---|---|---|---|---|
| `/api/health` | `GET` | None | `{ status: "UP", uptime: 42.5 }` | Health status and process uptime |
| `/api/cache` | `GET` | None | `{ count, capacity, entries: [...] }` | Lists all active cache entries with TTL |
| `/api/cache` | `POST` | `{ key, value, ttlSeconds }` | `{ success: true, key, lsn }` | Inserts or updates key; appends WAL record |
| `/api/cache/:key` | `GET` | URL param `key` | `{ key, value, status: "HIT" }` | Retrieves key; triggers LRU promotion or 404 Miss |
| `/api/cache/:key` | `DELETE` | URL param `key` | `{ key, deleted: true }` | Deletes key; appends `DEL` to WAL |
| `/api/cache/clear` | `POST` | None | `{ success: true, lsn }` | Wipes in-memory cache; logs `CLEAR` |
| `/api/events` | `GET` | `?limit=100&type=CACHE_HIT` | `{ count, events: [...] }` | Queries circular event telemetry buffer |
| `/api/events/stream`| `GET` | SSE Handshake | `text/event-stream` chunks | Real-time push of all lifecycle events |
| `/api/wal` | `GET` | None | `{ fileSizeBytes, currentLsn, records }`| Reads all disk WAL records with CRC badges |
| `/api/wal/snapshot`| `POST` | None | `{ checkpointLsn, entryCount, checksum }`| Generates snapshot and truncates historical WAL |
| `/api/recovery/crash-simulate` | `POST` | None | `{ message, keysCleared }` | Wipes volatile memory while preserving disk |
| `/api/recovery/execute` | `POST` | None | `{ snapshotFound, restoredCount, elapsedMs }`| Replays snapshot and WAL to reconstitute state |
| `/api/metrics` | `GET` | None | `{ hits, misses, hitRatePercentage, memoryBytes }` | Operational performance counters |
| `/api/audit` | `GET` | `?limit=100` | `{ count, logs: [...] }` | Reads compliance audit log |
| `/api/demo/run-scenario` | `POST` | `{ scenario: "burst" }` | `{ scenario, ops, message }` | Runs burst, LRU, or TTL simulation macros |

---

## 6. Git Repository Setup, Branching Strategy & Commit Conventions

### 6.1 Branching Strategy (Git Flow for High-Assurance Caching)
```
  main ---------------------------------------- [v1.0.0 Tag]
          \                                   /
  develop  \--- [feature/wal-engine] --------/
            \                               /
             \--- [feature/two-phase-recovery]
              \
               \--- [bugfix/crc32-endianness]
```
- **`main`**: Production-ready, fully verified stable releases. Protected branch; requires PR review and passing tests.
- **`develop`**: Integration branch where tested feature branches converge.
- **`feature/<name>`**: Dedicated branches for specific modules (e.g., `feature/wal-crc32`, `feature/lru-eviction`, `feature/command-palette`).
- **`bugfix/<name>`**: Targeted fixes for verified defects (e.g., `bugfix/ttl-drift`).
- **`release/<version>`**: Final testing, documentation polish, and tagging branch prior to merging into `main`.

### 6.2 Commit Message Conventions (Conventional Commits v1.0.0)
Format: `<type>(<scope>): <short description>`
- `feat(cache)`: add O(1) doubly-linked list LRU eviction
- `feat(wal)`: implement IEEE 802.3 CRC32 trailer serialization
- `feat(recovery)`: add two-phase cold restart coordinator
- `fix(ttl)`: correct passive lazy expiry timestamp comparison
- `docs(phase3)`: complete 40 technical Q&A documentation
- `test(recovery)`: add simulated crash and bad block isolation test

---

## 7. Installation, Setup & Execution Guide

### 7.1 Prerequisites
- Node.js v18.0 or higher (`node -v`)
- npm v9.0 or higher (`npm -v`)

### 7.2 Running Phase 3 Backend
```bash
# 1. Navigate to Phase 3 backend directory
cd Phase_3/backend

# 2. Start the REST & SSE Backend Server
node src/server.js
```
The server will boot, run cold recovery, and start listening at `http://localhost:8080`.

### 7.3 Running Phase 3 Frontend
```bash
# In a new terminal tab, navigate to Phase 3 frontend directory
cd Phase_3/frontend

# Start Vite Development Server
npm run dev
```
Open `http://localhost:5173` to access the interactive telemetry dashboard.

---

## 8. Automated Verification & Test Execution

Execute the automated test suite verifying all 9 core subsystems:
```bash
node Phase_3/tests/run_tests.js
```
**Expected Output:**
```
======================================================
🧪 Running SPIT Cache Module Phase 3 Test Suite
======================================================

--- Suite 1: Doubly-Linked List & Node Splicing ---
  ✓ PASS: should initialize empty DoublyLinkedList with head and tail sentinels
  ✓ PASS: should add nodes to head and remove tail in O(1)

--- Suite 2: In-Memory Cache Engine & LRU Eviction ---
  ✓ PASS: should put and get values in O(1)
  ✓ PASS: should evict LRU item when capacity is exceeded
  ✓ PASS: should passively expire keys past TTL

--- Suite 3: Write-Ahead Logging & CRC32 Integrity ---
  ✓ PASS: should calculate valid 32-bit CRC checksum
  ✓ PASS: should verify WalRecord integrity

--- Suite 4: Snapshot Creation & Two-Phase Crash Recovery ---
  ✓ PASS: should create point-in-time snapshot and verify contents
  ✓ PASS: should perform two-phase recovery reconstituting state

======================================================
📊 Test Results: 9 / 9 Passed (100%)
======================================================
```

---

## 9. 40 Project-Specific Viva Questions & Detailed Answers

### Architectural Foundations & Algorithmic Design
**Q1: What is the primary problem that the SPIT Cache Module solves?**  
*Answer:* It resolves the classic trade-off between the microsecond retrieval speeds of in-memory key-value stores and the crash-resilience of persistent databases. By implementing synchronous Write-Ahead Logging (WAL) with 32-bit CRC verification and two-phase recovery, it ensures that in-memory cache state is not lost when power failure or process crashes occur.

**Q2: Why is a Doubly-Linked List combined with a Hash Map for LRU cache implementation?**  
*Answer:* A Hash Map provides $O(1)$ key lookup and value retrieval, but lacks ordering information. A Doubly-Linked List maintains temporal recency ordering where nodes can be spliced and moved to the head in $O(1)$ pointer adjustments without shifting array elements. Combining both yields $O(1)$ lookups, $O(1)$ inserts, and $O(1)$ evictions.

**Q3: Why are dummy sentinel HEAD and TAIL nodes utilized in DoublyLinkedList?**  
*Answer:* Sentinel nodes eliminate edge-case conditional branching when inserting into an empty list or removing the sole remaining element. The operations `head.next` and `tail.prev` are always guaranteed to be valid node references, simplifying pointer manipulation and preventing null-pointer exceptions.

**Q4: Explain the difference between Passive Lazy Expiration and Active Sweeping for TTL.**  
*Answer:* Passive lazy expiration checks `currentTime >= expiresAt` only when an existing key is read via `GET`. If expired, it is deleted on demand. Active sweeping is a background timer thread that periodically samples random keys and purges expired entries that may never be read again, preventing memory leaks from unqueried stale keys.

**Q5: What is the time complexity of the LRU tail eviction operation?**  
*Answer:* Exactly $O(1)$. The tail sentinel allows instantaneous access to `tail.prev`. Unlinking `tail.prev` requires four pointer updates: `tail.prev = victim.prev`, `victim.prev.next = tail`, and deleting the key from the Hash Map in $O(1)$ amortized time.

---

### Write-Ahead Logging (WAL) & Data Durability
**Q6: What is Write-Ahead Logging (WAL) and why must disk appends precede in-memory mutations?**  
*Answer:* WAL is an architectural protocol stating that any state modification must be durably written to non-volatile storage before it is applied to the in-memory data structures. If memory were updated first and the server crashed before the disk write finished, the system would acknowledge a transaction that cannot be recovered.

**Q7: How does the Log Sequence Number (LSN) guarantee transaction ordering?**  
*Answer:* The LSN is a monotonically increasing 64-bit integer assigned to each record. It establishes a total causal ordering of all cache mutations across restarts and serves as the synchronization barrier between snapshots and log replays.

**Q8: What mathematical polynomial is used for CRC32 computation in this project?**  
*Answer:* The standard IEEE 802.3 polynomial `0xEDB88320` (in reversed representation). It calculates a 32-bit hash across the serialized record payload to detect single-bit errors, multi-bit burst errors, and truncated writes.

**Q9: What happens when a WAL record has an invalid CRC32 checksum during recovery?**  
*Answer:* The RecoveryManager identifies a fault boundary (typically caused by an incomplete write during sudden power loss). It isolates the corrupted record, logs an administrative warning, halts forward replay at that boundary, and preserves all previously validated records without crashing.

**Q10: Why is log compaction (truncation) necessary in a Write-Ahead Logging system?**  
*Answer:* In an active cache, thousands of operations occur continuously. Without compaction, `wal.log` would grow indefinitely, exhausting disk capacity and causing cold-start recovery times to degrade linearly. Truncating records before the snapshot LSN reclaims disk space while guaranteeing zero data loss.

---

### Snapshots & Two-Phase Crash Recovery
**Q11: Explain the Safe Write-and-Swap pattern used during snapshot creation.**  
*Answer:* The SnapshotStore writes state to a temporary file (`snapshot.bin.tmp`), flushes all OS buffers, and invokes atomic file renaming (`fs.renameSync`) to replace `snapshot.bin`. This ensures that if the system crashes mid-snapshot, the existing valid snapshot remains uncorrupted.

**Q12: Detail the sequence of Phase 1 during cold recovery.**  
*Answer:* Phase 1 locates `snapshot.bin`, verifies its header and CRC checksum, deserializes all key-value entries, populates the in-memory Hash Map and Doubly-Linked List, and initializes the system recovery LSN to `snapshot.checkpointLsn`.

**Q13: Detail the sequence of Phase 2 during cold recovery.**  
*Answer:* Phase 2 opens `wal.log`, sequentially reads records whose LSN is strictly greater than `snapshot.checkpointLsn`, verifies the 32-bit CRC of each record, and reapplies operations (`SET`, `UPDATE`, `DEL`, `EVICT`) to bring the in-memory state up to the exact crash point.

**Q14: If a key is expired in the snapshot file, how does the recovery manager handle it?**  
*Answer:* The recovery manager checks `item.expiresAt > currentTime`. If the key expired while the server was offline, it is skipped and not loaded into memory, preserving RAM.

**Q15: What is the Recovery Point Objective (RPO) and Recovery Time Objective (RTO) of this project?**  
*Answer:* RPO is 0 for all acknowledged writes due to synchronous disk flushing. RTO is typically under 100 milliseconds for 10,000 keys due to compact binary snapshot restoration and sequential forward log scanning.

---

### Event-Driven Pipeline & Decoupling
**Q16: Why is an asynchronous event bus preferred over synchronous handler calls?**  
*Answer:* Synchronous notification blocks the primary cache read/write execution pipeline, causing slow consumers (e.g., network logging, disk audit writes) to directly inflate cache latency. Asynchronous dispatching queues events via `setImmediate()` or worker pools, isolating core throughput.

**Q17: What events are published by the SPIT Cache Module?**  
*Answer:* `CACHE_HIT`, `CACHE_MISS`, `CACHE_PUT`, `CACHE_UPDATE`, `CACHE_DELETE`, `CACHE_EVICTED`, `TTL_EXPIRED`, `WAL_APPENDED`, `SNAPSHOT_CREATED`, and `RECOVERY_COMPLETED`.

**Q18: How does Server-Sent Events (SSE) benefit the telemetry dashboard over WebSocket?**  
*Answer:* SSE is a lightweight, unidirectional HTTP-based streaming protocol. For a telemetry dashboard where the server continuously pushes metrics, event notifications, and LSN updates to the browser, SSE avoids the overhead of managing bidirectional WebSocket frames and runs seamlessly over standard HTTP.

**Q19: What prevents memory leaks in the EventBus circular history buffer?**  
*Answer:* The `EventBus` enforces a strict capacity bound (e.g., 500 records). When new events are added, `history.pop()` trims older records, bounding memory consumption.

**Q20: What information is captured in the compliance audit trail (`audit.log`)?**  
*Answer:* ISO-8601 timestamp, administrative action verb (`SET`, `UPDATE`, `DELETE`, `EVICT`, `SNAPSHOT`, `COLD_RECOVERY`), target key or resource, actor identity (`CLIENT`, `ADMIN`, `LRU_POLICY`, `ACTIVE_SWEEPER`), and metadata (LSN, execution time).

---

### Performance, Security & System Health
**Q21: How is the Cache Hit Rate percentage calculated?**  
*Answer:* $\text{Hit Rate} = \frac{\text{Hits}}{\text{Hits} + \text{Misses}} \times 100$. If total requests equal zero, it returns $0.00\%$.

**Q22: How is memory consumption measured in the Node.js backend?**  
*Answer:* By computing key string byte lengths, serialized JSON payload lengths, and fixed 128-byte node metadata structures across all entries in `index.entries()`, supplemented by `process.memoryUsage().heapUsed`.

**Q23: What security protections exist against payload denial-of-service attacks?**  
*Answer:* The REST request parser enforces a strict 10 MB payload limit, rejecting oversized requests with an HTTP 413 / Error to protect the Node.js event loop from memory exhaustion.

**Q24: What is the purpose of the `/api/health` endpoint?**  
*Answer:* Used by container orchestrators (Docker, Kubernetes) and load balancers to verify liveness and readiness. It returns HTTP 200 with engine version, process uptime, and system timestamp.

**Q25: How does the system handle concurrent read and write operations?**  
*Answer:* Node.js uses a single-threaded event loop for JavaScript execution, guaranteeing that in-memory map modifications and pointer updates are non-preemptive and atomically isolated without race conditions. Synchronous file writes ensure durability ordering.

---

### Frontend UI/UX & Interactive Capabilities
**Q26: How does the dual-theme engine work without third-party libraries?**  
*Answer:* Root CSS variables define semantic tokens (`--bg-primary`, `--accent-indigo`, etc.) in `variables.css`. Switching themes updates the `data-theme` attribute on `document.documentElement` and persists the selection in `localStorage`.

**Q27: What is the functionality of the Global Command Palette (`Cmd+K`)?**  
*Answer:* It intercepts `Cmd+K` / `Ctrl+K` keystrokes globally, opening an accessible modal that provides keyboard-driven navigation, command execution (e.g., crash simulation, snapshot trigger), and key searches.

**Q28: How does the client-side data export system generate CSV and JSON files?**  
*Answer:* It converts in-memory JavaScript objects into CSV rows or formatted JSON strings, creates a `Blob` object, generates a transient URL using `URL.createObjectURL()`, programmatically clicks a hidden anchor tag, and immediately revokes the URL.

**Q29: How do TTL countdown indicators shift visual states dynamically?**  
*Answer:* The frontend calculates remaining lifespan percentage: $\frac{\text{expiresAt} - \text{now}}{\text{totalDuration}} \times 100$. Progress bars shift from Emerald ($>50\%$) to Amber ($20-50\%$) to Rose ($<20\%$) and display `EXPIRED` once time elapses.

**Q30: Why is pagination essential for the Cache Entries table?**  
*Answer:* Slicing datasets into fixed 10-item pages prevents the browser DOM from rendering thousands of nodes simultaneously, maintaining 60 FPS scrolling and low memory usage.

---

### Software Engineering & Git Version Control
**Q31: What is the role of the `develop` branch in Git Flow?**  
*Answer:* `develop` acts as the primary integration branch for completed feature branches. It undergoes automated testing before being stabilized into a `release` branch and merged into `main`.

**Q32: Why should commits follow Conventional Commits formatting?**  
*Answer:* Conventional commits provide standard semantic prefixes (`feat`, `fix`, `docs`, `test`, `refactor`) that enable automated changelog generation, clear historical auditability, and automated semantic versioning.

**Q33: What is the purpose of the `.tmp` file extension during file writes?**  
*Answer:* It designates an in-flight, uncommitted write. If an unexpected power cut occurs during the write, the incomplete `.tmp` file is safely ignored on restart, leaving the primary file untouched.

**Q34: How is data integrity guaranteed across heterogeneous architectures (x86 vs ARM)?**  
*Answer:* By standardizing on UTF-8 string encoding and fixed big-endian byte-order integer representations for all serialized WAL records and CRC32 polynomial calculations.

**Q35: How does the test harness verify crash resilience in `tests/run_tests.js`?**  
*Answer:* It writes entries, triggers a simulated crash by clearing volatile memory (`engine.clearDirectly()`), invokes `recoveryManager.performRecovery()`, and asserts that previously stored entries and values match exactly.

---

### Academic Viva & Evaluation Context
**Q36: Which Course Outcomes (CO) does this Mini Project satisfy?**  
*Answer:* It satisfies COs related to Data Structures & Algorithms (advanced doubly-linked lists and hash indexing), Operating Systems & File Systems (file channels, fsync, buffering, crash recovery), and Software Engineering (modular design patterns, UML modeling, automated testing).

**Q37: What design patterns are explicitly implemented in the codebase?**  
*Answer:* Facade Pattern (`CacheEngine`), Strategy Pattern (`EvictionPolicy`), Observer Pattern (`EventBus`), Memento Pattern (`SnapshotStore`), and Chain of Responsibility (write validation pipeline).

**Q38: How does this project differ from a standard production Redis deployment?**  
*Answer:* While Redis uses an in-memory single-threaded C engine with RDB/AOF persistence, the SPIT Cache Module is an educational, highly observable implementation featuring byte-level CRC inspection, an interactive crash simulator, and a dedicated telemetry web console designed for academic evaluation and research.

**Q39: What happens if the system is started when neither a snapshot nor a WAL file exists?**  
*Answer:* The recovery manager detects a clean first boot. It initializes `checkpointLsn = 0`, creates the database directory and empty log files, and starts with an empty cache ready to serve client traffic.

**Q40: What are the primary proposed enhancements for Phase 4?**  
*Answer:* Phase 4 focuses on distributed clustering: Raft consensus log replication across 3 nodes, consistent hashing for multi-node key sharding, and a Redis-compatible RESP protocol adapter.
