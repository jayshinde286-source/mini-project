# 09. Two-Week Progress Report (Phase I)

---

## 1. Executive Summary of Phase-I Activities

During the initial two weeks of the semester (01 August 2026 – 14 August 2026), our team completed the foundational problem discovery, literature survey, gap analysis, systems architecture design, and project planning under the guidance of **Prof. Suhas Kakade**.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      TWO-WEEK PHASE-I PROGRESS TIMELINE                     │
├──────────────────────────────────────┬──────────────────────────────────────┤
│               WEEK 1                 │                WEEK 2                │
│    (01 Aug 2026 – 07 Aug 2026)       │     (08 Aug 2026 – 14 Aug 2026)      │
│  Focus: Topic & Problem Exploration  │  Focus: Architecture & Gap Analysis  │
├──────────────────────────────────────┼──────────────────────────────────────┤
│ • Finalized project domain & title   │ • Refined formal problem statement   │
│ • Studied RAM speed vs. volatility   │ • Benchmarked existing systems       │
│ • Defined initial 7 objectives       │ • Formulated 5-way gap analysis      │
│ • Studied WAL, TTL & Event Bus basics│ • Designed modular Java architecture │
│ • Established team module division   │ • Selected Java 17 zero-dependency   │
│ • Prepared draft scope document      │ • Finalized semester roadmap & PPT   │
└──────────────────────────────────────┴──────────────────────────────────────┘
```

---

## 2. Week 1 Detailed Progress Report

* **Review Date**: **07 AUG 2026**
* **Primary Objective**: Finalize project topic, explore systems challenges in in-memory caching, and formulate preliminary project objectives.

### Work Undertaken During Week 1
1. **Topic Finalization**: Selected and registered the project title *"Persistent Event-Driven Memory Cache Module"* within the Department of Computer Science and Engineering.
2. **Core Problem Identification**: Researched the trade-offs between volatile primary storage (RAM) and durable secondary storage (disk/SSD).
3. **Volatility Analysis**: Studied scenarios leading to state loss, including abrupt JVM process crashes (`SIGKILL`), hardware power loss, and unhandled runtime exceptions.
4. **Key-Value Cache Concepts**: Studied in-memory hashing techniques, entry structures, and average $O(1)$ time complexity bounds.
5. **Persistence Concepts**: Investigated Write-Ahead Logging (WAL) mechanisms used in database engines (e.g., SQLite rollback/WAL, PostgreSQL WAL) and explored record serialization.
6. **Lifecycle Management Concepts**: Studied Time-To-Live (TTL) expiration strategies (lazy vs. active background sweeps) and memory bounding.
7. **Eviction Strategies**: Explored the mechanics of Least Recently Used (LRU) and Least Frequently Used (LFU) eviction heuristics.
8. **Event-Driven Paradigms**: Researched decoupled publish-subscribe event architectures and their utility in cache observability.
9. **Review of Related Solutions**: Conducted initial literature searches on standard `HashMap`, Redis, Memcached, and Guava Cache.
10. **Draft Scope Definition**: Drafted preliminary functional requirements and boundaries for an undergraduate mini-project.
11. **Team Ownership Division**: Discussed module distribution among the three team members based on core competencies.

### Week 1 Outcomes
* Approved project title and domain registration.
* Comprehensive technical notes on RAM volatility, WAL mechanics, and pub-sub event models.
* Draft problem definition document outlining the fundamental challenges of uncoordinated memory caches.

---

## 3. Week 2 Detailed Progress Report

* **Review Date**: **14 AUG 2026**
* **Primary Objective**: Formalize system architecture, complete comparative literature study, identify explicit research gaps, and prepare Phase-I evaluation deliverables.

### Work Undertaken During Week 2
1. **Problem Statement Refinement**: Finalized the formal academic problem statement and the central research question: *"How can we combine RAM-level speed with persistence, recovery and event-driven monitoring?"*
2. **Comparative Study**: Formulated a structured taxonomy comparing Java `HashMap`, Guava/Caffeine caches, and RocksDB/LevelDB storage engines.
3. **Gap Analysis**: Identified the 5-way functional gap (Speed + Durability + Observability + Lifecycle + Concurrency) and articulated our academic value proposition.
4. **Architecture Modeling**: Designed the layered system architecture (`Client -> Facade -> Engine -> [WAL / Bus / Eviction / Concurrency]`).
5. **Data Flow Specification**: Specified conceptual sequence flows for standard `SET` (write-through logging) and `GET` (cache lookup with lazy TTL) operations.
6. **Technology Stack Decision**: Selected pure Java 17 with standard JDK libraries (zero external dependencies) to ensure effortless reproducibility and transparent white-box evaluation.
7. **Milestone Roadmap**: Established the semester schedule across Phase I, Phase II, Phase III, Phase IV, and Final ESE.
8. **Team Matrix Finalization**: Finalized module ownership: Sanchit (Durability/Recovery), Jay (Engine/Concurrency), and Nikhil (Events/Metrics/Testing).
9. **Presentation Preparation**: Designed and compiled the Phase-I evaluation slide deck for departmental review.
10. **Phase-I Deliverables Review**: Collated all Phase-I documents, architectural diagrams, and viva preparation questions for the project guide review.

### Week 2 Outcomes
* Complete Phase-I documentation package organized in `phase-1/`.
* Clear, beginner-friendly system architecture diagrams with component interface specifications.
* Verified roadmap ready for Phase-II engine implementation.

---

## 4. Overall Two-Week Synthesis

By the conclusion of Week 2, our team established a rock-solid theoretical, architectural, and planning foundation. We verified that our proposed module solves a genuine systems integration challenge while remaining pedagogically feasible and rigorously testable.
