# SPIT Cache Module — Phase 3 Product Requirements Document (PRD)
## Full-Stack Persistent Event-Driven Memory Cache System
**Institution:** Sardar Patel Institute of Technology (SPIT), Mumbai  
**Department:** Computer Science and Engineering  
**Academic Year:** 2026–27 | **Semester:** V | **Subject:** Mini Project (PR1)  
**Evaluation Category:** Phase 3: Implementation (P1 — Module-Wise Coding: 10 Marks)  

---

## 1. Executive Summary
The **SPIT Cache Module (Phase 3)** represents the complete, fully operational implementation of a high-performance in-memory cache system equipped with synchronous Write-Ahead Logging (WAL) with 32-bit CRC data integrity, point-in-time binary snapshotting, a decoupled asynchronous event bus, an automated two-phase crash recovery manager, and a modern telemetry management console.

Phase 3 transitions from conceptual architecture into a completely runnable, decoupled client-server platform comprising a native Node.js persistent REST & SSE backend and an interactive Vite + React telemetry console.

---

## 2. Product Objectives
1. **Durability with Microsecond Latency**: Eliminate the vulnerability of cache state loss upon process crash or power interruption by recording mutations synchronously in an append-only WAL before committing them to memory.
2. **Deterministic Cold-Start Recovery**: Provide an automated two-phase crash recovery mechanism that restores 100% of unexpired keys in sub-100ms.
3. **Decoupled Telemetry**: Enable real-time operational observability (hit/miss ratios, memory consumption, LSN progression, audit trails) via non-blocking event publishing.
4. **Independent Operability**: Ensure that the Phase 3 backend and frontend can be started, tested, and demonstrated independently of other phases.

---

## 3. Module-Wise Functional Requirements

### Module 1: In-Memory Storage & Eviction Subsystem (`engine/`)
- **[FR-M1.1] $O(1)$ Hash Map Indexing**: Constant-time key lookup and node reference caching using native hash mapping.
- **[FR-M1.2] $O(1)$ Doubly-Linked List (DLL)**: Sentinel nodes (`HEAD` and `TAIL`) maintaining recency ordering.
- **[FR-M1.3] Least Recently Used (LRU) Eviction**: Automatic eviction of the oldest node (`TAIL.prev`) when size exceeds the configured capacity threshold (default: 50 keys).
- **[FR-M1.4] Hybrid Dual TTL Expiration**:
  - *Passive Lazy Expiration*: Evaluated upon `GET(key)` calls. If expired, entry is unlinked and evicted immediately.
  - *Active Background Sweeper*: Periodic timer sampling random keys every 1000ms to reclaim unreferenced stale memory.

### Module 2: Write-Ahead Logging (WAL) Subsystem (`wal/`)
- **[FR-M2.1] Append-Only Durability**: Synchronous or immediate micro-batched append of all mutation operations (`SET`, `UPDATE`, `DEL`, `EVICT`, `EXPIRE`, `CLEAR`).
- **[FR-M2.2] Structured Record Schema**: Each record serializes magic bytes (`SP`), 64-bit Log Sequence Number (`lsn`), epoch timestamp, opcode, key string, payload value, TTL seconds, and a 32-bit CRC checksum trailer.
- **[FR-M2.3] Log Compaction / Truncation**: Following a successful snapshot checkpoint, historical records prior to the snapshot LSN are pruned to prevent unbounded disk growth.

### Module 3: Point-in-Time Snapshot Subsystem (`snapshot/`)
- **[FR-M3.1] Atomic Snapshot Checkpoint**: Serializes all non-expired in-memory key-value pairs into `snapshot.bin`.
- **[FR-M3.2] Safe Write-and-Swap Pattern**: Snapshots are written to a temporary file (`snapshot.bin.tmp`) and atomically renamed upon successful disk flush to eliminate partial snapshot corruption.

### Module 4: Two-Phase Crash Recovery Subsystem (`recovery/`)
- **[FR-M4.1] Phase 1 - Snapshot Ingestion**: If a verified `snapshot.bin` exists, reconstitutes all stored entries and sets the baseline checkpoint LSN.
- **[FR-M4.2] Phase 2 - Forward WAL Replay**: Scans `wal.log` forward from the checkpoint LSN, verifies the CRC32 checksum of each record, and reapplies state mutations.
- **[FR-M4.3] Fault Isolation**: If an invalid CRC32 checksum is encountered (simulating an abrupt mid-write power cut), recovery halts at the last valid record and isolates the bad block.

### Module 5: Asynchronous Event Bus & Audit Logging (`events/`, `audit/`)
- **[FR-M5.1] Non-Blocking Publication**: Publishes events (`CACHE_HIT`, `CACHE_MISS`, `CACHE_PUT`, `CACHE_EVICTED`, `TTL_EXPIRED`, `WAL_APPENDED`, `SNAPSHOT_CREATED`, `RECOVERY_COMPLETED`) without delaying client requests.
- **[FR-M5.2] Compliance Audit Trail**: Appends immutable operational records to `audit.log` containing timestamps, actor identities, actions, and target keys.

### Module 6: REST API Gateway & Server-Sent Events (`server.js`)
- Full set of RESTful endpoints: `/api/cache`, `/api/events`, `/api/wal`, `/api/recovery`, `/api/metrics`, `/api/audit`, `/api/health`.
- Real-time Server-Sent Events (SSE) streaming at `/api/events/stream`.

### Module 7: Responsive Telemetry Console (`frontend/`)
- Commercial SaaS UI supporting Obsidian Dark and Clean Slate Light themes.
- Global Command Palette (`Cmd+K` / `Ctrl+K`).
- Dynamic TTL countdown progress bars.
- Cache entries table with search, sort, filter, pagination, and JSON/CSV export.
- Interactive crash simulation and recovery replay controls.

---

## 4. Acceptance Criteria
- **AC-1**: All 9 automated tests in `Phase_3/tests/run_tests.js` pass with 100% success rate.
- **AC-2**: Crashing the engine and executing recovery restores all active entries with zero data loss.
- **AC-3**: WAL records verify against the standard IEEE 802.3 32-bit CRC polynomial.
- **AC-4**: The frontend communicates seamlessly with the backend REST and SSE endpoints while providing fallback support if the backend is offline.
