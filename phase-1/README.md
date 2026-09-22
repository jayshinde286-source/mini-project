# PERSISTENT EVENT-DRIVEN MEMORY CACHE MODULE
## Phase-I Overview & Project Charter

---

### Academic Information & Team Details

- **Project Title**: Persistent Event-Driven Memory Cache Module
- **Institute**: Sardar Patel Institute of Technology (S.P.I.T.), Andheri (W), Mumbai
- **Department**: Department of Computer Science and Engineering
- **Academic Year**: 2026–27
- **Class / Semester**: Third Year B.Tech. CSE / Semester V
- **Project Guide**: Prof. Suhas Kakade

#### Team Members

| Name | UID | Primary Planned Area |
|---|---|---|
| **Jay Shinde** | `2024800115` | Cache Engine, B-Tree Indexing & Concurrency Control |
| **Nikhil Shelar** | `2024800113` | Event Bus, Observability Metrics & Test Delivery |
| **Sanchit Gaikwad** | `2024800029` | Durability, Write-Ahead Logging & Crash Recovery |

---

## 1. Phase-I Purpose & Context

In modern software architectures, in-memory caches (like standard hash maps or memory caches) deliver lightning-fast read and write operations because data resides directly in RAM. However, RAM is inherently **volatile**. When a process crashes, an unhandled exception occurs, or the host machine restarts, all in-memory cache data is lost instantaneously. Furthermore, naive cache implementations often lack real-time visibility into cache mutations, have uncontrolled lifetime (leading to memory exhaustion), and lack safety guarantees during concurrent operations.

**Phase I** of this mini project establishes the foundational systems research, requirements analysis, system architecture, gap identification, modular division, and academic roadmap.

### Central Research & Design Question
> *"How can we combine RAM-level speed with persistence, recovery and event-driven monitoring?"*

---

## 2. Proposed Solution at a Glance

We propose the design of a modular, zero-dependency, Java-based **Persistent Event-Driven Memory Cache Module**. The module operates primarily in RAM for sub-millisecond key-value operations while integrating:
1. **Append-Only Write-Ahead Logging (WAL)** and **Snapshots** for durable crash recovery.
2. An **Ordered In-Memory Event Bus** that emits asynchronous domain events (`CACHE_PUT`, `CACHE_HIT`, `CACHE_MISS`, `CACHE_DELETE`, `TTL_EXPIRED`, `EVICTION`, `RECOVERY`) for decoupled metrics and audit streaming.
3. **Time-To-Live (TTL)** management and pluggable **LRU / LFU Eviction Policies** for controlled lifecycle management.
4. **Optimistic Versioning (CAS)** and **Key-Level Locking** for concurrency safety.

---

## 3. Scope Separation: Phase I vs. Future Phases

To maintain strict academic integrity during evaluation, the table below highlights what is within the scope of **Phase I** versus what is planned for future milestones:

```
┌────────────────────────────────────────────────────────────────────────────┐
│                           PHASE I (COMPLETED)                              │
│  - Formal Problem Definition & Volatility Analysis                         │
│  - Literature Review of Related Systems (HashMap, Caches, KV Stores)       │
│  - Gap Analysis & Academic Value Proposition                               │
│  - Modular System Architecture & Conceptual Data Flows                     │
│  - Project Objectives, Scope & Team Responsibility Matrix                  │
│  - Semester Milestone Planning & Weekly Progress (Weeks 1 & 2)             │
│  - Phase-I Presentation & Viva Voce Preparation Guide                      │
└────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                    PLANNED FOR FUTURE PHASES (II, III, IV, ESE)            │
│  - Phase II (02 Sep 2026): Core Engine, WAL v1 Baseline, LRU/LFU Baseline   │
│  - Phase III (30 Sep 2026): Event Bus, TTL, Concurrency, Metrics Projection│
│  - Phase IV (12 Oct 2026): Snapshots, B-Tree Index, Multi-Key Transactions │
│  - ESE Final (02 Nov 2026): End-to-End Evaluation, Live Demo, Final Viva   │
└────────────────────────────────────────────────────────────────────────────┘
```

> **Note on Repository State**: The repository root already contains experimental source prototypes and foundational test scaffolding created during technical feasibility exploration. In this Phase-I submission, we strictly report our conceptual, architectural, and planning deliverables as evaluated by the department.

---

## 4. Phase-I Document Directory

All Phase-I documentation is organized systematically inside this `phase-1/` directory:

| Document | Title | Purpose |
|---|---|---|
| [`01-problem-definition.md`](./01-problem-definition.md) | Problem Definition | Detailed analysis of RAM volatility, data loss, and formal academic problem statement. |
| [`02-need-for-system.md`](./02-need-for-system.md) | Need for the Proposed System | Deep dive into Speed, Reliability, Visibility, Controlled Lifetime, and Safe Updates. |
| [`03-existing-related-systems.md`](./03-existing-related-systems.md) | Existing & Related Systems | Comparative study of Java HashMap, typical caches, and key-value stores with disclaimer. |
| [`04-gap-analysis.md`](./04-gap-analysis.md) | Gap Analysis | Analysis of the 5-way functional gap and the educational value of an integrated module. |
| [`05-proposed-solution.md`](./05-proposed-solution.md) | Proposed Solution | Detailed module breakdown with genuine repository implementation status labels. |
| [`06-system-architecture.md`](./06-system-architecture.md) | System Architecture | Layered architecture, component responsibilities, and conceptual `SET` / `GET` flows. |
| [`07-objectives-and-scope.md`](./07-objectives-and-scope.md) | Objectives & Scope | Core project objectives, Phase-I boundary, and deliverables. |
| [`08-project-planning.md`](./08-project-planning.md) | Project Planning & Roadmap | Phase-by-phase timeline (Phase I to ESE) and individual team member ownership. |
| [`09-two-week-progress.md`](./09-two-week-progress.md) | Two-Week Progress Report | Week 1 & Week 2 detailed objectives, research activities, and verified outcomes. |
| [`10-planned-demo.md`](./10-planned-demo.md) | Planned Future Demo | Conceptual blueprint for the interactive CLI/Dashboard and crash-recovery demonstration. |
| [`11-viva-preparation.md`](./11-viva-preparation.md) | Viva Voce Preparation Guide | Comprehensive 40-question Q&A bank with 1-line, intuitive, and technical answers. |
| [`12-phase1-summary.md`](./12-phase1-summary.md) | Phase-I Summary | Executive project summary and a polished 60-second explanation for evaluators. |
| [`diagrams/`](./diagrams/) | System Diagrams | Mermaid architecture, cache flow, and crash recovery sequence diagrams. |
| [`evidence/README.md`](./evidence/README.md) | Technical Evidence Inventory | Repository audit of implemented, partial, and planned capabilities. |

---

## 5. Folder Structure

```text
phase-1/
├── README.md
├── 01-problem-definition.md
├── 02-need-for-system.md
├── 03-existing-related-systems.md
├── 04-gap-analysis.md
├── 05-proposed-solution.md
├── 06-system-architecture.md
├── 07-objectives-and-scope.md
├── 08-project-planning.md
├── 09-two-week-progress.md
├── 10-planned-demo.md
├── 11-viva-preparation.md
├── 12-phase1-summary.md
├── diagrams/
│   ├── architecture.md
│   ├── cache-flow.md
│   └── crash-recovery-flow.md
└── evidence/
    └── README.md
```
