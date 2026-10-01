# SPIT Cache Module — Algorithm Design & Specifications
## Detailed Algorithmic Workflows, Pseudocode, and Complexity Analysis
**Institution:** Sardar Patel Institute of Technology (SPIT), Mumbai  
**Department:** Computer Science and Engineering  
**Academic Year:** 2026–27 | **Semester:** V | **Subject:** Mini Project (PR1)  
**Evaluation Category:** Phase 2: Architecture & Design (P3 — Algorithm Design / Prototype: 5 Marks)  

---

## Table of Contents
1. [Core Architectural Constants & Data Structures](#1-core-architectural-constants--data-structures)
2. [Algorithm 1: Cache Insertion (PUT) with Capacity & Eviction Handling](#2-algorithm-1-cache-insertion-put-with-capacity--eviction-handling)
3. [Algorithm 2: Cache Retrieval (GET) with Passive Lazy Expiration](#3-algorithm-2-cache-retrieval-get-with-passive-lazy-expiration)
4. [Algorithm 3: Least Recently Used (LRU) Eviction in O(1)](#4-algorithm-3-least-recently-used-lru-eviction-in-o1)
5. [Algorithm 4: Active TTL Sweeper Daemon](#5-algorithm-4-active-ttl-sweeper-daemon)
6. [Algorithm 5: Write-Ahead Log (WAL) Append with CRC32 Trailer](#6-algorithm-5-write-ahead-log-wal-append-with-crc32-trailer)
7. [Algorithm 6: Atomic Snapshot Creation & Log Compaction](#7-algorithm-6-atomic-snapshot-creation--log-compaction)
8. [Algorithm 7: Two-Phase Crash Recovery with Fault Isolation](#8-algorithm-7-two-phase-crash-recovery-with-fault-isolation)
9. [Algorithm 8: Decoupled Asynchronous Event Dispatching](#9-algorithm-8-decoupled-asynchronous-event-dispatching)
10. [Asymptotic Complexity Summary Table](#10-asymptotic-complexity-summary-table)

---

## 1. Core Architectural Constants & Data Structures

### Primary Data Structures
- **Hash Table (`index`)**: Maps string `key` $\rightarrow$ `CacheNode` pointer for $O(1)$ amortized lookup.
- **Doubly-Linked List (`DLL`)**: Sentinel nodes `HEAD` (Most Recently Used) and `TAIL` (Least Recently Used).
- **Node Fields**: `key`, `value`, `createdAt`, `expiresAt`, `accessCount`, `prev`, `next`.
- **WAL Log Channel**: Sequential append-only file stream descriptor.

---

## 2. Algorithm 1: Cache Insertion (PUT) with Capacity & Eviction Handling

### Objective
Insert or update a key-value pair, enforce capacity constraints through $O(1)$ LRU eviction if full, record the mutation to the Write-Ahead Log, and notify event subscribers.

### Pseudocode
```python
ALGORITHM CachePut(key: String, value: Any, ttlMs: Long) -> Boolean:
    INPUT: key (non-null string), value (serializable payload), ttlMs (duration in ms, 0 for infinite)
    OUTPUT: Boolean indicating operation success

    ACQUIRE write_lock
    TRY:
        now <- CurrentTimeMillis()
        expiresAt <- (ttlMs > 0) ? (now + ttlMs) : INFINITY
        
        # Step 1: Check if key already exists in hash index
        IF index.CONTAINS_KEY(key) THEN:
            node <- index.GET(key)
            node.value <- value
            node.expiresAt <- expiresAt
            node.accessCount <- node.accessCount + 1
            
            # Reposition to Head (Most Recently Used)
            DLL.REMOVE_NODE(node)
            DLL.ADD_TO_HEAD(node)
            
            # Step 2: Append update mutation to WAL
            lsn <- WalManager.APPEND(OPCODE_UPDATE, key, value, expiresAt)
            EventBus.PUBLISH(EventType.CACHE_UPDATE, key, value, lsn)
            RETURN TRUE
        END IF

        # Step 3: Check capacity bounds
        IF index.SIZE() >= MAX_CAPACITY THEN:
            # Evict Least Recently Used element (Node right before TAIL sentinel)
            victimNode <- DLL.REMOVE_TAIL()
            index.REMOVE(victimNode.key)
            
            # Record eviction in WAL
            evictLsn <- WalManager.APPEND(OPCODE_EVICT, victimNode.key, NULL, 0)
            EventBus.PUBLISH(EventType.CACHE_EVICTED, victimNode.key, evictLsn)
        END IF

        # Step 4: Allocate and insert new CacheNode
        newNode <- ALLOCATE CacheNode(key, value, now, expiresAt)
        DLL.ADD_TO_HEAD(newNode)
        index.PUT(key, newNode)

        # Step 5: Append to WAL and publish event
        lsn <- WalManager.APPEND(OPCODE_SET, key, value, expiresAt)
        EventBus.PUBLISH(EventType.CACHE_PUT, key, value, lsn)
        RETURN TRUE

    FINALLY:
        RELEASE write_lock
END ALGORITHM
```

### Time & Space Complexity
- **Time Complexity**: $O(1)$ amortized for hash lookup, $O(1)$ node pointer manipulation, $O(1)$ sequential disk append.
- **Space Complexity**: $O(1)$ per insertion; $O(N)$ overall auxiliary space for $N$ entries.

---

## 3. Algorithm 2: Cache Retrieval (GET) with Passive Lazy Expiration

### Objective
Fetch a value associated with `key`. If the key exists but its TTL has expired, immediately purge it from the cache (lazy cleanup) and return a cache miss.

### Pseudocode
```python
ALGORITHM CacheGet(key: String) -> Any:
    INPUT: key (String)
    OUTPUT: Stored value or NULL if key does not exist / expired

    ACQUIRE read_or_write_lock
    TRY:
        # Step 1: Query Hash Index
        IF NOT index.CONTAINS_KEY(key) THEN:
            EventBus.PUBLISH(EventType.CACHE_MISS, key)
            RETURN NULL
        END IF

        node <- index.GET(key)
        now <- CurrentTimeMillis()

        # Step 2: Passive Lazy Expiration Check
        IF now >= node.expiresAt THEN:
            # Entry has expired; perform immediate lazy cleanup
            DLL.REMOVE_NODE(node)
            index.REMOVE(key)
            
            WalManager.APPEND(OPCODE_EXPIRE, key, NULL, 0)
            EventBus.PUBLISH(EventType.TTL_EXPIRED, key)
            EventBus.PUBLISH(EventType.CACHE_MISS, key)
            RETURN NULL
        END IF

        # Step 3: Valid Cache Hit - Promote to MRU (Head)
        DLL.REMOVE_NODE(node)
        DLL.ADD_TO_HEAD(node)
        node.accessCount <- node.accessCount + 1

        EventBus.PUBLISH(EventType.CACHE_HIT, key, node.value)
        RETURN node.value

    FINALLY:
        RELEASE read_or_write_lock
END ALGORITHM
```

### Time Complexity
- $O(1)$ lookup + $O(1)$ node relocation = $O(1)$ overall.

---

## 4. Algorithm 3: Least Recently Used (LRU) Eviction in O(1)

### Double-Linked List Manipulation Flow
```
Before Eviction:
[HEAD] <---> [Node A] <---> [Node B] <---> [Node C (Victim)] <---> [TAIL]

Step 1: victim = TAIL.prev
Step 2: TAIL.prev = victim.prev
Step 3: victim.prev.next = TAIL
Step 4: victim.prev = NULL; victim.next = NULL
Step 5: index.remove(victim.key)

After Eviction:
[HEAD] <---> [Node A] <---> [Node B] <---> [TAIL]
```

### Pseudocode
```python
ALGORITHM RemoveTail() -> CacheNode:
    IF TAIL.prev == HEAD THEN:
        RETURN NULL  # List is empty
    END IF

    victim <- TAIL.prev
    TAIL.prev <- victim.prev
    victim.prev.next <- TAIL

    victim.prev <- NULL
    victim.next <- NULL
    RETURN victim
END ALGORITHM
```

---

## 5. Algorithm 4: Active TTL Sweeper Daemon

### Objective
Prevent dead keys that are never read again from permanently occupying memory space. An active background thread randomly samples keys and removes expired entries.

### Pseudocode
```python
ALGORITHM ActiveTtlSweeperDaemon(sampleSize: Integer, maxKeysToEvict: Integer):
    WHILE isRunning:
        SLEEP(SWEEP_INTERVAL_MS)  # Default: 1000ms
        
        ACQUIRE write_lock
        TRY:
            totalKeys <- index.KEY_SET()
            IF totalKeys.IS_EMPTY() THEN CONTINUE
            
            sampledKeys <- SELECT_RANDOM(totalKeys, sampleSize)
            now <- CurrentTimeMillis()
            expiredCount <- 0

            FOR key IN sampledKeys:
                node <- index.GET(key)
                IF node != NULL AND now >= node.expiresAt THEN:
                    DLL.REMOVE_NODE(node)
                    index.REMOVE(key)
                    WalManager.APPEND(OPCODE_EXPIRE, key, NULL, 0)
                    EventBus.PUBLISH(EventType.TTL_EXPIRED, key)
                    expiredCount <- expiredCount + 1
                    
                    IF expiredCount >= maxKeysToEvict THEN BREAK
                END IF
            END FOR
        FINALLY:
            RELEASE write_lock
    END WHILE
END ALGORITHM
```

---

## 6. Algorithm 5: Write-Ahead Log (WAL) Append with CRC32 Trailer

### Objective
Guarantee persistence across crashes by sequentially writing mutations to disk with a CRC32 checksum before acknowledging the transaction.

### Record Serialization Format
```
[2B Magic: 0x5350] [8B LSN] [1B Opcode] [8B Timestamp] [2B KeyLen] [KeyBytes] [4B ValLen] [ValBytes] [4B CRC32]
```

### Pseudocode
```python
ALGORITHM WalAppend(opcode: Byte, key: String, value: Bytes, expiresAt: Long) -> Long:
    INPUT: opcode (SET=1, DEL=2, UPDATE=3, EVICT=4, EXPIRE=5), key, value, expiresAt
    OUTPUT: Unique Log Sequence Number (LSN)

    ACQUIRE wal_lock
    TRY:
        currentLsn <- currentLsn + 1
        timestamp <- CurrentTimeMillis()
        
        # Serialize header and payload into byte buffer
        buffer <- ALLOCATE_BYTE_BUFFER()
        buffer.PUT_SHORT(0x5350)              # Magic bytes 'SP'
        buffer.PUT_LONG(currentLsn)           # 8 Bytes
        buffer.PUT_BYTE(opcode)               # 1 Byte
        buffer.PUT_LONG(timestamp)            # 8 Bytes
        buffer.PUT_LONG(expiresAt)            # 8 Bytes
        
        keyBytes <- UTF8_ENCODE(key)
        buffer.PUT_SHORT(keyBytes.LENGTH)     # 2 Bytes
        buffer.PUT_BYTES(keyBytes)
        
        valBytes <- (value != NULL) ? value : EMPTY_BYTES
        buffer.PUT_INT(valBytes.LENGTH)       # 4 Bytes
        buffer.PUT_BYTES(valBytes)
        
        # Compute CRC32 over all serialized bytes so far
        payloadBytes <- buffer.ARRAY_SLICE(0, buffer.POSITION)
        crc32Checksum <- CALCULATE_CRC32(payloadBytes)
        
        # Append CRC32 at the end (4 Bytes)
        buffer.PUT_INT(crc32Checksum)
        
        # Flush to persistent file channel
        walFileChannel.WRITE(buffer)
        walFileChannel.FORCE(FALSE)           # Synchronous OS page-cache flush
        
        RETURN currentLsn
    FINALLY:
        RELEASE wal_lock
END ALGORITHM
```

---

## 7. Algorithm 6: Atomic Snapshot Creation & Log Compaction

### Objective
Create a durable point-in-time image of the cache to disk and truncate obsolete WAL records.

### Pseudocode
```python
ALGORITHM CreateSnapshotAndCompact() -> SnapshotSummary:
    ACQUIRE read_lock
    TRY:
        snapshotLsn <- WalManager.GET_CURRENT_LSN()
        now <- CurrentTimeMillis()
        
        # Collect snapshot of non-expired entries
        snapshotEntries <- NEW_LIST()
        FOR (key, node) IN index.ENTRIES():
            IF node.expiresAt > now THEN:
                snapshotEntries.ADD({
                    key: node.key,
                    value: node.value,
                    createdAt: node.createdAt,
                    expiresAt: node.expiresAt
                })
            END IF
        END FOR
    FINALLY:
        RELEASE read_lock

    # Write snapshot to temporary file first (atomic file pattern)
    tmpSnapshotFile <- File("data/snapshot.tmp")
    targetSnapshotFile <- File("data/snapshot.bin")

    FileOutputStream(tmpSnapshotFile).USE(stream -> {
        WriteSnapshotHeader(stream, snapshotLsn, snapshotEntries.SIZE())
        FOR entry IN snapshotEntries:
            SerializeEntry(stream, entry)
        ComputeAndWriteChecksum(stream)
        stream.FLUSH_AND_FSYNC()
    })

    # Atomic file rename ensures no partial snapshot corruption
    ATOMIC_FILE_MOVE(tmpSnapshotFile, targetSnapshotFile)

    # Log compaction: Truncate WAL records up to snapshotLsn
    WalManager.TRUNCATE_BEFORE_LSN(snapshotLsn)
    EventBus.PUBLISH(EventType.SNAPSHOT_CREATED, snapshotLsn, snapshotEntries.SIZE())

    RETURN SnapshotSummary(snapshotLsn, snapshotEntries.SIZE())
END ALGORITHM
```

---

## 8. Algorithm 7: Two-Phase Crash Recovery with Fault Isolation

### Objective
Restore cache state to the exact state before a system crash by loading the latest verified snapshot, replaying all valid WAL mutations up to the crash point, and safely isolating any partially-written corrupted records.

### Pseudocode
```python
ALGORITHM RecoverEngineState(engine: CacheEngine) -> RecoveryReport:
    report <- RecoveryReport()
    checkpointLsn <- 0

    # Phase 1: Load Point-in-Time Snapshot
    snapshotFile <- File("data/snapshot.bin")
    IF snapshotFile.EXISTS() THEN:
        TRY:
            snapshot <- SnapshotStore.READ_AND_VERIFY(snapshotFile)
            checkpointLsn <- snapshot.lsn
            
            FOR entry IN snapshot.entries:
                IF entry.expiresAt > CurrentTimeMillis() THEN:
                    engine.RESTORE_NODE(entry.key, entry.value, entry.expiresAt)
                    report.restoredFromSnapshotCount <- report.restoredFromSnapshotCount + 1
                END IF
            END FOR
            report.snapshotFound <- TRUE
        CATCH CorruptedSnapshotException e:
            LogWarning("Snapshot checksum failure. Falling back to complete WAL replay.")
            checkpointLsn <- 0
    END IF

    # Phase 2: Sequential WAL Replay
    walFile <- File("data/wal.log")
    IF NOT walFile.EXISTS() THEN:
        RETURN report
    END IF

    walStream <- OpenWalInputStream(walFile)
    WHILE NOT walStream.EOF():
        TRY:
            record <- walStream.READ_NEXT_RECORD()
            
            # Skip records already included in snapshot
            IF record.lsn <= checkpointLsn THEN:
                CONTINUE
            END IF

            # Verify integrity
            computedCrc <- CALCULATE_CRC32(record.payloadBytes)
            IF computedCrc != record.crc32 THEN:
                # Bit-rot or incomplete disk flush at crash boundary
                LogWarning("Corruption at LSN " + record.lsn + ". Aborting remaining replay.")
                report.corruptedRecordsIsolated <- report.corruptedRecordsIsolated + 1
                BREAK
            END IF

            # Apply mutation to cache engine
            SWITCH record.opcode:
                CASE OPCODE_SET:
                CASE OPCODE_UPDATE:
                    IF record.expiresAt > CurrentTimeMillis() THEN:
                        engine.RESTORE_NODE(record.key, record.value, record.expiresAt)
                        report.replayedRecordsCount <- report.replayedRecordsCount + 1
                    END IF
                CASE OPCODE_DEL:
                CASE OPCODE_EVICT:
                CASE OPCODE_EXPIRE:
                    engine.REMOVE_KEY_INTERNAL(record.key)
                    report.replayedRecordsCount <- report.replayedRecordsCount + 1
            END SWITCH

            report.lastRecoveredLsn <- record.lsn

        CATCH PartialRecordException e:
            # Incomplete tail record caused by hard power-loss
            LogWarning("Incomplete record at EOF detected. Cleanly truncating log tail.")
            BREAK
    END WHILE

    EventBus.PUBLISH(EventType.RECOVERY_COMPLETED, report)
    RETURN report
END ALGORITHM
```

---

## 9. Algorithm 8: Decoupled Asynchronous Event Dispatching

### Objective
Dispatch cache lifecycle events to downstream subscribers (metrics counters, web console SSE streams, audit logging) without holding cache locks or introducing latency to client read/write paths.

### Pseudocode
```python
ALGORITHM PublishEventAsync(eventType: EventType, key: String, metadata: Map):
    event <- CacheEvent(
        id: GenerateUUID(),
        timestamp: CurrentTimeMillis(),
        type: eventType,
        key: key,
        metadata: metadata
    )
    
    # Non-blocking ring buffer or executor queue offer
    enqueued <- asyncDispatchQueue.OFFER(event)
    IF NOT enqueued THEN:
        DropCountMetric.INCREMENT()
        LogWarning("Event dispatch queue saturated; telemetry sample dropped.")
    END IF
END ALGORITHM

WORKER ThreadPoolDispatcher:
    WHILE isRunning:
        event <- asyncDispatchQueue.POLL()
        subscribers <- subscriberRegistry.GET(event.type)
        FOR subscriber IN subscribers:
            TRY:
                subscriber.ON_EVENT(event)
            CATCH Exception e:
                LogError("Subscriber failed to process event: " + e.getMessage())
            END TRY
        END FOR
    END WHILE
END WORKER
```

---

## 10. Asymptotic Complexity Summary Table

| Operation / Algorithm | Average Time Complexity | Worst-Case Time Complexity | Space Complexity | Notes / Bottleneck |
|---|---|---|---|---|
| **Cache Lookup (GET)** | $O(1)$ | $O(1)$ | $O(1)$ | Hash lookup + DLL pointer update |
| **Cache Insert (PUT)** | $O(1)$ | $O(1)$ | $O(1)$ | Node allocation + DLL head move |
| **LRU Tail Eviction** | $O(1)$ | $O(1)$ | $O(1)$ | Direct pointer unlink at tail |
| **Passive TTL Expiration** | $O(1)$ | $O(1)$ | $O(1)$ | Triggered inline on GET check |
| **Active TTL Sweeper** | $O(K)$ | $O(K)$ | $O(1)$ | $K$ = sample size (bounded constant) |
| **WAL Record Append** | $O(1)$ | $O(1)$ amortized | $O(1)$ | Sequential write with CRC32 |
| **Snapshot Checkpoint** | $O(N)$ | $O(N)$ | $O(N)$ | $N$ = count of active cache keys |
| **Two-Phase Crash Recovery** | $O(S + W)$ | $O(S + W)$ | $O(S)$ | $S$ = snapshot keys, $W$ = WAL records |
| **Event Dispatch** | $O(1)$ | $O(1)$ | $O(1)$ | Non-blocking ring-buffer enqueue |
