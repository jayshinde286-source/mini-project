# 01. Problem Definition

---

## 1. Introduction: Speed vs. Volatility

In modern computing, Random Access Memory (RAM) provides microsecond-level data access speeds ($10 \text{ to } 100 \text{ ns}$ latency) compared to solid-state or magnetic persistent storage ($10 \text{ µs to } 10 \text{ ms}$ latency). For this reason, modern applications rely heavily on in-memory caches to reduce database load, minimize read latency, and handle high throughput.

However, RAM is fundamentally **volatile**:
* RAM requires continuous electrical power to retain its capacitive/transistor state.
* Operating system processes allocate memory in virtual address spaces that are reclaimed immediately when a process terminates, crashes, or is killed by the OS (e.g., via `SIGKILL` or out-of-memory errors).
* When a process restarts, it begins with an entirely empty memory space.

---

## 2. The Core Problem Illustrated

Consider a simple application caching user session information:

```text
[Client] ──── SET user:101 "Jay" ────► [In-Memory Cache (RAM)]
                                            │
                                            ▼
                                  Key: "user:101"
                                  Value: "Jay"
                                  (Stored exclusively in RAM)
```

At this moment:
1. The key-value pair `user:101 -> "Jay"` is available instantaneously in memory for subsequent `GET` requests.
2. If an unexpected power outage, kernel panic, JVM crash, or unhandled runtime failure occurs at $T_1$, the process terminates abruptly.
3. Upon restarting at $T_2$, a fresh instance of the application cannot recover `user:101` from RAM. The entire state is lost.

```text
[System Crash / Process Restart]
               │
               ▼
[New Cache Instance in RAM]
       Key: "user:101" ───► MISS (NULL) ───► Cache Stampede / Data Loss!
```

---

## 3. Seven Fundamental Problems in Simple In-Memory Implementations

Simple in-memory cache implementations (such as a standard `java.util.HashMap` or uncoordinated memory structures) suffer from the following seven core engineering flaws:

### 1. Volatile Memory
Memory contents disappear when power ceases or when the operating system reclaims process memory. Without a secondary storage strategy, memory cannot guarantee durability.

### 2. Complete Loss of Cached State
When the host application restarts (e.g., during rolling deployments, system maintenance, or unexpected crashes), all warmed cache state is lost. Downstream databases or backends experience a sudden "cache stampede" as thousands of concurrent requests hit the backing store simultaneously.

### 3. Uncontrolled Crash and Restart Behaviour
In the absence of a structured recovery protocol, restarting an application leaves the cache in a cold, uninitialized state. There is no automated mechanism to determine the last valid acknowledged state prior to the crash.

### 4. Partial / Torn Updates
If an operation modifies multiple cache entries or if an update is interrupted halfway by a crash, the cache may be left in an inconsistent intermediate state where some keys reflect the update while dependent keys do not.

### 5. Lack of Operational Visibility & Auditability
Basic memory collections operate as "black boxes." They do not publish events or notify external components when entries are inserted, modified, evicted, or expired. System administrators cannot inspect real-time cache mutations, hit/miss ratios, or reconstruct an audit trail of changes.

### 6. Stale Data & Memory Exhaustion
Without fine-grained Time-To-Live (TTL) expiration and bounded eviction policies (such as Least Recently Used - LRU or Least Frequently Used - LFU), obsolete entries linger indefinitely, resulting in memory leaks and `OutOfMemoryError` conditions.

### 7. Concurrent Update Anomaly & Race Conditions
When multiple concurrent threads execute read-modify-write cycles (e.g., check-then-act or update counters), uncoordinated writes lead to lost updates, phantom writes, and race conditions unless explicit versioning or atomic compare-and-set (CAS) mechanisms are enforced.

---

## 4. Central Research & Design Question

To address these interconnected challenges, this project investigates and answers the following research question:

> **"How can we combine RAM-level speed with persistence, recovery and event-driven monitoring?"**

---

## 5. Formal Academic Problem Statement

> **Problem Statement:**  
> *"To design, model, and implement a lightweight, modular, and dependency-free in-memory cache subsystem in Java that maintains high-throughput and low-latency key-value operations in volatile memory, while guaranteeing crash resilience through append-only Write-Ahead Logging (WAL) and snapshots, providing real-time operational visibility via an ordered event bus, enforcing bounded memory lifetimes through TTL and eviction policies, and preventing data inconsistency during concurrent access."*
