#!/usr/bin/env python3
"""Render the 50 logical Markdown pages as exactly 50 polished PDF pages."""

from __future__ import annotations

import html
import re
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    HRFlowable,
    KeepInFrame,
    PageBreak,
    PageTemplate,
    Paragraph,
    Preformatted,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs" / "VIVA_HANDBOOK_50_PAGES.md"
OUTPUT = ROOT / "output" / "pdf" / "PERSISTENT_EVENT_DRIVEN_CACHE_VIVA_HANDBOOK_50_PAGES.pdf"

NAVY = colors.HexColor("#0B1F3A")
SLATE = colors.HexColor("#526277")
LIGHT = colors.HexColor("#F5F2EA")
PAPER = colors.HexColor("#FFFDF8")
GRID = colors.HexColor("#D9DFE8")
CYAN = colors.HexColor("#08AFC1")
CORAL = colors.HexColor("#FF684A")
GREEN = colors.HexColor("#20A66A")
VIOLET = colors.HexColor("#566BFF")


def register_fonts() -> None:
    font_dir = Path("/System/Library/Fonts/Supplemental")
    candidates = {
        "Body": font_dir / "Arial.ttf",
        "Body-Bold": font_dir / "Arial Bold.ttf",
        "Body-Italic": font_dir / "Arial Italic.ttf",
        "Mono": font_dir / "Andale Mono.ttf",
    }
    for name, path in candidates.items():
        if not path.exists():
            raise FileNotFoundError(f"Required font not found: {path}")
        pdfmetrics.registerFont(TTFont(name, str(path)))


def inline_markup(text: str) -> str:
    text = text.rstrip().replace("  ", " ")
    escaped = html.escape(text, quote=False)
    escaped = re.sub(r"`([^`]+)`", r'<font name="Mono" color="#4257D6">\1</font>', escaped)
    escaped = re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", escaped)
    escaped = re.sub(r"(?<!\*)\*([^*]+)\*(?!\*)", r"<i>\1</i>", escaped)
    return escaped


def styles() -> dict[str, ParagraphStyle]:
    return {
        "page_title": ParagraphStyle(
            "PageTitle", fontName="Body-Bold", fontSize=15.5, leading=18,
            textColor=NAVY, spaceAfter=5.5, keepWithNext=True,
        ),
        "h3": ParagraphStyle(
            "H3", fontName="Body-Bold", fontSize=9.6, leading=11.5,
            textColor=VIOLET, spaceBefore=3.5, spaceAfter=2.5, keepWithNext=True,
        ),
        "body": ParagraphStyle(
            "Body", fontName="Body", fontSize=8.55, leading=11.15,
            textColor=NAVY, spaceAfter=3.8, alignment=TA_LEFT,
        ),
        "bullet": ParagraphStyle(
            "Bullet", parent=None, fontName="Body", fontSize=8.35, leading=10.7,
            textColor=NAVY, leftIndent=11, firstLineIndent=-7, bulletIndent=1,
            spaceAfter=1.7,
        ),
        "number": ParagraphStyle(
            "Number", parent=None, fontName="Body", fontSize=8.35, leading=10.7,
            textColor=NAVY, leftIndent=15, firstLineIndent=-11, bulletIndent=1,
            spaceAfter=1.7,
        ),
        "quote": ParagraphStyle(
            "Quote", fontName="Body-Italic", fontSize=8.2, leading=10.8,
            textColor=SLATE, leftIndent=9, rightIndent=5, borderColor=CYAN,
            borderWidth=1.5, borderPadding=(4, 5, 4, 7), backColor=colors.HexColor("#EBF9FA"),
            spaceAfter=4,
        ),
        "code": ParagraphStyle(
            "Code", fontName="Mono", fontSize=6.8, leading=8.4,
            textColor=colors.HexColor("#243FC7"), backColor=colors.HexColor("#EEF2FA"),
            borderPadding=6, leftIndent=3, rightIndent=3, spaceBefore=2, spaceAfter=4,
        ),
        "table": ParagraphStyle(
            "TableText", fontName="Body", fontSize=6.8, leading=8.2, textColor=NAVY,
        ),
        "table_head": ParagraphStyle(
            "TableHead", fontName="Body-Bold", fontSize=6.8, leading=8.2, textColor=colors.white,
            alignment=TA_CENTER,
        ),
        "small": ParagraphStyle(
            "Small", fontName="Body", fontSize=7.2, leading=9, textColor=SLATE,
        ),
    }


def parse_table(lines: list[str], style_map: dict[str, ParagraphStyle], available_width: float) -> Table:
    rows: list[list[str]] = []
    for line in lines:
        cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
        if all(re.fullmatch(r":?-{3,}:?", cell or "---") for cell in cells):
            continue
        rows.append(cells)
    column_count = max(len(row) for row in rows)
    for row in rows:
        row.extend([""] * (column_count - len(row)))
    rendered = []
    for row_index, row in enumerate(rows):
        row_style = style_map["table_head"] if row_index == 0 else style_map["table"]
        rendered.append([Paragraph(inline_markup(cell), row_style) for cell in row])
    widths = [available_width / column_count] * column_count
    table = Table(rendered, colWidths=widths, repeatRows=1, hAlign="LEFT")
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("BACKGROUND", (0, 1), (-1, -1), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.35, GRID),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))
    return table


def page_flowables(section: str, style_map: dict[str, ParagraphStyle], available_width: float) -> list:
    lines = section.strip().splitlines()
    title = lines[0].removeprefix("## ").strip()
    result: list = [
        Paragraph(inline_markup(title), style_map["page_title"]),
        HRFlowable(width="100%", thickness=1.1, color=CYAN, spaceBefore=0, spaceAfter=5),
    ]
    index = 1
    paragraph_buffer: list[str] = []

    def flush_paragraph() -> None:
        if paragraph_buffer:
            text = " ".join(part.strip() for part in paragraph_buffer if part.strip())
            if text:
                result.append(Paragraph(inline_markup(text), style_map["body"]))
            paragraph_buffer.clear()

    while index < len(lines):
        raw = lines[index].rstrip()
        stripped = raw.strip()
        if not stripped or stripped == "---" or stripped.startswith("<div style="):
            flush_paragraph()
            index += 1
            continue
        if stripped.startswith("```"):
            flush_paragraph()
            code_lines: list[str] = []
            index += 1
            while index < len(lines) and not lines[index].strip().startswith("```"):
                code_lines.append(lines[index].rstrip())
                index += 1
            result.append(Preformatted("\n".join(code_lines), style_map["code"], maxLineLength=120))
            index += 1
            continue
        if stripped.startswith("### "):
            flush_paragraph()
            result.append(Paragraph(inline_markup(stripped[4:]), style_map["h3"]))
            index += 1
            continue
        if stripped.startswith("|"):
            flush_paragraph()
            table_lines: list[str] = []
            while index < len(lines) and lines[index].strip().startswith("|"):
                table_lines.append(lines[index].strip())
                index += 1
            result.append(parse_table(table_lines, style_map, available_width))
            result.append(Spacer(1, 3))
            continue
        if stripped.startswith(">"):
            flush_paragraph()
            result.append(Paragraph(inline_markup(stripped.lstrip("> ")), style_map["quote"]))
            index += 1
            continue
        bullet = re.match(r"^[-*] +(.*)$", stripped)
        if bullet:
            flush_paragraph()
            result.append(Paragraph(inline_markup(bullet.group(1)), style_map["bullet"], bulletText="•"))
            index += 1
            continue
        numbered = re.match(r"^(\d+)\. +(.*)$", stripped)
        if numbered:
            flush_paragraph()
            result.append(Paragraph(inline_markup(numbered.group(2)), style_map["number"], bulletText=numbered.group(1) + "."))
            index += 1
            continue
        if stripped.startswith("**Q") or stripped.startswith("**A"):
            flush_paragraph()
            result.append(Paragraph(inline_markup(stripped), style_map["body"]))
            index += 1
            continue
        paragraph_buffer.append(stripped)
        index += 1
    flush_paragraph()
    return result


def extract_sections(markdown: str) -> list[str]:
    matches = list(re.finditer(r"(?m)^## Page (\d+) of 50", markdown))
    sections: list[str] = []
    for position, match in enumerate(matches):
        start = match.start()
        end = matches[position + 1].start() if position + 1 < len(matches) else len(markdown)
        section = markdown[start:end]
        section = re.sub(r"\n?<div style=\"page-break-after: always;\"></div>\s*$", "", section.strip())
        sections.append(section)
    if len(sections) != 50:
        raise ValueError(f"Expected 50 numbered sections, found {len(sections)}")
    for expected, section in enumerate(sections, start=1):
        if not section.startswith(f"## Page {expected} of 50"):
            raise ValueError(f"Page numbering is not sequential at page {expected}")
    return sections


class VivaDocTemplate(BaseDocTemplate):
    def __init__(self, filename: str, page_titles: list[str]):
        self.page_titles = page_titles
        width, height = A4
        frame = Frame(
            14 * mm,
            14 * mm,
            width - 28 * mm,
            height - 27 * mm,
            leftPadding=0,
            rightPadding=0,
            topPadding=6 * mm,
            bottomPadding=5 * mm,
            id="content",
        )
        super().__init__(
            filename,
            pagesize=A4,
            leftMargin=14 * mm,
            rightMargin=14 * mm,
            topMargin=13 * mm,
            bottomMargin=14 * mm,
            title="Persistent Event-Driven Memory Cache Module - 50 Page Viva Handbook",
            author="Jay Umesh Shinde, Sanchit Gaikwad, Nikhil Shelar",
            subject="Technical report and viva defence handbook",
        )
        self.addPageTemplates(PageTemplate(id="viva", frames=[frame], onPage=self.draw_page_chrome))

    def draw_page_chrome(self, canvas, document) -> None:
        page_number = canvas.getPageNumber()
        width, height = A4
        accents = [CYAN, VIOLET, CORAL, GREEN, CYAN]
        accent = accents[min(4, (page_number - 1) // 10)]
        canvas.saveState()
        canvas.setFillColor(PAPER)
        canvas.rect(0, 0, width, height, fill=1, stroke=0)
        canvas.setFillColor(accent)
        canvas.rect(0, height - 5.5 * mm, width, 5.5 * mm, fill=1, stroke=0)
        canvas.setFont("Body-Bold", 6.8)
        canvas.setFillColor(SLATE)
        canvas.drawString(14 * mm, 7.2 * mm, "PERSISTENT EVENT-DRIVEN MEMORY CACHE MODULE")
        canvas.setFont("Body", 6.8)
        canvas.drawRightString(width - 14 * mm, 7.2 * mm, f"VIVA HANDBOOK  •  {page_number} / 50")
        key = f"page-{page_number}"
        canvas.bookmarkPage(key)
        if 1 <= page_number <= len(self.page_titles):
            canvas.addOutlineEntry(self.page_titles[page_number - 1], key, level=0, closed=False)
        canvas.restoreState()


def main() -> None:
    register_fonts()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    markdown = SOURCE.read_text(encoding="utf-8")
    sections = extract_sections(markdown)
    style_map = styles()
    available_width = A4[0] - 28 * mm
    available_height = A4[1] - 40 * mm
    titles = [section.splitlines()[0].removeprefix("## ").strip() for section in sections]
    document = VivaDocTemplate(str(OUTPUT), titles)
    story: list = []
    for page_number, section in enumerate(sections, start=1):
        content = page_flowables(section, style_map, available_width)
        story.append(KeepInFrame(available_width, available_height, content, mode="shrink", mergeSpace=True))
        if page_number < len(sections):
            story.append(PageBreak())
    document.build(story)
    print(f"Created {OUTPUT}")


if __name__ == "__main__":
    main()
