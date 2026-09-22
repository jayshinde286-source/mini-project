# 10. Planned Demonstration Strategy (Future Phases)

---

## 1. Demonstration Philosophy & Educational Objective

The goal of our demonstration in later phases is to make the internal systems mechanics of the cache completely transparent, visual, and demonstrable to examiners and students.

> **IMPORTANT SCOPE NOTE:**  
> The interactive web interface and visual dashboard described below represent the **Planned Demonstration Blueprint** for subsequent phases. In Phase I, we define the demonstration scenarios, UI wireframe concepts, and validation protocols.

---

## 2. Conceptual Demonstration Architecture

```text
┌────────────────────────────────────────────────────────────────────────────┐
│                       PLANNED DEMO ARCHITECTURE                            │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│   [ Visual Web Dashboard / Browser UI / Interactive CLI Client ]          │
│                                    │                                       │
│                                    ▼ HTTP / WebSocket / stdin              │
│   [ Java Cache Service Backend (Embedded HTTP/REST Handler) ]              │
│                                    │                                       │
│                                    ▼ In-Process Method Calls               │
│   [ Persistent Event-Driven Memory Cache Module ]                          │
│     ├── Core Memory Engine (Key-Value + B-Tree)                            │
│     ├── Write-Ahead Log (WAL on Disk) + CRC32                              │
│     ├── Event Bus + Circular Event Journal (Real-Time Stream)              │
│     └── Recovery Manager (Crash Replay Engine)                             │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Planned Visual Dashboard Layout

The future demonstrator interface will present four synchronized panels:

```
┌───────────────────────────────────────────────────────────────────────────┐
│              PERSISTENT EVENT-DRIVEN MEMORY CACHE DASHBOARD               │
├───────────────────────────────────────────────────────────────────────────┤
│ [SYSTEM STATUS: ONLINE]  [ACTIVE ENTRIES: 4]  [HIT RATE: 87.5%]           │
│ [WAL STATUS: SYNCED]     [MEMORY: 1.2 MB]     [RECOVERED KEYS: 4]         │
├─────────────────────────────────────┬─────────────────────────────────────┤
│  PANEL A: CACHE OPERATIONS          │  PANEL B: LIVE CACHE STATE (RAM)    │
│  [Key]   [_______________________]  │  ┌──────┬────────┬───────┬────────┐ │
│  [Value] [_______________________]  │  │ KEY  │ VALUE  │ TTL   │ VER    │ │
│  [TTLms] [_______________________]  │  ├──────┼────────┼───────┼────────┤ │
│  [ SET ]  [ GET ]  [ DELETE ]       │  │ u:101│ Jay    │ 60s   │ v1     │ │
│  [ CAS Update ]  [ Begin Tx ]       │  │ u:102│ Nikhil │ None  │ v1     │ │
│  ---------------------------------- │  │ u:103│ Sanchit│ 30s   │ v2     │ │
│  [ 💥 SIMULATE SUDDEN CRASH ]       │  └──────┴────────┴───────┴────────┘ │
├─────────────────────────────────────┼─────────────────────────────────────┤
│  PANEL C: LIVE EVENT VIEWER (STREAM)│  PANEL D: PERSISTENCE & METRICS     │
│  [11:00:01] CACHE_PUT key=u:101     │  WAL File: data/wal.log (248 bytes) │
│  [11:00:04] CACHE_HIT key=u:101     │  Last Checkpoint: None              │
│  [11:00:09] TTL_EXPIRED key=u:103   │  CRC32 Validations: 14 Passed, 0 Err│
│  [11:00:15] EVICTION policy=LRU     │  Avg Latency: 0.04 ms               │
└─────────────────────────────────────┴─────────────────────────────────────┘
```

---

## 4. Seven-Step Crash & Recovery Demonstration Scenario

To prove that the cache successfully combines RAM speed with crash durability, the live demonstration will follow this exact 7-step test protocol:

```text
Step 1: Write Data
        User enters: SET user:101 "Jay", SET user:102 "Nikhil", SET user:103 "Sanchit"
        -> Display shows 3 active keys in memory.
        -> WAL file size increases on disk.
        -> Event viewer shows 3 CACHE_PUT events.

Step 2: Verify In-Memory State
        User clicks GET user:101.
        -> Instant retrieval from RAM (Event: CACHE_HIT).

Step 3: Simulate Sudden Process Crash
        User presses "💥 SIMULATE SUDDEN CRASH" or issues SIGKILL to the JVM.
        -> JVM process dies abruptly.
        -> System Status switches to OFFLINE.
        -> RAM contents are completely wiped by the operating system.

Step 4: Restart Cache Subsystem
        Application is launched afresh.
        -> A new clean JVM initializes with an empty heap.

Step 5: Execute Automated Recovery
        RecoveryManager initializes:
        1. Checks for binary snapshots (none found on clean start).
        2. Opens WAL file `wal.log`.
        3. Reads each record sequentially, verifies CRC32 checksums.
        4. Replays operations into the in-memory engine.

Step 6: Confirm Restored Entries
        System Status returns to ONLINE.
        -> Live cache table automatically populates with:
           user:101 ("Jay"), user:102 ("Nikhil"), and user:103 ("Sanchit").

Step 7: Verify Recovery Telemetry & Proof
        Event viewer displays: RECOVERY event (3 entries restored in 1.4 ms).
        -> Examiner is shown the on-disk WAL binary structure and CRC32 verification logs.
```

---

## 5. Additional Planned Interactive Scenarios

1. **TTL Expiration Demonstration**:
   * Set `temp:token` with TTL = 5 seconds.
   * Observe key active in table.
   * After 5 seconds, query key -> triggers `TTL_EXPIRED` event and removal.
2. **LRU vs. LFU Eviction Demonstration**:
   * Set capacity limit to 3.
   * Add 3 entries, perform reads to alter access frequency and recency.
   * Add 4th entry -> observe exact evicted key according to the active algorithm.
3. **Corruption Isolation Demonstration**:
   * Deliberately flip bytes in the WAL file using a hex editor.
   * Trigger recovery -> verify that `RecoveryManager` catches CRC32 mismatch, isolates corruption, and logs an alert without crashing the JVM.
