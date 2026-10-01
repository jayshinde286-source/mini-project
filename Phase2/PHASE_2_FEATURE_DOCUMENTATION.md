# SPIT Cache Module — Phase 2 Comprehensive Feature Documentation
## Detailed Architectural & Technical Specifications for Every Application Feature
**Institution:** Sardar Patel Institute of Technology (SPIT), Mumbai  
**Department:** Computer Science and Engineering  
**Academic Year:** 2026–27 | **Semester:** V | **Subject:** Mini Project (PR1)  

---

## Table of Contents
1. [Feature 1: Interactive Real-Time Cache Monitoring Dashboard](#feature-1-interactive-real-time-cache-monitoring-dashboard)
2. [Feature 2: Cache Entries Management (Search, Sort, Filter, Pagination, CRUD)](#feature-2-cache-entries-management-search-sort-filter-pagination-crud)
3. [Feature 3: Live Event Stream with Filtering, Pause/Resume, and Export](#feature-3-live-event-stream-with-filtering-pauseresume-and-export)
4. [Feature 4: Write-Ahead Logging (WAL) Explorer & CRC32 Inspector](#feature-4-write-ahead-logging-wal-explorer--crc32-inspector)
5. [Feature 5: Two-Phase Crash Recovery & Diagnostics Simulator](#feature-5-two-phase-crash-recovery--diagnostics-simulator)
6. [Feature 6: Cache Metrics, Throughput Analytics & Hit Rate Donut](#feature-6-cache-metrics-throughput-analytics--hit-rate-donut)
7. [Feature 7: Audit Trail Logging & System Compliance Inspector](#feature-7-audit-trail-logging--system-compliance-inspector)
8. [Feature 8: Global Command Palette (Cmd+K / Ctrl+K)](#feature-8-global-command-palette-cmdk--ctrlk)
9. [Feature 9: Dual-Theme Engine (Obsidian Dark & Slate Light)](#feature-9-dual-theme-engine-obsidian-dark--slate-light)
10. [Feature 10: Client-Side Data Export System (JSON & CSV)](#feature-10-client-side-data-export-system-json--csv)
11. [Feature 11: Real-Time TTL Visualizer & Progress Bar](#feature-11-real-time-ttl-visualizer--progress-bar)
12. [Feature 12: Interactive Simulation & Quick Demo Suite](#feature-12-interactive-simulation--quick-demo-suite)

---

## Feature 1: Interactive Real-Time Cache Monitoring Dashboard

### 1. Feature Name
Interactive Real-Time Cache Monitoring Dashboard (`Dashboard.jsx`).

### 2. Purpose
Provides high-level system observability, visualizing key operational telemetry: total keys, active vs. expired entries, memory pressure, cache hit ratio, eviction counts, WAL LSN progression, and system health status.

### 3. How It Works
The dashboard polls or receives pushed telemetry state from `CacheContext`. It computes derived KPIs (e.g., hit percentage = $\frac{Hits}{Hits + Misses} \times 100$) and passes data to responsive SVG/Canvas chart primitives and glowing semantic KPI cards.

### 4. How Users Interact With It
- View real-time stat cards with status glow indicators.
- Inspect the 24-step throughput area chart and hit/miss donut visualizer.
- Click quick-action buttons to trigger demo workloads or navigate to granular tabs.

### 5. Frontend Implementation
- File: `src/pages/Dashboard.jsx`, `src/components/StatCard.jsx`, `src/components/Charts.jsx`.
- Uses CSS Grid with responsive breakpoints (`grid-template-columns: repeat(auto-fit, minmax(220px, 1fr))`).
- Custom SVG line charts with linear gradients and dynamic donut calculations.

### 6. Backend Implementation
- Corresponds to `edu.spit.cache.engine.CacheEngine.getMetrics()` aggregating atomic counters: `totalRequests`, `hits`, `misses`, `evictions`, `memoryBytes`.

### 7. APIs Involved
- `GET /api/metrics`
- `GET /api/health`

### 8. Database / Storage Operations
Reads in-memory atomic counters (`AtomicLong`, `AtomicInteger`) with zero disk I/O to avoid throughput degradation.

### 9. Inputs and Outputs
- **Input**: Polled cache state object `{ entries, stats, wal, events }`.
- **Output**: Rendered visual UI containing 6 primary KPI cards, 2 SVG charts, and engine status indicators.

### 10. Error Handling
Gracefully displays `0%` or `N/A` with neutral badges when no traffic has been recorded; falls back to offline status badge if the backend is unreachable.

### 11. Practical Example
A DBA inspects the dashboard during a burst workload and observes the hit ratio increase to 88.5% while memory stabilizes under the 50-entry cap as LRU evictions increment.

### 12. Limitations
Telemetry charts display rolling windows (e.g., last 30 minutes); historical data spanning weeks requires external time-series storage (Prometheus).

---

## Feature 2: Cache Entries Management (Search, Sort, Filter, Pagination, CRUD)

### 1. Feature Name
Cache Entries Management Console (`CacheTable.jsx`).

### 2. Purpose
Allows engineers to inspect, search, filter, paginate, export, and manually insert, update, or remove key-value pairs stored in the cache.

### 3. How It Works
Renders the complete set of in-memory entries. A unified client-side pipeline applies substring search across keys and values, filters by status (`ACTIVE`, `EXPIRED`, `ALL`), sorts by column (`key`, `expiresAt`, `accessCount`), and slices into 10-item pages.

### 4. How Users Interact With It
- Type in the search box to instantly filter keys.
- Click status filter pills (`All`, `Active`, `Expired`).
- Click table headers to toggle ascending/descending sorts.
- Navigate pages via `Prev` / `Next` and page numbers.
- Click `+ Add Entry` to open an insertion modal with key, value, and TTL inputs.
- Click the trash icon to delete an entry with confirmation.

### 5. Frontend Implementation
- File: `src/components/CacheTable.jsx`.
- State hooks: `searchTerm`, `statusFilter`, `sortField`, `sortDirection`, `currentPage`, `pageSize`.
- Uses Lucide icons (`Search`, `ArrowUpDown`, `Plus`, `Trash2`, `Download`).

### 6. Backend Implementation
- Maps to `CacheEngine.put(key, value, ttlMs)`, `CacheEngine.get(key)`, and `CacheEngine.delete(key)`.

### 7. APIs Involved
- `GET /api/cache`
- `POST /api/cache`
- `DELETE /api/cache/:key`

### 8. Database / Storage Operations
Modifies both the in-memory doubly-linked hash map and appends an `OP_SET` or `OP_DEL` record to `wal.log`.

### 9. Inputs and Outputs
- **Inputs**: Key string, value string/JSON, optional TTL integer (seconds).
- **Outputs**: Table rows with live countdown badges, hit count, creation timestamp, and actions.

### 10. Error Handling
Rejects empty keys or invalid TTL inputs with toast notifications; handles concurrent deletion gracefully.

### 11. Practical Example
Admin inputs key `user:session:402`, value `{"role":"admin"}`, TTL `60s`. The table displays the row with a 60s countdown badge, automatically transitioning to `EXPIRED` once time elapses.

### 12. Limitations
Very large datasets ($> 50,000$ keys) benefit from server-side cursor pagination rather than full in-memory DOM slicing.

---

## Feature 3: Live Event Stream with Filtering, Pause/Resume, and Export

### 1. Feature Name
Decoupled Live Event Stream (`EventsPage.jsx`).

### 2. Purpose
Provides real-time visibility into internal cache lifecycle events (`CACHE_HIT`, `CACHE_MISS`, `CACHE_PUT`, `CACHE_EVICTED`, `TTL_EXPIRED`, `WAL_APPENDED`).

### 3. How It Works
The `EventBus` broadcasts events to registered consumers. Events are buffered in state with sequence IDs, timestamps, type classifications, and associated payload metadata.

### 4. How Users Interact With It
- Inspect live events flowing in chronological order.
- Filter by specific event types (e.g., only `CACHE_EVICTED` or `TTL_EXPIRED`).
- Click `Pause Stream` to freeze updates for inspection; click `Resume Stream` to unpause.
- Click `Clear Events` or `Export JSON` to download the log.

### 5. Frontend Implementation
- File: `src/pages/EventsPage.jsx`.
- Employs color-coded badges (Emerald for hits, Rose for misses, Amber for evictions, Indigo for puts).

### 6. Backend Implementation
- Corresponds to `edu.spit.cache.event.EventBus.subscribe()` publishing `CacheEvent` records.

### 7. APIs Involved
- `GET /api/events` (polling or Server-Sent Events `/api/events/stream`).

### 8. Database / Storage Operations
Appends audit entries to `data/audit.log` when persistence is enabled.

### 9. Inputs and Outputs
- **Inputs**: Filter selection string, stream pause boolean toggle.
- **Outputs**: Formatted event stream list with animated pulse indicators on incoming events.

### 10. Error Handling
Caps event buffer at 500 items in memory to prevent browser memory leaks during high-throughput tests.

### 11. Practical Example
Demonstrator runs an LRU eviction simulation; the event stream instantly lights up with an amber `CACHE_EVICTED` badge showing key `user:101` evicted to make room for `user:151`.

### 12. Limitations
Without persistent historical archival, cleared events only exist within the current session buffer.

---

## Feature 4: Write-Ahead Logging (WAL) Explorer & CRC32 Inspector

### 1. Feature Name
WAL Inspector & Byte-Level Integrity Explorer (`PersistencePage.jsx`).

### 2. Purpose
Exposes the internal append-only durability mechanics of the cache, allowing inspection of Log Sequence Numbers (LSN), opcodes, record byte lengths, and CRC32 checksum verification.

### 3. How It Works
Reads the WAL log record by record. For each entry, it parses header fields (`magic`, `lsn`, `opcode`, `timestamp`), displays the raw hex/text payload, and verifies the 32-bit CRC against computed bytes.

### 4. How Users Interact With It
- View total LSN counter, file size on disk, and write throughput.
- Filter records by operation type (`SET`, `DEL`, `EVICT`, `EXPIRE`).
- Click any record to inspect raw serialization details and checksum verification badge.
- Click `Force Snapshot` to trigger manual checkpointing and log compaction.

### 5. Frontend Implementation
- File: `src/pages/PersistencePage.jsx`.
- Clean card layout with monospace typography for LSN numbers and hex checksums.

### 6. Backend Implementation
- Maps to `edu.spit.cache.wal.WalManager` and `edu.spit.cache.wal.WalRecord`.

### 7. APIs Involved
- `GET /api/wal/records`
- `GET /api/wal/status`
- `POST /api/wal/snapshot`

### 8. Database / Storage Operations
Sequential disk read of `data/wal.log`; file truncation during checkpointing.

### 9. Inputs and Outputs
- **Inputs**: Filter query, snapshot trigger.
- **Outputs**: Table of durable disk records with `CRC: VALID` badges.

### 10. Error Handling
Flags records with mismatched CRC32 as `CORRUPTED` with a red highlight badge.

### 11. Practical Example
During presentation, the user shows that every `PUT` command increments the LSN by 1 and produces a distinct 8-character hex CRC32 checksum trailer.

### 12. Limitations
Continuous log inspection in production should be sampled to avoid reading multi-gigabyte log files into memory at once.

---

## Feature 5: Two-Phase Crash Recovery & Diagnostics Simulator

### 1. Feature Name
Two-Phase Crash Recovery & Diagnostics Simulator (`RecoveryPage.jsx`).

### 2. Purpose
Demonstrates fault-tolerance by providing interactive simulations: triggering an abrupt simulated crash, executing cold restarts, loading point-in-time snapshots, and replaying un-snapshotted WAL records with CRC verification.

### 3. How It Works
Simulates a crash by clearing volatile memory. The recovery coordinator then initiates:
- Phase 1: Reads `snapshot.bin` up to checkpoint LSN.
- Phase 2: Reads `wal.log` forward from checkpoint LSN, validating each CRC32 before applying mutations.

### 4. How Users Interact With It
- Click `Simulate Crash` to clear volatile memory while preserving disk files.
- Click `Execute Cold Recovery` to run the two-phase replay sequence.
- View step-by-step recovery logs and diagnostic counters (restored keys, replayed records, corrupted blocks isolated).

### 5. Frontend Implementation
- File: `src/pages/RecoveryPage.jsx`.
- Status cards, diagnostic progress meters, and real-time terminal output logs.

### 6. Backend Implementation
- Corresponds to `edu.spit.cache.recovery.RecoveryManager.recover()`.

### 7. APIs Involved
- `POST /api/recovery/crash-simulate`
- `POST /api/recovery/execute`
- `GET /api/recovery/status`

### 8. Database / Storage Operations
Reads `data/snapshot.bin` and `data/wal.log`; does not modify existing log records during read-only recovery.

### 9. Inputs and Outputs
- **Inputs**: Simulated crash trigger button.
- **Outputs**: Recovery report showing elapsed time (e.g., 42ms), total keys restored, and final verified LSN.

### 10. Error Handling
Catches corrupted records, halts replay at the fault boundary, and informs the operator without crashing the engine.

### 11. Practical Example
The presenter clicks `Simulate Crash` (entries drop to 0), then clicks `Recover`. In 50ms, all 45 previous keys are reconstituted with complete value integrity.

### 12. Limitations
In-browser simulation is tied to state context; in native backend mode, it tests actual process termination.

---

## Feature 6: Cache Metrics, Throughput Analytics & Hit Rate Donut

### 1. Feature Name
Cache Metrics, Throughput Analytics & Hit Rate Donut (`MetricsPage.jsx`).

### 2. Purpose
Provides in-depth quantitative telemetry including hit-to-miss distribution, operations per second, memory allocation trends, and eviction counts over time.

### 3. How It Works
Collects operational metrics from the engine, computes percentages and moving averages, and formats values for high-contrast charts.

### 4. How Users Interact With It
- Switch between 5-minute, 15-minute, and 1-hour telemetry windows.
- Hover over chart data points to view exact timestamps and counts.
- Inspect hit rate breakdown (Hits, Misses, Evictions, Expirations).

### 5. Frontend Implementation
- File: `src/pages/MetricsPage.jsx`, `src/components/Charts.jsx`.
- Custom SVG path rendering with gradient fills and smooth cubic Bezier curves.

### 6. Backend Implementation
- Driven by `CacheEngine.getMetrics()` returning microsecond latencies and atomic counters.

### 7. APIs Involved
- `GET /api/metrics/historical`

### 8. Database / Storage Operations
Purely in-memory metric ring-buffer; zero disk overhead.

### 9. Inputs and Outputs
- **Inputs**: Time range filter selector.
- **Outputs**: Visual throughput charts, donut diagrams, and ratio progress bars.

### 10. Error Handling
Handles zero-traffic states gracefully without dividing by zero.

### 11. Practical Example
Demonstrates cache warm-up: initial queries produce misses; subsequent queries achieve a 95% hit rate.

### 12. Limitations
Metrics reset on clean system reboot unless an external telemetry exporter is attached.

---

## Feature 7: Audit Trail Logging & System Compliance Inspector

### 1. Feature Name
Audit Trail Logging & Compliance Inspector (`AuditPage.jsx`).

### 2. Purpose
Records an immutable log of administrative actions (e.g., manual key additions, deletions, cache purges, snapshot triggers, recovery executions) for compliance and debugging.

### 3. How It Works
Every administrative operation emits a structured audit record containing an ISO-8601 timestamp, user/actor identity, action verb, target resource, and outcome status (`SUCCESS`, `FAILED`).

### 4. How Users Interact With It
- Filter audit logs by action type (`CREATE`, `UPDATE`, `DELETE`, `RECOVER`, `SNAPSHOT`).
- Search by target key or resource name.
- Export audit trail as CSV for compliance archiving.

### 5. Frontend Implementation
- File: `src/pages/AuditPage.jsx`.
- Dense compliance table layout with action badges and JSON metadata expanders.

### 6. Backend Implementation
- Handled by `AuditLogger` writing append-only entries to `data/audit.log`.

### 7. APIs Involved
- `GET /api/audit`
- `GET /api/audit/export`

### 8. Database / Storage Operations
Sequential appends to text-based audit log files.

### 9. Inputs and Outputs
- **Inputs**: Filter terms, date range.
- **Outputs**: Table of auditable actions with timestamps and operator details.

### 10. Error Handling
Disk full conditions trigger fallback to in-memory audit ring buffer with alert banner.

### 11. Practical Example
Examiner asks: "Who deleted key `session:admin`?" The presenter opens the Audit tab and shows the exact timestamp and IP of the deletion event.

### 12. Limitations
Audit log rotation policies (e.g., 30-day retention) must be configured for long-term production.

---

## Feature 8: Global Command Palette (Cmd+K / Ctrl+K)

### 1. Feature Name
Global Keyboard Command Palette (`CommandPaletteModal.jsx`).

### 2. Purpose
Delivers a fast, power-user keyboard interface for navigation, global search, and instant cache mutations without clicking through menus.

### 3. How It Works
A global keyboard listener intercepts `Cmd+K` (macOS) and `Ctrl+K` (Windows/Linux). An accessible glassmorphic modal opens with auto-focus on the search input, filtering available commands and cache keys.

### 4. How Users Interact With It
- Press `Cmd+K` anywhere in the application.
- Type commands (e.g., `Add`, `Dashboard`, `Recovery`, `Simulate`, `Purge`).
- Use `ArrowUp` / `ArrowDown` to navigate results and `Enter` to execute.
- Press `Escape` to close.

### 5. Frontend Implementation
- File: `src/components/CommandPaletteModal.jsx`.
- Uses React portals, focus trapping, and keyboard event dispatchers.

### 6. Backend Implementation
- Direct programmatic invocation of context actions (`setActiveTab`, `openAddModal`, `runSimulation`).

### 7. APIs Involved
- Client-side orchestration; invokes respective backend APIs when mutations are selected.

### 8. Database / Storage Operations
None directly; triggers standard cache operations.

### 9. Inputs and Outputs
- **Inputs**: Keyboard keystrokes and queries.
- **Outputs**: Instant view navigation or dialog activation.

### 10. Error Handling
Ignores unsupported keystrokes; displays "No matching commands found" empty state.

### 11. Practical Example
Presenter presses `Cmd+K`, types "Crash", hits `Enter`, and the application immediately navigates to Recovery and runs the simulation.

### 12. Limitations
Requires JavaScript keyboard focus inside the browser tab.

---

## Feature 9: Dual-Theme Engine (Obsidian Dark & Slate Light)

### 1. Feature Name
Dual-Theme Engine (`variables.css`, `CacheContext.jsx`, `Topbar.jsx`).

### 2. Purpose
Eliminates the plain black-and-white aesthetic in favor of a modern, commercial SaaS design palette supporting Obsidian Dark and Clean Slate Light modes with high-contrast accessibility.

### 3. How It Works
Root CSS custom properties (`--bg-primary`, `--accent-indigo`, `--surface-card`, `--border-color`) are dynamically switched by modifying the `data-theme` attribute on `document.documentElement`. The selected theme is persisted in `localStorage`.

### 4. How Users Interact With It
- Click the Theme pill button in the top navigation bar (`Theme: Dark` or `Theme: Light`).
- Theme transitions smoothly across all components with subtle CSS ease transitions.

### 5. Frontend Implementation
- File: `src/styles/variables.css`, `src/context/CacheContext.jsx`.
- Rich semantic color palette: Indigo (`#6366f1`), Cyan (`#06b6d4`), Emerald (`#10b981`), Amber (`#f59e0b`), Rose (`#ef4444`).

### 6. Backend Implementation
- None (pure presentation tier).

### 7. APIs Involved
- Browser `localStorage.setItem('theme', theme)`.

### 8. Database / Storage Operations
Browser local storage read/write.

### 9. Inputs and Outputs
- **Input**: User click toggle.
- **Output**: Instant, flicker-free recoloring of all UI components.

### 10. Error Handling
Falls back to `dark` theme if `localStorage` is blocked or unavailable.

### 11. Practical Example
User toggles to Light mode for classroom projector visibility and toggles back to Dark mode for desktop work.

### 12. Limitations
Theme switching is client-side; does not sync across multiple different devices automatically.

---

## Feature 10: Client-Side Data Export System (JSON & CSV)

### 1. Feature Name
Client-Side Data Export System (`CacheTable.jsx`, `EventsPage.jsx`).

### 2. Purpose
Allows engineers and evaluators to download live cache entries, event traces, and audit logs for external verification, offline analysis, and test documentation.

### 3. How It Works
Transforms in-memory JavaScript objects into formatted JSON strings or comma-separated value (CSV) text blobs. Creates a temporary `<a>` element with a `Blob` object URL, clicks it programmatically, and revokes the URL.

### 4. How Users Interact With It
- Click `Export JSON` or `Export CSV` on the Cache Entries or Events tabs.
- Browser immediately downloads `cache_entries_export.json` or `.csv`.

### 5. Frontend Implementation
- Integrated utility functions generating `new Blob([data], { type: 'application/json' })` and handling CSV quote escaping.

### 6. Backend Implementation
- Client-side data serialization with option to call backend `/api/cache/export` for raw files.

### 7. APIs Involved
- DOM URL API (`URL.createObjectURL`).

### 8. Database / Storage Operations
None; zero disk load on the server.

### 9. Inputs and Outputs
- **Input**: User export trigger.
- **Output**: Clean downloadable file formatted with headers, keys, values, and timestamps.

### 10. Error Handling
Catches circular JSON structures; sanitizes CSV field commas and line breaks.

### 11. Practical Example
Student downloads `cache_entries_export.csv` and opens it in Microsoft Excel to attach to their academic project report.

### 12. Limitations
Client-side memory limit applies if exporting millions of keys simultaneously.

---

## Feature 11: Real-Time TTL Visualizer & Progress Bar

### 1. Feature Name
Real-Time TTL Visualizer & Dynamic Expiration Progress Indicator (`TTLVisualizer.jsx`).

### 2. Purpose
Visually conveys the remaining lifespan of cached items through dynamic countdown timers and percentage progress bars that change color as expiration nears.

### 3. How It Works
Calculates the elapsed duration $\frac{now - createdAt}{expiresAt - createdAt} \times 100$. A timer ticks every second, re-rendering countdown text (`28s left`, `Expired`) and shifting bar colors from Emerald ($>50\%$) to Amber ($20-50\%$) to Rose ($<20\%$).

### 4. How Users Interact With It
- Inspect TTL progress bars directly inside the Cache Entries table or on the dedicated TTL page.
- Watch live countdown without refreshing the page.

### 5. Frontend Implementation
- File: `src/pages/TTLVisualizer.jsx` and table cell components.
- CSS transitions for smooth progress bar reduction.

### 6. Backend Implementation
- Key metadata stores `createdAt` and `expiresAt` epoch millisecond timestamps.

### 7. APIs Involved
- `GET /api/cache`

### 8. Database / Storage Operations
Passive check during read operations; active background sweeper on backend.

### 9. Inputs and Outputs
- **Input**: Current timestamp and entry lifecycle timestamps.
- **Output**: Color-coded progress bar and human-readable remaining time string.

### 10. Error Handling
Handles entries with infinite TTL ($ttl = 0$) by displaying a persistent `Infinity` badge with an emerald infinite indicator.

### 11. Practical Example
Examiner watches a key inserted with a 15-second TTL count down in real time from green to orange to red, disappearing upon reaching 0.

### 12. Limitations
Slight clock drift between client machine and server clock can cause a 1-second display discrepancy.

---

## Feature 12: Interactive Simulation & Quick Demo Suite

### 1. Feature Name
Interactive Simulation & Quick Demo Suite (`DemoControls.jsx`).

### 2. Purpose
Enables one-click demonstration of complex distributed caching scenarios (burst traffic, LRU eviction overflows, cold crash recovery, rapid TTL expiration) during academic viva evaluations.

### 3. How It Works
Pre-programmed workflow macros execute automated sequences of cache insertions, queries, and deletions, accompanied by real-time visual progress notifications.

### 4. How Users Interact With It
- Click any of the 8 demo buttons in the Quick Actions bar:
  1. `Burst Traffic (20 Ops)`
  2. `Test LRU Eviction`
  3. `Test TTL Expiration`
  4. `Simulate Crash & Recover`
  5. `Create Snapshot Checkpoint`
  6. `Read Heavy Workload`
  7. `Cache Hit Streak`
  8. `Reset All Data`

### 5. Frontend Implementation
- File: `src/components/DemoControls.jsx`.
- Colorized buttons with Lucide icons (`Zap`, `Trash`, `Clock`, `RotateCcw`, `Camera`, `Database`).

### 6. Backend Implementation
- Executes batch operations against the `CacheEngine` and `WalManager`.

### 7. APIs Involved
- `POST /api/demo/run-scenario`
- `POST /api/cache/batch`

### 8. Database / Storage Operations
Appends batch records to WAL and triggers snapshot checkpointer.

### 9. Inputs and Outputs
- **Input**: Scenario button click.
- **Output**: Instant graph spikes, event stream activity, and toast notifications.

### 10. Error Handling
Debounces clicks to prevent race conditions during macro execution.

### 11. Practical Example
During viva, the student clicks `Test LRU Eviction`; 55 keys are inserted into a 50-capacity cache, visually proving that the 5 oldest keys are evicted in $O(1)$ time with WAL logging.

### 12. Limitations
Designed for demonstration and testing; disabled in production environments.
