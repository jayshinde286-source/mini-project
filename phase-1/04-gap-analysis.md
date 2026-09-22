# 04. Gap Analysis

---

## 1. The Multi-Faceted Engineering Gap

When reviewing standard software engineering curricula and open-source building blocks, developers and students typically encounter systems that address isolated aspects of data management:

```
┌────────────────────────────────────────────────────────────────────────────┐
│                  THE FIVE PILLARS OF CACHE SYSTEM DESIGN                   │
│                                                                            │
│       ┌─────────────────┐                 ┌─────────────────┐              │
│       │   Fast Memory   │                 │  Persistence &  │              │
│       │      Cache      │                 │    Recovery     │              │
│       └────────┬────────┘                 └────────┬────────┘              │
│                │                                   │                       │
│                └─────────────────┬─────────────────┘                       │
│                                  │                                         │
│                                  ▼                                         │
│                      ┌──────────────────────┐                              │
│                      │    THE INTEGRATION   │                              │
│                      │         GAP          │                              │
│                      └──────────┬───────────┘                              │
│                                 │                                          │
│         ┌───────────────────────┼───────────────────────┐                  │
│         │                       │                       │                  │
│         ▼                       ▼                       ▼                  │
│  ┌──────────────┐       ┌──────────────┐        ┌──────────────┐           │
│  │ Event-Driven │       │ TTL & Bounded│        │ Concurrency  │           │
│  │  Monitoring  │       │   Eviction   │        │    Safety    │           │
│  └──────────────┘       └──────────────┘        └──────────────┘           │
└────────────────────────────────────────────────────────────────────────────┘
```

The fundamental gap identified in Phase I is the lack of a **cohesive, lightweight, and inspectable system** that unifies all five domains without relying on bloated enterprise frameworks or opaque binary distributions.

---

## 2. Detailed Gap Identification Across the Five Domains

### Gap 1: Memory Speed vs. Durability Isolation
* **Current State**: Developers either use an in-memory map (which loses all state on crash) or an external database (which incurs heavy network/disk I/O penalties for simple key lookups).
* **Identified Gap**: A straightforward, in-process architecture where RAM serves as the primary read/write tier while an append-only WAL operates asynchronously/synchronously in the background to ensure restart recovery.

### Gap 2: Absence of Verifiable Crash Recovery Mechanisms
* **Current State**: Lightweight libraries rarely demonstrate how Write-Ahead Logs, record checksums, and snapshot compaction work under actual crash scenarios.
* **Identified Gap**: A transparent recovery engine that can deliberately detect corrupted records (via CRC32 validation), reject half-written transactions, and restore exact state up to the failure point.

### Gap 3: Decoupled Event-Driven Observability
* **Current State**: Most standard cache implementations mutate state silently. Developers must inject manual logging code into critical execution paths, causing tight coupling and performance bottlenecks.
* **Identified Gap**: A decoupled, publish-subscribe domain event bus where every cache state transition (`CACHE_PUT`, `CACHE_HIT`, `CACHE_MISS`, `CACHE_DELETE`, `TTL_EXPIRED`, `EVICTION`, `RECOVERY`) is broadcast to independent metric observers and audit loggers.

### Gap 4: Controlled Memory Lifecycles (TTL + Eviction)
* **Current State**: Simple projects often implement either basic TTL or a basic eviction list, rarely integrating proactive TTL sweeping with bounded O(1) algorithms (such as LRU and LFU) while persisting lifecycle events.
* **Identified Gap**: Unified lifecycle management combining lazy read-time expiration, scheduled background sweeps, and bounded memory policies that trigger proper audit events upon key eviction.

### Gap 5: Safe Concurrent Mutation & Optimistic Locking
* **Current State**: Undergraduate projects often resort to coarse-grained `synchronized` methods (which serialize all threads and destroy throughput) or leave shared state unprotected (causing data corruption).
* **Identified Gap**: Implementation of fine-grained key locking alongside Optimistic Concurrency Control (CAS with monotonic version counters) to ensure thread safety without degrading parallelism.

---

## 3. Academic Value Proposition (No Exaggerated Claims)

We do not claim industrial novelty or proprietary mathematical breakthroughs. The academic and practical value of this project lies in **system synthesis, pedagogical clarity, and rigorous verification**:

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                    ACADEMIC VALUE OF OUR MODULE                         │
│                                                                         │
│   [ IMPLEMENT ]  -> Clean, zero-dependency Java 17 systems code         │
│   [ INSPECT ]    -> White-box internal structures (WAL, B-Tree, Bus)    │
│   [ TEST ]       -> Automated crash, restart, and corruption tests      │
│   [ BENCHMARK ]  -> Concrete LRU vs. LFU hit-rate & latency comparisons │
│   [ DEMONSTRATE] -> Interactive CLI showing live events & recovery      │
└─────────────────────────────────────────────────────────────────────────┘
```

1. **White-Box Systems Learning**: By implementing our own WAL serializer, CRC32 verifier, B-Tree, and event bus, we bridge theoretical OS and Database concepts (ACID properties, logging, paging, caching) with actual running software.
2. **Deterministic Failure Injection**: The module allows students and examiners to inject corrupted bytes into the WAL file, trigger crashes, and observe how the recovery manager safely isolates damage.
3. **Modular Extensibility**: The clean separation between Cache Engine, Persistence Layer, Event Bus, and Eviction Policies makes each component independently testable and maintainable.
