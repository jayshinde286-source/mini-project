# Persistent Event-Driven Memory Cache Module

[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen)](#)
[![Tests](https://img.shields.io/badge/Tests-34%2F34%20Passed-success)](#testing--verification)
[![Node](https://img.shields.io/badge/Node.js-v18%2B-green)](#)
[![Java](https://img.shields.io/badge/Java-17%2B-orange)](#)
[![Live Dashboard](https://img.shields.io/badge/Live%20Console-Netlify-00c7b7)](https://spit-cache-module-2026.netlify.app/)
[![GitHub Repo](https://img.shields.io/badge/GitHub-Repository-blue?logo=github)](https://github.com/jayshinde286-source/mini-project)

A high-throughput, memory-resident key-value storage engine engineered to combine the microsecond retrieval speeds of in-memory caching with strict persistence, crash resilience, and distributed consensus.

---

### 🌐 Live Production Links
* 🚀 **Live Web Console:** [https://spit-cache-module-2026.netlify.app/](https://spit-cache-module-2026.netlify.app/)
* 📦 **GitHub Repository:** [https://github.com/jayshinde286-source/mini-project](https://github.com/jayshinde286-source/mini-project)

### Engineering Team & Supervision
* **Jay Shinde** (UID: `2024800115`) — Core Storage Engine, WAL Durability & Web Console
* **Nikhil Shelar** (UID: `2024800113`) — EventBus Dispatcher, TTL Indexing & LRU Splicing
* **Sanchit Gaikwad** (UID: `2024800029`) — Crash Recovery Pipeline, Audit Chaining & Benchmarking
* **Faculty Guide:** **Prof. Suhas Kakade** (Department of Computer Engineering, SPIT Mumbai)

---

## Architecture Overview

```mermaid
flowchart TD
    Client[Client Application / Redis CLI / Web UI] --> Gateway[API Gateway & Rate Limiter]
    
    subgraph Core Engine
        Gateway --> Engine[In-Memory Cache Engine]
        Engine --> HashMap[Hash Map Index O(1)]
        Engine --> DLL[Doubly-Linked List LRU]
    end

    subgraph Durability Pipeline
        Gateway --> WAL[Append-Only Write-Ahead Log]
        WAL --> Fsync[POSIX fdatasync / CRC32 Integrity]
        WAL --> Snapshot[Periodic Point-in-Time Snapshot]
        Snapshot --> Recovery[Two-Phase Crash Recovery Pipeline]
    end

    subgraph Distributed Consensus
        Gateway --> Coordinator[Cluster Coordinator]
        Coordinator --> Raft[3-Node Raft Consensus]
        Coordinator --> HashRing[32-bit Consistent Hash Ring]
        Coordinator --> RespServer[Redis RESP3 TCP Socket Server :6379]
    end

    subgraph Observability
        Engine --> EventBus[Decoupled Event Bus]
        EventBus --> Audit[SHA-256 Tamper-Evident Audit Chain]
        EventBus --> WebConsole[Real-Time Web Dashboard]
    end
```

The system strictly enforces a **Write-Ahead Logging** contract:
1. Operations are validated and sanitized against injection and prototype pollution.
2. The mutation is recorded to the append-only WAL on disk with a 32-bit CRC checksum.
3. The mutation is committed into volatile RAM memory and indexed in $O(1)$.
4. An immutable domain event is published asynchronously to event subscribers.

---

## Key System Features

### 1. In-Memory Engine & $O(1)$ LRU Eviction
* **Hash Table + Doubly-Linked List:** Average $O(1)$ lookup, insert, and delete operations.
* **Sentinel Nodes:** Head and tail sentinels eliminate branch checks during node promotion.
* **Strict 4-Pointer Splicing:** Relocates cache hit nodes to MRU head in 4 pointer assignments.
* **Dual Expiration:** Passive lazy expiration upon access combined with an active background sweeper running at 1000ms intervals.

### 2. Durability & Two-Phase Crash Recovery
* **Append-Only WAL:** Every state transition is written to disk before memory acknowledgement.
* **CRC32 Data Integrity:** Detects silent data corruption or truncated writes during unexpected server shutdown.
* **Atomic Snapshots:** Point-in-time binary state serialization enabling safe WAL log compaction.
* **Cold Boot Recovery:** Rebuilds active cache state from the latest snapshot followed by log replay in $< 10\text{ms}$.

### 3. Distributed Raft Consensus & Sharding
* **3-Node Raft State Machine:** Active leader election, follower heartbeats (200ms), and quorum log replication ($Q = \lfloor N/2 \rfloor + 1$).
* **32-Bit Consistent Hash Ring:** 128 virtual nodes per physical node (384 slots) for uniform key partitioning without full-cluster rehashing.
* **Chaos Engineering Sandbox:** Built-in fault injection enabling simulated split-brain partitions and automated failover verification.

### 4. Native Redis Wire Protocol (RESP3)
* Pure TCP socket server listening on port `6379`.
* Wire-compatible with official `redis-cli`, Jedis, Lettuce, `ioredis`, and `redis-py`.
* Native command support: `PING`, `SET`, `GET`, `DEL`, `EXISTS`, `DBSIZE`, `INFO`, `CLUSTER NODES`.

---

## Quick Start & Execution

### 1. Prerequisites
* **Node.js** v18.0.0 or higher
* **Java 17** or higher (optional, for Phase 1 JVM engine)

### 2. Clone & Launch Backend Server
```bash
# Clone the repository
git clone https://github.com/jayshinde286-source/mini-project.git
cd mini-project

# Launch the backend engine (REST API on :8080, Redis TCP on :6379)
node Phase_3/backend/src/server.js
```

### 3. Launch Frontend Web Console
In a separate terminal:
```bash
# Serve the compiled production dashboard
python3 -m http.server 3000 --directory Phase2/dist
```
Open **`http://localhost:3000`** in any modern web browser.

### 4. Connect via Redis CLI
```bash
redis-cli -p 6379 PING
# Output: PONG

redis-cli -p 6379 SET cluster:demo:key "Hello SPIT Cache" EX 120
# Output: OK

redis-cli -p 6379 GET cluster:demo:key
# Output: "Hello SPIT Cache"
```

---

## REST API Specification

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Live system uptime, memory usage, and security status |
| `GET` | `/api/cache` | Retrieve all active in-memory cache entries |
| `POST` | `/api/cache` | Insert or update a cache entry (`key`, `value`, `ttlSeconds`) |
| `GET` | `/api/cache/:key` | Retrieve a specific cache entry (Cache Hit / Miss) |
| `DELETE` | `/api/cache/:key` | Invalidate and purge key with WAL tombstone |
| `GET` | `/api/wal` | Read verified Write-Ahead Log records and LSNs |
| `POST` | `/api/wal/snapshot` | Trigger an atomic point-in-time snapshot checkpoint |
| `POST` | `/api/recovery/crash-simulate` | Simulate dirty memory crash (purges RAM heap) |
| `POST` | `/api/recovery/execute` | Execute two-phase recovery from persistent disk storage |
| `GET` | `/api/cluster/status` | Live Raft cluster topology, leader, terms, and quorum status |
| `GET` | `/api/cluster/ring` | 32-bit consistent hash ring slots and vnode allocation |
| `GET` | `/api/cluster/route/:key` | Resolve deterministic hash ring slot and physical node for a key |
| `POST` | `/api/cluster/chaos/partition` | Inject network partition / isolate a cluster node |
| `POST` | `/api/cluster/chaos/heal` | Heal network split and restore consensus quorum |
| `GET` | `/api/cluster/resp/status` | Redis RESP3 TCP socket server status and metrics |

---

## Testing & Verification

The repository includes a comprehensive, automated test battery covering core data structures, durability pipelines, security sanitization, and distributed consensus.

Run all test suites:
```bash
# 1. Phase 3 Backend & Crash Recovery Tests
node Phase_3/tests/run_tests.js

# 2. Enterprise Security & Cryptographic Audit Tests
node Phase_3/tests/security_tests.js

# 3. Phase 4 Raft Consensus & Redis Protocol Tests
node Phase_3/tests/test_phase4.js
```

**Verification Results:**
* **Engine & Durability:** 17 / 17 tests passed (100%)
* **Security & Input Sanitization:** 9 / 9 tests passed (100%)
* **Distributed Raft & Redis Wire Protocol:** 8 / 8 tests passed (100%)
* **Total Automated Test Coverage:** **34 / 34 Tests Passed (100% Success)**

---

## Project Structure

```text
mini-project/
├── Phase2/                         # Modern React Web Management Console
│   ├── src/
│   │   ├── components/             # Reusable UI components & visualizers
│   │   ├── pages/                  # Dashboard, Cache, WAL, Cluster, Metrics pages
│   │   └── context/                # CacheContext state provider
│   └── dist/                       # Pre-compiled static production assets
├── Phase_3/                        # Enterprise Backend & Engine Core
│   ├── backend/src/
│   │   ├── engine/                 # CacheEngine & DoublyLinkedList
│   │   ├── wal/                    # Write-Ahead Log manager with CRC32
│   │   ├── snapshot/               # SnapshotStore binary serializer
│   │   ├── recovery/               # Two-phase crash recovery manager
│   │   ├── cluster/                # RaftNode, ConsistentHashRing, RespServer
│   │   ├── security/               # SecurityGuard & RateLimiter
│   │   └── server.js               # HTTP REST & SSE Gateway
│   ├── database/                   # Persistent storage directory (wal.log, snapshot.bin)
│   └── tests/                      # Automated unit and integration test suites
├── phase-1/                        # Core In-Memory Cache Engine (Java 17)
└── netlify.toml                    # Continuous deployment configuration
```

---

## License & Attribution
Developed for the Third-Year B.Tech Computer Engineering Curriculum at **Sardar Patel Institute of Technology (SPIT), Mumbai**.
Licensed under the MIT License.
