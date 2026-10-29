# Phase II Frontend Architecture & Technical Specification

**Course**: B.Tech Computer Engineering (Semester VI) — Mini Project  
**Institution**: Sardar Patel Institute of Technology (SPIT), Mumbai  
**Project**: Persistent Event-Driven Memory Cache Module  
**Student Contributors**:
* **Jay Shinde** (UID: 2024800115)
* **Nikhil Shelar** (UID: 2024800113)
* **Sanchit Gaikwad** (UID: 2024800029)  
**Faculty Project Guide**: **Prof. Suhas Kakade**

---

## 1. Project Objective

The primary objective of the **Phase II Frontend** deliverable is to provide a clean, academic, demo-ready visualization platform that exposes the inner workings of our low-latency, dependency-free Java 17 memory cache engine. 

While Phase I established the core algorithmic foundations (exclusive WAL ownership, CRC32 checksum hashing, B-tree/hash indexing, LRU doubly-linked list eviction, and async EventBus dispatching), Phase II provides the operational UI necessary for evaluators and peers to inspect:
- Memory entries, TTL expiration countdowns, and LRU eviction pressure.
- Append-only Write-Ahead Log (WAL) record serialization and checksum integrity.
- Point-in-time state checkpointing (Snapshots).
- Multi-step crash recovery replay with diagnostic batch integrity reporting.
- Metric telemetry (85.0% hit rate, sub-2ms response times).
- Compliance audit streams matching append-only JSON Lines specifications.

---

## 2. Frontend Architecture & Design Philosophy

The application is structured to reflect professional developer tooling (similar to AWS CloudWatch, Datadog, and RedisInsight) while remaining completely decoupled from the underlying storage layer:

```
┌─────────────────────────────────────────────────────────────┐
│                 Phase II Presentation Layer                 │
│   (Sidebar + Topbar + 7 Page Views + Modals + SVG Charts)   │
└──────────────────────────────┬──────────────────────────────┘
                               │ React Context Hook (useCache)
┌──────────────────────────────▼──────────────────────────────┐
│                    Central State Store                      │
│             (CacheContext - Local Mutator)                  │
└──────────────────────────────┬──────────────────────────────┘
                               │ Service Layer Callbacks
┌──────────────────────────────▼──────────────────────────────┐
│                   Abstract Service Layer                    │
│   ┌─────────────────┬──────────────────┬─────────────────┐  │
│   │  cacheService   │   eventService   │persistenceService│ │
│   ├─────────────────┼──────────────────┼─────────────────┤  │
│   │ recoveryService │  metricsService  │   apiService    │  │
│   └─────────────────┴──────────────────┴─────────────────┘  │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / WebSocket REST Bridge
┌──────────────────────────────▼──────────────────────────────┐
│                 Java 17 Core Cache Engine                   │
│ (CacheEngine, WriteAheadLog, RecoveryManager, EventBus)     │
└─────────────────────────────────────────────────────────────┘
```

### Design Guidelines Adhered to:
1. **Zero Bloat / Zero Generic AI Aesthetics**: Built entirely using high-contrast, dark-mode CSS variables (`var(--bg-primary)`, `var(--status-green)`, `var(--accent-blue)`), crisp borders, and monospace accents (`JetBrains Mono`). Avoided childish animations, neon gradients, or generic templates.
2. **Service Layer Isolation**: React components never manipulate storage directly; all mutations flow through `cacheService`, `persistenceService`, and `eventService`.
3. **Deterministic Simulation & Controlled Concurrency**: A built-in Live Updates switch (`ON/OFF`) guarantees that demonstrations remain stable and non-chaotic during faculty questions.

---

## 3. Page-by-Page Technical Explanation

### 3.1. Dashboard (`/` or `activeTab === 'dashboard'`)
The evaluator's landing view designed to give an immediate 360-degree status report:
- **8 KPI Cards**:
  1. *Total Entries*: Active in-memory hash keys (128).
  2. *Cache Hits*: Total successful lookups (1,842).
  3. *Cache Misses*: Cold lookups or expired requests (326).
  4. *Hit Rate*: Computed as `Hits / (Hits + Misses) * 100` (85.0%).
  5. *Evictions*: Evictions enforced by LRU limit (24).
  6. *Expired Entries*: Keys reaped by background TTL thread (17).
  7. *WAL Records*: Total sequenced, checksummed records (2,431).
  8. *Active Events*: EventBus listeners connected (6).
- **Subsystem Health Grid**: 8 diagnostic cards for Cache Engine, Persistence, WAL Channel, Snapshots, EventBus, Recovery State, TTL Manager, and LRU Eviction.
- **Activity Timeline Chart**: Responsive SVG visualization plotting Hits, Misses, and Operations over the last 60 minutes.
- **Hit vs Miss Donut**: Circular efficiency gauge with breakdown metrics.
- **Recent Events Table**: Live preview of the latest 6 events with status badges.

### 3.2. Cache Management (`activeTab === 'cache'`)
Provides full CRUD capabilities over the in-memory store:
- **Searchable Table**: Real-time filtering by key, value, and status (`ACTIVE`, `EXPIRED`, `EVICTED`).
- **TTL Visualizer**: Dynamic horizontal progress bar displaying remaining seconds/minutes with color transitions (green $\rightarrow$ amber $\rightarrow$ red $\rightarrow$ expired).
- **SET Modal**: Validates non-empty key, non-null value, and TTL unit conversions (sec, min, hr, ms). Automatically assigns WAL sequence number, CRC32 checksum, and emits `CACHE_SET`.
- **GET Modal**: Interactive lookup modal returning a green `CACHE HIT` card with metadata (value, version, access count, creation time) or a red `CACHE MISS` card.
- **DELETE Modal**: Confirms key removal and warns the user that an append-only tombstone record will be appended to the WAL.
- **LRU Eviction Subpanel**: Visualizes cache capacity (1000 entries), current usage (128 entries / 12.8%), LRU policy, total evictions, and last evicted key.

### 3.3. Event Stream (`activeTab === 'events'`)
Exposes the decoupled asynchronous `EventBus` (`edu.spit.cache.event.EventBus`):
- Displays chronological event envelopes (`eventId`, `timestamp`, `type`, `key`, `source`, `transactionId`, `status`, `detail`).
- Filterable by type: `CACHE_SET`, `CACHE_HIT`, `CACHE_MISS`, `CACHE_DELETE`, `TTL_EXPIRED`, `CACHE_EVICTED`, `SNAPSHOT_CREATED`, `RECOVERY_COMPLETED`.
- Modal inspection for viewing raw event envelope attributes.
- Export as JSON for test suite analysis.

### 3.4. Persistence & Write-Ahead Log (`activeTab === 'persistence'`)
Validates durable state handling:
- **Persistence Status**: Real-time sync-on-commit flush and exclusive writer channel status.
- **V2 WAL Records Table**: Displays sequential records with Transaction ID, Operation, Key, Timestamp, Status, and CRC32 hex checksum (e.g., `0x8F4B2A10`).
- **Point-in-Time Snapshot Card**: Snapshot version 42, entry count (128), binary size (24.8 KB), and integrity status.
- **Snapshot Inspector Modal**: Allows evaluators to inspect the serialized memory dump preview.
- **Snapshot Creation**: Triggers a new snapshot version, resetting pending writes.

### 3.5. Crash Recovery (`activeTab === 'recovery'`)
Demonstrates deterministic state restoration after process crashes:
- Visualizes the 7-step recovery pipeline:
  1. *Load Snapshot* (read base checkpoint)
  2. *Validate Snapshot* (CRC32 checksum check)
  3. *Read WAL* (scan records following checkpoint)
  4. *Validate WAL Records* (per-record CRC32 verification)
  5. *Replay Valid Records* (execute idempotent state updates)
  6. *Restore Cache* (rebuild indexes, TTL heap, and LRU pointers)
  7. *Recovery Complete* (online verification)
- **RecoveryReport Card**: Mirrors `edu.spit.cache.persistence.RecoveryReport` with verified metrics:
  - Snapshot entries restored: 124
  - WAL operations applied: 4
  - Incomplete transactions skipped: 0
  - Checksum failures: 0
  - Total entries materialized: 128
- Interactive validation buttons: "VALIDATE WAL" and "VALIDATE SNAPSHOT".

### 3.6. Metrics & Telemetry (`activeTab === 'metrics'`)
Exposes operational metrics matching `edu.spit.cache.metrics.CacheMetrics`:
- 10 Telemetry KPI cards (Hits, Misses, Hit Rate, Avg Latency ~1.8ms, Evictions, Expirations, Puts, Gets, Deletes).
- Operations timeline chart and Hit Rate ratio donut.
- Academic benchmark summary cards comparing current statistics against Semester VI design goals.

### 3.7. Audit Journal (`activeTab === 'audit'`)
Exposes the append-only JSON Lines compliance stream matching `edu.spit.cache.event.AuditLogListener`:
- Table columns: `logId`, `timestamp`, `operation`, `key`, `actor` (`Client API`, `TTL Manager`, `Eviction Manager`, `System Admin`, `Recovery Manager`), `status`, and `details`.
- Filterable by operation type, searchable by actor/key.
- **Export JSONL**: Downloads authentic newline-delimited JSON stream.

---

## 4. Component Architecture & Data Flow

```
                      [User Trigger: e.g. Click 'SET ENTRY']
                                       │
                                       ▼
                         [CacheOperationModal.jsx]
                          - Validates input
                          - Calls setEntry(key, value, ttl, unit)
                                       │
                                       ▼
                           [CacheContext.jsx]
                          - Calls cacheService.set()
                          - Computes CRC32 checksum
                          - Appends to walRecords
                          - Appends to events (EventBus)
                          - Appends to auditLogs
                          - Increments metrics (puts, totalRequests)
                          - Fires Toast notification
                                       │
            ┌──────────────────────────┼──────────────────────────┐
            ▼                          ▼                          ▼
    [CacheTable.jsx]           [PersistencePage.jsx]      [EventsPage.jsx]
    Re-renders active          Shows new WAL entry        Shows CACHE_SET
    entry with TTL bar         with seq # & CRC32         event in stream
```

---

## 5. System Operational Verification Walkthrough Guide

Step-by-step verification flow for demonstration:
1. **Overview**: Explain the architecture and health grid on the Dashboard.
2. **SET Entry**: Insert `student:jay` = `CSE_B3` with 60s TTL. Show entry created in the table and WAL record committed.
3. **GET Hit**: Query `student:jay`. Show the green `CACHE HIT` card with version and access count.
4. **GET Miss**: Query `student:unknown`. Show the red `CACHE MISS` alert and metric counter increment.
5. **DELETE Entry**: Delete `student:jay`. Show `CACHE_DELETE` event and tombstone record in WAL.
6. **TTL Expiry**: Simulate TTL expiry to demonstrate background thread reaping.
7. **Event Stream**: Navigate to Events page and filter by `CACHE_SET` / `CACHE_HIT`.
8. **Persistence**: Navigate to Persistence page to show the V2 tab-separated WAL and Snapshot.
9. **Crash Recovery**: Navigate to Recovery page, click "Start Recovery", and observe the 7-step pipeline execution.
10. **Metrics & Audit**: Review the 85.0% hit rate and export audit logs as JSONL.

---

## 6. Phase III Backend Integration Specification

To bridge this frontend with the actual Java 17 backend in Phase III:
1. Open `Phase2/src/services/apiService.js` and set:
   ```javascript
   export const API_CONFIG = {
     BASE_URL: 'http://localhost:8080/api',
     IS_MOCK_MODE: false,
     DEFAULT_LATENCY_MS: 0
   };
   ```
2. Implement lightweight HTTP handlers in the Java backend using `com.sun.net.httpserver.HttpServer`:
   - `GET  /api/cache/entries` $\rightarrow$ Returns active entries from `ConcurrentHashMap`.
   - `POST /api/cache/entries` $\rightarrow$ Invokes `CacheEngine.put(key, value, ttl)`.
   - `GET  /api/cache/entries/:key` $\rightarrow$ Invokes `CacheEngine.get(key)`.
   - `DELETE /api/cache/entries/:key` $\rightarrow$ Invokes `CacheEngine.delete(key)`.
   - `GET  /api/events` $\rightarrow$ Returns events from `InMemoryEventJournal`.
   - `GET  /api/persistence/wal/records` $\rightarrow$ Returns parsed records from `WriteAheadLog`.
   - `POST /api/persistence/snapshot` $\rightarrow$ Invokes `SnapshotManager.takeSnapshot()`.
   - `POST /api/recovery/start` $\rightarrow$ Invokes `RecoveryManager.recover()`.
   - `GET  /api/metrics` $\rightarrow$ Returns `CacheMetrics.snapshot()`.

All data structures in this frontend match the exact fields, data types, and enum names defined in `edu.spit.cache.*`.
