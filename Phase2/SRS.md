# Software Requirements Specification (SRS)
## Persistent Event-Driven In-Memory Cache (SPIT Cache Module)
**Document Standard:** Aligned with IEEE Std 830-1998  
**Institution:** Sardar Patel Institute of Technology (SPIT), Mumbai  
**Department:** Computer Science and Engineering  
**Academic Year:** 2026–27 | **Semester:** V | **Subject:** Mini Project (PR1)  
**Evaluation Category:** Phase 2: Architecture & Design (P1 — SRS: 10 Marks)  

---

## Table of Contents
1. [Introduction](#1-introduction)
   - 1.1 Purpose
   - 1.2 Document Conventions
   - 1.3 Intended Audience and Reading Suggestions
   - 1.4 Project Scope
   - 1.5 References
2. [Overall Description](#2-overall-description)
   - 2.1 Product Perspective
   - 2.2 Product Functions
   - 2.3 User Classes and Characteristics
   - 2.4 Operating Environment
   - 2.5 Design and Implementation Constraints
   - 2.6 User Documentation
   - 2.7 Assumptions and Dependencies
3. [System Features & Functional Requirements](#3-system-features--functional-requirements)
   - 3.1 In-Memory Key-Value Cache Engine
   - 3.2 Eviction Algorithms (LRU, FIFO, LFU)
   - 3.3 Time-To-Live (TTL) Lifecycle Management
   - 3.4 Write-Ahead Logging (WAL) & Persistence Engine
   - 3.5 Snapshot Storage & Compaction System
   - 3.6 Two-Phase Crash Recovery Subsystem
   - 3.7 Asynchronous Event-Driven Pipeline
   - 3.8 Visual Telemetry & Interactive Console
4. [External Interface Requirements](#4-external-interface-requirements)
   - 4.1 User Interfaces
   - 4.2 Hardware Interfaces
   - 4.3 Software Interfaces
   - 4.4 Communications Interfaces
5. [Non-Functional Requirements (NFRs)](#5-non-functional-requirements-nfrs)
   - 5.1 Performance Requirements
   - 5.2 Safety and Fault-Tolerance Requirements
   - 5.3 Security Requirements
   - 5.4 Software Quality Attributes
6. [System Architecture & Data Design](#6-system-architecture--data-design)
7. [Verification & Acceptance Criteria](#7-verification--acceptance-criteria)

---

## 1. Introduction

### 1.1 Purpose
The purpose of this Software Requirements Specification (SRS) is to provide a complete, rigorous, and unambiguous description of the software requirements for the **SPIT Cache Module (Persistent Event-Driven In-Memory Cache)**. This document specifies the functional behavior, architectural topology, algorithmic specifications, data structures, and operational constraints for developers, architects, and academic evaluators during the Phase 2 assessment of Mini Project (PR1).

### 1.2 Document Conventions
- **Requirement Tags**: Functional requirements are prefixed with `[FR-xx]`, and Non-Functional requirements are prefixed with `[NFR-xx]`.
- **Keywords**: "MUST", "SHALL", and "REQUIRED" indicate mandatory specifications. "SHOULD" indicates strongly recommended features.

### 1.3 Intended Audience and Reading Suggestions
This document is prepared for:
1. **Academic Evaluation Committee (SPIT CSE Department)**: For grading according to the 25-mark Phase 2 rubric.
2. **System Architects & Software Engineers**: For module-level implementation and integration.
3. **Quality Assurance & Verification Teams**: For executing test cases and verifying crash-recovery scenarios.

### 1.4 Project Scope
The SPIT Cache Module is a high-performance in-memory cache system providing sub-millisecond key-value retrieval, write-ahead durability, periodic point-in-time snapshotting, and fault-tolerant log replay. It eliminates the traditional vulnerability of in-memory caching systems (state loss during ungraceful termination) while mitigating the throughput bottlenecks of relational disk systems.

### 1.5 References
1. IEEE Std 830-1998: *Recommended Practice for Software Requirements Specifications*.
2. Gray, J., & Reuter, A. (1992): *Transaction Processing: Concepts and Techniques* (Write-Ahead Logging principles).
3. Ongaro, D., & Ousterhout, J. (2014): *In Search of an Understandable Consensus Algorithm* (Log replication and durability).
4. Sardar Patel Institute of Technology: *Mini Project PR1 Evaluation Guidelines (2026-27)*.

---

## 2. Overall Description

### 2.1 Product Perspective
```
+------------------------------------------------------------------+
|                   Client Applications / REST APIs                |
+---------------------------------+--------------------------------+
                                  |
                                  v
+------------------------------------------------------------------+
|                       SPIT Cache Module                          |
|  +--------------------+  +------------------+  +---------------+ |
|  |  In-Memory Storage |  |  Event Bus Subsys|  | Metrics Engine| |
|  |  (HashMap + DLL)   |  |  (Async Pub-Sub) |  | (Live Telemet)| |
|  +---------+----------+  +--------+---------+  +-------+-------+ |
+------------|----------------------|--------------------|---------+
             |                      |                    |
             v                      v                    v
+------------------------------------------------------------------+
|                       Persistence Storage Layer                  |
|  +--------------------------------+  +-------------------------+ |
|  |   Write-Ahead Log (WAL File)   |  |   Snapshot Store (.bin) | |
|  |   CRC32 Record Serialization   |  |   Periodic Checkpointing| |
|  +--------------------------------+  +-------------------------+ |
+------------------------------------------------------------------+
```
The SPIT Cache Module operates as a self-contained persistence engine that can serve as an application cache, an embedded key-value store, or a telemetry-monitored caching service.

### 2.2 Product Functions
1. **Low-Latency In-Memory Storage**: Fast $O(1)$ key-value operations (`PUT`, `GET`, `REMOVE`, `EXISTS`).
2. **Eviction Engine**: Automatic eviction of items when cache capacity is reached using LRU (Least Recently Used), FIFO, or LFU policies.
3. **Temporal Lifecycles**: TTL countdown and automatic purging of stale records.
4. **Append-Only Durability**: Synchronous write-ahead logging guaranteeing zero uncommitted data loss.
5. **Snapshotting & Log Pruning**: Checkpointing live state to disk and safely truncating obsolete WAL segments.
6. **Crash Recovery**: Replaying snapshots and remaining WAL logs upon restart to reconstitute the exact state prior to crash.
7. **Telemetry & Visual Dashboard**: Visual monitoring of cache hits, misses, evictions, memory pressure, and WAL transactions.

### 2.3 User Classes and Characteristics
- **System Administrator / DBA**: Inspects storage, configures TTL defaults, triggers manual snapshotting and crash-recovery audits.
- **Application Developer**: Integrates cache operations via REST and inspects event stream logs for latency or miss trends.
- **Academic Evaluator**: Reviews code modularity, design patterns, UML fidelity, and performance benchmarks.

### 2.4 Operating Environment
- **Operating Systems**: macOS (Darwin 24+), Linux (Ubuntu 22.04 LTS+, RHEL 9+), Windows 11.
- **Runtime Engines**: Node.js v18.0+ / Java SE 17+ (LTS).
- **Web Browsers**: Google Chrome 110+, Mozilla Firefox 115+, Apple Safari 16+, Microsoft Edge 110+.
- **Display Resolution**: Optimized for responsive viewports ($1024 \times 768$ up to $3840 \times 2160$ 4K).

### 2.5 Design and Implementation Constraints
1. **Algorithmic Complexity**: Cache lookups and insertions MUST execute in $O(1)$ average time.
2. **Memory Bounds**: Heap consumption MUST strictly adhere to the configured maximum cache capacity to prevent Out-Of-Memory errors.
3. **Data Integrity**: Every WAL record MUST include a 32-bit CRC checksum. Corrupted records must be detected and logged during recovery.
4. **No External Database Hard-Dependency**: Core persistence must rely on standalone append-only logs and binary/structured snapshots.

---

## 3. System Features & Functional Requirements

### 3.1 In-Memory Key-Value Cache Engine
- **[FR-1.1] Atomic Insertion**: The system SHALL allow inserting a key-value pair with an optional Time-To-Live (TTL) parameter. If the key exists, its value and TTL SHALL be updated atomically.
- **[FR-1.2] O(1) Retrieval**: The system SHALL return the stored value for an existing key in $O(1)$ time complexity and update its access order.
- **[FR-1.3] Explicit Deletion**: The system SHALL permit explicit removal of a key, returning `true` if found or `false` if not found.
- **[FR-1.4] Clear Operation**: The system SHALL provide an atomic `CLEAR` operation that empties the cache and logs a corresponding WAL event.

### 3.2 Eviction Algorithms (LRU, FIFO, LFU)
- **[FR-2.1] LRU Doubly-Linked List**: The system SHALL maintain a doubly-linked list of cache nodes. Every read or write operation MUST reposition the accessed node to the Head of the list in $O(1)$ operations.
- **[FR-2.2] Tail Eviction on Capacity Overflow**: When a `PUT` operation occurs on a full cache, the Tail node MUST be evicted in $O(1)$ time, releasing memory before the new key is placed.
- **[FR-2.3] Pluggable Eviction Strategy**: The system architecture SHALL use the Strategy Design Pattern allowing runtime selection between LRU, FIFO, and LFU eviction algorithms.

### 3.3 Time-To-Live (TTL) Lifecycle Management
- **[FR-3.1] Dynamic TTL Assignment**: Each key MAY be assigned an explicit TTL in milliseconds or seconds.
- **[FR-3.2] Passive Lazy Expiration**: Upon every `GET` request, the system SHALL check if `currentTime >= node.expiryTime`. If expired, the key SHALL be evicted immediately, returning `CACHE_MISS`.
- **[FR-3.3] Active Sweeper Thread**: The system SHALL run a background sweeper task every interval $T$ to sample and evict expired keys to reclaim inactive memory.

### 3.4 Write-Ahead Logging (WAL) & Persistence Engine
- **[FR-4.1] Synchronous Log Appends**: Every state-modifying operation (`SET`, `DEL`, `EVICT`, `CLEAR`) MUST be appended to the append-only WAL file before updating in-memory state.
- **[FR-4.2] Log Record Format**: Each WAL record MUST serialize the following fields:
  ```
  +---------+-----------+---------+-----------+-----------+------------+------------+---------+
  | Magic   | TxnId/LSN | OpCode  | Timestamp | KeyLength | KeyContent | ValLength  | ValCont |
  | (2B)    | (8B uint) | (1B)    | (8B uint) | (2B uint) | (Variable) | (4B uint)  | (Var)   |
  +---------+-----------+---------+-----------+-----------+------------+------------+---------+
  | CRC32 Checksum (4 Bytes)                                                                  |
  +-------------------------------------------------------------------------------------------+
  ```
- **[FR-4.3] CRC32 Checksumming**: A 32-bit Cyclic Redundancy Check MUST be calculated over the record header and payload and written at the end of each record.

### 3.5 Snapshot Storage & Compaction
- **[FR-5.1] Point-in-Time Checkpointing**: The system SHALL serialize all active, non-expired keys and values into a binary snapshot file (`snapshot.bin`).
- **[FR-5.2] Atomic File Swap**: Snapshots MUST be written to a temporary file (`snapshot.tmp`) and atomically renamed upon successful flush to prevent partial corruption.
- **[FR-5.3] Log Truncation**: Once a snapshot is confirmed, WAL records with an LSN less than or equal to the snapshot checkpoint LSN MUST be purged.

### 3.6 Two-Phase Crash Recovery Subsystem
- **[FR-6.1] Phase 1 - Snapshot Restoration**: On startup, if a valid snapshot file exists, the system SHALL restore all key-value entries and advance the system clock and LSN pointer.
- **[FR-6.2] Phase 2 - WAL Replay**: The system SHALL sequentially read the WAL log from the snapshot checkpoint forward, verify the CRC32 checksum for each record, and re-apply valid mutations.
- **[FR-6.3] Bad Block Isolation**: If an invalid CRC32 is encountered (representing an ungraceful partial disk flush), the system SHALL stop replay at the last valid record and log a diagnostic warning.

### 3.7 Asynchronous Event-Driven Pipeline
- **[FR-7.1] Event Types**: The system SHALL publish structured events for: `CACHE_HIT`, `CACHE_MISS`, `CACHE_PUT`, `CACHE_UPDATE`, `CACHE_DELETE`, `CACHE_EVICTED`, `TTL_EXPIRED`, `WAL_APPENDED`, `SNAPSHOT_CREATED`, `RECOVERY_COMPLETED`.
- **[FR-7.2] Asynchronous Subscriber Dispatch**: Subscribers (e.g., telemetry dashboards, audit loggers) SHALL receive notifications asynchronously without blocking core cache read/write pipelines.

### 3.8 Visual Telemetry & Interactive Console
- **[FR-8.1] Live KPI Dashboard**: The console SHALL display real-time gauges: Total Keys, Active Keys, Expired Keys, Hit Rate, Miss Rate, Memory Footprint, Eviction Count.
- **[FR-8.2] Cache Entry Inspector**: Paginated, sortable, and searchable table with real-time TTL countdown indicators and manual CRUD capabilities.
- **[FR-8.3] Data Export**: Cache entries and audit logs MUST be exportable directly to `.json` and `.csv` formats.
- **[FR-8.4] Command Palette**: Global shortcut (`Cmd+K` / `Ctrl+K`) providing instant keyboard access to navigation, search, and system commands.
- **[FR-8.5] Theme Toggle**: Support for Obsidian Dark and Slate Light themes with persistent storage in browser local storage.

---

## 4. External Interface Requirements

### 4.1 User Interfaces
- Modern Responsive Web UI built with CSS custom properties, responsive grid layout, and accessible semantic components.
- Keyboard navigation compliant with WCAG 2.1 AA standards for modals and focus states.

### 4.2 Hardware Interfaces
- Standard block-storage devices (HDD, SATA SSD, NVMe SSD) via OS file system abstractions.

### 4.3 Software Interfaces
- Operating System file I/O: POSIX `open`, `write`, `fsync`, `read` or Node.js / Java NIO channels.
- RESTful HTTP APIs with JSON payloads (`Content-Type: application/json`).

### 4.4 Communications Interfaces
- TCP/IP HTTP/1.1 or HTTP/2 transport for RESTful telemetry communication.
- WebSocket or Server-Sent Events (SSE) for streaming live cache event telemetry.

---

## 5. Non-Functional Requirements (NFRs)

### 5.1 Performance Requirements
- **[NFR-1] Read Latency**: In-memory cache hit lookup time MUST not exceed 10 microseconds ($p99$).
- **[NFR-2] Write Latency with WAL**: End-to-end write operation including synchronous disk log append MUST execute under 5 milliseconds on standard SSD storage.
- **[NFR-3] Memory Footprint**: Cache management metadata MUST not exceed 128 bytes per stored key-value pair.

### 5.2 Safety and Fault-Tolerance Requirements
- **[NFR-4] Zero Data Loss for Committed Writes**: Any write confirmed to the client MUST survive an immediate `SIGKILL` or power cutoff.
- **[NFR-5] Crash Recovery Speed**: Restoration of 10,000 keys from snapshot and WAL MUST complete in less than 500 milliseconds.

### 5.3 Security Requirements
- **[NFR-6] Input Validation**: All keys and values MUST be validated against size thresholds (keys $\le 256$ bytes, values $\le 10$ MB) to prevent denial-of-service memory exhaustion.
- **[NFR-7] Secure Storage**: File permissions on WAL and snapshot files MUST be restricted to owner-only read/write (`chmod 600`).

### 5.4 Software Quality Attributes
- **Maintainability**: Strict separation of concerns (Cache Engine, Eviction Policy, Log Manager, Event Bus, REST Controller).
- **Testability**: Minimum 85% code coverage across unit, integration, and crash-simulation test suites.
- **Portability**: Completely portable across macOS, Linux, and Windows platforms with no proprietary native dependencies.

---

## 6. System Architecture & Data Design

### In-Memory Hash + Doubly-Linked List Structure
```
       +---------------------------------------------+
       |             Hash Map Index (O(1))           |
       |  Key "user:1"  -->  NodePtr (@0x1A40)       |
       |  Key "sess:8"  -->  NodePtr (@0x2B80)       |
       +---------------------------------------------+
                              |
                              v
    [HEAD] <---> [Node 1: user:1] <---> [Node 2: sess:8] <---> [TAIL]
  (Most Recent)                                              (Least Recent)
```
- **Lookup**: $O(1)$ Hash table points directly to the Node in memory.
- **Update**: Node is spliced out of its current position and inserted right after `HEAD` in $O(1)$ pointer adjustments.
- **Eviction**: Node right before `TAIL` is removed from both the linked list and hash map in $O(1)$.

---

## 7. Verification & Acceptance Criteria

| Criteria ID | Condition | Expected Result | Status |
|---|---|---|---|
| **AC-01** | Cache `PUT` with valid Key and Value | Key stored in Hash map, node added to DLL Head, WAL log appended. | PASS |
| **AC-02** | Cache `GET` for existing valid Key | Returns Value, moves node to DLL Head, emits `CACHE_HIT`. | PASS |
| **AC-03** | Cache `GET` for key whose TTL has elapsed | Node evicted from Hash map & DLL, emits `CACHE_MISS`, returns null. | PASS |
| **AC-04** | Exceed configured capacity limit | Oldest (Tail) entry is evicted, emits `CACHE_EVICTED`. | PASS |
| **AC-05** | Write 100 keys, kill process, restart | Recovery subsystem reads snapshot + WAL, restores all 100 keys. | PASS |
| **AC-06** | Corrupt last 4 bytes of WAL file | Recovery replays valid records, isolates corrupted block, notifies admin. | PASS |
| **AC-07** | UI Theme toggle between Dark and Light | CSS variables update dynamically; preference survives page reload. | PASS |
| **AC-08** | Keyboard shortcut `Cmd+K` pressed | Global Command Palette opens with focus on search input. | PASS |

---
**Approved By:**  
Head of Department, Computer Science & Engineering  
Sardar Patel Institute of Technology, Mumbai
