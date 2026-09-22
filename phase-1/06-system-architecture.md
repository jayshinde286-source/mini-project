# 06. System Architecture & Detailed Component Design

---

## 1. High-Level Architectural Model

The architecture of the **Persistent Event-Driven Memory Cache Module** is organized into cleanly separated layers to enforce strict modularity, high performance, and fault containment:

```text
                     ┌────────────────────────────────────────┐
                     │          Client / Demo / CLI           │
                     └───────────────────┬────────────────────┘
                                         │ Requests (SET, GET, DEL, CAS, TX)
                                         ▼
                     ┌────────────────────────────────────────┐
                     │    PersistentEventDrivenCache Facade   │
                     └───────────────────┬────────────────────┘
                                         │
        ┌────────────────────────────────┼────────────────────────────────┐
        │                                │                                │
        ▼                                ▼                                ▼
┌───────────────┐               ┌─────────────────┐               ┌───────────────┐
│ Persistence & │               │   Core Engine   │               │   Event Bus   │
│   Recovery    │               │    & Memory     │               │   Subsystem   │
├───────────────┤               ├─────────────────┤               ├───────────────┤
│ • WAL Writer  │               │ • Hash Map (RAM)│               │ • Pub-Sub Bus │
│ • CRC32 Check │◄── WAL Sync ──┤ • B-Tree Index  │─── Events ───►│ • Event Ring  │
│ • Snapshots   │               │ • TTL Sweeper   │               │ • JSONL Audit │
│ • Recovery Mgr│               │ • LRU/LFU Policy│               │ • Metrics Sink│
└───────────────┘               └─────────────────┘               └───────────────┘
```

---

## 2. Component Responsibilities Explained Simply

### 1. Service Facade (`PersistentEventDrivenCache`)
* **Role**: The single point of entry for client applications.
* **Responsibility**: Coordinates write-ahead logging, memory updates, event publication, and lifecycle management (start, shutdown, checkpoint).

### 2. Core Cache Engine (`CacheEngine`)
* **Role**: The primary in-memory data store.
* **Responsibility**: Holds `CacheEntry` objects (containing key, value, version number, creation timestamp, and TTL). Enforces optimistic concurrency rules (CAS) and validates that replay operations do not overwrite newer versions.

### 3. Write-Ahead Log Subsystem (`WriteAheadLog`)
* **Role**: The durability foundation.
* **Responsibility**: Appends serialized operation records to disk sequentially before memory is updated. Each record includes a monotonic sequence ID, operation type (`PUT`, `DELETE`, `TX_COMMIT`), key, value, and CRC32 checksum. Enforces an OS-level file lock to prevent split-brain writes.

### 4. Snapshot & Compaction Manager (`SnapshotManager`)
* **Role**: Storage efficiency and fast restart recovery.
* **Responsibility**: Periodically writes a binary snapshot of all active, non-expired cache entries to disk. Once a snapshot is confirmed, old WAL records prior to the snapshot point can be safely compacted/truncated.

### 5. Recovery Engine (`RecoveryManager`)
* **Role**: Automatic state reconstruction upon startup.
* **Responsibility**: Reads the latest valid snapshot file, loads entries into the cache engine, then replays subsequent WAL records sequentially. Verifies CRC32 checksums on every record and isolates/reports any corrupted bytes.

### 6. Event Bus & Journal (`EventBus`, `InMemoryEventJournal`)
* **Role**: Decoupled asynchronous and synchronous observability.
* **Responsibility**: Broadcasts strongly typed `CacheEvent` messages. Maintains an in-memory circular buffer (ring buffer) of the last $N$ events so developers can inspect recent operations without reading disk files.

### 7. Metrics Collector & Audit Sink (`CacheMetrics`, `AuditLogListener`)
* **Role**: Telemetry and compliance logging.
* **Responsibility**: Consumes events from the bus to calculate hit counts, miss counts, hit-to-miss ratios, eviction counts, and latency percentiles. Streams JSON Lines audit logs to disk for forensic inspection.

### 8. Eviction Policies (`LRUCache`, `LFUCache`)
* **Role**: Memory-bounded cache lifecycle.
* **Responsibility**: When maximum capacity is reached, LRU evicts the least recently accessed key using a doubly linked list, while LFU evicts the key with the lowest access frequency using frequency buckets.

### 9. Ordered Index (`BTreeIndex`)
* **Role**: Range query acceleration.
* **Responsibility**: Maintains a balanced B-Tree index alongside the hash map to enable ordered prefix and range scans (e.g., `scan("user:100", "user:200")`).

### 10. Transaction Manager (`TransactionManager`)
* **Role**: Multi-key atomicity and isolation.
* **Responsibility**: Buffers multi-key mutations in a client transaction workspace, acquires exclusive key locks in lexicographical order (to prevent deadlocks), and commits changes as an atomic WAL batch.

---

## 3. Conceptual Walkthrough of a Standard `SET` Operation

Consider a client issuing:  
`SET product:101 "MacBook"` with a TTL of $60,000\text{ ms}$ (60 seconds).

```text
[Client] ── (1) SET product:101 "MacBook" (ttl=60s)
   │
   ▼
[Service Facade]
   │
   ├──► (2) Validate Arguments (Ensure non-null key, valid TTL > 0)
   │
   ├──► (3) Acquire Coordination / Key Lock (Prevent concurrent race conditions)
   │
   ├──► (4) Write Ahead to WAL:
   │        Serialize [seq=101, op=PUT, key="product:101", val="MacBook", ttl=60s, crc=0x5E8A9]
   │        Flush to disk according to DurabilityMode (e.g., OS_FLUSH or FSYNC)
   │
   ├──► (5) Apply to Cache Engine (Memory):
   │        Create CacheEntry(key="product:101", val="MacBook", ver=1, expiresAt=now+60s)
   │        Insert into exact-key Hash Map
   │
   ├──► (6) Update Secondary Indices:
   │        Insert / Update key in B-Tree Index for range scan visibility
   │        Update Eviction Queue (LRU/LFU position)
   │
   ├──► (7) Publish Domain Event:
   │        EventBus.publish(CacheEvent{type=CACHE_PUT, key="product:101", ver=1})
   │        ├──► Metrics Listener: Increment writeCount, update memory estimate
   │        ├──► Audit Listener: Append JSON entry to audit.jsonl
   │        └──► Event Journal: Append to in-memory circular ring buffer
   │
   └──► (8) Return Success Result to Client
```

---

## 4. Conceptual Walkthrough of a Standard `GET` Operation

Consider a client issuing:  
`GET product:101`

```text
[Client] ── (1) GET product:101
   │
   ▼
[Service Facade / Cache Engine]
   │
   ├──► (2) Lookup key in memory Hash Map
   │
   ├──► (3) Check Existence:
   │        ├── If NOT found:
   │        │     Publish CACHE_MISS event -> Increment missCount -> Return null
   │        │
   │        └── If found:
   │              Check Expiration (currentTime > entry.expiresAt?):
   │              ├── If EXPIRED (Lazy Expiry):
   │              │     Remove entry from memory & B-Tree
   │              │     Append DELETE to WAL
   │              │     Publish TTL_EXPIRED event
   │              │     Increment missCount -> Return null
   │              │
   │              └── If VALID (Active):
   │                    Update access timestamp & frequency in Eviction Policy
   │                    Publish CACHE_HIT event -> Increment hitCount
   │                    Return CacheValue("MacBook", ver=1)
```

---

## 5. Architectural Correctness Note

The multi-step sequences described above represent the structural architecture designed during Phase I. In our codebase, these flows are implemented inside the modular classes under `src/main/java/edu/spit/cache/` and verified through unit and integration test suites.
