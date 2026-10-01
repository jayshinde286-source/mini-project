import os
import re
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
            self.drawString(54, 750, "SPIT Cache Module — 100 Viva Questions & Answers (Phase 2 & 3)")
            self.drawRightString(558, 750, "Sardar Patel Institute of Technology, Mumbai")
            self.setStrokeColor(colors.HexColor("#cbd5e1"))
            self.setLineWidth(0.5)
            self.line(54, 742, 558, 742)
            
        # Footer
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.5)
        self.line(54, 45, 558, 45)
        self.drawString(54, 32, "SPIT CSE B.Tech Mini Project (PR1) — Academic Year 2026–27")
        self.drawRightString(558, 32, f"Page {self._pageNumber} of {page_count}")
        self.restoreState()

def clean_text_for_reportlab(text):
    # Escape basic XML chars first
    text = text.replace('&', '&amp;')
    text = text.replace('<', '&lt;')
    text = text.replace('>', '&gt;')
    
    # Process code blocks first: `foo` -> <font face="Courier" color="#1e293b">foo</font>
    def code_repl(m):
        code_content = m.group(1)
        return f'<font face="Courier" color="#0f172a">{code_content}</font>'
    text = re.sub(r'`([^`]+)`', code_repl, text)
    
    # Process bold: **text** -> <b>text</b>
    text = re.sub(r'\*\*([^*]+)\*\*', r'<b>\1</b>', text)
    
    # Process paired italics: *word* -> <i>word</i> (only when word doesn't contain / or spaces at boundary)
    text = re.sub(r'(?<![/\w])\*([a-zA-Z0-9_\-\s]+?)\*(?![/\w])', r'<i>\1</i>', text)
    
    # Replace math markers $...$ with clean text
    text = re.sub(r'\$(.*?)\$', r'\1', text)
    
    # Normalize newlines
    text = text.replace('\n', ' ')
    return text.strip()

def parse_markdown_qa(md_path):
    with open(md_path, 'r', encoding='utf-8') as f:
        content = f.read()

    domains = []
    # Split by section headers ###
    sections = re.split(r'\n###\s+', content)
    
    for sec in sections[1:]:
        lines = sec.strip().split('\n')
        domain_title = lines[0].strip()
        
        qa_pairs = []
        pattern = r'\*\*Q(\d+):\s*(.*?)\*\*\s*\n\*Answer:\*\s*(.*?)(?=\n\n\*\*Q|\n\n---|\Z)'
        matches = re.findall(pattern, sec, re.DOTALL)
        
        for num, q_text, a_text in matches:
            q_clean = clean_text_for_reportlab(q_text)
            a_clean = clean_text_for_reportlab(a_text)
            
            qa_pairs.append({
                'num': int(num),
                'question': q_clean,
                'answer': a_clean
            })
            
        if qa_pairs:
            domains.append({
                'title': domain_title,
                'qa': qa_pairs
            })
            
    return domains

def generate_pdf(output_pdf="SPIT_Cache_100_Viva_QA_Phase_2_and_3.pdf"):
    md_file = "/Users/jayshinde/Documents/mini project/Phase_3/PROJECT_VIVA_100_QA.md"
    domains = parse_markdown_qa(md_file)
    
    doc = SimpleDocTemplate(
        output_pdf,
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
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#0f172a'),
        alignment=0
    )

    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10.5,
        leading=14.5,
        textColor=colors.HexColor('#475569'),
        alignment=0
    )

    meta_style = ParagraphStyle(
        'MetaStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor('#334155')
    )

    domain_heading_style = ParagraphStyle(
        'DomainHeading',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#1e3a8a'),
        spaceBefore=14,
        spaceAfter=5
    )

    question_style = ParagraphStyle(
        'QuestionStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#0f172a'),
        spaceBefore=6,
        spaceAfter=2.5
    )

    answer_style = ParagraphStyle(
        'AnswerStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12.2,
        textColor=colors.HexColor('#334155'),
        spaceAfter=6
    )

    story = []

    # Title Banner Box
    title_data = [
        [Paragraph("SPIT Cache Module — 100 Technical Viva Questions & Answers", title_style)],
        [Paragraph("Master Viva Defense & Examination Guide — Covering Phase 2 (Frontend) & Phase 3 (Backend Persistent Core)", subtitle_style)],
        [Spacer(1, 4)],
        [Paragraph(
            "<b>Institution:</b> Sardar Patel Institute of Technology (SPIT), Andheri (W), Mumbai<br/>"
            "<b>Department:</b> Computer Science & Engineering | <b>Academic Year:</b> 2026–27 | <b>Subject:</b> Mini Project (PR1)<br/>"
            "<b>Student Authors:</b> Jay Shinde (2024800115), Nikhil Shelar (2024800113), Sanchit Gaikwad (2024800029)<br/>"
            "<b>Faculty Guide:</b> Prof. Suhas Kakade", meta_style
        )]
    ]
    t = Table(title_data, colWidths=[504])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#cbd5e1')),
        ('PADDING', (0,0), (-1,-1), 12),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE')
    ]))
    story.append(t)
    story.append(Spacer(1, 12))

    # Executive Overview
    overview_text = (
        "<b>Examination Overview:</b> This evaluation handbook comprises exactly 100 targeted technical questions and verified "
        "model answers spanning 17 core Computer Science and Software Engineering competencies assessed during the SPIT Mini Project examination. "
        "Questions address Phase 2 (Interactive React Telemetry Console, SVG charting, Dark/Light Themes, Command Palette) and "
        "Phase 3 (Modular Node.js Backend, O(1) Hash Map & Doubly-Linked List, Write-Ahead Logging with IEEE 802.3 CRC32, "
        "Point-in-Time Snapshot Checkpoints, Cold Recovery Pipeline, Server-Sent Events, Cryptographic SHA-256 Audit Chaining, and Sliding-Window Rate Limiting)."
    )
    story.append(Paragraph(overview_text, answer_style))
    story.append(HRFlowable(width="100%", thickness=0.75, color=colors.HexColor("#e2e8f0"), spaceBefore=4, spaceAfter=8))

    # Add All 100 Questions & Answers organized by Domain
    total_q_count = 0
    for domain in domains:
        story.append(Paragraph(domain['title'], domain_heading_style))
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#cbd5e1"), spaceBefore=2, spaceAfter=5))
        
        for item in domain['qa']:
            total_q_count += 1
            q_flowable = Paragraph(f"<b>Q{item['num']}: {item['question']}</b>", question_style)
            a_flowable = Paragraph(f"<b>Answer:</b> {item['answer']}", answer_style)
            story.append(KeepTogether([q_flowable, a_flowable]))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"✅ Generated {output_pdf} successfully with {total_q_count} questions!")

if __name__ == "__main__":
    generate_pdf()
