# SPIT Cache Module — UML Architecture & Design Specifications
## Object-Oriented Modeling & System Schematics
**Institution:** Sardar Patel Institute of Technology (SPIT), Mumbai  
**Department:** Computer Science and Engineering  
**Academic Year:** 2026–27 | **Semester:** V | **Subject:** Mini Project (PR1)  
**Evaluation Category:** Phase 2: Architecture & Design (P2 — UML Diagrams: 5 Marks)  

---

## Table of Contents
1. [Overview of System Modeling](#1-overview-of-system-modeling)
2. [Use Case Diagram & Actor Specifications](#2-use-case-diagram--actor-specifications)
3. [Class Diagram (Core Domain Model)](#3-class-diagram-core-domain-model)
4. [Sequence Diagrams (Runtime Interaction Flows)](#4-sequence-diagrams-runtime-interaction-flows)
   - 4.1 Cache Write & WAL Append Sequence
   - 4.2 Cache Read with TTL Expiry Check Sequence
   - 4.3 Cold Start Crash Recovery Sequence
5. [Activity Diagrams (Process Logic & Control Flow)](#5-activity-diagrams-process-logic--control-flow)
   - 5.1 Cache Insertion & Eviction Pipeline
   - 5.2 Two-Phase Recovery Workflow
6. [Component Diagram (Subsystem Physical Topology)](#6-component-diagram-subsystem-physical-topology)
7. [Design Patterns Employed](#7-design-patterns-employed)

---

## 1. Overview of System Modeling
The unified modeling for the **SPIT Cache Module** illustrates both structural static topologies (classes, components, modules) and dynamic behavioral flows (state transitions, sequence messages, and activity pipelines). All models reflect the actual codebase structure implementing Write-Ahead Logging (WAL), $O(1)$ Hash-Doubly-Linked List Cache Engine, Event Bus subscribers, and Recovery subsystems.

---

## 2. Use Case Diagram & Actor Specifications

### Diagram
```mermaid
flowchart TD
    subgraph Actors
        ClientApp["Client Application / Microservice"]
        DBA["DevOps / System Administrator"]
        TelemetryConsumer["Telemetry / Monitoring Service"]
    end

    subgraph CacheSystem["SPIT Cache Module Boundary"]
        UC1(["PUT Key-Value (with TTL)"])
        UC2(["GET Key Value"])
        UC3(["DELETE Key"])
        UC4(["Inspect Cache Statistics"])
        UC5(["Trigger Checkpoint Snapshot"])
        UC6(["Simulate Crash & Cold Recovery"])
        UC7(["Stream Lifecycle Events"])
        UC8(["Verify WAL Integrity (CRC32)"])
        UC9(["Export Cache / Audit Data"])
    end

    ClientApp --> UC1
    ClientApp --> UC2
    ClientApp --> UC3
    
    DBA --> UC4
    DBA --> UC5
    DBA --> UC6
    DBA --> UC8
    DBA --> UC9

    TelemetryConsumer --> UC7
    TelemetryConsumer --> UC4

    UC1 -.->|<<includes>>| UC8
    UC6 -.->|<<includes>>| UC8
    UC1 -.->|<<emits>>| UC7
    UC2 -.->|<<emits>>| UC7
    UC3 -.->|<<emits>>| UC7
```

### Actor Description
1. **Client Application**: Consumes high-speed cache APIs (`PUT`, `GET`, `DELETE`) to offload primary storage.
2. **DevOps / Administrator**: Interacts with the visual telemetry console to monitor hit/miss ratios, inspect byte-level WAL records, manage backups, and trigger crash recovery simulations.
3. **Telemetry Consumer**: Subscribes to the asynchronous event pipeline to capture system diagnostics and metrics without impacting core cache throughput.

---

## 3. Class Diagram (Core Domain Model)

```mermaid
classDiagram
    class CacheEngine {
        -int capacity
        -Map~String, CacheNode~ index
        -DoublyLinkedList lruList
        -EvictionPolicy evictionPolicy
        -WalManager walManager
        -EventBus eventBus
        -SnapshotStore snapshotStore
        +put(String key, Object value, long ttlMs) boolean
        +get(String key) Object
        +delete(String key) boolean
        +clear() void
        +getStats() CacheMetrics
    }

    class CacheNode {
        -String key
        -Object value
        -long createdAt
        -long expiresAt
        -int accessCount
        -CacheNode prev
        -CacheNode next
        +isExpired() boolean
        +getTtlRemaining() long
    }

    class DoublyLinkedList {
        -CacheNode head
        -CacheNode tail
        -int size
        +moveToHead(CacheNode node) void
        +addToHead(CacheNode node) void
        +removeNode(CacheNode node) void
        +removeTail() CacheNode
    }

    class EvictionPolicy {
        <<interface>>
        +onNodeAccess(CacheNode node) void
        +selectVictim(DoublyLinkedList list) CacheNode
    }

    class LRUEvictionPolicy {
        +onNodeAccess(CacheNode node) void
        +selectVictim(DoublyLinkedList list) CacheNode
    }

    class FIFOEvictionPolicy {
        +onNodeAccess(CacheNode node) void
        +selectVictim(DoublyLinkedList list) CacheNode
    }

    class WalManager {
        -File walFile
        -FileChannel channel
        -long currentLsn
        +appendRecord(WalOpcode opcode, String key, byte[] val) long
        +readAllRecords() List~WalRecord~
        +truncateBeforeLsn(long lsn) void
    }

    class WalRecord {
        -long lsn
        -long timestamp
        -WalOpcode opcode
        -String key
        -byte[] payload
        -long crc32Checksum
        +verifyChecksum() boolean
        +serialize() byte[]
        +static deserialize(ByteBuffer buf) WalRecord
    }

    class SnapshotStore {
        -File snapshotFile
        +saveSnapshot(Map~String, CacheNode~ state, long snapshotLsn) void
        +loadSnapshot() SnapshotMetadata
    }

    class RecoveryManager {
        -WalManager walManager
        -SnapshotStore snapshotStore
        +performRecovery(CacheEngine engine) RecoverySummary
    }

    class EventBus {
        -List~EventListener~ listeners
        -ExecutorService dispatchPool
        +publish(CacheEvent event) void
        +subscribe(EventType type, EventListener listener) void
    }

    CacheEngine --> CacheNode : maintains
    CacheEngine --> DoublyLinkedList : manages
    CacheEngine --> EvictionPolicy : uses
    CacheEngine --> WalManager : logs to
    CacheEngine --> EventBus : publishes to
    CacheEngine --> SnapshotStore : persists via
    DoublyLinkedList --> CacheNode : links
    EvictionPolicy <|.. LRUEvictionPolicy : implements
    EvictionPolicy <|.. FIFOEvictionPolicy : implements
    WalManager --> WalRecord : serializes/deserializes
    RecoveryManager --> WalManager : replays
    RecoveryManager --> SnapshotStore : restores
```

### Class Responsibility & Relationships
- **`CacheEngine`**: Facade and coordinator for in-memory operations, thread coordination, and storage subcomponents.
- **`DoublyLinkedList` & `CacheNode`**: Maintains $O(1)$ node insertion, removal, and head repositioning.
- **`EvictionPolicy` (Strategy Pattern)**: Decouples eviction decision logic from the core cache engine.
- **`WalManager`**: Handles append-only disk logging with byte-level CRC32 trailer serialization.
- **`RecoveryManager`**: Orchestrates two-phase crash reconstitution (Snapshot load followed by log replay).
- **`EventBus` (Observer Pattern)**: Dispatches non-blocking lifecycle notifications to telemetry consumers.

---

## 4. Sequence Diagrams (Runtime Interaction Flows)

### 4.1 Cache Write & WAL Append Sequence
```mermaid
sequenceDiagram
    autonumber
    actor Client as Client / API
    participant Cache as CacheEngine
    participant WAL as WalManager
    participant Disk as Persistent Log File
    participant DLL as DoublyLinkedList
    participant Bus as EventBus

    Client->>Cache: put(key, value, ttlMs)
    Note over Cache: Check capacity. If full, evict Tail.
    opt Capacity Exceeded
        Cache->>DLL: removeTail()
        DLL-->>Cache: victimNode
        Cache->>WAL: appendRecord(OP_EVICT, victimNode.key, null)
        WAL->>Disk: write(WalRecord + CRC32)
        Cache->>Bus: publish(CACHE_EVICTED)
    end

    Cache->>WAL: appendRecord(OP_SET, key, value)
    WAL->>WAL: calculateCRC32(payload)
    WAL->>Disk: writeSync(record)
    Disk-->>WAL: LSN confirmed
    WAL-->>Cache: lsnNumber

    Cache->>DLL: addToHead(newNode)
    Cache->>Cache: update HashMap index
    Cache->>Bus: publish(CACHE_PUT, key, lsn)
    Cache-->>Client: Success (Status 200 / true)
```

---

### 4.2 Cache Read with TTL Expiry Check Sequence
```mermaid
sequenceDiagram
    autonumber
    actor Client as Client / API
    participant Cache as CacheEngine
    participant Node as CacheNode
    participant DLL as DoublyLinkedList
    participant Bus as EventBus

    Client->>Cache: get(key)
    Cache->>Cache: index.get(key)
    
    alt Key not in index
        Cache->>Bus: publish(CACHE_MISS, key)
        Cache-->>Client: null (Miss)
    else Key exists in index
        Cache->>Node: isExpired(currentTime)
        alt Key has Expired
            Cache->>DLL: removeNode(node)
            Cache->>Cache: index.remove(key)
            Cache->>Bus: publish(TTL_EXPIRED, key)
            Cache->>Bus: publish(CACHE_MISS, key)
            Cache-->>Client: null (Miss / Expired)
        else Key is Valid (Not Expired)
            Cache->>DLL: moveToHead(node)
            Cache->>Bus: publish(CACHE_HIT, key)
            Cache-->>Client: node.value (Hit)
        end
    end
```

---

### 4.3 Cold Start Crash Recovery Sequence
```mermaid
sequenceDiagram
    autonumber
    actor System as Application Bootloader
    participant Recovery as RecoveryManager
    participant Snapshot as SnapshotStore
    participant WAL as WalManager
    participant Cache as CacheEngine

    System->>Recovery: performRecovery(engine)
    Recovery->>Snapshot: loadSnapshot()
    alt Snapshot exists
        Snapshot-->>Recovery: {snapshotLsn, Map<Key, Value>}
        Recovery->>Cache: bulkLoad(snapshotState)
        Note over Recovery: State initialized to Snapshot LSN
    else No snapshot found
        Recovery->>Recovery: baseline snapshotLsn = 0
    end

    Recovery->>WAL: readAllRecords()
    WAL-->>Recovery: List<WalRecord>
    
    loop Each WalRecord where LSN > snapshotLsn
        Recovery->>Recovery: verifyCRC32(record)
        alt Checksum Valid
            Recovery->>Cache: applyMutation(record.opcode, record.key, record.value)
        else Checksum Corrupted (Partial Write)
            Recovery->>Recovery: isolateBadBlock()
            Note over Recovery: Abort log replay at first corrupted record
        end
    end

    Recovery-->>System: RecoverySummary (restoredKeys, lastValidLsn)
```

---

## 5. Activity Diagrams (Process Logic & Control Flow)

### 5.1 Cache Insertion & Eviction Pipeline
```mermaid
stateDiagram-v2
    [*] --> ReceivePutRequest: put(key, value, ttl)
    ReceivePutRequest --> ValidatePayload: Check key != null & size <= Limit
    
    state ValidatePayload {
        [*] --> CheckValid
        CheckValid --> InvalidPayload: Length > Threshold
        CheckValid --> ValidPayload: Passed checks
    }

    InvalidPayload --> [*]: Return Error (IllegalArgument)

    ValidPayload --> CheckExistingKey: Does key exist in HashMap?
    
    state CheckExistingKey {
        [*] --> Found: Yes
        [*] --> NotFound: No
    }

    Found --> UpdateExistingNode: Update value, expiresAt
    UpdateExistingNode --> MoveToHead: Move node to DLL Head
    
    NotFound --> CheckCapacity: size >= capacity?
    CheckCapacity --> EvictTail: Yes (Capacity full)
    CheckCapacity --> AllocateNewNode: No (Capacity available)

    EvictTail --> RemoveTailDLL: DLL.removeTail()
    RemoveTailDLL --> RemoveTailHash: HashMap.remove(tailKey)
    RemoveTailHash --> AppendEvictWAL: WAL.append(OP_EVICT)
    AppendEvictWAL --> AllocateNewNode: Insert new node

    AllocateNewNode --> InsertHeadDLL: DLL.addToHead(node)
    InsertHeadDLL --> InsertHashMap: HashMap.put(key, node)
    
    MoveToHead --> WriteWAL: Append OP_SET to WAL
    InsertHashMap --> WriteWAL: Append OP_SET to WAL
    
    WriteWAL --> ComputeCRC32: Calculate 32-bit CRC
    ComputeCRC32 --> FlushToDisk: fsync append-only file
    FlushToDisk --> EmitEvent: EventBus.publish(CACHE_PUT)
    EmitEvent --> [*]: Return Success (true)
```

---

### 5.2 Two-Phase Recovery Workflow
```mermaid
stateDiagram-v2
    [*] --> InitRecovery: Boot Sequence Triggered
    InitRecovery --> LocateSnapshot: Check snapshot.bin in data/
    
    state LocateSnapshot {
        [*] --> SnapshotFound: File present & readable
        [*] --> SnapshotMissing: File absent
    }

    SnapshotFound --> LoadSnapshotFile: Read binary header & payload
    LoadSnapshotFile --> PopulateCacheMap: Reconstitute keys in Memory
    PopulateCacheMap --> SetCheckpointLSN: Set checkpointLsn = snapshot.lsn
    
    SnapshotMissing --> SetZeroLSN: Set checkpointLsn = 0

    SetCheckpointLSN --> OpenWALFile: Open wal.log
    SetZeroLSN --> OpenWALFile: Open wal.log

    state OpenWALFile {
        [*] --> ScanRecords: Sequential File Scan
    }

    ScanRecords --> FilterLSN: Is record.lsn > checkpointLsn?
    FilterLSN --> CheckCRC32: Yes
    FilterLSN --> ScanRecords: No (Skip already snapshotted)

    state CheckCRC32 {
        [*] --> ValidCRC: CRC matched
        [*] --> InvalidCRC: Bit-rot / Partial Write
    }

    ValidCRC --> ReplayOperation: Execute OP_SET / OP_DEL on Cache
    ReplayOperation --> ScanRecords: Next record
    
    InvalidCRC --> LogCorruptedRecord: Log Warning & LSN
    LogCorruptedRecord --> CompleteRecovery: Halt replay at corrupt boundary

    ScanRecords --> CompleteRecovery: EOF Reached
    CompleteRecovery --> EmitRecoveryEvent: EventBus.publish(RECOVERY_COMPLETED)
    EmitRecoveryEvent --> [*]: Engine Ready for Traffic
```

---

## 6. Component Diagram (Subsystem Physical Topology)

```mermaid
flowchart TB
    subgraph ClientLayer["Presentation & Client Layer"]
        ReactUI["Vite + React Dashboard Console\n(Modern Obsidian / Slate Themes)"]
        CLIClient["Java CLI Terminal Tool\n(edu.spit.cache.cli)"]
        CurlClient["External REST / HTTP Clients"]
    end

    subgraph ServiceLayer["Service & Interface Layer"]
        HttpGateway["REST API Gateway / Controllers\n(/api/cache, /api/events, /api/wal)"]
        EventStreamer["WebSocket / SSE Telemetry Streamer"]
    end

    subgraph CoreEngine["Core Storage Engine Subsystem"]
        CacheFacade["Cache Engine Facade"]
        HashIndex["Concurrent Hash Map Index"]
        LRUList["Doubly-Linked List Manager"]
        TTLWorker["Active TTL Expiration Sweeper"]
        EventBusSubsys["Decoupled Async Event Bus"]
    end

    subgraph PersistenceLayer["Durability & Storage Subsystem"]
        WalEngine["Write-Ahead Log (WAL) Engine\n(CRC32 Checksum Trailer)"]
        SnapshotEngine["Binary Snapshot Manager\n(Point-in-Time Checkpointer)"]
        RecoveryEngine["Two-Phase Recovery Coordinator"]
    end

    subgraph PhysicalStorage["Physical Disk Storage (OS File System)"]
        WalDisk[("data/wal.log\n(Append-Only Log)")]
        SnapshotDisk[("data/snapshot.bin\n(Point-in-Time State)")]
        AuditDisk[("data/audit.log\n(Telemetry Audit Trail)")]
    end

    ReactUI -->|HTTP / JSON| HttpGateway
    CLIClient -->|Method Invocation| CacheFacade
    CurlClient -->|HTTP REST| HttpGateway

    HttpGateway --> CacheFacade
    HttpGateway --> EventStreamer
    EventBusSubsys --> EventStreamer

    CacheFacade --> HashIndex
    CacheFacade --> LRUList
    CacheFacade --> TTLWorker
    CacheFacade --> EventBusSubsys
    CacheFacade --> WalEngine
    CacheFacade --> SnapshotEngine

    RecoveryEngine --> WalEngine
    RecoveryEngine --> SnapshotEngine
    RecoveryEngine --> CacheFacade

    WalEngine --> WalDisk
    SnapshotEngine --> SnapshotDisk
    EventBusSubsys --> AuditDisk
```

---

## 7. Design Patterns Employed
1. **Facade Pattern**: `CacheEngine` provides a unified, simple programmatic interface hiding internal complexities of hash indexing, doubly-linked list node splicing, WAL serialization, and event dispatching.
2. **Strategy Pattern**: `EvictionPolicy` defines an abstract interface implemented by `LRUEvictionPolicy`, `FIFOEvictionPolicy`, and `LFUEvictionPolicy`, allowing dynamic runtime swapping.
3. **Observer Pattern**: `EventBus` facilitates loose coupling between the high-throughput cache execution path and downstream telemetry consumers (metrics aggregator, audit logger, dashboard SSE emitter).
4. **Memento Pattern**: `SnapshotStore` captures and externalizes the cache's internal state without violating encapsulation, allowing restoration to a point-in-time state.
5. **Chain of Responsibility**: Handlers in the write pipeline (Validation $\rightarrow$ WAL serialization $\rightarrow$ In-memory update $\rightarrow$ Event notification).
