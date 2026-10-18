"""Render the Markdown course report to a readable PDF with ReportLab."""

import html
import re
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.units import inch
from reportlab.platypus import (
    HRFlowable, KeepTogether, PageBreak, Paragraph, Preformatted, SimpleDocTemplate,
    Spacer, Table, TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "reports" / "MONGODB_PROJECT_REPORT.md"
OUTPUT = ROOT / "output" / "pdf" / "VaultX_MongoDB_Project_Report.pdf"
NAVY = colors.HexColor("#123458")
BEIGE = colors.HexColor("#D4C9BE")


def inline(text):
    text = html.escape(text.strip())
    text = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", text)
    text = re.sub(r"`([^`]+)`", r"<font name='Courier'>\1</font>", text)
    text = re.sub(r"\[([^]]+)\]\(([^)]+)\)", r"\1", text)
    return text


def footer(canvas, doc):
    canvas.saveState()
    width, _ = doc.pagesize
    canvas.setStrokeColor(BEIGE)
    canvas.line(0.68 * inch, 0.61 * inch, width - 0.68 * inch, 0.61 * inch)
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(NAVY)
    canvas.drawString(0.7 * inch, 0.42 * inch, "VaultX  |  MongoDB and PyMongo Project")
    canvas.drawRightString(width - 0.7 * inch, 0.42 * inch, str(doc.page))
    canvas.restoreState()


def build():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name="TitleCustom", parent=styles["Title"], fontName="Helvetica-Bold",
                              fontSize=22, leading=27, textColor=NAVY, alignment=TA_CENTER,
                              spaceAfter=16))
    styles.add(ParagraphStyle(name="H2Custom", parent=styles["Heading2"], fontName="Helvetica-Bold",
                              fontSize=13, leading=17, textColor=NAVY, spaceBefore=15,
                              spaceAfter=7, keepWithNext=True))
    styles.add(ParagraphStyle(name="BodyCustom", parent=styles["BodyText"], fontName="Helvetica",
                              fontSize=9.5, leading=14, spaceAfter=7))
    styles.add(ParagraphStyle(name="BulletCustom", parent=styles["BodyCustom"], leftIndent=13,
                              firstLineIndent=-10, spaceAfter=3))
    styles.add(ParagraphStyle(name="CodeCustom", parent=styles["Code"], fontName="Courier",
                              fontSize=8, leading=11, leftIndent=9, backColor=colors.HexColor("#F1EFEC"),
                              borderPadding=6, spaceAfter=8))
    styles.add(ParagraphStyle(name="TableCustom", parent=styles["BodyCustom"], fontSize=8.5,
                              leading=11, spaceAfter=0))
    styles.add(ParagraphStyle(name="TableHeaderCustom", parent=styles["TableCustom"],
                              textColor=colors.white, fontName="Helvetica-Bold"))
    story = []
    lines = SOURCE.read_text(encoding="utf-8").splitlines()
    paragraph = []
    table_rows = []
    code_lines = []
    in_code = False

    def flush_paragraph():
        if paragraph:
            story.append(Paragraph(inline(" ".join(paragraph)), styles["BodyCustom"]))
            paragraph.clear()

    def flush_table():
        if not table_rows:
            return
        rows = [row for row in table_rows if not all(re.fullmatch(r":?-{3,}:?", cell) for cell in row)]
        data = [[Paragraph(inline(cell), styles["TableHeaderCustom"] if i == 0 else styles["TableCustom"])
                 for cell in row] for i, row in enumerate(rows)]
        table = Table(data, colWidths=[3.55 * inch, 2.85 * inch], repeatRows=1, hAlign="LEFT")
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), NAVY),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F1EFEC")]),
            ("GRID", (0, 0), (-1, -1), 0.4, BEIGE),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 7),
            ("RIGHTPADDING", (0, 0), (-1, -1), 7),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ]))
        story.append(KeepTogether([table, Spacer(1, 8)]))
        table_rows.clear()

    for raw in lines + [""]:
        line = raw.strip()
        if line.startswith("```"):
            flush_paragraph()
            flush_table()
            if in_code:
                story.append(Preformatted("\n".join(code_lines), styles["CodeCustom"]))
                code_lines.clear()
            in_code = not in_code
            continue
        if in_code:
            code_lines.append(raw)
            continue
        if line.startswith("|") and line.endswith("|"):
            flush_paragraph()
            table_rows.append([cell.strip() for cell in line.strip("|").split("|")])
            continue
        flush_table()
        if not line:
            flush_paragraph()
            continue
        if line.startswith("# "):
            flush_paragraph()
            story.append(Paragraph(inline(line[2:]), styles["TitleCustom"]))
            story.append(HRFlowable(width="100%", thickness=2, color=BEIGE, spaceAfter=13))
        elif line.startswith("## "):
            flush_paragraph()
            if line.startswith("## 7. Evaluation results"):
                story.append(PageBreak())
            story.append(Paragraph(inline(line[3:]), styles["H2Custom"]))
        elif re.match(r"^\d+\. ", line):
            flush_paragraph()
            story.append(Paragraph(inline(line), styles["BulletCustom"]))
        elif line.startswith("- "):
            flush_paragraph()
            story.append(Paragraph("&#8226; " + inline(line[2:]), styles["BulletCustom"]))
        else:
            paragraph.append(line.rstrip(" "))

    doc = SimpleDocTemplate(str(OUTPUT), pagesize=(8.27 * inch, 11.69 * inch),
                            leftMargin=0.7 * inch, rightMargin=0.7 * inch,
                            topMargin=0.7 * inch, bottomMargin=0.75 * inch,
                            title="VaultX MongoDB and PyMongo Project Report")
    doc.build(story, onFirstPage=footer, onLaterPages=footer)
    print(OUTPUT)


if __name__ == "__main__":
    build()
