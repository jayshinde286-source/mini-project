# 02. Need for the Proposed System

---

## 1. System Motivation

Modern computer systems demand both high performance and high dependability. Traditional databases prioritize durability at the cost of disk I/O latency, while simple in-memory caches prioritize speed at the cost of durability and observability.

Our proposed system is needed to bridge this gap by fulfilling **five core engineering requirements**:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   5 PILLARS OF THE PROPOSED SYSTEM                     │
├──────────────┬──────────────┬──────────────┬─────────────┬─────────────┤
│    SPEED     │ RELIABILITY  │  VISIBILITY  │ CONTROLLED  │    SAFE     │
│              │              │              │  LIFETIME   │   UPDATES   │
│  Sub-ms RAM  │  Crash Proof │ Event Bus &  │  TTL & LRU/ │ Optimistic  │
│  Operations  │  via WAL/Rec │ Metrics Sink │     LFU     │ CAS & Locks │
└──────────────┴──────────────┴──────────────┴─────────────┴─────────────┘
```

---

## 2. Detailed Requirement Breakdown

---

### Pillar 1: SPEED (Low-Latency In-Memory Access)

#### Simple Explanation
The application should read and write frequent data in a fraction of a millisecond without making a slow disk query every single time.

#### Technical Meaning
All active keys and values reside in direct Java heap memory (using hash indexing and pointer dereferences), ensuring $O(1)$ average time complexity for `GET` and `SET` operations. Reads bypass secondary storage entirely, eliminating disk rotational delay or SSD bus serialization overhead.

#### Concrete Example
```text
Client requests: GET session:token_9841
Memory lookup takes ~0.05 milliseconds.
Response returned immediately without reading from SSD or remote DB.
```

---

### Pillar 2: RELIABILITY (Crash Durability & Fast Recovery)

#### Simple Explanation
If the computer crashes, loses power, or the program restarts, all confirmed data can be restored automatically instead of disappearing forever.

#### Technical Meaning
Before an update is committed to volatile memory, a structured record containing a monotonic sequence number, timestamp, operation type, key, value, and CRC32 checksum is appended sequentially to an on-disk **Write-Ahead Log (WAL)**. Upon system restart, a recovery engine scans snapshots and replays valid WAL records to rebuild the in-memory state up to the last acknowledged transaction.

#### Concrete Example
```text
1. Client issues: SET config:theme "dark"
2. WAL records: [seq=42, op=PUT, key="config:theme", val="dark", crc=0x9B1A2F]
3. Operation acknowledged.
4. Process crashes!
5. On restart, RecoveryManager reads WAL record 42, verifies CRC32, and restores:
   config:theme -> "dark" in memory.
```

---

### Pillar 3: VISIBILITY (Event-Driven Observability & Auditability)

#### Simple Explanation
Developers and administrators should be able to see what the cache is doing in real-time (e.g., when keys are added, read, deleted, or expired) without hacking into the code.

#### Technical Meaning
The cache decouples mutation logic from monitoring logic using a publish-subscribe **Event Bus**. Every state change emits an immutable domain event (`CacheEvent`) carrying an event ID, monotonic sequence number, event type, key, payload, and timestamp. Downstream listeners update hit/miss rate metrics, output structured JSON Lines audit records, and maintain a circular event journal.

#### Concrete Example
```text
Client executes: GET user:55 (which does not exist)
1. Engine detects miss.
2. Event published: CacheEvent{type=CACHE_MISS, key="user:55", seq=108}
3. Metrics listener increments 'missCount' -> updates Miss Rate to 12.5%.
4. Audit listener logs to audit.jsonl:
   {"timestamp":1700000000,"event":"CACHE_MISS","key":"user:55"}
```

---

### Pillar 4: CONTROLLED LIFETIME (TTL Expiration & Eviction Policies)

#### Simple Explanation
Old or unused items should be cleaned up automatically so the cache doesn't run out of memory or serve outdated information.

#### Technical Meaning
Memory resources are bounded. Entries can be configured with a **Time-To-Live (TTL)** in milliseconds. When a key expires, it is lazily rejected upon read and proactively swept by background eviction. Additionally, when the cache reaches capacity limits, bounded policy strategies—**Least Recently Used (LRU)** via a doubly linked hash map or **Least Frequently Used (LFU)** via frequency buckets—evict cold data.

#### Concrete Example
```text
1. Cache configured with maxCapacity = 2 entries.
2. PUT keyA "10"
3. PUT keyB "20"
4. GET keyA (Access count of keyA increases / moves to MRU position)
5. PUT keyC "30" (Capacity exceeded!)
   -> Eviction policy selects keyB (coldest entry) and evicts it.
   -> Emits EVICTION event for keyB.
```

---

### Pillar 5: SAFE UPDATES (Concurrency Control & Consistency)

#### Simple Explanation
When multiple users or background tasks try to update the same item at the same time, they shouldn't corrupt the data or overwrite each other accidentally.

#### Technical Meaning
Thread safety is maintained via fine-grained locking and **Optimistic Concurrency Control (OCC)** using version-based **Compare-And-Set (CAS)**. Each cache entry maintains a strictly increasing version counter. Writers can specify an expected version; if another thread updated the entry concurrently, the CAS operation fails gracefully without corrupting memory or the persistent WAL.

#### Concrete Example
```text
Thread 1 and Thread 2 both read balance = $100 (version = 5).
Thread 1 executes: CAS("balance", expectedVer=5, newVal=$120) -> SUCCESS (ver becomes 6).
Thread 2 executes: CAS("balance", expectedVer=5, newVal=$150) -> REJECTED!
-> Thread 2 is informed of the version mismatch, preventing a lost update.
```

---

## 3. Summary Matrix

| Requirement | What We Achieve | Technical Mechanism |
|---|---|---|
| **Speed** | Sub-millisecond data retrieval | Direct Java Heap Map & B-Tree |
| **Reliability** | Zero data loss on acknowledged writes | Append-only WAL + CRC32 + Recovery Manager |
| **Visibility** | Real-time monitoring & audit trail | Decoupled Event Bus + Metrics Projection |
| **Controlled Lifetime** | Bounded memory & fresh data | TTL Sweeper + LRU / LFU Eviction |
| **Safe Updates** | Data integrity under concurrent load | Atomic CAS + Versioning + Key Locks |
