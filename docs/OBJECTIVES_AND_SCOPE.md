# Objectives and Scope

## Project title

**PERSISTENT EVENT-DRIVEN MEMORY CACHE MODULE**

## Main objective

To design, implement, and verify a fast in-memory key/value cache that preserves acknowledged updates across process crashes, exposes every important state transition as an ordered event, supports concurrent and transactional updates safely, and restores a consistent exact-key and ordered-query view using an atomic snapshot plus a checksummed write-ahead log.

## Sub-objectives

1. Provide constant-time average exact-key access using an in-memory map.
2. Provide ordered inclusive range queries through a genuine B-tree index.
3. Guarantee WAL-before-memory ordering for every acknowledged standalone mutation.
4. Guarantee all-or-nothing recovery of committed multi-key transactions using a count plus SHA-256 batch manifest.
5. Detect malformed or corrupted WAL records through strict parsing and CRC32 checksums.
6. Reduce recovery cost by creating atomic point-in-time snapshots and compacting covered WAL records.
7. Support TTL-based values without allowing expired values to reappear after restart.
8. Support optimistic concurrency using version numbers and compare-and-set.
9. Support pessimistic transaction coordination using exclusive per-key ownership.
10. Publish ordered events without coupling the core mutation path to metrics or audit logic.
11. Provide operational evidence through metrics, audit logs, event history, recovery reports, invariant checks, and a unified diagnostics command.
12. Compare LRU and LFU under different workload distributions using repeatable measurements.
13. Reject a second process attempting to write the same WAL through an OS-backed exclusive lock.
14. Keep the implementation dependency-free, testable, explainable, and runnable on Java 17.

## In scope

- Single-process, multi-threaded Java application
- String keys and values
- Versioned checksummed WAL
- Atomic transaction batches with commit manifests
- Snapshot/replay recovery
- Lazy and background TTL expiry
- Exact and ordered range queries
- LRU/LFU algorithm laboratory
- Event subscribers, JSONL audit and metrics
- Exclusive WAL ownership for one writer process
- CLI, diagnostics evidence bundle and executable JAR
- Automated unit and integration tests

## Out of scope

- Distributed consensus and replication
- Cross-machine transactions
- Network protocol and authentication
- Encryption at rest
- Shared multi-process reads/writes beyond rejecting a second writer
- Unlimited production throughput claims
- Full database query language
- JMH-grade benchmark methodology

## Success criteria

The project is successful when:

- all automated tests pass from a clean build;
- an acknowledged value survives restart;
- an uncommitted transaction does not survive restart;
- an expired value never returns or reappears;
- a damaged WAL record is reported rather than applied;
- a damaged operation inside a committed transaction causes the entire transaction batch to be rejected;
- a second cache process cannot open the same WAL for writing;
- a checkpoint can compact the WAL without resetting sequence numbers;
- a stale compare-and-set request is rejected;
- conflicting transactions cannot own the same key;
- map and B-tree invariants remain healthy after concurrent writes;
- `DIAGNOSTICS` exposes health, storage, recovery, metrics and event-delivery evidence in one command.
