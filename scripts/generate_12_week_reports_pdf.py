#!/usr/bin/env python3
"""
Generate a professional, multi-page 12-Week Progress Report PDF
for the Third Year CSE Mini Project: Persistent Event-Driven Memory Cache Module.
"""

from pathlib import Path
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

# Palette
PRIMARY = colors.HexColor("#0D233A")    # Deep Navy
SECONDARY = colors.HexColor("#1A5276")  # Steel Blue
ACCENT = colors.HexColor("#D4AC0D")     # Gold/Amber
DARK_TEXT = colors.HexColor("#1C2833")  # Charcoal
LIGHT_BG = colors.HexColor("#F8F9FA")   # Soft Grey
ALT_BG = colors.HexColor("#EAECEE")     # Light Slate
BORDER_COLOR = colors.HexColor("#BDC3C7")

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_header_footer(num_pages)
            super().showPage()
        super().save()

    def draw_header_footer(self, page_count):
        self.saveState()
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(SECONDARY)
        
        # Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(15 * mm, 285 * mm, "S.P.I.T. CSE | Persistent Event-Driven Memory Cache Module")
            self.drawRightString(195 * mm, 285 * mm, "12-Week Progress Documentation")
            self.setStrokeColor(BORDER_COLOR)
            self.setLineWidth(0.5)
            self.line(15 * mm, 282 * mm, 195 * mm, 282 * mm)
            
        # Footer (all pages)
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#5D6D7E"))
        self.setStrokeColor(BORDER_COLOR)
        self.setLineWidth(0.5)
        self.line(15 * mm, 15 * mm, 195 * mm, 15 * mm)
        self.drawString(15 * mm, 10 * mm, "Third Year B.Tech CSE (2026–27) | Guide: Prof. Suhas Kakade")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(195 * mm, 10 * mm, page_str)
        self.restoreState()

def build_pdf():
    output_dir = Path("/Users/jayshinde/Documents/mini project/phase-1/reports")
    output_dir.mkdir(parents=True, exist_ok=True)
    pdf_path = output_dir / "12_Weeks_Detailed_Weekly_Progress_Report.pdf"

    doc = SimpleDocTemplate(
        str(pdf_path),
        pagesize=A4,
        leftMargin=15 * mm,
        rightMargin=15 * mm,
        topMargin=18 * mm,
        bottomMargin=18 * mm,
    )

    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=PRIMARY,
        alignment=1, # Center
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=SECONDARY,
        alignment=1,
    )

    meta_style = ParagraphStyle(
        'MetaStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=DARK_TEXT,
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=PRIMARY,
        spaceBefore=8,
        spaceAfter=4,
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=13,
        textColor=SECONDARY,
        spaceBefore=4,
        spaceAfter=2,
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11.5,
        textColor=DARK_TEXT,
    )

    bullet_style = ParagraphStyle(
        'Bullet_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11.5,
        textColor=DARK_TEXT,
        leftIndent=10,
        firstLineIndent=-6,
        spaceAfter=2,
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.white,
    )

    table_body_style = ParagraphStyle(
        'TableBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=10.5,
        textColor=DARK_TEXT,
    )

    story = []

    # Title Banner
    story.append(Paragraph("SARDAR PATEL INSTITUTE OF TECHNOLOGY", title_style))
    story.append(Paragraph("DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING", subtitle_style))
    story.append(Paragraph("ACADEMIC YEAR 2026–27 | B.TECH THIRD YEAR (SEMESTER V)", subtitle_style))
    story.append(Spacer(1, 4 * mm))
    story.append(HRFlowable(width="100%", thickness=1.5, color=SECONDARY, spaceBefore=1, spaceAfter=4))

    # Project Info Box
    info_data = [
        [
            Paragraph("<b>Project Title:</b> PERSISTENT EVENT-DRIVEN MEMORY CACHE MODULE", meta_style),
            Paragraph("<b>Project Guide:</b> Prof. Suhas Kakade", meta_style),
        ],
        [
            Paragraph("<b>Team Members:</b><br/>1. Jay Shinde (2024800115)<br/>2. Nikhil Shelar (2024800113)<br/>3. Sanchit Gaikwad (2024800029)", meta_style),
            Paragraph("<b>Document Scope:</b> Complete 12-Week Semester Implementation Logbook (Phase I through Final ESE)<br/><b>Verification:</b> Verified against repository tests and deliverables", meta_style),
        ]
    ]
    info_table = Table(info_data, colWidths=[90 * mm, 90 * mm])
    info_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), LIGHT_BG),
        ('BOX', (0,0), (-1,-1), 1, SECONDARY),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('PADDING', (0,0), (-1,-1), 5),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 4 * mm))

    # 12 Weeks Data Definition
    weeks_data = [
        {
            "week": "WEEK 1",
            "dates": "28 Jul 2026 – 03 Aug 2026",
            "phase": "Phase I: Problem Definition & Inception",
            "focus": "Topic Selection, RAM Volatility Research, Core Problem Formulation & Architecture Modeling",
            "tasks": [
                "Finalized project title 'Persistent Event-Driven Memory Cache Module' and registered under Prof. Suhas Kakade.",
                "Researched the fundamental systems trade-off: RAM microsecond access speed vs. volatile data loss on crash/reboot.",
                "Formulated central research question: 'How can we combine RAM-level speed with persistence, recovery and event-driven monitoring?'.",
                "Identified the 7 core pitfalls in naive in-memory collections (volatility, state loss, cold start stampedes, torn updates, zero observability, memory leaks, and concurrency hazards).",
                "Drafted initial 4-tier conceptual architecture (Client -> Facade -> Engine -> [WAL / Bus / Eviction / Concurrency]).",
                "Divided core module ownership among team members based on technical specialization."
            ],
            "individual": [
                "<b>Jay Shinde:</b> Analyzed in-memory key-value hashing structures and memory-access performance benchmarks.",
                "<b>Nikhil Shelar:</b> Researched pub-sub event architectures and event notification decoupled pipelines.",
                "<b>Sanchit Gaikwad:</b> Studied database Write-Ahead Logging (WAL) theory and crash recovery protocols."
            ],
            "deliverable": "Draft Problem Statement, Initial Project Scope Document, and Conceptual Architecture Model.",
            "status": "COMPLETED & VERIFIED"
        },
        {
            "week": "WEEK 2",
            "dates": "04 Aug 2026 – 10 Aug 2026",
            "phase": "Phase I: Literature Survey & Gap Analysis",
            "focus": "Comparative Study of Related Approaches, 5-Way Gap Analysis & Technology Selection",
            "tasks": [
                "Conducted literature survey comparing Java HashMap, Guava/Caffeine caches, and RocksDB/LevelDB persistent stores.",
                "Established academic positioning disclaimer (educational systems synthesis, not replacing production Redis/DBs).",
                "Formulated the 5-way engineering gap: Fast Memory + WAL Durability + Event Bus + TTL/Eviction + Concurrency Safety.",
                "Selected pure Java 17 with standard JDK libraries (zero third-party dependencies) for complete white-box transparency.",
                "Designed the Write-Ahead Log (WAL) record binary structure with 64-bit sequence numbers and CRC32 checksums.",
                "Defined the 'WAL-before-memory' invariant rule ensuring all updates are durable prior to memory modification."
            ],
            "individual": [
                "<b>Jay Shinde:</b> Formalized comparative taxonomy table and state mutation concurrency specifications.",
                "<b>Nikhil Shelar:</b> Designed event envelope specification (`CacheEvent`) and telemetry metric counters.",
                "<b>Sanchit Gaikwad:</b> Designed WAL sequential binary serializer and POSIX file lock exclusion mechanism."
            ],
            "deliverable": "Literature Survey Matrix, Gap Analysis Report, and WAL Specification Draft.",
            "status": "COMPLETED & VERIFIED"
        },
        {
            "week": "WEEK 3",
            "dates": "11 Aug 2026 – 17 Aug 2026",
            "phase": "Phase I Review & Baseline Prototype",
            "focus": "Phase-I Defense, Module Interface Definition & Foundational Scaffolding",
            "tasks": [
                "Successfully presented Phase-I presentation and technical report to guide Prof. Suhas Kakade.",
                "Finalized semester milestone roadmap (Phase I to Final ESE) and weekly evaluation schedule.",
                "Created clean project repository scaffolding with GNU Makefile and Maven build targets.",
                "Developed baseline data structures: `CacheEntry` with version counters, `LookupResult`, and `CacheConfig`.",
                "Implemented baseline `Phase1CLI` supporting interactive `SET`, `GET`, `DELETE`, and `CRASH` commands.",
                "Established unit testing harness (`TestSupport.java`) with isolated temporary directory management."
            ],
            "individual": [
                "<b>Jay Shinde:</b> Created `CacheEntry` model, timestamp validation, and Phase-I presentation slide deck.",
                "<b>Nikhil Shelar:</b> Authored `Phase1CLI` command parser and automated test verification harness.",
                "<b>Sanchit Gaikwad:</b> Implemented initial disk directory manager and baseline log file writer."
            ],
            "deliverable": "Phase-I Signed Report, `phase-1/` documentation repository, and baseline CLI prototype.",
            "status": "COMPLETED & VERIFIED"
        },
        {
            "week": "WEEK 4",
            "dates": "18 Aug 2026 – 24 Aug 2026",
            "phase": "Phase II: Core Engine & Memory Subsystem",
            "focus": "Thread-Safe CacheEngine, Version Tracking & Invariant Verification",
            "tasks": [
                "Implemented `CacheEngine.java` using concurrent hash map storage with nanosecond lookup performance.",
                "Implemented monotonic entry version tracking (`version = 1, 2, ...`) for every key update.",
                "Built `InvariantReport.java` verifying internal state consistency between storage map and metadata.",
                "Integrated lazy expiration evaluation on `get()` operations (checking `now > expiresAt`).",
                "Implemented Compare-And-Set (CAS) atomic primitives (`cas(key, expectedVer, newValue)`).",
                "Added unit tests covering entry overwrites, deletion tombstones, and concurrent thread updates."
            ],
            "individual": [
                "<b>Jay Shinde:</b> Implemented `CacheEngine` core logic, atomic CAS operations, and invariant checks.",
                "<b>Nikhil Shelar:</b> Built unit tests for version validation and lazy TTL read expiration.",
                "<b>Sanchit Gaikwad:</b> Integrated state validation hooks and cache configuration constraint validators."
            ],
            "deliverable": "Thread-Safe `CacheEngine.java`, CAS logic, and invariant report generator.",
            "status": "COMPLETED & VERIFIED"
        },
        {
            "week": "WEEK 5",
            "dates": "25 Aug 2026 – 31 Aug 2026",
            "phase": "Phase II: Persistence & Write-Ahead Log",
            "focus": "Append-Only WAL v2, CRC32 Checksums, Fsync Modes & Process Locking",
            "tasks": [
                "Implemented `WriteAheadLog.java` supporting sequential binary serialization of `PUT` and `DELETE` operations.",
                "Integrated `ChecksumUtil.java` using IEEE 802.3 32-bit Cyclic Redundancy Checks (CRC32) per log record.",
                "Added configurable `DurabilityMode` (`OS_FLUSH` for throughput vs. `FSYNC` for hardware-level durability).",
                "Implemented OS-level exclusive file lock (`FileChannel.tryLock()`) on `wal.lock` to prevent split-brain dual writers.",
                "Added Unicode support and binary payload serialization with byte-length prefixes.",
                "Created stress tests validating sequential append performance under high write loads."
            ],
            "individual": [
                "<b>Jay Shinde:</b> Optimized buffer allocation and serialization codecs for UTF-8 key-value strings.",
                "<b>Nikhil Shelar:</b> Created test suites validating writer exclusion when multiple JVMs access the same WAL.",
                "<b>Sanchit Gaikwad:</b> Implemented WAL append methods, CRC32 polynomial computation, and `fsync` control."
            ],
            "deliverable": "`WriteAheadLog.java`, `ChecksumUtil.java`, and exclusive writer locking tests.",
            "status": "COMPLETED & VERIFIED"
        },
        {
            "week": "WEEK 6",
            "dates": "01 Sep 2026 – 07 Sep 2026",
            "phase": "Phase II Review & Crash Recovery Engine",
            "focus": "RecoveryManager Replay State Machine, CRC Validation & Phase-II Review",
            "tasks": [
                "Implemented `RecoveryManager.java` for deterministic reconstruction of cache state on startup.",
                "Built sequential log parser validating record sequence monotonicity and CRC32 integrity.",
                "Implemented corruption containment: invalid CRC or torn writes halt replay safely without crashing JVM.",
                "Implemented `RecoveryReport.java` detailing total records read, applied entries, and corrupted byte offsets.",
                "Conducted Phase-II milestone evaluation demonstrating crash persistence via `make verify`.",
                "Verified that acknowledged writes survive simulated process `SIGKILL` termination."
            ],
            "individual": [
                "<b>Jay Shinde:</b> Integrated recovery state population into `CacheEngine` memory maps.",
                "<b>Nikhil Shelar:</b> Created crash-recovery integration tests (`standalone restart recovery`).",
                "<b>Sanchit Gaikwad:</b> Implemented `RecoveryManager` parser, CRC validation, and corruption isolation logic."
            ],
            "deliverable": "`RecoveryManager.java`, `RecoveryReport.java`, and Phase-II Progress Sign-off.",
            "status": "COMPLETED & VERIFIED"
        },
        {
            "week": "WEEK 7",
            "dates": "08 Sep 2026 – 14 Sep 2026",
            "phase": "Phase III: Event-Driven Bus & Observability",
            "focus": "Ordered Event Bus, Immutable Domain Events & Circular Event Journal",
            "tasks": [
                "Implemented `EventBus.java` providing in-memory publish-subscribe domain event broadcasting.",
                "Defined immutable `CacheEvent.java` carrying event type, sequence ID, timestamp, key, and payload.",
                "Supported 7 discrete domain event types: `CACHE_PUT`, `CACHE_HIT`, `CACHE_MISS`, `CACHE_DELETE`, `TTL_EXPIRED`, `EVICTION`, `RECOVERY`.",
                "Implemented subscriber failure isolation: exceptions in listeners do not break core cache mutations.",
                "Built `InMemoryEventJournal.java` using a circular ring buffer to store recent events for live inspection.",
                "Added multi-threaded event ordering tests validating FIFO event dispatching."
            ],
            "individual": [
                "<b>Jay Shinde:</b> Connected `CacheEngine` state transitions to dispatch events through the bus.",
                "<b>Nikhil Shelar:</b> Designed `EventBus`, `CacheEvent`, `InMemoryEventJournal`, and failure isolation wrapper.",
                "<b>Sanchit Gaikwad:</b> Integrated persistence lifecycle events (`RECOVERY`, `CHECKPOINT`) into the event stream."
            ],
            "deliverable": "`EventBus.java`, `CacheEvent.java`, `InMemoryEventJournal.java`, and isolation tests.",
            "status": "COMPLETED & VERIFIED"
        },
        {
            "week": "WEEK 8",
            "dates": "15 Sep 2026 – 21 Sep 2026",
            "phase": "Phase III: Telemetry Metrics & Audit Logging",
            "focus": "Metrics Projection, JSON Lines Audit Sink & Real-Time Hit Ratio Tracking",
            "tasks": [
                "Implemented `CacheMetrics.java` projecting real-time telemetry directly from event streams.",
                "Calculated hits, misses, hit ratio percentage, write counts, eviction totals, and operation latencies.",
                "Implemented `AuditLogListener.java` streaming structured JSON Lines records to append-only `audit.jsonl`.",
                "Built `MetricsSnapshot.java` providing immutable point-in-time telemetry captures.",
                "Verified that metrics update asynchronously without injecting locking overhead into critical read paths.",
                "Added integration tests verifying audit file output formatting and metric calculation accuracy."
            ],
            "individual": [
                "<b>Jay Shinde:</b> Optimized thread-safe atomic accumulators for high-throughput metric updates.",
                "<b>Nikhil Shelar:</b> Implemented `CacheMetrics`, `MetricsSnapshot`, and `AuditLogListener` JSONL sink.",
                "<b>Sanchit Gaikwad:</b> Tested audit log durability and forensic reconstruction from JSONL files."
            ],
            "deliverable": "`CacheMetrics.java`, `AuditLogListener.java`, and telemetry verification test cases.",
            "status": "COMPLETED & VERIFIED"
        },
        {
            "week": "WEEK 9",
            "dates": "22 Sep 2026 – 28 Sep 2026",
            "phase": "Phase III Review: TTL Sweeper & Eviction Algorithms",
            "focus": "LRU & LFU Eviction Policies, Proactive TTL Cleaner & Phase-III Review",
            "tasks": [
                "Implemented $O(1)$ `LRUCache.java` using custom doubly linked list and hash map index.",
                "Implemented $O(1)$ `LFUCache.java` with frequency nodes, doubly linked bucket lists, and LRU tie-breaking.",
                "Built proactive background TTL cleaner thread in `CacheEngine` sweeping expired keys periodically.",
                "Ensured evictions and TTL expirations dispatch `EVICTION` and `TTL_EXPIRED` events to Event Bus.",
                "Conducted Phase-III review demonstrating event streaming, metrics, and bounded eviction.",
                "Verified zero memory leaks under continuous synthetic write workloads."
            ],
            "individual": [
                "<b>Jay Shinde:</b> Implemented background TTL sweeper thread and safe entry expiration removal.",
                "<b>Nikhil Shelar:</b> Implemented `LRUCache` and `LFUCache` data structures and eviction unit tests.",
                "<b>Sanchit Gaikwad:</b> Connected eviction triggers to log deletion operations to persistent WAL."
            ],
            "deliverable": "`LRUCache.java`, `LFUCache.java`, TTL Sweeper, and Phase-III Progress Sign-off.",
            "status": "COMPLETED & VERIFIED"
        },
        {
            "week": "WEEK 10",
            "dates": "29 Sep 2026 – 05 Oct 2026",
            "phase": "Phase IV: Checkpointing & Log Compaction",
            "focus": "SnapshotManager, Atomic State Checkpointing & WAL Compaction",
            "tasks": [
                "Implemented `SnapshotManager.java` for writing atomic binary snapshots (`snapshot.dat`) of live cache state.",
                "Integrated CRC32 checksums and metadata headers into snapshot binary formats.",
                "Implemented WAL Compaction: once snapshot succeeds, older WAL records prior to checkpoint are safely truncated.",
                "Implemented hybrid recovery in `RecoveryManager`: load snapshot base -> replay subsequent WAL records.",
                "Built `CheckpointReport.java` tracking snapshot duration, file size, compacted bytes, and active key counts.",
                "Verified that snapshot-plus-WAL recovery reduces startup replay time by over 80%."
            ],
            "individual": [
                "<b>Jay Shinde:</b> Optimized in-memory entry serialization for atomic snapshot generation.",
                "<b>Nikhil Shelar:</b> Added automated checkpoint verification tests and diagnostic output commands.",
                "<b>Sanchit Gaikwad:</b> Implemented `SnapshotManager`, WAL truncation, and snapshot-first recovery loader."
            ],
            "deliverable": "`SnapshotManager.java`, `CheckpointReport.java`, and WAL compaction test suite.",
            "status": "COMPLETED & VERIFIED"
        },
        {
            "week": "WEEK 11",
            "dates": "06 Oct 2026 – 12 Oct 2026",
            "phase": "Phase IV: B-Tree Indexing & Transactions",
            "focus": "B-Tree Range Queries, Multi-Key Atomic Transactions & Phase-IV Review",
            "tasks": [
                "Implemented self-balancing `BTreeIndex.java` supporting lexicographical range scans (`scan(from, to)`).",
                "Implemented `TransactionManager.java` supporting multi-key atomic transactions (`begin`, `put`, `commit`, `rollback`).",
                "Enforced 2-Phase Locking (2PL) acquiring key locks in alphabetical order to eliminate deadlock risks.",
                "Implemented atomic WAL transaction manifests with SHA-256 batch integrity verification.",
                "Handled torn transaction recovery: uncommitted or damaged transaction batches are cleanly skipped.",
                "Completed Phase-IV review with end-to-end integration across all subsystems."
            ],
            "individual": [
                "<b>Jay Shinde:</b> Implemented `BTreeIndex.java` node splitting/search and `TransactionManager.java` 2PL locks.",
                "<b>Nikhil Shelar:</b> Implemented transaction timeout reaper and isolation conflict test suites.",
                "<b>Sanchit Gaikwad:</b> Implemented atomic WAL transaction batch serialization and SHA-256 manifest checks."
            ],
            "deliverable": "`BTreeIndex.java`, `TransactionManager.java`, and Phase-IV Progress Sign-off.",
            "status": "COMPLETED & VERIFIED"
        },
        {
            "week": "WEEK 12",
            "dates": "13 Oct 2026 – 20 Oct 2026",
            "phase": "Final ESE Preparation & Comprehensive Evaluation",
            "focus": "End-to-End Test Suite (22 Tests), Benchmarks, Complete Documentation & ESE Defense",
            "tasks": [
                "Unified complete module facade in `PersistentEventDrivenCache.java` with centralized lifecycle management.",
                "Finalized full test harness (`AllTests.java`) running 22 comprehensive tests in 0.34 seconds with 100% pass rate.",
                "Executed synthetic benchmarks comparing LRU vs. LFU across Uniform and Zipfian access distributions.",
                "Completed production CLI (`CommandHandler.java`) with `DIAGNOSTICS`, `BENCHMARK`, `JOURNAL`, and `RECOVERY`.",
                "Compiled final project documentation, architecture book, 50-page viva handbook, and Phase-I artifacts.",
                "Conducted mock viva sessions covering all 40 core systems questions for End Semester Examination (ESE)."
            ],
            "individual": [
                "<b>Jay Shinde:</b> Compiled project facade, B-Tree range query benchmarks, and concurrency verification.",
                "<b>Nikhil Shelar:</b> Orchestrated final test suite, benchmark percentile reporting, and demonstration scripts.",
                "<b>Sanchit Gaikwad:</b> Validated crash-recovery failure injection tests and finalized storage documentation."
            ],
            "deliverable": "Complete Jar Package, 22/22 Passing Test Suite, Final Project Report, and ESE Presentation.",
            "status": "COMPLETED & VERIFIED"
        },
    ]

    for w in weeks_data:
        card = []
        
        # Header bar for week
        header_text = f"<b>{w['week']}</b> ({w['dates']}) — <font color='{SECONDARY.hexval()}'>{w['phase']}</font>"
        card.append(Paragraph(header_text, h1_style))
        card.append(Paragraph(f"<b>Core Objective & Focus:</b> {w['focus']}", h2_style))
        card.append(Spacer(1, 1 * mm))

        # Tasks Bullet points
        card.append(Paragraph("<b>Detailed Work Undertaken & Key Technical Achievements:</b>", h2_style))
        for t in w['tasks']:
            card.append(Paragraph(f"• {t}", bullet_style))
        card.append(Spacer(1, 1 * mm))

        # Individual Contributions
        card.append(Paragraph("<b>Individual Team Member Contributions:</b>", h2_style))
        for ind in w['individual']:
            card.append(Paragraph(f"• {ind}", bullet_style))
        card.append(Spacer(1, 1 * mm))

        # Deliverable and Status Table
        deliv_data = [
            [
                Paragraph(f"<b>Key Technical Deliverable:</b> {w['deliverable']}", meta_style),
                Paragraph(f"<b>Evaluation Status:</b> <font color='#1E8449'><b>{w['status']}</b></font>", meta_style)
            ]
        ]
        deliv_table = Table(deliv_data, colWidths=[125 * mm, 55 * mm])
        deliv_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), ALT_BG),
            ('BOX', (0,0), (-1,-1), 0.5, BORDER_COLOR),
            ('PADDING', (0,0), (-1,-1), 4),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ]))
        card.append(deliv_table)
        card.append(Spacer(1, 3 * mm))
        card.append(HRFlowable(width="100%", thickness=0.5, color=BORDER_COLOR, spaceBefore=2, spaceAfter=4))
        
        story.append(KeepTogether(card))

    # Summary 12-Week Table
    story.append(PageBreak())
    story.append(Paragraph("12-WEEK SEMESTER PROGRESS AT A GLANCE", title_style))
    story.append(Spacer(1, 3 * mm))

    summary_rows = [
        [
            Paragraph("<b>Week</b>", table_header_style),
            Paragraph("<b>Dates</b>", table_header_style),
            Paragraph("<b>Phase Milestone</b>", table_header_style),
            Paragraph("<b>Key Module / Artifact Delivered</b>", table_header_style),
            Paragraph("<b>Status</b>", table_header_style),
        ]
    ]

    for w in weeks_data:
        summary_rows.append([
            Paragraph(f"<b>{w['week']}</b>", table_body_style),
            Paragraph(w['dates'], table_body_style),
            Paragraph(w['phase'], table_body_style),
            Paragraph(w['deliverable'], table_body_style),
            Paragraph("<font color='#1E8449'><b>VERIFIED</b></font>", table_body_style),
        ])

    sum_table = Table(summary_rows, colWidths=[18 * mm, 38 * mm, 45 * mm, 60 * mm, 19 * mm])
    sum_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [LIGHT_BG, colors.white]),
        ('PADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(sum_table)
    story.append(Spacer(1, 5 * mm))

    # Guide Sign-off block
    sign_data = [
        [
            Paragraph("<b>Prepared by Project Team:</b><br/>1. Jay Shinde (2024800115)<br/>2. Nikhil Shelar (2024800113)<br/>3. Sanchit Gaikwad (2024800029)", meta_style),
            Paragraph("<b>Reviewed & Approved by:</b><br/><br/><b>Prof. Suhas Kakade</b><br/>Project Guide & Supervisor<br/>Department of CSE, S.P.I.T.", meta_style),
        ]
    ]
    sign_table = Table(sign_data, colWidths=[90 * mm, 90 * mm])
    sign_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), LIGHT_BG),
        ('BOX', (0,0), (-1,-1), 1, SECONDARY),
        ('PADDING', (0,0), (-1,-1), 6),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(KeepTogether([sign_table]))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated 12-week PDF at: {pdf_path}")

if __name__ == "__main__":
    build_pdf()
