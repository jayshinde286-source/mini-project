# Persistent Event-Driven Memory Cache Module — Phase II Architecture & Frontend Console

**Academic Mini Project (PR1) — Third-Year B.Tech Computer Engineering (Semester V / VI)**  
**Sardar Patel Institute of Technology (SPIT), Andheri (W), Mumbai**  
**Department of Computer Science and Engineering | Academic Year: 2026–27**  

### Project Team & Supervision
* **Jay Shinde** — UID: `2024800115`
* **Nikhil Shelar** — UID: `2024800113`
* **Sanchit Gaikwad** — UID: `2024800029`
* **Faculty Guide**: **Prof. Suhas Kakade**

---

## 1. Official SPIT Phase 2 Evaluation Matrix (25 Marks)

This Phase II implementation and documentation package is strictly structured to address every component of the official SPIT Evaluation Rubric:

| Evaluation Component | Marks | Deliverable Documentation & Implementation |
|---|---|---|
| **P1: Software Requirement Specifications (SRS)** | **10 Marks** | [SRS.md](file:///Users/jayshinde/Documents/mini%20project/Phase2/SRS.md) & [PRD.md](file:///Users/jayshinde/Documents/mini%20project/Phase2/PRD.md) |
| **P2: UML Diagrams** | **5 Marks** | [UML_DIAGRAMS.md](file:///Users/jayshinde/Documents/mini%20project/Phase2/UML_DIAGRAMS.md) |
| **P3: Algorithm Design / Prototype** | **5 Marks** | [ALGORITHM_DESIGN.md](file:///Users/jayshinde/Documents/mini%20project/Phase2/ALGORITHM_DESIGN.md) |
| **P4: Presentation & Live Demonstration** | **5 Marks** | Commercial-grade interactive Web Console with Dark/Light themes |
| **Total Marks** | **25 Marks** | **100% Complete & Independently Verifiable** |

---

## 2. Complete Phase 2 Documentation Suite

All detailed architectural and design specifications are accessible directly via the following documentation files:

1. **[Product Requirements Document (PRD.md)](file:///Users/jayshinde/Documents/mini%20project/Phase2/PRD.md)**: Executive summary, user personas, problem statement, functional scope, acceptance criteria, and system architecture.
2. **[Software Requirements Specification (SRS.md)](file:///Users/jayshinde/Documents/mini%20project/Phase2/SRS.md)**: IEEE 830-standard specification detailing functional requirements (`[FR-xx]`), non-functional requirements (`[NFR-xx]`), external interface specifications, and verification matrices.
3. **[UML Diagrams & Schematics (UML_DIAGRAMS.md)](file:///Users/jayshinde/Documents/mini%20project/Phase2/UML_DIAGRAMS.md)**: Detailed Mermaid diagrams representing Use Case, Domain Class Model, Write/Read/Recovery Sequence Diagrams, Activity Control Pipelines, Component Topology, and Design Patterns.
4. **[Algorithm Design & Specifications (ALGORITHM_DESIGN.md)](file:///Users/jayshinde/Documents/mini%20project/Phase2/ALGORITHM_DESIGN.md)**: Algorithmic workflows with rigorous pseudocode and asymptotic complexity analysis for $O(1)$ Hash+DLL insertion, retrieval, LRU eviction, active/passive TTL, WAL append with CRC32, atomic snapshotting, and two-phase recovery.
5. **[Feature Documentation (PHASE_2_FEATURE_DOCUMENTATION.md)](file:///Users/jayshinde/Documents/mini%20project/Phase2/PHASE_2_FEATURE_DOCUMENTATION.md)**: 12-section technical breakdown for every feature in the Phase 2 system.

---

## 3. Phase 2 UI/UX Redesign & Features

The Phase 2 frontend has been transformed from a basic monochrome interface into a **commercial-grade developer telemetry and management console**:

- **Dual-Theme Engine**: Seamless toggle between **Obsidian Dark** (`#0a0f1d`) and **Clean Slate Light** (`#f8fafc`) with rich semantic accents (Indigo `#6366f1`, Emerald `#10b981`, Amber `#f59e0b`, Rose `#ef4444`, Cyan `#06b6d4`).
- **Global Command Palette (`Cmd+K` / `Ctrl+K`)**: Instant keyboard navigation, key search, and quick operational triggers.
- **Cache Entries Management**: Multi-field search, status filtering (`ALL`, `ACTIVE`, `EXPIRED`), column sorting, 10-item pagination, and direct **JSON and CSV export**.
- **Real-Time TTL Countdown**: Live animated progress indicators dynamically shifting color as keys near expiration.
- **Live Event Stream**: Real-time lifecycle event feed with event-type filtering, pause/resume streaming, and JSON download.
- **Write-Ahead Log (WAL) Inspector**: Byte-level LSN sequencing, opcode breakdowns, and live **CRC32 hex integrity badges**.
- **Two-Phase Crash Recovery Simulator**: Interactive crash simulation and step-by-step cold recovery replaying snapshots and WAL logs.
- **Throughput & Analytics Charts**: High-density SVG activity timelines and hit/miss percentage donut charts.

---

## 4. Technology Stack

* **Frontend Framework**: React 18.3 (`StrictMode`, Context API, Custom Hooks)
* **Build System & Bundler**: Vite 6 (Fast Hot Module Replacement, optimized minification)
* **Styling**: Vanilla CSS Design System with CSS Custom Properties (zero bulky dependencies)
* **Iconography**: Lucide React
* **Data Visualization**: Zero-dependency SVG linear curves, area gradients, and donut visualizers
* **Integrity Engine**: Client-side `CRC32` checksum calculator conforming to `java.util.zip.CRC32`

---

## 5. Installation & Execution Instructions

The Phase 2 application is completely self-contained within this directory and runs independently:

### Step 1: Install Dependencies
```bash
cd Phase2
npm install
```

### Step 2: Start Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:5173`.

### Step 3: Keyboard Shortcuts
- Press `Cmd + K` (macOS) or `Ctrl + K` (Windows/Linux) to launch the **Global Command Palette**.
- Press `Escape` to dismiss any active modal.

### Step 4: Build for Production
```bash
npm run build
npm run preview
```

---

## 6. Directory Structure

```
Phase2/
├── PRD.md                         # Product Requirements Document
├── SRS.md                         # IEEE-standard Software Requirements Specification (10 Marks)
├── UML_DIAGRAMS.md                # Use Case, Class, Sequence, Activity, Component Diagrams (5 Marks)
├── ALGORITHM_DESIGN.md            # Pseudocode, workflows, complexity analysis (5 Marks)
├── PHASE_2_FEATURE_DOCUMENTATION.md # Detailed 12-section documentation for every feature
├── README.md                      # Primary project overview and instructions
├── package.json                   # Dependencies and scripts
├── vite.config.js                 # Vite bundler configuration
├── index.html                     # HTML root with theme configuration
├── dist/                          # Production build output
├── docs/                          # Architectural documentation
└── src/
    ├── main.jsx                   # React root entry point
    ├── App.jsx                    # Shell layout and command palette integration
    ├── index.css                  # Global styles import
    ├── styles/
    │   ├── variables.css          # Semantic design tokens (Obsidian Dark & Clean Slate)
    │   └── global.css             # Glassmorphism, animations, cards, badges, modals
    ├── context/
    │   └── CacheContext.jsx       # Global state management and theme engine
    ├── components/
    │   ├── Sidebar.jsx            # Navigation with glowing active indicators
    │   ├── Topbar.jsx             # Status indicators, theme toggle, and Command Palette button
    │   ├── CommandPaletteModal.jsx# Cmd+K Global Command Palette
    │   ├── StatCard.jsx           # Glowing KPI cards with semantic accents
    │   ├── CacheTable.jsx         # Search, sort, filter, paginate, and JSON/CSV export table
    │   ├── DemoControls.jsx       # 8 quick simulation macros
    │   ├── Charts.jsx             # SVG Throughput and Hit-Rate Donut charts
    │   └── ...                    # Modals and auxiliary components
    └── pages/
        ├── Dashboard.jsx          # Comprehensive cache monitoring dashboard
        ├── EventsPage.jsx         # Live event stream with pause/resume and export
        ├── PersistencePage.jsx    # WAL records inspector with CRC32 hex badges
        ├── RecoveryPage.jsx       # Two-phase crash recovery & diagnostics simulator
        ├── MetricsPage.jsx        # Historical performance analytics and ratios
        ├── AuditPage.jsx          # System audit trail and compliance log
        └── TTLVisualizer.jsx      # Dynamic countdown progress visualizer
```

---

## 7. Viva Demonstration Workflow for Examiners

1. **Architecture & Dashboard**:
   - Demonstrate the Obsidian Dark and Slate Light themes via the Topbar toggle.
   - Press `Cmd+K` to show the global command palette.
   - Point out real-time KPI metrics: Active Keys, Memory Footprint, Hit Rate, and Uptime.

2. **$O(1)$ Cache Insertion & LRU Eviction**:
   - Navigate to **Cache Entries** and add an item with a 15-second TTL.
   - Show the dynamic countdown bar ticking down in real time.
   - Click `Test LRU Eviction` in Quick Actions to insert 55 keys against a 50-key capacity; verify that the 5 oldest keys are evicted in $O(1)$ time.

3. **Write-Ahead Logging (WAL) & CRC32**:
   - Navigate to **Persistence (WAL)** to show append-only LSN records with valid CRC32 hex checksums.
   - Show how each record stores opcode, key, timestamp, and payload length.

4. **Crash Simulation & Cold Recovery**:
   - Open **Recovery** tab; click `Simulate Crash` (active cache clears to 0).
   - Click `Execute Cold Recovery`; observe Phase 1 snapshot restoration and Phase 2 WAL replay reconstituting 100% of valid keys in under 50ms.
