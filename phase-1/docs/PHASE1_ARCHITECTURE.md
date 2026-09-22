# PHASE 1 ARCHITECTURE & DESIGN DOCUMENTATION

## 1. Overview & System Design

The Phase 1 Persistent Memory Cache Module is built around three core architectural guarantees:
1. **Low-Latency Reads:** In-memory access using `ConcurrentHashMap`.
2. **Durability Guarantee:** Append-only Write-Ahead Log (WAL) written before memory mutation.
3. **Observability & Decoupling:** Event-driven notification bus driving metric calculations.

---

## 2. Write-Ahead Log (WAL) Record Specification

Each line in the WAL file represents a single mutation operation formatted as:
```text
<sequence>|<timestamp>|<operation>|<key>|<value>|<expiresAtEpochMillis>|<checksum>
```

### Fields:
- `sequence`: Monotonically increasing 64-bit integer.
- `timestamp`: System time in milliseconds when written.
- `operation`: `PUT`, `DELETE`, or `CLEAR`.
- `key`: UTF-8 key string (empty string for `CLEAR`).
- `value`: UTF-8 value string (empty string for `DELETE` or `CLEAR`).
- `expiresAtEpochMillis`: Absolute expiration timestamp in ms (`0` if no TTL).
- `checksum`: CRC32 integer calculated over `<sequence>|<timestamp>|<operation>|<key>|<value>|<expiresAtEpochMillis>`.

---

## 3. Critical Write Execution Flow

```text
Client Call -> Phase1CacheService
                   │
                   ├── 1. Format WalRecord with CRC32
                   ├── 2. Append & Force-Flush to WAL File (Disk)
                   ├── 3. Update CacheEngine In-Memory HashMap
                   └── 4. Publish Event to EventBus subscribers (Metrics)
```

---

## 4. Crash Recovery Replay Algorithm

On JVM initialization or `RECOVER` execution:
1. Open the specified `.wal` file.
2. Read line by line.
3. Parse each record and verify the CRC32 checksum.
   - If checksum is valid, add record to valid list.
   - If checksum is invalid (corrupted by unexpected power outage during write), log error, increment `corruptedCount`, and skip the line.
4. Sort valid records by sequence number.
5. Apply records sequentially to an empty `CacheEngine` instance.
6. Purge any entries whose TTL has passed relative to current clock.
7. System state is restored to the exact point prior to crash.
