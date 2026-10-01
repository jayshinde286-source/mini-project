import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

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
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))
        
        # Header (on pages 2 and later)
        if self._pageNumber > 1:
            self.drawString(54, 750, "SPIT Cache Module — Phase 4 Engineering Roadmap")
            self.drawRightString(558, 750, "Sardar Patel Institute of Technology, Mumbai")
            self.setStrokeColor(colors.HexColor("#cbd5e1"))
            self.setLineWidth(0.5)
            self.line(54, 742, 558, 742)
            
        # Footer
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.5)
        self.line(54, 45, 558, 45)
        self.drawString(54, 32, "Confidential — Academic Year 2026–27 | Department of Computer Science & Engineering")
        self.drawRightString(558, 32, f"Page {self._pageNumber} of {page_count}")
        self.restoreState()

def build_pdf(filename="Phase_4_Roadmap.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=colors.HexColor('#0f172a'),
        spaceAfter=6
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#475569'),
        spaceAfter=15
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=19,
        textColor=colors.HexColor('#1e293b'),
        spaceBefore=14,
        spaceAfter=8,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor('#334155'),
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=14,
        textColor=colors.HexColor('#334155'),
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'Bullet_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#334155'),
        leftIndent=15,
        firstLineIndent=-10,
        spaceAfter=3
    )

    callout_style = ParagraphStyle(
        'CalloutText',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#1e40af')
    )

    story = []

    # Title & Metadata Banner
    story.append(Paragraph("SPIT Cache Module", title_style))
    story.append(Paragraph("<b>Phase 4 Engineering Roadmap: Distributed Clustering, Raft Consensus & RESP3 Protocol</b>", subtitle_style))
    
    meta_table = Table([
        [
            Paragraph("<b>Institution:</b> Sardar Patel Institute of Technology (SPIT)", body_style),
            Paragraph("<b>Academic Year:</b> 2026–27 | Semester: V", body_style)
        ],
        [
            Paragraph("<b>Department:</b> Computer Science & Engineering", body_style),
            Paragraph("<b>Subject:</b> Mini Project (PR1) — Phase 4 Roadmap", body_style)
        ],
        [
            Paragraph("<b>Project Team:</b> Jay Shinde, Nikhil Shelar, Sanchit Gaikwad", body_style),
            Paragraph("<b>Faculty Guide:</b> Prof. Suhas Kakade", body_style)
        ]
    ], colWidths=[250, 254])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#e2e8f0')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#f1f5f9')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 15))

    # Executive Summary Callout
    callout_data = [[
        Paragraph(
            "<b>Strategic Vision:</b> While Phase 2 established UI/UX modeling and Phase 3 completed the single-node persistent core (WAL + Snapshots + Two-Phase Recovery), <b>Phase 4 transitions SPIT Cache into an enterprise-grade distributed system</b> capable of horizontal sharding, multi-node Raft consensus replication, and seamless integration with existing Redis client libraries.",
            callout_style
        )
    ]]
    callout_tbl = Table(callout_data, colWidths=[504])
    callout_tbl.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#eff6ff')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#bfdbfe')),
        ('LEFTPADDING', (0,0), (-1,-1), 12),
        ('RIGHTPADDING', (0,0), (-1,-1), 12),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(callout_tbl)
    story.append(Spacer(1, 15))

    # Section 1: Objectives & Scope
    story.append(Paragraph("1. Phase 4 Objectives & Strategic Scope", h1_style))
    story.append(Paragraph(
        "Phase 4 addresses the single-node capacity and single-point-of-failure constraints of Phase 3. The primary engineering goals are:",
        body_style
    ))
    story.append(Paragraph("• <b>High Availability (HA):</b> Zero downtime failover when an active master node crashes via automated leader election.", bullet_style))
    story.append(Paragraph("• <b>Horizontal Scalability:</b> Partitioning cache keys across an elastic ring of cluster nodes using Consistent Hashing.", bullet_style))
    story.append(Paragraph("• <b>Consensus Replication:</b> Strong distributed durability via Raft quorum commits across 3 to 5 storage nodes.", bullet_style))
    story.append(Paragraph("• <b>Ecosystem Interoperability:</b> Redis RESP3 wire protocol compatibility to allow drop-in replacement in existing enterprise stacks.", bullet_style))
    story.append(Spacer(1, 10))

    # Section 2: Architecture Evolution
    story.append(Paragraph("2. Architectural Evolution: Single-Node to Distributed Cluster", h1_style))
    
    arch_data = [
        ["Subsystem Dimension", "Phase 3 (Single-Node Core)", "Phase 4 (Clustered Architecture)"],
        ["Topology", "Standalone single-process engine", "3-to-5 Node Raft Replicated Cluster"],
        ["Durability Scope", "Local disk append (wal.log + snapshot.bin)", "Distributed Replicated Log (Quorum Commits)"],
        ["Capacity Limit", "Bounded by single host RAM", "Distributed RAM partitioning across cluster nodes"],
        ["Client Interface", "HTTP/REST & Server-Sent Events", "Redis RESP3 TCP Socket + HTTP Gateway"],
        ["Failure Model", "Crash recovery via local log replay", "Automated sub-second leader election failover"],
        ["Sharding", "No sharding (monolithic memory index)", "Consistent Hashing Ring with 128 Virtual Nodes"]
    ]
    arch_table = Table(arch_data, colWidths=[120, 190, 194])
    arch_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1e293b')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,0), 8.5),
        ('BOTTOMPADDING', (0,0), (-1,0), 6),
        ('TOPPADDING', (0,0), (-1,0), 6),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('FONTNAME', (0,1), (-1,-1), 'Helvetica'),
        ('FONTSIZE', (0,1), (-1,-1), 8),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#f8fafc')]),
        ('TOPPADDING', (0,1), (-1,-1), 5),
        ('BOTTOMPADDING', (0,1), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(arch_table)
    story.append(Spacer(1, 15))

    story.append(PageBreak())

    # Section 3: Core Technical Pillars of Phase 4
    story.append(Paragraph("3. Core Technical Pillars of Phase 4 Implementation", h1_style))

    story.append(Paragraph("Pillar A: Raft Consensus Replicated State Machine", h2_style))
    story.append(Paragraph(
        "The single-node `WalManager` will be upgraded into a distributed Raft consensus engine. Each node maintains three internal states: <i>Follower</i>, <i>Candidate</i>, or <i>Leader</i>. Heartbeats (every 150ms) monitor node liveness. Write transactions are acknowledged to clients only after a quorum of nodes ($Q = \\lfloor N/2 \\rfloor + 1$) have successfully appended the record to their local WAL.",
        body_style
    ))

    story.append(Paragraph("Pillar B: Consistent Hashing & Virtual Nodes", h2_style))
    story.append(Paragraph(
        "To distribute keys evenly without full reshuffling when nodes join or leave, a 32-bit consistent hashing ring will be deployed. Each physical server maps to 128 virtual nodes (tokens) on the ring. Key routing uses MD5 or Murmur3 hashes to find the successor node on the ring in $O(\\log V)$ time via binary search.",
        body_style
    ))

    story.append(Paragraph("Pillar C: Redis Serialization Protocol (RESP3) Adapter", h2_style))
    story.append(Paragraph(
        "A native TCP listener on port 6379 will decode RESP3 frames. Commands supported will include: <code>GET</code>, <code>SET</code>, <code>DEL</code>, <code>EXPIRE</code>, <code>TTL</code>, <code>PING</code>, <code>INFO</code>, and <code>CLUSTER NODES</code>. This enables existing production microservices built in Java, Python, Go, and Node.js to use SPIT Cache as an official Redis alternative without changing client drivers.",
        body_style
    ))

    story.append(Paragraph("Pillar D: Chaos Engineering & Fault Injection Testbed", h2_style))
    story.append(Paragraph(
        "To satisfy rigorous verification criteria, Phase 4 will introduce automated network partition simulations (split-brain scenarios), abrupt leader node kills, and packet delay injection using Jepsen-style automated test harnesses.",
        body_style
    ))
    story.append(Spacer(1, 10))

    # Section 4: Work Breakdown Structure (WBS)
    story.append(Paragraph("4. Work Breakdown Structure & Milestones (16-Week Plan)", h1_style))

    wbs_data = [
        ["Sprint", "Core Deliverable", "Technical Focus & Verification", "Nature"],
        ["Sprints 1–3 (W1–6)", "Raft Consensus Core", "Leader election, AppendEntries RPC, log replication across 3 nodes", "Mandatory"],
        ["Sprints 4–5 (W7–10)", "Consistent Hashing Ring", "Virtual node distribution, ring topology, key rebalancing migrations", "Mandatory"],
        ["Sprints 6–7 (W11–13)", "RESP3 Wire Protocol", "TCP socket server on 6379, pipelining, redis-cli compatibility", "Mandatory"],
        ["Sprint 8 (W14–15)", "Cluster Telemetry Console", "Visual topology map, active leader indicators, node partition graph", "Mandatory"],
        ["Sprint 9 (W16)", "Chaos & Performance Suite", "Split-brain tests, recovery benchmarks, final project documentation", "Mandatory"],
        ["Extension A", "Zero-Copy File I/O", "Memory-mapped files (mmap) for WAL flushing", "Optional"],
        ["Extension B", "Tiered NVMe Storage", "Spillover of cold LRU keys to SSD rather than deletion", "Optional"]
    ]
    wbs_table = Table(wbs_data, colWidths=[90, 130, 204, 80])
    wbs_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0f172a')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,0), 8),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('FONTNAME', (0,1), (-1,-1), 'Helvetica'),
        ('FONTSIZE', (0,1), (-1,-1), 7.5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#f8fafc')]),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(wbs_table)
    story.append(Spacer(1, 15))

    # Section 5: Verification & Expected Academic Outcomes
    story.append(Paragraph("5. Expected Evaluation Outcomes & Deliverables", h1_style))
    story.append(Paragraph("• <b>Benchmark Targets:</b> Sustained throughput of $50,000+\\text{ ops/sec}$ across 3 clustered nodes with sub-2ms $p99$ latency.", bullet_style))
    story.append(Paragraph("• <b>Fault Recovery Guarantee:</b> Automated leader election completing in under 350ms upon leader node death.", bullet_style))
    story.append(Paragraph("• <b>Academic Artifacts:</b> Research paper draft for IEEE/Springer submission on lightweight persistent in-memory caching.", bullet_style))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated {filename}")

if __name__ == "__main__":
    build_pdf("Phase_3/Phase_4_Roadmap.pdf")
