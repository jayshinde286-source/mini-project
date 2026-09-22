# 08. Project Planning & Roadmap

---

## 1. Semester Project Timeline & Milestones

The development lifecycle for the **Persistent Event-Driven Memory Cache Module** is structured across five major evaluation checkpoints during the academic semester:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SEMESTER PROJECT ROADMAP                            │
└─────────────────────────────────────────────────────────────────────────────┘

  PHASE I             PHASE II            PHASE III           PHASE IV            ESE FINAL
[17 AUG 2026]       [02 SEP 2026]       [30 SEP 2026]       [12 OCT 2026]       [02 NOV 2026]
      │                   │                   │                   │                   │
      ▼                   ▼                   ▼                   ▼                   ▼
• Problem Def.      • Core Engine       • Event Bus         • Snapshots         • Full System
• Related Study     • Basic WAL v1      • TTL Sweeper       • B-Tree Index      • Live Demo
• Gap Analysis      • Recovery Base     • Eviction Hook     • Diagnostics CLI   • Benchmark
• Architecture      • Basic Tests       • Metrics Sink      • End-to-End Test   • Final Report
• Phase-I Report    • LRU/LFU Base      • Multi-key Tx      • Documentation     • Viva Voce
```

---

## 2. Phase-by-Phase Deliverable Specifications

### Milestone 1: Phase I — Problem Formulation & Architecture
* **Target Review Date**: **17 AUG 2026**
* **Status**: **COMPLETED**
* **Deliverables**:
  1. Formal Problem Statement & Volatility Analysis.
  2. Literature Review & Comparative Analysis of Related Systems.
  3. Gap Analysis across the 5 Core Systems Dimensions.
  4. System Architecture, Layered Model & Data Flow Specifications.
  5. Project Scope, Milestone Schedule & Team Ownership Matrix.
  6. Week 1 & Week 2 Progress Reports & Viva Preparation Guide.

---

### Milestone 2: Phase II — Engine Core & Durability Baseline
* **Target Review Date**: **02 SEP 2026**
* **Status**: *PLANNED FOR FUTURE PHASE*
* **Deliverables**:
  1. In-memory `CacheEngine` with basic `GET`, `PUT`, `DELETE` operations.
  2. Initial `WriteAheadLog` implementation with sequential file append.
  3. Baseline `RecoveryManager` capable of reading uncorrupted logs on startup.
  4. Foundational unit tests verifying crash-restart state persistence.
  5. Baseline in-memory LRU / LFU cache policy implementations.

---

### Milestone 3: Phase III — Event Bus, Lifecycle & Concurrency
* **Target Review Date**: **30 SEP 2026**
* **Status**: *PLANNED FOR FUTURE PHASE*
* **Deliverables**:
  1. Decoupled, publish-subscribe `EventBus` emitting strongly-typed domain events.
  2. Millisecond-precision TTL expiration with background sweeper thread.
  3. Eviction policy integration with event dispatching (`EVICTION` event).
  4. Optimistic Concurrency Control via versioned Compare-And-Set (CAS).
  5. Real-time `CacheMetrics` collector and JSON Lines audit log listener.
  6. Multi-key transactional workspace with atomic batch commit.

---

### Milestone 4: Phase IV — Snapshots, Indexing & Hardening
* **Target Review Date**: **12 OCT 2026**
* **Status**: *PLANNED FOR FUTURE PHASE*
* **Deliverables**:
  1. Atomic `SnapshotManager` for periodic state checkpointing and WAL compaction.
  2. Integrated in-memory `BTreeIndex` for range scans (`scan(from, to)`).
  3. Deterministic corruption recovery (CRC32 validation & torn transaction rejection).
  4. Interactive Command-Line Interface (`CommandHandler`) and script runner.
  5. Comprehensive automated test harness (crash tests, race condition tests).

---

### Milestone 5: ESE Final Evaluation — Verification & Viva
* **Target Review Date**: **02 NOV 2026**
* **Status**: *PLANNED FOR FUTURE PHASE*
* **Deliverables**:
  1. Complete, polished, zero-dependency Java module package.
  2. End-to-end live demonstration of crash recovery, TTL, eviction, and events.
  3. Comprehensive benchmark report (LRU vs. LFU throughput & latency percentiles).
  4. Final Project Report, Architecture Book, and Evidence Portfolio.
  5. Final End Semester Examination (ESE) Viva Voce defense.

---

## 3. Team Ownership & Responsibilities

While all three team members maintain complete end-to-end understanding of the entire system, primary ownership is divided logically across key architectural domains:

```
┌────────────────────────────────────────────────────────────────────────────┐
│                    TEAM RESPONSIBILITY ALLOCATION                          │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│   👨‍💻 Sanchit Gaikwad (2024800029)                                          │
│   Primary Focus: Durability, Storage & Crash Recovery                      │
│   • Write-Ahead Log (WAL) record serialization and sequential I/O          │
│   • CRC32 checksum generation, verification, and corruption isolation      │
│   • Snapshot creation, point-in-time state compaction, and truncation       │
│   • Recovery replay state machine and crash-consistency guarantees         │
│                                                                            │
│   👨‍💻 Jay Shinde (2024800115)                                              │
│   Primary Focus: Core Cache Engine, Indexing & Concurrency                 │
│   • Thread-safe in-memory cache data structures and version tracking       │
│   • Generic B-Tree index implementation for ordered range scans            │
│   • Compare-And-Set (CAS) optimistic concurrency control logic             │
│   • Fine-grained key-level locking and transaction coordination            │
│                                                                            │
│   👨‍💻 Nikhil Shelar (2024800113)                                            │
│   Primary Focus: Event Bus, Observability, Eviction & Test Delivery         │
│   • Decoupled publish-subscribe Event Bus and circular Event Journal       │
│   • Telemetry metrics projection (hit/miss ratios, throughput counters)    │
│   • JSON Lines audit logging and observer error isolation                  │
│   • LRU / LFU eviction algorithms and TTL sweeper integration              │
│   • Test harness orchestration, CLI demonstration scripts, and packaging   │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

> **Cross-Functional Commitment**: Every team member actively participates in architectural reviews, code inspections, and mock viva sessions to ensure shared ownership and complete system fluency.
