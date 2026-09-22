# PHASE 1 WEEKLY PROGRESS REPORTS TRANSCRIPT

**Department of Computer Science and Engineering, SPIT**  
**Academic Year 2026-27 | Mini Project Progress Documentation**  
**Supervisor:** Prof. Suhas Kakade  
**Team Members:** Jay Umesh Shinde (2024800115), Sanchit Gaikwad (2024800029), Nikhil Shelar (2024800113)

---

## Week 1 Progress Report (28/07/2026 – 03/08/2026)

### Focus: Problem Definition & Initial Architecture
- Finalized problem statement: Standard in-memory caches deliver high performance but are volatile and risk data loss upon process crash.
- Defined objective of building a persistent, event-driven, memory-resident key-value cache combining high throughput with crash recovery.
- Researched Write-Ahead Logging (WAL), crash recovery patterns, event-driven architectures, and eviction policies.
- Formulated initial modular design: core cache engine, persistence/WAL layer, event bus, CLI, metrics observer.
- Established strict write sequence: input validation -> write to disk (WAL) -> update memory -> emit domain event.

---

## Week 2 Progress Report (04/08/2026 – 10/08/2026)

### Focus: Related Systems Study & Detailed Specifications
- Studied storage patterns from Redis (AOF logging) and PostgreSQL WAL durability mechanisms.
- Selected Java 17 dependency-free stack to ensure clean portability across university computing labs.
- Formulated WAL record structure featuring sequence numbers, timestamps, key-value pairs, TTL, and CRC32 integrity checksums.
- Planned event bus observer pattern for hit/miss metrics and JSON audit logs without coupling core state logic.
- Designed process-level lock file mechanism (`.lock`) to prevent concurrent WAL writer corruption.

---

## Week 3 Progress Report (11/08/2026 – 19/08/2026)

### Focus: Phase 1 Core Prototype & Evaluation Preparation
- Completed Phase 1 core Java prototype supporting `SET`, `GET`, `DELETE`, and `CLEAR` operations.
- Implemented WAL append-only logger with CRC32 checksum generation and file force-flushing.
- Built crash-recovery replay engine (`RecoveryManager`) capable of reconstructing in-memory state on startup and skipping corrupted entries.
- Created interactive CLI shell (`Phase1CLI`) with built-in crash simulation (`CRASH`) for live evaluation.
- Developed automated verification test suite (`AllPhase1Tests`) covering unit and integration testing.
- Prepared Phase 1 documentation and presentation materials for Phase 1 faculty evaluation.
- Documented future roadmap: LRU/LFU eviction policies (Phase 2), transactions and B-Tree indexing (Phase 3) designated as upcoming work.
