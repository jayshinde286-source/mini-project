#!/usr/bin/env python3
"""Create an exactly 30-page, rubric-aware ESE viva and explanation handbook."""

from __future__ import annotations

import re
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    Image,
    KeepInFrame,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

from create_viva_pdf import (
    CYAN,
    CORAL,
    GREEN,
    LIGHT,
    NAVY,
    PAPER,
    SLATE,
    VIOLET,
    extract_sections,
    inline_markup,
    page_flowables,
    register_fonts,
    styles,
)


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs" / "VIVA_HANDBOOK_50_PAGES.md"
OUTPUT = ROOT / "output" / "pdf" / "PERSISTENT_EVENT_DRIVEN_CACHE_ESE_VIVA_EXPLANATION_30_PAGES.pdf"
LOGO = ROOT / "tmp" / "pdfs" / "ese-viva-30" / "spitlogo.png"


def ascii_hyphens(text: str) -> str:
    return text.replace("—", "-").replace("–", "-").replace("‑", "-")


CUSTOM_EVALUATION_LEFT = """
### Official identity

**Institute:** Sardar Patel Institute of Technology, Department of Computer Science and Engineering.

**Academic year:** 2026-27, Third Year Mini Project I, Semester V.

**Group 15:** Sanchit Gaikwad (2024800029), Jay Shinde (2024800115), and Nikhil Shelar (2024800113).

**Guide:** Prof. Suhas Kakade.

### Official evaluation schedule

| Stage | Date | Evaluator |
|---|---|---|
| Phase I | 17 Aug 2026 | Guide |
| Phase II | 02 Sep 2026 | Guide |
| Phase III | 30 Sep 2026 | Guide |
| Phase IV | 12 Oct 2026 | Guide |
| ESE | 02 Nov 2026 | Industry expert / alumni |

### Mark-sheet weights

Each internal phase contains P1 = 10, P2 = 5, P3 = 5, and P4 = 5, totaling 25. The ESE contains P1 = 20, P2 = 20, P3 = 30, and P4 = 20. The supplied mark sheet gives codes and weights but not the descriptive rubric labels, so this handbook prepares evidence across problem quality, architecture, implementation, validation, communication, and individual ownership without pretending those are official label names.
"""


CUSTOM_EVALUATION_RIGHT = """
### Full-marks defence strategy

1. Start with the problem and central invariant, not a list of classes.
2. Prove every claim with one of four evidence types: source code, automated test, durable file, or live command output.
3. Clearly separate implemented guarantees from planned extensions.
4. Let all three students explain the complete system, while each student owns a five-minute deep dive.
5. Demonstrate failure behavior, because recovery software is judged by what happens when execution stops unexpectedly.

### Evidence pyramid

| Claim | Strongest evidence |
|---|---|
| Acknowledged writes survive restart | restart recovery test and live crash drill |
| Transactions recover atomically | SHA-256 batch-manifest corruption test |
| Ordered queries are real | B-tree split/range/delete test |
| Concurrency is controlled | CAS, conflict, timeout, and 100-write tests |
| Event-driven behavior is useful | metrics, JSONL audit, event journal, listener-failure count |
| Project is professionally packaged | Java 17 JAR, package boundaries, docs, make targets |

### Examiner-facing sentence

> Our project is not merely a HashMap saved to a file. It is a failure-aware state module whose acknowledged operations have durable evidence, whose recovery is deterministic, whose observers are decoupled, and whose important guarantees are executable tests.
"""


CUSTOM_V3_INTEGRITY = """
### Why version 3 was necessary

Per-record CRC32 answers: "Was this line damaged?" It does not answer: "Did recovery receive every operation that belonged to the committed transaction?" If one TX_SET line is checksum-invalid but the COMMIT line remains valid, replaying the remaining records would create a partial transaction.

### Commit manifest design

Before appending a transaction batch, `TransactionBatchIntegrity` hashes a canonical, length-prefixed representation of every operation: operation type, key, value, and expiry timestamp. COMMIT stores `TXI1:operationCount:sha256Digest`.

```text
BEGIN TX-7
TX_SET account:A 5000
TX_SET account:B 15000
COMMIT TXI1:2:4f...c9
```

Recovery groups transaction records, recomputes the digest, checks the count, rejects aborted IDs, and classifies the batch as VERIFIED, LEGACY_UNVERIFIED, or INVALID. Only verified and backward-compatible legacy batches may replay.

### Failure injection proof

The test commits two keys, corrupts one TX_SET checksum, restarts, and asserts that neither key exists. Recovery reports one checksum failure and one rejected transaction batch. This closes the atomicity gap documented in the earlier handbook.

### Honest security claim

SHA-256 here proves structural completeness, not writer authentication. A malicious actor who can rewrite the log and recompute the digest is outside the threat model; production hardening would use a keyed MAC or authenticated encryption.
"""


CUSTOM_DIAGNOSTICS = """
### One-command ESE evidence

`DIAGNOSTICS` (alias `EVIDENCE`) creates a read-only `DiagnosticsReport` that combines:

- generation time and uptime;
- entry count, active transactions, WAL sequence and durability mode;
- map-versus-B-tree invariant status;
- recovery counters, including rejected and legacy transaction batches;
- event-derived metrics;
- event publication, delivery and listener-failure statistics;
- WAL, snapshot and audit-file sizes.

```text
cache> DIAGNOSTICS
DIAGNOSTICS ... health=HEALTHY entries=2 activeTx=0
STORAGE walBytes=... snapshotBytes=... auditBytes=...
EVENTS published=... deliveries=... listenerFailures=0
snapshot=... walApplied=... rejectedTxBatches=0 ...
hits=... misses=... hitRate=... puts=...
```

This command is valuable because it does not manufacture separate demo-only state. It asks the same service, recovery report, metrics projection, event bus, and filesystem that the real module uses. The evidence remains traceable to production paths.

### Viva quick answer

Q: Why is diagnostics a record rather than formatted text inside the service?

A: The service returns typed facts. The CLI owns presentation. Tests or a future HTTP adapter can consume the same report without parsing console text.
"""


CUSTOM_EVIDENCE = """
### Ten-minute live demonstration

1. Run `make verify` and show all 22 tests passing plus the executable JAR.
2. Start the CLI and execute `SET account:A 10000`, `SETEX otp 5000 123456`, `GET account:A`, and `RANGE account:A account:Z`.
3. Open a transaction, update two accounts, and commit.
4. Run `EVENTS 12`, `METRICS`, `HEALTH`, and `DIAGNOSTICS`.
5. Stop and restart the process with the same paths.
6. Run `RECOVERY`, `SHOW`, and `HEALTH` to prove restart correctness.
7. Run `CHECKPOINT COMPACT`, restart again, and show that versions continue above the snapshot boundary.

### What to say while demonstrating

- Before SET: "The mutation lock establishes one legal write order."
- After SET: "Success was returned only after WAL append under the selected durability mode."
- During COMMIT: "Operations and the manifest-bearing COMMIT are appended as one synchronized batch."
- After restart: "Snapshot provides the base; WAL replays only later valid records."
- During HEALTH: "The exact-key map and ordered B-tree are compared, not assumed consistent."

### Recovery drill safety

Use isolated demo paths under `target/demo`. Never corrupt the real `data/` directory during evaluation. The automated test already performs safe checksum and transaction-manifest failure injection in a temporary directory.
"""


CUSTOM_RUBRIC_LEFT = """
### Evidence mapped to the supplied ESE columns

| Column | Weight | Prepared evidence |
|---|---:|---|
| P1 | 20 | exact problem, objective, constraints, literature gap, scope |
| P2 | 20 | architecture, WAL ordering, events, B-tree, transaction design |
| P3 | 30 | working JAR, 22 tests, failure injection, restart demo, benchmarks |
| P4 | 20 | report quality, diagrams, team ownership, live explanation, viva |

The descriptions above are a preparation map, not claimed official rubric names; only the codes and weights are visible in the provided mark sheet. The practical goal is to ensure no evaluator dimension lacks evidence.

### Submission evidence index

- `README.md`: build, commands, guarantees, limitations.
- `docs/ARCHITECTURE.md`: write, transaction, recovery, concurrency decisions.
- `docs/TEST_PLAN.md`: 22-test risk/evidence matrix.
- `docs/OBJECTIVES_AND_SCOPE.md`: measurable objectives and honest boundaries.
- `target/persistent-event-driven-cache-3.0.0.jar`: executable deliverable.
- this handbook: ESE explanation, viva bank, pitch, and checklist.
"""


CUSTOM_RUBRIC_RIGHT = """
### How to answer for marks

Use the CLAIM-EVIDENCE-BOUNDARY pattern:

1. **Claim:** State one precise guarantee.
2. **Evidence:** Name the class, test, command, or durable artifact that proves it.
3. **Boundary:** State what the guarantee deliberately does not cover.

Example: "A committed transaction recovers all-or-nothing. TransactionManager writes the operations plus a count-and-SHA-256 COMMIT manifest; the damaged-transaction integration test corrupts one member and proves the entire batch is rejected. This protects accidental corruption, not malicious rewriting without a MAC."

### Common mark-losing mistakes

- Calling the project distributed, database-grade, or production-ready.
- Showing only successful CRUD and no crash/corruption path.
- Confusing CRC32 error detection with encryption.
- Claiming every operation is O(1) while WAL force and B-tree work exist.
- Letting one student answer all technical questions.
- Reading slides instead of pointing to executable evidence.

### Strong closing line

> We optimized the project for explainable correctness: each major feature has an invariant, a failure mode, an observable counter, and a repeatable test.
"""


CUSTOM_TEAM = """
### Three-student ownership plan

**Sanchit Gaikwad - persistence and recovery lead**

Own WAL V2, CRC32, SHA-256 transaction manifest, snapshots, compaction, restart sequence, and failure matrix. Demo corrupted transaction rejection and explain WAL-before-memory.

**Jay Shinde - cache engine and concurrency lead**

Own the map/B-tree invariant, range queries, TTL, CAS, transaction locks, thread-safety model, LRU/LFU algorithms, and benchmark interpretation. Demo HEALTH, CAS rejection, and RANGE.

**Nikhil Shelar - events, observability, testing and delivery lead**

Own event bus, audit listener, in-memory journal, metrics projection, diagnostics, CLI, build/JAR packaging, and the 22-test catalogue. Demo EVENTS, METRICS, DIAGNOSTICS, and `make verify`.

### Cross-knowledge rule

Ownership means who leads the explanation, not who alone understands it. Every student must answer the main objective, architecture, WAL ordering, transaction atomicity, limitations, and two-minute pitch. Examiners often redirect a question to verify genuine teamwork.

### Handover sequence

Sanchit: problem and durability -> Jay: engine, algorithms and concurrency -> Nikhil: events, evidence and tests -> all three: limitations and future roadmap.
"""


PAGE_SPECS = [
    ("ESE evaluation map and schedule", CUSTOM_EVALUATION_LEFT, CUSTOM_EVALUATION_RIGHT),
    ("Executive summary and central objective", [1], [2]),
    ("Problem, motivation, scope, and academic fit", [3], [4, 5]),
    ("Requirements and system architecture", [6], [7]),
    ("Professional package structure and domain model", [8], [9]),
    ("Event-driven architecture and event bus", [10], [11]),
    ("Event catalogue, metrics, audit, and projections", [12], [13]),
    ("Durable write path and versioned WAL format", [14], [15]),
    ("Version 3 transaction integrity and corruption handling", CUSTOM_V3_INTEGRITY, [16]),
    ("Durability modes, snapshots, and checkpoints", [17], [18]),
    ("Recovery algorithm and failure matrix", [19], [20]),
    ("Cache engine internals and B-tree rationale", [21], [22]),
    ("B-tree insertion, range algorithm, and complexity", [23], [39]),
    ("LRU, LFU, workloads, and benchmark interpretation", [24, 25], [26]),
    ("TTL semantics and optimistic concurrency", [27], [28]),
    ("Transaction state machine, locks, and conflicts", [29], [30]),
    ("Transaction atomicity and thread safety", [31], [32]),
    ("Invariants, health checks, CLI, and public API", [33], [34]),
    ("Configuration, lifecycle, and diagnostics", [35], CUSTOM_DIAGNOSTICS),
    ("Testing strategy and automated evidence catalogue", [36], [37]),
    ("Live demonstration plan and evidence command", [38], CUSTOM_EVIDENCE),
    ("Performance, reliability, and security model", [39], [40]),
    ("Limitations, engineering trade-offs, and roadmap", [41], [42]),
    ("ESE rubric-to-evidence matrix and answering method", CUSTOM_RUBRIC_LEFT, CUSTOM_RUBRIC_RIGHT),
    ("Team ownership and presentation division", [43], CUSTOM_TEAM),
    ("Viva bank I: fundamentals, WAL, and recovery", [44], [45]),
    ("Viva bank II: events, observability, and algorithms", [46], [47]),
    ("Viva bank III: transactions and difficult questions", [48], [49]),
    ("Final defence, two-minute pitch, and submission checklist", [50], None),
]


def short_title(section: str) -> str:
    first = ascii_hyphens(section.splitlines()[0].removeprefix("## ").strip())
    return re.sub(r"^Page \d+ of 50\s*-\s*", "", first)


def content_for(source, old_sections, style_map, width):
    if source is None:
        return []
    if isinstance(source, str):
        synthetic = "## Custom\n" + ascii_hyphens(source.strip())
        return page_flowables(synthetic, style_map, width)[2:]
    result = []
    for section_number in source:
        section = ascii_hyphens(old_sections[section_number - 1])
        result.append(Paragraph(inline_markup(short_title(section)), style_map["h3"]))
        result.extend(page_flowables(section, style_map, width)[2:])
    return result


class EseDocTemplate(BaseDocTemplate):
    def __init__(self, filename: str, page_titles: list[str]):
        self.page_titles = page_titles
        width, height = A4
        frame = Frame(
            13 * mm,
            13 * mm,
            width - 26 * mm,
            height - 24 * mm,
            leftPadding=0,
            rightPadding=0,
            topPadding=8 * mm,
            bottomPadding=6 * mm,
            id="content",
        )
        super().__init__(
            filename,
            pagesize=A4,
            title="Persistent Event-Driven Memory Cache Module - 30 Page ESE Viva and Explanation",
            author="Sanchit Gaikwad, Jay Shinde, Nikhil Shelar",
            subject="SPIT CSE Mini Project I ESE defence handbook, academic year 2026-27",
        )
        self.addPageTemplates(PageTemplate(id="ese", frames=[frame], onPage=self.draw_page))

    def draw_page(self, canvas, document) -> None:
        page = canvas.getPageNumber()
        width, height = A4
        chapter_colors = [CYAN, VIOLET, CORAL, GREEN]
        accent = chapter_colors[min(3, max(0, (page - 2) // 8))]
        canvas.saveState()
        canvas.setFillColor(PAPER)
        canvas.rect(0, 0, width, height, fill=1, stroke=0)
        if page == 1:
            canvas.setFillColor(NAVY)
            canvas.rect(0, height - 72 * mm, width, 72 * mm, fill=1, stroke=0)
            canvas.setFillColor(CYAN)
            canvas.rect(0, height - 76 * mm, width, 4 * mm, fill=1, stroke=0)
        else:
            canvas.setFillColor(accent)
            canvas.rect(0, height - 5.5 * mm, width, 5.5 * mm, fill=1, stroke=0)
            canvas.setFont("Body-Bold", 6.7)
            canvas.setFillColor(SLATE)
            canvas.drawString(13 * mm, 7 * mm, "SPIT CSE  |  MINI PROJECT I  |  ESE 2026-27")
            canvas.drawRightString(width - 13 * mm, 7 * mm, f"ESE HANDBOOK  |  {page} / 30")
        key = f"ese-page-{page}"
        canvas.bookmarkPage(key)
        canvas.addOutlineEntry(self.page_titles[page - 1], key, level=0, closed=False)
        canvas.restoreState()


def cover_flowables() -> list:
    cover_title = ParagraphStyle(
        "CoverTitle", fontName="Body-Bold", fontSize=24, leading=27,
        textColor=colors.white, alignment=TA_CENTER, spaceAfter=7,
    )
    cover_subtitle = ParagraphStyle(
        "CoverSubtitle", fontName="Body", fontSize=10.5, leading=14,
        textColor=colors.HexColor("#DDEBFA"), alignment=TA_CENTER,
    )
    center_title = ParagraphStyle(
        "CenterTitle", fontName="Body-Bold", fontSize=14, leading=18,
        textColor=NAVY, alignment=TA_CENTER, spaceAfter=5,
    )
    center_body = ParagraphStyle(
        "CenterBody", fontName="Body", fontSize=9.5, leading=13,
        textColor=NAVY, alignment=TA_CENTER,
    )
    team_style = ParagraphStyle(
        "Team", fontName="Body", fontSize=8.8, leading=11.5, textColor=NAVY,
    )
    logo = Image(str(LOGO), width=24 * mm, height=24 * mm)
    logo.hAlign = "CENTER"
    team_data = [
        [Paragraph("<b>Student</b>", team_style), Paragraph("<b>UID</b>", team_style), Paragraph("<b>Defence lead</b>", team_style)],
        [Paragraph("Sanchit Gaikwad", team_style), Paragraph("2024800029", team_style), Paragraph("Persistence and recovery", team_style)],
        [Paragraph("Jay Shinde", team_style), Paragraph("2024800115", team_style), Paragraph("Engine and concurrency", team_style)],
        [Paragraph("Nikhil Shelar", team_style), Paragraph("2024800113", team_style), Paragraph("Events, testing and delivery", team_style)],
    ]
    team_table = Table(team_data, colWidths=[48 * mm, 36 * mm, 73 * mm])
    team_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#D4DCE8")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    return [
        Spacer(1, 4 * mm),
        Paragraph("PERSISTENT EVENT-DRIVEN<br/>MEMORY CACHE MODULE", cover_title),
        Paragraph("Enhanced Version 3.0 | ESE Viva and Technical Explanation | Exactly 30 Pages", cover_subtitle),
        Spacer(1, 24 * mm),
        logo,
        Spacer(1, 4 * mm),
        Paragraph("Sardar Patel Institute of Technology", center_title),
        Paragraph("Department of Computer Science and Engineering<br/>Mini Project I - Third Year B.Tech - Academic Year 2026-27", center_body),
        Spacer(1, 9 * mm),
        team_table,
        Spacer(1, 8 * mm),
        Paragraph("<b>Project Guide:</b> Prof. Suhas Kakade", center_body),
        Spacer(1, 4 * mm),
        Paragraph("<b>End Semester Evaluation:</b> 02 November 2026 | Industry Expert / Alumni", center_body),
        Spacer(1, 11 * mm),
        Paragraph("Durability | Recovery | Events | Transactions | B-tree | TTL | Concurrency | Diagnostics | 22 Tests", center_body),
    ]


def page_content(title, left, right, old_sections, style_map, available_width):
    header = ParagraphStyle(
        "EsePageTitle", fontName="Body-Bold", fontSize=14.4, leading=17.2,
        textColor=NAVY, spaceAfter=5,
    )
    items = [Paragraph(inline_markup(title), header)]
    if right is None:
        full = content_for(left, old_sections, style_map, available_width)
        items.append(KeepInFrame(available_width, 225 * mm, full, mode="shrink", mergeSpace=True))
        return items
    gap = 6 * mm
    column_width = (available_width - gap) / 2
    left_items = content_for(left, old_sections, style_map, column_width)
    right_items = content_for(right, old_sections, style_map, column_width)
    columns = Table(
        [[
            KeepInFrame(column_width, 224 * mm, left_items, mode="shrink", mergeSpace=True),
            KeepInFrame(column_width, 224 * mm, right_items, mode="shrink", mergeSpace=True),
        ]],
        colWidths=[column_width, column_width],
        rowHeights=[224 * mm],
        hAlign="LEFT",
    )
    columns.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (0, 0), 0),
        ("RIGHTPADDING", (0, 0), (0, 0), gap / 2),
        ("LEFTPADDING", (1, 0), (1, 0), gap / 2),
        ("RIGHTPADDING", (1, 0), (1, 0), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ("LINEBEFORE", (1, 0), (1, 0), 0.65, colors.HexColor("#DDE3EC")),
    ]))
    items.append(columns)
    return items


def main() -> None:
    register_fonts()
    if not LOGO.exists():
        raise FileNotFoundError(f"Convert the supplied SPIT logo to PNG first: {LOGO}")
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    sections = extract_sections(SOURCE.read_text(encoding="utf-8"))
    if len(PAGE_SPECS) != 29:
        raise ValueError(f"Expected 29 content page specs after cover, found {len(PAGE_SPECS)}")
    style_map = styles()
    style_map["body"].fontSize = 8.15
    style_map["body"].leading = 10.35
    style_map["bullet"].fontSize = 7.95
    style_map["bullet"].leading = 9.8
    style_map["number"].fontSize = 7.95
    style_map["number"].leading = 9.8
    style_map["h3"].fontSize = 9.2
    style_map["h3"].leading = 10.8
    style_map["table"].fontSize = 6.3
    style_map["table_head"].fontSize = 6.3

    page_titles = ["Cover"] + [spec[0] for spec in PAGE_SPECS]
    document = EseDocTemplate(str(OUTPUT), page_titles)
    available_width = A4[0] - 26 * mm
    story = cover_flowables()
    for title, left, right in PAGE_SPECS:
        story.append(PageBreak())
        story.extend(page_content(title, left, right, sections, style_map, available_width))
    document.build(story)
    print(f"Created {OUTPUT}")


if __name__ == "__main__":
    main()
