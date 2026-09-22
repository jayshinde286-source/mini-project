# 07. Objectives & Project Scope

---

## 1. Overall Project Objectives

The primary objective of this mini-project is to build a reliable, high-performance, and observable in-memory cache module in pure Java that bridges the gap between raw memory speed and robust data durability.

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                        CORE PROJECT OBJECTIVES                          │
├─────────────────────────────────────────────────────────────────────────┤
│ 1. Sub-Millisecond Key-Value Operations (RAM-First Data Access)         │
│ 2. Guaranteed Crash Durability & Automated Recovery (WAL + Snapshots)   │
│ 3. Real-Time Observability & Event Streaming (Ordered Event Bus)        │
│ 4. Bounded Memory Lifecycle Management (TTL Expiration + LRU/LFU)       │
│ 5. Concurrency Safety & Atomic Multi-Key Transactions (CAS + 2PL Locks) │
│ 6. Observability Metrics & Forensics Audit Trail (JSON Lines Logging)   │
│ 7. Verifiable & Demonstrable Prototype (Interactive CLI & Benchmarks)   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Detailed Technical Objectives

1. **Fast In-Memory Engine**: Implement an in-memory key-value engine delivering $O(1)$ average time complexity for basic cache primitives (`GET`, `PUT`, `DELETE`).
2. **Crash Resilience & Data Integrity**:
   * Implement an append-only Write-Ahead Log (WAL) with per-record CRC32 checksum verification.
   * Implement an atomic Snapshot Manager to compact log files.
   * Implement a Recovery Manager to automatically reconstruct state and report corrupted bytes after ungraceful termination.
3. **Domain Event Sourcing**:
   * Build a lightweight, ordered Event Bus supporting decoupled subscribers.
   * Emit discrete domain events: `CACHE_PUT`, `CACHE_HIT`, `CACHE_MISS`, `CACHE_DELETE`, `TTL_EXPIRED`, `EVICTION`, and `RECOVERY`.
4. **Lifecycle Control**:
   * Support millisecond-precision Time-To-Live (TTL) expiration with lazy read checks and proactive background sweeping.
   * Implement bounded $O(1)$ LRU (Least Recently Used) and LFU (Least Frequently Used) eviction algorithms.
5. **Concurrency & Query Capabilities**:
   * Provide optimistic concurrency control using versioned Compare-And-Set (CAS).
   * Implement multi-key atomic transactions with deadlock-free key locking.
   * Maintain a balanced B-Tree index for ordered lexicographical range queries (`scan(fromKey, toKey)`).
6. **Zero-Dependency Architecture**:
   * Build the complete subsystem using standard Java 17 libraries without external third-party frameworks.

---

## 3. Scope Separation: Phase I vs. Future Phases

To maintain academic rigor and project accountability, project deliverables are partitioned strictly across phases:

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         PHASE-I ACADEMIC SCOPE                           │
│                          (Completed & Evaluated)                         │
├──────────────────────────────────────────────────────────────────────────┤
│  ✓ Formulate and finalize the formal academic problem statement.        │
│  ✓ Conduct extensive literature review on existing caching approaches.   │
│  ✓ Identify the 5-way engineering gap in lightweight cache systems.      │
│  ✓ Formulate system requirements (Speed, Durability, Observability, etc)│
│  ✓ Design high-level system architecture and component interactions.     │
│  ✓ Define component boundaries and interface specifications.            │
│  ✓ Select technology stack (Java 17, Zero-Dependency Standard Library).  │
│  ✓ Develop project roadmap, phase milestones, and team ownership.        │
│  ✓ Document Week 1 and Week 2 progress reports and evaluation guide.     │
│  ✓ Prepare Phase-I slides and Viva Voce preparation materials.           │
└──────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                     LATER PHASES IMPLEMENTATION SCOPE                    │
│                      (Phases II, III, IV & Final ESE)                    │
├──────────────────────────────────────────────────────────────────────────┤
│  ▶ Phase II (Sep 02): Core cache engine, basic WAL v1, LRU/LFU baseline. │
│  ▶ Phase III (Sep 30): Event Bus, TTL sweeper, Concurrency, Metrics.     │
│  ▶ Phase IV (Oct 12): Snapshots, B-Tree index, Multi-key transactions.   │
│  ▶ ESE (Nov 02): End-to-end integration, demo CLI, benchmark validation. │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Out of Scope for the Current Mini-Project

To keep the scope realistic and achievable for an undergraduate Third-Year engineering project, the following areas are deliberately marked as **out of scope**:
* **Distributed Clustering & Consensus**: Multi-node replication via Paxos or Raft consensus algorithms is out of scope (our module is an in-process Java cache).
* **Network Wire Protocols**: Implementing full Redis (RESP) or Memcached network protocol parsers is out of scope.
* **Secondary Disk Indexing**: On-disk B+ Tree paging (like InnoDB) is out of scope; our B-Tree is memory-resident while the WAL provides persistence.
