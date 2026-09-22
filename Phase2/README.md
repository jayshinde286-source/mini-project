# Persistent Event-Driven Memory Cache Module — Phase II Frontend

**Academic Mini Project — Third-Year B.Tech Computer Engineering (Semester VI)**  
**Sardar Patel Institute of Technology (SPIT), Mumbai**

### Project Team
* **Jay Shinde** — UID: `2024800115`
* **Nikhil Shelar** — UID: `2024800113`
* **Sanchit Gaikwad** — UID: `2024800029`
* **Faculty Guide**: **Prof. Suhas Kakade**

---

## 1. Phase II Frontend Purpose

The Phase II Frontend provides a high-density, academic developer dashboard designed to visually and interactively demonstrate the architectural capabilities of our **Persistent Event-Driven Memory Cache Module**. 

It allows faculty evaluators to immediately examine:
1. **Cache Storage & Indexing**: In-memory hash-map entries with active versions and access counters.
2. **Operations**: Real-time `SET`, `GET` (Hits vs Misses), and `DELETE` (Tombstone logging).
3. **Time-To-Live (TTL)**: Active expiration countdown bars and automatic background reaper purging.
4. **LRU Eviction**: Real-time capacity monitoring against maximum entry thresholds.
5. **Durable Persistence (WAL)**: V2 Write-Ahead Log records with sequence ordering and strict **CRC32 hex checksums**.
6. **Point-in-Time Snapshots**: Compact state checkpoints for fast boot times.
7. **Deterministic Crash Recovery**: Step-by-step 7-phase recovery pipeline execution.
8. **EventBus Telemetry**: Append-only asynchronous event publication.
9. **Performance Metrics & Analytics**: Hit rate percentages, sub-2ms latency gauges, and operations timelines.
10. **Audit Logs**: Append-only JSON Lines compliance stream.

---

## 2. Technology Stack

* **Core Framework**: React 18.3 (`StrictMode`, Context API, Custom Hooks)
* **Build System**: Vite 6 (Ultra-fast HMR and optimized production bundling)
* **Styling**: Vanilla CSS Design System with CSS Custom Properties (Deep slate developer theme, zero bloated third-party UI frameworks)
* **Icons**: Lucide React (`lucide-react`)
* **Visualizations**: Responsive, zero-dependency SVG charts (Activity timeline, Hit/Miss donut, TTL progress gauges)
* **Integrity Engine**: JavaScript implementation of `java.util.zip.CRC32` matching the backend `ChecksumUtil.crc32Hex`.

---

## 3. How to Install & Run

The frontend is completely self-contained inside the `Phase2/` directory and can be executed independently without impacting the core Java engine:

```bash
# Navigate to the Phase2 directory
cd Phase2

# Install dependencies (only required once)
npm install

# Start the development server
npm run dev
```

The application will start at `http://localhost:5173`.

To build the production bundle:
```bash
npm run build
npm run preview
```

---

## 4. Directory & Folder Structure

```
Phase2/
├── README.md                      # Primary project overview and instructions
├── package.json                   # Dependencies and scripts
├── vite.config.js                 # Vite bundler configuration
├── index.html                     # HTML root with Inter & JetBrains Mono fonts
├── docs/
│   └── PHASE2_FRONTEND.md         # In-depth architectural & viva evaluation report
├── src/
│   ├── main.jsx                   # React root entry point
│   ├── App.jsx                    # Shell layout, tab routing, and modal coordination
│   ├── index.css                  # Global styles import
│   ├── styles/
│   │   ├── variables.css          # Design system color tokens, radiuses, and fonts
│   │   └── global.css             # High-contrast developer dark theme layout & components
│   ├── components/
│   │   ├── Sidebar.jsx            # Left navigation with online status and engine badges
│   │   ├── Topbar.jsx             # Live uptime counter, live simulation switch, team modal
│   │   ├── StatCard.jsx           # Clean developer metric cards
│   │   ├── CacheTable.jsx         # Searchable, filterable table with TTL bars & actions
│   │   ├── CacheOperationModal.jsx# SET entry modal with live TTL validation
│   │   ├── GetKeyModal.jsx        # GET modal displaying rich CACHE HIT / CACHE MISS feedback
│   │   ├── DeleteConfirmModal.jsx # DELETE confirmation warning about WAL tombstones
│   │   ├── TTLVisualizer.jsx      # Dynamic progress indicator with color transitions
│   │   ├── EvictionPanel.jsx      # LRU policy gauge and capacity monitoring
│   │   ├── DemoControls.jsx       # Quick simulation toolbar for viva demonstrations
│   │   ├── ProfessorDemoModal.jsx # 10-Step interactive Viva demonstration workflow
│   │   ├── Charts.jsx             # Zero-dependency SVG Activity trend and Hit/Miss donut
│   │   └── Toast.jsx              # Toast notification stack for real-time operations
│   ├── pages/
│   │   ├── Dashboard.jsx          # KPI cards, health grid, throughput charts, recent events
│   │   ├── CachePage.jsx          # Cache table, SET/GET/DELETE controls, LRU status
│   │   ├── EventsPage.jsx         # Real-time event stream, type filters, JSON export
│   │   ├── PersistencePage.jsx    # V2 WAL records, CRC32 verification, Snapshot inspector
│   │   ├── RecoveryPage.jsx       # 7-step recovery pipeline execution & RecoveryReport evidence
│   │   ├── MetricsPage.jsx        # 10 performance telemetry cards and benchmark goals
│   │   └── AuditPage.jsx          # Compliance audit trail with JSONL export
│   ├── context/
│   │   └── CacheContext.jsx       # Centralized store managing state, events, and persistence
│   ├── services/
│   │   ├── apiService.js          # REST client abstraction with mock fallback switch
│   │   ├── cacheService.js        # Cache operations layer (SET, GET, DELETE, CLEAR)
│   │   ├── eventService.js        # EventBus publisher and subscriber layer
│   │   ├── persistenceService.js  # WAL serializer and snapshot controller
│   │   ├── recoveryService.js     # 7-phase crash recovery executor
│   │   └── metricsService.js      # Metric counters and health indicators
│   ├── data/
│   │   ├── mockCacheData.js       # Realistic initial entries matching Java models
│   │   ├── mockEvents.js          # Initial events matching CacheEvent format
│   │   ├── mockMetrics.js         # Realistic counters and 60-min trend series
│   │   ├── mockPersistence.js     # Initial V2 WAL records and snapshot metadata
│   │   └── mockAudit.js           # Initial JSONL audit log records
│   ├── utils/
│   │   ├── formatters.js          # Time, duration, number, and TTL calculations
│   │   └── checksum.js            # CRC32 hex implementation matching ChecksumUtil.java
│   └── assets/
│       └── cache-icon.svg         # SVG icon
```

---

## 5. Frontend Pages Overview

| Page | Key Purpose | Primary Actions / Visuals |
|---|---|---|
| **1. Dashboard** | High-level system overview for evaluators | 8 Stat Cards, 8-component Health Card, 60-min throughput chart, Recent Events, Quick Demo bar |
| **2. Cache Entries** | In-memory store management | Searchable table, TTL progress bars, SET / GET / DELETE modals, LRU eviction gauge |
| **3. Event Stream** | Decoupled event bus monitoring | Filterable event stream (`CACHE_SET`, `CACHE_HIT`, `CACHE_MISS`, etc.), JSON export |
| **4. Persistence (WAL)** | Durability evidence | V2 WAL table (Sequence, Txn ID, Op, Key, CRC32, Status), Snapshot binary inspector |
| **5. Recovery** | Crash recovery verification | Interactive 7-step visual recovery pipeline, `RecoveryReport` evidence, WAL/Snapshot validation |
| **6. Metrics & Stats** | Performance analytics | 10 KPI cards, Hit vs Miss ratio donut, Avg response time (~1.8ms), Latency targets |
| **7. Audit Logs** | Compliance and event audit stream | Append-only audit table, Actor filters (Client, TTL Manager, System), JSONL file export |

---

## 6. Professor Viva Evaluation Demo Flow (10 Steps)

Click the **"Viva Demo Flow"** button in the top navigation bar to open the built-in 10-step guide:

1. **Step 1: Dashboard Overview** — Explain health cards, hit rate, and system components.
2. **Step 2: SET Cache Entry** — Insert `student:jay` = `CSE_B3` (TTL: 60s). Observe WAL commit and new entry.
3. **Step 3: GET Lookup (Cache Hit)** — Query `student:jay`. View rich `CACHE HIT` card with version and access count.
4. **Step 4: GET Lookup (Cache Miss)** — Query unknown key `student:unknown`. View `CACHE MISS` alert and metric increment.
5. **Step 5: DELETE Entry** — Delete `student:jay`. Emits `CACHE_DELETE` and appends tombstone to WAL.
6. **Step 6: Simulate TTL Expiry** — Trigger background reaper to expire keys and emit `TTL_EXPIRED`.
7. **Step 7: Event Bus Stream** — Review chronological event publication log.
8. **Step 8: Persistence & WAL** — Verify V2 tab-delimited records with valid CRC32 hex hashes.
9. **Step 9: 7-Step Crash Recovery** — Execute automated recovery (*Load Snapshot* $\rightarrow$ *Validate CRC* $\rightarrow$ *Read WAL* $\rightarrow$ *Replay* $\rightarrow$ *Restore*).
10. **Step 10: Metrics Analytics** — Demonstrate 85.0% hit rate and 1.8ms average latency.

---

## 7. Backend Integration Plan (Phase III)

The frontend architecture strictly isolates UI components from data-fetching through the `src/services/` layer:
* In `src/services/apiService.js`, toggle `API_CONFIG.IS_MOCK_MODE = false` and set `VITE_BACKEND_API_URL = http://localhost:8080/api`.
* In Phase III, create lightweight HTTP/REST endpoints in Java using JDK 17 `com.sun.net.httpserver.HttpServer` (zero external dependencies) mapping directly to:
  * `POST /api/cache/entries` $\rightarrow$ `CacheEngine.put(key, value, ttl)`
  * `GET /api/cache/entries/:key` $\rightarrow$ `CacheEngine.get(key)`
  * `DELETE /api/cache/entries/:key` $\rightarrow$ `CacheEngine.delete(key)`
  * `GET /api/events` $\rightarrow$ `InMemoryEventJournal.recentEvents()`
  * `POST /api/recovery/start` $\rightarrow$ `RecoveryManager.recover()`
  * `GET /api/metrics` $\rightarrow$ `CacheMetrics.snapshot()`

---

## 8. Preserved Core Files Outside `Phase2/`

As strictly required, **zero files** outside `Phase2/` were modified or moved:
* Java 17 core engine under `src/main/java/` remains 100% intact.
* `pom.xml`, `Makefile`, and `phase-1/` documentation remain untouched.
* The frontend runs as an independent, modular evaluation layer.
