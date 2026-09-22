# 11. Viva Voce Preparation Guide (40 Questions & Answers)

---

## 1. Core Systems & Memory Caching Fundamentals

### Q1. What is a cache?
* **1-Line Answer**: A high-speed temporary storage layer that stores copies of data for fast subsequent retrieval.
* **Simple Explanation**: It acts like keeping your most-used books on your desk instead of walking to the library shelves every time.
* **Technical Answer**: An auxiliary memory tier placed between a requester and the primary data store that reduces average memory access time (AMAT) by exploiting temporal and spatial locality.
* **Possible Follow-up**: *What is the difference between temporal and spatial locality?*

### Q2. Why is cache used?
* **1-Line Answer**: To drastically reduce read latency and decrease load on slower primary storage systems.
* **Simple Explanation**: Reading from memory takes nanoseconds, while querying a disk database or network API can take tens of milliseconds.
* **Technical Answer**: To bridge the processor-memory and memory-disk performance gaps, mitigating I/O bottlenecks and maximizing request throughput.
* **Possible Follow-up**: *What is cache hit ratio and why does it matter?*

### Q3. Why is RAM fast?
* **1-Line Answer**: RAM uses electronic semiconductor transistors/capacitors accessed directly over a high-bandwidth memory bus without mechanical or block serialization overhead.
* **Simple Explanation**: RAM has no moving parts and directly communicates with the CPU using electric signals in nanoseconds.
* **Technical Answer**: Random Access Memory provides direct word-level addressing with uniform access latency ($10\text{--}100\text{ ns}$), bypassing filesystem drivers, disk scheduling, and OS page cache translations.
* **Possible Follow-up**: *What is the typical latency hierarchy between L1 cache, RAM, NVMe SSD, and HDD?*

### Q4. What does volatile mean?
* **1-Line Answer**: Volatile means memory requires continuous electrical power to maintain its stored state and loses all data upon power loss or process exit.
* **Simple Explanation**: When the computer turns off or the program stops, everything in volatile memory is wiped clean.
* **Technical Answer**: State stored in DRAM cells decays without constant dynamic refresh cycles and is reclaimed by the operating system kernel when the owning process address space is terminated.
* **Possible Follow-up**: *Can a process recover its own heap memory after receiving a `SIGKILL` signal?*

### Q5. What happens to an in-memory cache after a process crash?
* **1-Line Answer**: All cached key-value data is instantly erased from RAM, leaving subsequent queries to fail or suffer cache misses.
* **Simple Explanation**: The memory disappears, causing the application to restart with an empty cache.
* **Technical Answer**: The OS tears down the virtual memory tables of the crashed JVM process. When the application restarts, it experiences a cold cache condition, potentially causing a downstream "cache stampede."
* **Possible Follow-up**: *How does a cache stampede impact a backend database?*

---

## 2. Persistence, Logging & Recovery

### Q6. What is persistence?
* **1-Line Answer**: The ability of a system to store state in non-volatile secondary storage so it survives process restarts and power cycles.
* **Simple Explanation**: Saving your work to a hard disk or SSD so it is still there when you open the computer tomorrow.
* **Technical Answer**: Durability guarantees achieved by flushing serialized state representations to non-volatile media (NVM/SSD/HDD) via POSIX file synchronization primitives (`fsync`).
* **Possible Follow-up**: *What does the 'D' in ACID properties stand for?*

### Q7. What is WAL (Write-Ahead Log)?
* **1-Line Answer**: An append-only disk log where every state-modifying operation is recorded sequentially before being applied to memory.
* **Simple Explanation**: Writing a receipt in a logbook first so that if you faint right after, you know exactly what you did when you wake up.
* **Technical Answer**: A sequential append-only log file providing durability and atomicity. State transitions are committed to disk with sequence numbers and checksums before updating active in-memory data structures.
* **Possible Follow-up**: *Why is sequential disk write significantly faster than random disk write?*

### Q8. Why write to WAL before changing memory?
* **1-Line Answer**: To ensure that acknowledged updates can be reconstructed after a crash; if memory were changed first and the system crashed before disk write, the update would be permanently lost.
* **Simple Explanation**: If you change memory first and crash immediately, you have no record that the client ever gave you the data.
* **Technical Answer**: The "WAL-before-memory invariant" prevents unrecoverable phantom state mutations. Durability is acknowledged to the client only after disk persistence is guaranteed.
* **Possible Follow-up**: *What happens if a write succeeds in WAL but the process crashes before memory update?*

### Q9. What is recovery?
* **1-Line Answer**: The automated process of reading persistent logs and snapshots upon startup to restore the cache to its exact pre-crash state.
* **Simple Explanation**: Replaying the recorded logbook from start to finish when the program boots up.
* **Technical Answer**: The deterministic reconstruction of in-memory data structures by sequentially applying snapshot state followed by idempotent replay of valid WAL log records up to the latest consistent sequence number.
* **Possible Follow-up**: *How do you prevent replaying an operation twice during recovery?*

### Q10. What is a snapshot?
* **1-Line Answer**: A point-in-time serialized copy of the entire active in-memory cache state written to disk.
* **Simple Explanation**: Taking a photograph of all active memory items so you don't have to read thousands of old log entries from the very beginning.
* **Technical Answer**: A compacted checkpoint file containing live key-value pairs at a specific sequence number ($S_n$), allowing previous WAL records prior to $S_n$ to be safely truncated.
* **Possible Follow-up**: *What is log compaction and why is it necessary?*

---

## 3. Cache Lifecycles, Expiration & Eviction

### Q11. What is TTL (Time-To-Live)?
* **1-Line Answer**: A time duration or timestamp indicating how long a cached key-value entry remains valid before expiring.
* **Simple Explanation**: An expiration date on a food item; once the date passes, it is no longer usable.
* **Technical Answer**: A millisecond-precision lifespan associated with a cache entry. After $T_{\text{created}} + \text{TTL} < T_{\text{current}}$, the entry is considered dead and eligible for removal.
* **Possible Follow-up**: *What is the difference between lazy expiration and proactive TTL sweeping?*

### Q12. What is cache eviction?
* **1-Line Answer**: The deliberate removal of valid cache entries when memory capacity is full to make room for new items.
* **Simple Explanation**: Throwing out an old book from a crowded bookshelf to fit a newly bought book.
* **Technical Answer**: A deterministic policy-driven algorithm that selects victim keys for deallocation when the cache exceeds its maximum configured capacity or memory threshold.
* **Possible Follow-up**: *How does eviction differ from TTL expiration?*

### Q13. What is LRU (Least Recently Used)?
* **1-Line Answer**: An eviction algorithm that removes the item that has not been accessed for the longest duration of time.
* **Simple Explanation**: If your desk is full, you remove the book you haven't touched in the longest time.
* **Technical Answer**: An $O(1)$ eviction policy implemented via a hash map combined with a doubly linked list; accessed nodes are shifted to the head (MRU), and evictions occur from the tail (LRU).
* **Possible Follow-up**: *Why is a plain Array inefficient for implementing LRU?*

### Q14. What is LFU (Least Frequently Used)?
* **1-Line Answer**: An eviction algorithm that removes the item with the lowest total access count.
* **Simple Explanation**: Removing the book that has been opened the fewest number of times.
* **Technical Answer**: An $O(1)$ eviction policy utilizing frequency buckets and doubly linked lists to track key access counts, evicting from the lowest non-empty frequency bucket with LRU tie-breaking.
* **Possible Follow-up**: *What is the 'cache frequency pollution' problem in naive LFU implementations?*

---

## 4. Event-Driven Architecture & Observability

### Q15. What is an event-driven system?
* **1-Line Answer**: A software architecture where state transitions generate asynchronous or synchronous event notifications consumed by decoupled observers.
* **Simple Explanation**: Instead of one component doing everything, it announces "this happened!" and other interested parts react on their own.
* **Technical Answer**: A decoupled architectural pattern where producers emit immutable domain events into a broker/bus without direct knowledge of who is listening, promoting single-responsibility and extensibility.
* **Possible Follow-up**: *What are the advantages of loose coupling in event-driven design?*

### Q16. What is an event bus?
* **1-Line Answer**: A centralized publish-subscribe communication channel that routes events from producers to registered listeners.
* **Simple Explanation**: A loudspeaker or notification hub that delivers announcements to everyone subscribed.
* **Technical Answer**: An in-memory dispatcher containing a registry of subscriber callback handlers, coordinating event delivery with queue management and error isolation.
* **Possible Follow-up**: *What is the difference between synchronous and asynchronous event dispatching?*

### Q17. What are metrics?
* **1-Line Answer**: Quantifiable numerical measurements tracking system health, performance, and operational efficiency over time.
* **Simple Explanation**: Gauges and speedometers for your code showing hit rates, total writes, and memory usage.
* **Technical Answer**: Aggregated telemetry data (counters, gauges, timers, percentiles) derived from domain event streams to monitor cache hit ratios, throughput (ops/sec), and p99 latencies.
* **Possible Follow-up**: *Why calculate metrics from an event stream rather than incrementing global counters inside the engine?*

### Q18. Why is audit logging useful?
* **1-Line Answer**: It provides a sequential, immutable record of every mutation for compliance, debugging, and post-mortem analysis.
* **Simple Explanation**: A security camera recording who added, changed, or deleted a key and when.
* **Technical Answer**: An append-only chronological log (e.g., JSON Lines format) capturing actor, timestamp, operation type, key, and version for forensics, compliance, and anomaly detection.
* **Possible Follow-up**: *What is the JSON Lines (JSONL) format and why is it useful for logs?*

---

## 5. Concurrency, Locking & Indexing

### Q19. What is concurrency?
* **1-Line Answer**: The ability of a system to execute multiple computational tasks or threads during overlapping time intervals.
* **Simple Explanation**: Two or more people using the same cache at the exact same moment.
* **Technical Answer**: The interleaved or parallel execution of multiple independent execution threads accessing shared mutable memory structures.
* **Possible Follow-up**: *What is the difference between concurrency and parallelism?*

### Q20. What is a race condition?
* **1-Line Answer**: A concurrency flaw where the final state depends unpredictably on the relative execution timing or order of competing threads.
* **Simple Explanation**: Two people trying to withdraw the last \$100 from an ATM simultaneously without locking the account.
* **Technical Answer**: An anomaly occurring when multiple threads perform uncoordinated read-modify-write operations on shared state without proper memory barriers or synchronization.
* **Possible Follow-up**: *How does Java's `volatile` keyword differ from explicit locking?*

### Q21. What is CAS (Compare-And-Set)?
* **1-Line Answer**: An atomic hardware-supported CPU instruction that updates a variable only if it currently matches an expected value.
* **Simple Explanation**: "Change value to B only if it is still A; if someone changed it to C in the meantime, cancel my change."
* **Technical Answer**: An Optimistic Concurrency Control (OCC) primitive that compares the current version/value with an expected version and conditionally applies the update atomically without holding coarse mutexes.
* **Possible Follow-up**: *What is the ABA problem in CAS operations?*

### Q22. Why might transactions be needed in a cache?
* **1-Line Answer**: To ensure that multi-key updates either succeed completely or fail completely as an all-or-nothing atomic unit.
* **Simple Explanation**: Transferring money from Account A to Account B requires deducting from A and adding to B together; doing only one leaves money lost in transit.
* **Technical Answer**: To guarantee Atomicity and Isolation across multiple dependent keys, buffering writes until commit time and rolling back partial modifications upon failure.
* **Possible Follow-up**: *How does 2-Phase Locking (2PL) prevent dirty reads during transactions?*

### Q23. What is a B-tree / ordered index?
* **1-Line Answer**: A self-balancing search tree data structure optimized for fast range queries and ordered key traversal.
* **Simple Explanation**: A structured phonebook that lets you look up everyone whose name starts between "M" and "P".
* **Technical Answer**: A multi-way balanced tree maintaining sorted keys with $O(\log N)$ search, insertion, and deletion complexity, enabling inclusive prefix scans (`scan(fromKey, toKey)`).
* **Possible Follow-up**: *Why can't a standard Hash Map perform range queries efficiently?*

---

## 6. Academic Positioning & Project Comparison

### Q24. Why not simply use Java's `HashMap`?
* **1-Line Answer**: `HashMap` provides no persistence, crash recovery, TTL, eviction, event bus, or concurrency safety by itself.
* **Simple Explanation**: `HashMap` is just a basic in-memory dictionary; it loses everything on crash and has no monitoring or limits.
* **Technical Answer**: `HashMap` lacks an append-only logging engine, eviction policies, versioned CAS, event dispatching, and thread-safe mutation protocols required for a resilient caching subsystem.
* **Possible Follow-up**: *What happens if multiple threads call `HashMap.put()` concurrently in Java?*

### Q25. Why not simply use Redis?
* **1-Line Answer**: Redis is a standalone production server; our goal is an educational, in-process Java module built from first principles for deep systems learning.
* **Simple Explanation**: We are not trying to replace Redis; we are building our own lightweight module to understand how caching, logging, and recovery work under the hood.
* **Technical Answer**: Redis is an out-of-process C server requiring network socket IPC. Our module is an in-process Java component designed to model systems concepts without native external dependencies.
* **Possible Follow-up**: *What are the latency trade-offs of in-process caching versus out-of-process client-server caching?*

### Q26. What is unique / valuable about this academic project?
* **1-Line Answer**: It unifies five key systems concepts—RAM cache, durable WAL, event bus, bounded eviction, and concurrency—into one inspectable, zero-dependency Java module.
* **Simple Explanation**: It is a transparent, white-box system that students can easily run, crash, recover, test, and benchmark.
* **Technical Answer**: The educational value lies in the holistic integration of database logging theory, operating system file locks, pub-sub architectures, and algorithmic eviction heuristics in clean Java 17.
* **Possible Follow-up**: *How does this project demonstrate separation of concerns?*

---

## 7. Phase I Scope, Progress & Team Division

### Q27. What exactly did you complete in Phase I?
* **1-Line Answer**: Problem definition, literature review of related systems, gap identification, layered system architecture, objectives, and two-week progress roadmap.
* **Simple Explanation**: All theoretical research, requirement analysis, architectural design diagrams, and project planning.
* **Technical Answer**: We formalized the academic problem statement, evaluated trade-offs against HashMaps/Caches/KV stores, mapped out component data flows, and established milestone deliverables.
* **Possible Follow-up**: *Why is Phase I focused on planning and architecture rather than final coding?*

### Q28. What will you implement in Phase II?
* **1-Line Answer**: The core in-memory cache engine, baseline Write-Ahead Log (WAL), recovery replay engine, and baseline unit tests.
* **Simple Explanation**: Getting basic SET, GET, and crash-restart recovery working with automated test cases.
* **Technical Answer**: Implementing `CacheEngine`, `WriteAheadLog` v1, basic `RecoveryManager`, and JUnit test verification of single-key persistence.
* **Possible Follow-up**: *What is the target review date for Phase II? (Answer: 02 Sep 2026).*

### Q29. What is Jay Shinde's primary responsibility?
* **1-Line Answer**: Core Cache Engine, B-Tree ordered indexing, and concurrency control (CAS & key locking).
* **Technical Detail**: Jay designs the in-memory data structures, version tracking for optimistic concurrency, and range scan algorithms.

### Q30. What is Sanchit Gaikwad's primary responsibility?
* **1-Line Answer**: Durability subsystem, Write-Ahead Log (WAL), snapshot compaction, and crash recovery replay.
* **Technical Detail**: Sanchit owns log serialization, CRC32 checksum verification, snapshot creation, and the recovery state machine.

### Q31. What is Nikhil Shelar's primary responsibility?
* **1-Line Answer**: Event Bus, observability metrics, audit logging, eviction algorithms (LRU/LFU), and test harness delivery.
* **Technical Detail**: Nikhil owns the publish-subscribe event infrastructure, JSON Lines audit listener, telemetry calculations, and demo test scripts.

---

## 8. Verification, Failures & Edge Cases

### Q32. How will you demonstrate persistence?
* **1-Line Answer**: By writing keys to the cache, killing the process abruptly, restarting, and verifying that all keys are restored from the WAL.
* **Simple Explanation**: We add items, crash the application, restart it, and show that the items are still there.
* **Technical Answer**: We execute write commands, issue a `SIGKILL` to simulate an ungraceful crash, reboot the module, and observe `RecoveryManager` replaying entries from `wal.log`.
* **Possible Follow-up**: *How do you verify that the restored data is identical to the written data?*

### Q33. How will you demonstrate TTL?
* **1-Line Answer**: By inserting a key with a 3-second TTL, querying it immediately (HIT), waiting 4 seconds, and querying it again (MISS + `TTL_EXPIRED` event).
* **Simple Explanation**: Show that an entry works initially but disappears automatically after its time runs out.
* **Technical Answer**: We demonstrate lazy expiration on read access as well as background sweeper eviction emitting `TTL_EXPIRED` events to the live event viewer.

### Q34. How will you demonstrate eviction?
* **1-Line Answer**: By configuring a small capacity (e.g., 3 entries), filling the cache, adding a 4th entry, and showing that the coldest key is evicted based on LRU or LFU rules.
* **Simple Explanation**: Fill up a 3-item cache and watch the least-used item get pushed out when a 4th is inserted.
* **Technical Answer**: We inspect the live event viewer for `EVICTION` events and verify that the victim key matches the mathematical policy order (LRU tail vs. LFU lowest frequency bucket).

### Q35. How will you prove recovery works?
* **1-Line Answer**: By comparing in-memory state after recovery against a recorded pre-crash manifest and checking CRC32 validation counts.
* **Simple Explanation**: Showing that all keys match their pre-crash values and that the recovery report confirms zero errors.
* **Technical Answer**: The system outputs a `RecoveryReport` indicating: total snapshot records loaded, total WAL entries scanned, valid entries applied, and corrupted records isolated.

### Q36. What happens if the WAL file is corrupted?
* **1-Line Answer**: The `RecoveryManager` catches the CRC32 checksum mismatch, discards the corrupted record, stops replay at that point, and reports the error.
* **Simple Explanation**: The system detects that bytes were tampered with, ignores the broken entry, and keeps all earlier valid data safe.
* **Technical Answer**: Each WAL record contains a CRC32 polynomial checksum. If bit flips or torn writes occur, the calculated checksum differs, causing the recovery engine to isolate the corrupted segment without crashing.
* **Possible Follow-up**: *What is a torn write in operating systems?*

### Q37. What are the limitations of your project?
* **1-Line Answer**: It is a single-node in-process cache without multi-node clustering or distributed consensus.
* **Simple Explanation**: It runs on one machine inside one Java application, not distributed across a network of 50 servers.
* **Technical Answer**: The module does not support distributed replication (Raft/Paxos), sharded clustering, or network protocol parsing (RESP).

### Q38. Is this a distributed cache?
* **1-Line Answer**: No, it is a single-node in-process modular cache designed for local high-throughput and embedded durability.
* **Simple Explanation**: It lives inside the same application process rather than on a remote cluster.
* **Technical Answer**: It is an in-memory Java library module. Single-process architecture eliminates network serialization latency while focusing on intra-node persistence and concurrency.

### Q39. What is the difference between a cache and a database?
* **1-Line Answer**: A cache prioritizes ultra-low-latency temporary data access, while a database is a persistent system of record prioritizing full ACID guarantees and complex querying.
* **Simple Explanation**: A cache is a quick scratchpad for fast lookups; a database is the permanent master storage.
* **Technical Answer**: Databases provide durable relational or document indexing with disk-first durability; caches store transient hot data in RAM to absorb read loads and reduce database query frequency.

### Q40. What happens during SET and GET under the hood?
* **1-Line Answer**: `SET` writes sequentially to the WAL, updates the memory map/index, and emits a `CACHE_PUT` event; `GET` checks memory, validates TTL, and emits a `CACHE_HIT` or `CACHE_MISS` event.
* **Simple Explanation**: `SET` logs to disk first, then stores in RAM, then tells listeners. `GET` reads from RAM immediately, checks if it's expired, and returns the result.
* **Technical Answer**: `SET` executes write-ahead log serialization, flushes to disk, commits to the concurrent map and B-tree, and broadcasts an immutable `CacheEvent`. `GET` executes an $O(1)$ memory lookup, triggers lazy TTL evaluation, updates eviction metadata, and dispatches hit/miss telemetry.
