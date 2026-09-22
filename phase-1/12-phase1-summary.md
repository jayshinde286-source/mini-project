# 12. Phase-I Executive Summary

---

## 1. Executive Summary Overview

| Dimension | Phase-I Synthesis |
|---|---|
| **Project Title** | Persistent Event-Driven Memory Cache Module |
| **Department / College** | Department of Computer Science and Engineering, S.P.I.T. |
| **Team Members** | Jay Shinde (`2024800115`), Nikhil Shelar (`2024800113`), Sanchit Gaikwad (`2024800029`) |
| **Project Guide** | Prof. Suhas Kakade |
| **Academic Year** | 2026–27 (Third Year B.Tech CSE) |
| **Phase-I Milestone** | 17 August 2026 |

---

## 2. Core Narrative of Phase I

### What Problem We Identified
In-memory caches are fast because data is held directly in RAM, but RAM is inherently **volatile**. A single unexpected application crash, kernel kill, or power failure results in instantaneous loss of all cached data, leading to cold-start penalties and database cache stampedes. Naive caches also suffer from torn updates, lack of mutation visibility, stale data accumulation, and concurrent race conditions.

### What We Studied
We surveyed key-value data structures and caching systems across the computing spectrum:
1. Standard Java collections (`HashMap`, `ConcurrentHashMap`).
2. Popular in-memory caching libraries (Google Guava, Caffeine).
3. Persistent key-value storage engines (RocksDB, LevelDB, SQLite).

### What Gap We Found
Existing solutions present an "all-or-nothing" trade-off: in-memory caches are ultra-fast but completely volatile and opaque; storage engines are durable but heavy, disk-oriented, and complex. There is a clear educational and architectural gap for a **lightweight, modular, zero-dependency Java module** that seamlessly integrates:
1. Fast RAM caching
2. Append-only WAL persistence & recovery
3. Decoupled event-driven monitoring
4. Controlled TTL & bounded LRU/LFU eviction
5. Concurrency safety (CAS and key-level locks)

### What We Propose
A modular, pure Java 17 **Persistent Event-Driven Memory Cache Module** that enforces the "WAL-before-memory" invariant, broadcasts immutable domain events over an in-memory bus, sweeps expired entries, and rebuilds state idempotently upon crash recovery.

### What Architecture We Planned
A 4-tier layered architecture:
* **Client / CLI Interface**: Admin commands, scripts, and benchmarking harnesses.
* **Service Facade**: Coordinates lifecycle, logging, and dispatching.
* **Core Engine & Memory**: Concurrent hash map, versioned cache entries, B-tree range index, and LRU/LFU eviction policies.
* **Persistence & Observability**: Write-Ahead Log with CRC32 checks, Snapshot Manager, Recovery Replay Engine, Event Bus, Metrics Sink, and JSON Lines Audit Logger.

### What We Completed in Two Weeks
* **Week 1 (01 Aug – 07 Aug 2026)**: Topic registration, RAM volatility analysis, study of WAL/TTL/Event Bus theory, definition of 7 core objectives, and team division.
* **Week 2 (08 Aug – 14 Aug 2026)**: Literature comparison, 5-way gap analysis, layered architecture modeling, data flow diagrams, semester roadmap planning, and Phase-I presentation preparation.

### What Comes Next (Phase II Milestone — 02 Sep 2026)
In Phase II, our primary deliverable is the core in-memory cache engine, baseline Write-Ahead Log (WAL v1), initial recovery replay engine, and automated JUnit test verification.

---

## 3. "What Should We Tell Our Professor?" (1–2 Minute Natural Pitch)

When presenting our Phase-I progress to **Prof. Suhas Kakade** and departmental evaluators, we will deliver the following natural 60-to-90 second presentation:

> *"Good morning, Sir. Our Third Year CSE mini-project is titled **Persistent Event-Driven Memory Cache Module**, guided by you, Prof. Suhas Kakade.*
>
> *During the first two weeks of our semester, our team—Jay Shinde, Nikhil Shelar, and Sanchit Gaikwad—focused on establishing the foundational systems engineering research for our project.*
>
> *In **Week 1**, we finalized our project topic and analyzed the core systems trade-off: while RAM provides microsecond access speeds, it is volatile and loses all state on process crashes or restarts. We formulated our central research question: **'How can we combine RAM-level speed with persistence, recovery, and event-driven monitoring?'***
>
> *In **Week 2**, we conducted a comparative study of existing systems—such as Java HashMaps, in-memory caches like Guava, and storage engines like RocksDB. We identified a clear gap for an educational, zero-dependency Java module that unifies fast memory access, Write-Ahead Logging (WAL) with CRC32 verification, an ordered domain event bus, TTL eviction, and concurrency control.*
>
> *We designed the complete 4-tier system architecture, formalized our conceptual data flows for `SET` and `GET` operations, established our module boundaries, and defined our semester roadmap.*
>
> *For **Phase I**, our deliverables are theoretical formulation, related-systems analysis, architectural modeling, and milestone planning. In **Phase II**, we will deliver the working core engine, baseline WAL, and automated crash-recovery tests.*
>
> *Thank you, Sir. We are ready for your questions."*
