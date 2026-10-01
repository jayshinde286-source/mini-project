# SPIT Cache Module — Master Viva Defense & Technical Interview Script (`CHAT.md`)
## Realistic Conversational Dialogue Between Faculty Examiner & Student Team
**Institution:** Sardar Patel Institute of Technology (SPIT), Andheri (W), Mumbai  
**Department:** Computer Science and Engineering  
**Academic Year:** 2026–27 | **Semester:** V / VI | **Subject:** Mini Project (PR1)  

---

### Participants:
* **👨‍🏫 Professor / External Examiner**: Senior Faculty Evaluator, SPIT CSE Department
* **👨‍💻 Jay Shinde (Candidate / Lead Developer)**: Student presenting the SPIT Cache Module (UID: `2024800115`)
* **👥 Team Members**: Nikhil Shelar (`2024800113`), Sanchit Gaikwad (`2024800029`)
* **👨‍🏫 Faculty Guide**: Prof. Suhas Kakade

---

## Act 1: The Opening Pitch & Problem Statement

**👨‍🏫 Professor:**  
Good morning, team. I see your project title is *"SPIT Cache Module: Persistent Event-Driven In-Memory Cache"*. In simple terms, what is this project, and why did you build it instead of just using MySQL, MongoDB, or Redis?

**👨‍💻 Jay Shinde:**  
Good morning, Sir. In high-traffic systems like IRCTC during Tatkal hours or Amazon flash sales, querying a relational database for every request causes severe disk I/O bottlenecks—queries take 20 to 50 milliseconds. 

To solve this, developers put an in-memory cache in front. But traditional volatile caches like Memcached or standard Redis without append-only configuration have a fatal flaw: **if the process crashes, the server loses power, or an OS panic occurs, 100% of cached sessions, cart items, and tokens disappear instantly.** 

When thousands of users reconnect, all their requests hit the database at the exact same instant. This is known as a **Cache Stampede** or **Thundering Herd**, and it brings down the entire database infrastructure.

We built the **SPIT Cache Module** to solve this exact trade-off. It provides **microsecond-level in-memory retrieval ($< 5\mu\text{s}$)** using an $O(1)$ Hash Map and Doubly-Linked List, backed by **synchronous Write-Ahead Logging (WAL) with 32-bit CRC data integrity**, **point-in-time state snapshots**, and an **automated two-phase crash recovery manager** that restores the cache in under 5 milliseconds upon reboot.

---

## Act 2: Architecture & Data Structures ($O(1)$ Mechanics)

**👨‍🏫 Professor:**  
Okay, let's talk data structures. How do you implement Least Recently Used (LRU) eviction, and what is its time complexity?

**👨‍💻 Jay Shinde:**  
Sir, our in-memory engine achieves strictly **$O(1)$ time complexity for lookup, insertion, and eviction**. 
We achieve this by coupling two data structures:
1. A **Hash Map Index (`Map`)**: Provides $O(1)$ amortized key-to-node pointer lookups.
2. A **Doubly-Linked List (`DoublyLinkedList`)**: Maintains the recency ordering of keys.

Whenever an entry is read or updated, we splice its node from its current position and move it to the `HEAD` sentinel (Most Recently Used). When the cache hits its maximum capacity (configured to 50 entries by default), the node immediately preceding the `TAIL` sentinel (`tail.prev`) is the Least Recently Used entry. We unlink it from the list and delete it from the hash index in $O(1)$ time.

**👨‍🏫 Professor:**  
Why did you use dummy sentinel `HEAD` and `TAIL` nodes instead of simple pointers?

**👨‍💻 Jay Shinde:**  
Sentinels eliminate edge-case boundary checks. Without sentinels, inserting into an empty list or deleting the last remaining node requires multiple `if (head == null)` or `if (node.next == null)` conditions. With permanent `HEAD` and `TAIL` sentinels, `head.next` and `tail.prev` are always valid object references. This prevents NullPointerExceptions and reduces conditional branching overhead.

---

## Act 3: Write-Ahead Logging (WAL) & Durability Guarantees

**👨‍🏫 Professor:**  
Explain Write-Ahead Logging (WAL). When a client sends a `SET` request, what happens first: memory update or disk write?

**👨‍💻 Jay Shinde:**  
The **disk write MUST happen first**, Sir. That is the fundamental rule of the Write-Ahead Logging protocol:
1. We first assign a monotonically increasing 64-bit **Log Sequence Number (LSN)**.
2. We serialize the record containing: magic bytes (`SP`), `lsn`, `timestamp`, `opcode: "SET"`, `key`, `value`, and `ttlSeconds`.
3. We compute an **IEEE 802.3 32-bit Cyclic Redundancy Check (CRC32)** over the serialized payload.
4. We append the record to `data/wal.log` and invoke `fsync` (`fs.fdatasyncSync`) to flush OS page caches to physical storage.
5. **Only after the disk flush confirms success** do we insert the node into the in-memory Doubly-Linked List and Hash Map index.

If we updated memory first and the power cut occurred before the disk write, the client would have received an HTTP 200 success response for data that does not exist on disk, violating ACID durability ($RPO = 0$).

**👨‍🏫 Professor:**  
Why do you need CRC32? Isn't checking if the file exists enough?

**👨‍💻 Jay Shinde:**  
No, Sir. If a server loses power while writing a 200-byte record, the hard drive might only flush the first 80 bytes. The remaining bytes are truncated or filled with zeroes (known as a **torn write** or **partial flush**). 
Furthermore, storage media can suffer from silent bit-rot. 
The 32-bit CRC polynomial (`0xEDB88320`) calculates an 8-character hex checksum over the record bytes. During cold recovery, we recalculate the CRC for every record. If a single bit was corrupted or torn mid-write, the checksum fails, the bad block is cleanly isolated, and recovery halts safely without ingesting corrupt data.

---

## Act 4: Snapshots & Log Compaction

**👨‍🏫 Professor:**  
If your cache runs for a month, `wal.log` will have millions of lines. Won't the disk run out of space and cold recovery take 30 minutes?

**👨‍💻 Jay Shinde:**  
Exactly, Sir! That is why we implemented **Point-in-Time Checkpoint Snapshots and Log Compaction**.
Periodically, or when triggered via `/api/wal/snapshot`:
1. The engine captures all active, non-expired keys at the current LSN $K$.
2. It writes them to a temporary file (`snapshot.bin.tmp`), flushes to disk, and uses atomic file renaming (`fs.renameSync`) to swap it to `snapshot.bin`. This is the **Safe Write-and-Swap Pattern**—if power fails during snapshot writing, the existing valid snapshot remains undamaged.
3. Once the snapshot is verified, the `WalManager` performs **Log Compaction**: it truncates and removes all historical WAL records with $LSN \le K$, because their cumulative state is already safely stored in `snapshot.bin`.

This bounds disk usage and keeps cold recovery under 5 milliseconds.

---

## Act 5: Crash Recovery Walkthrough

**👨‍🏫 Professor:**  
Walk me through what happens when your server restarts after a dirty crash (`kill -9`).

**👨‍💻 Jay Shinde:**  
Our `RecoveryManager` executes a deterministic **Two-Phase Recovery Sequence**:
- **Phase 1 (Snapshot Restoration)**: 
  It checks if `snapshot.bin` exists. If present, it verifies the header checksum, restores all saved key-value pairs into the in-memory Hash Map and Doubly-Linked List, and sets `checkpointLsn = snapshot.checkpointLsn`.
- **Phase 2 (Forward WAL Replay)**:
  It opens `wal.log` and scans forward. It skips all records with $LSN \le checkpointLsn$ (since they are already in the snapshot). For every record with $LSN > checkpointLsn$, it verifies the CRC32 checksum. If valid, it reapplies the mutation (`SET`, `UPDATE`, `DEL`, `EVICT`) to memory.
  If an invalid CRC is encountered, it logs a diagnostic warning, isolates the corrupted record, and completes recovery up to the last verified boundary.

The entire process finishes before the HTTP port opens, so clients never observe a cold cache or inconsistent state.

---

## Act 6: Live Demonstration & UI/UX Walkthrough

**👨‍🏫 Professor:**  
Show me the application running. What features did you implement in the frontend?

**👨‍💻 Jay Shinde:**  
*(Opens browser at `http://localhost:5174` or the Netlify deployment)*:
Here is our management console, Sir:
1. **Commercial Dual-Theme Design System**: We built an **Obsidian Dark** (`#0a0f1d`) and **Clean Slate Light** (`#f8fafc`) theme with semantic accents (Indigo, Cyan, Emerald, Amber, Rose) using CSS custom properties.
2. **Dashboard KPIs & Charts**: Real-time metrics showing Total Requests, Hit Rate Donut, Memory Footprint in bytes, and a custom SVG Activity timeline with linear gradient curves.
3. **Cache Table with Bulk Operations**:
   - Let me click **"Load Sample Data"**: 5 realistic enterprise keys appear instantly (`auth:jwt:u101`, `inventory:sku:iphone15`, etc.).
   - Notice the **dynamic TTL progress bars** shifting from Green ($>50\%$) to Orange to Red as expiration counts down.
   - Let me click the **Eye icon** on a key: this opens the **Key Inspector Modal**, displaying the raw byte-size estimate, access hits, version LSN, and pretty-printed JSON with a Copy button.
   - We also have **Row Selection Checkboxes** allowing Bulk Delete and Export to JSON/CSV.
4. **Global Command Palette**: If I press **`Cmd + K`**, the spotlight modal opens, allowing instant keyboard search and navigation across all views.
5. **Keyboard Shortcuts**: Pressing **`?`** opens the complete keyboard shortcuts cheat sheet, and pressing number keys **`1` through `7`** jumps directly between tabs.

---

## Act 7: The "Kill -9" Live Test (Grilling on Fault Tolerance)

**👨‍🏫 Professor:**  
*(Pointing at screen)*: You have 10 keys in the cache right now. Prove to me your persistence actually works. Kill the backend right now.

**👨‍💻 Jay Shinde:**  
Gladly, Sir! Let's navigate to the **Recovery** tab (or press key **`5`**).
1. Look at the Active Entries counter: it shows 10 active keys.
2. I click **"Simulate Dirty Crash"**: 
   The volatile memory is wiped—active keys drop to **0**.
3. But our disk files (`wal.log` and `snapshot.bin`) remain intact on disk.
4. Now, I click **"Execute Cold Recovery"**:
   Look at the diagnostic log:
   - Phase 1 loads the snapshot.
   - Phase 2 validates all CRC32 checksums and replays post-snapshot WAL mutations.
   - In **1 millisecond**, all 10 keys are reconstituted with their exact values, hit counts, and remaining TTLs!

---

## Act 8: Event Bus & Server-Sent Events (SSE)

**👨‍🏫 Professor:**  
How does the web console update in real time? Are you constantly polling the backend with `setInterval`?

**👨‍💻 Jay Shinde:**  
No, Sir! Polling wastes CPU cycles and network bandwidth. We implemented a **Decoupled Asynchronous Event Bus with Server-Sent Events (SSE)** at `/api/events/stream`:
- When any cache mutation occurs, `EventBus.publish()` dispatches an event (`CACHE_HIT`, `CACHE_PUT`, `CACHE_EVICTED`, `TTL_EXPIRED`) asynchronously using `setImmediate()`.
- The HTTP server holds an open SSE connection to the client browser and immediately pushes `data: JSON(event)\n\n`.
- This ensures real-time updates without polling and without holding the cache lock on read/write threads.

---

## Act 9: Git Best Practices & Project Evaluation Rubric

**👨‍🏫 Professor:**  
How did you organize your Git repository and commits for the Phase 3 evaluation?

**👨‍💻 Jay Shinde:**  
We adhered strictly to the **Git Flow branching strategy** and **Conventional Commits v1.0.0**:
- **`main`**: Protected branch containing only verified, passing code with release tags.
- **`develop`**: Central integration branch.
- **`feature/*`**: Dedicated branches for isolated modules (`feature/wal-crc32`, `feature/lru-eviction`, `feature/command-palette`).
- Every commit follows semantic prefixing:
  - `feat(wal): implement IEEE 802.3 CRC32 trailer serialization`
  - `fix(recovery): resolve bad block isolation boundary at EOF`
  - `docs(phase3): write 100 viva questions and answers`
  - `test(engine): add automated crash simulation assertion`

---

## Act 10: Future Scope & Phase 4 Roadmap

**👨‍🏫 Professor:**  
What are the limitations of your current system, and what is your plan for Phase 4?

**👨‍💻 Jay Shinde:**  
Currently, the SPIT Cache Module is a single-node engine bounded by the host machine's RAM and single-drive write IOPS.
For Phase 4, we have compiled a formal **Phase 4 Engineering Roadmap PDF** (`Phase_4_Roadmap.pdf`) covering three pillars:
1. **Raft Distributed Consensus**: Replicating the WAL log across a 3-to-5 node cluster with automated leader election and quorum commits.
2. **Consistent Hashing**: A 32-bit hash ring with 128 virtual nodes for horizontal key sharding across nodes.
3. **Redis RESP3 Wire Protocol Adapter**: A raw TCP listener on port 6379, allowing standard Redis clients (`redis-cli`, Jedis, `redis-py`) to use SPIT Cache as a drop-in persistent replacement without rewriting backend code.

---

## Act 11: Examiner Verdict & Scoring Summary

**👨‍🏫 Professor:**  
Excellent work, Jay and team. Your implementation covers everything from low-level pointer splicing in doubly-linked lists to byte-level CRC checksumming, atomic file swapping, clean REST and SSE APIs, and a commercial-grade UI with full documentation.

### Final Marks Recommended:
* **Phase 2 Architecture & Design**: **25 / 25 Marks**
  - *P1: SRS (IEEE 830)*: 10/10
  - *P2: UML Diagrams*: 5/5
  - *P3: Algorithm Design / Prototype*: 5/5
  - *P4: Presentation*: 5/5
* **Phase 3 Implementation**: **25 / 25 Marks**
  - *P1: Module-wise Coding*: 10/10
  - *P2: Git Repository Setup*: 5/5
  - *P3: Git Branching & Commit Conventions*: 5/5
  - *P4: Live Presentation & Defense*: 5/5

**Total Score: 50 / 50 Marks (Full Marks)**
