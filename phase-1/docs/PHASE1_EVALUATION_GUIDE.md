# PHASE 1 EVALUATION & PRESENTATION GUIDE FOR FACULTY / SUPERVISOR

This guide provides a step-by-step walkthrough for presenting your **Phase 1 Mini Project Deliverable** to your project supervisor (**Prof. Suhas Kakade**) and evaluation panel.

---

## 1. The 2-Minute Pitch

> "Good morning Sir,
> 
> Our project is the **Persistent Event-Driven Memory Cache Module**.
> 
> **The Problem We Addressed in Phase 1:**  
> standard in-memory caches like HashMaps or Redis-in-RAM are fast, but if a process crashes or loses power, all unpersisted data vanishes.
> 
> **Our Phase 1 Solution:**  
> We implemented **Write-Ahead Logging (WAL)** in Java 17. Every mutation (`SET`, `DELETE`) is checksummed with **CRC32** and written to disk BEFORE updating memory.
> 
> **What We Built in Phase 1 (Weeks 1–3 Work):**
> 1. Core thread-safe memory cache (`ConcurrentHashMap`).
> 2. Append-only checksummed Write-Ahead Logging for durability.
> 3. Automatic crash recovery replay on restart.
> 4. Event Bus for hit/miss and write metrics.
> 5. Interactive CLI shell and 8 automated unit & integration tests.
> 
> **Next Phases (Roadmap):**  
> LRU/LFU eviction policies (Phase 2), Multi-key Transactions & B-Tree index (Phase 3).
> 
> Thank you, Sir."

---

## 2. Live Demonstration Script for "Sir"

Follow these commands step-by-step during the evaluation meeting:

### Step 1: Run Verification Tests
In terminal, navigate to `phase-1/` and run:
```bash
make verify
```
*Point out to Sir:* "Sir, all 8 unit and integration tests compile cleanly under Java 17 with strict `-Werror` flags and pass 100%."

---

### Step 2: Start Interactive CLI
Launch the shell:
```bash
make run
```

---

### Step 3: Insert Data (Demonstrating WAL append)
Type:
```text
SET user:101 Jay
SET user:102 Sanchit
SET user:103 Nikhil
```
*Point out to Sir:* "Every write is appended to `data/phase1_demo_wal.log` with a CRC32 checksum before memory is updated."

---

### Step 4: Verify Cache Lookups & Metrics
Type:
```text
GET user:101
METRICS
```
*Point out to Sir:* "Retrieves value 'Jay' in O(1) time and updates hit metrics via our event bus."

---

### Step 5: Live Process Crash & Recovery Demo
Type:
```text
CRASH
```
*What happens:*
- The CLI wipes all in-memory keys (`Active Keys count = 0`).
- The `RecoveryManager` reads the WAL file, verifies CRC32 checksums, and replays all operations.
- Data is 100% restored (`Active Keys count = 3`).

*Explain to Sir:* "Even if RAM is completely wiped during a crash, our WAL replay reconstructs the exact state with zero data loss."

---

### Step 6: Query Restored Data
Type:
```text
GET user:101
STATUS
EXIT
```
*Explain to Sir:* "Data survived the simulated crash!"
