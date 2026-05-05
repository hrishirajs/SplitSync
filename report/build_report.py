from __future__ import annotations

import datetime as _dt
from pathlib import Path

from docx import Document
from docx.enum.section import WD_ORIENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "report"
TEMPLATE = Path("/Users/hrishirajsaxena/Downloads/Project Report Format.docx")
ASSETS_DIR = OUT_DIR / "assets"


def _set_normal_style(doc: Document) -> None:
    normal = doc.styles["Normal"]
    font = normal.font
    font.name = "Times New Roman"
    font.size = Pt(12)

    # Keep headings consistent with academic formatting.
    for heading in ("Heading 1", "Heading 2", "Heading 3"):
        try:
            st = doc.styles[heading]
        except KeyError:
            continue
        st.font.name = "Times New Roman"



def _add_field(paragraph, field_code: str) -> None:
    # Inserts a Word field (e.g., TOC). Word will populate on "Update Field".
    r = paragraph.add_run()
    fld_char_begin = OxmlElement("w:fldChar")
    fld_char_begin.set(qn("w:fldCharType"), "begin")
    instr_text = OxmlElement("w:instrText")
    instr_text.set(qn("xml:space"), "preserve")
    instr_text.text = field_code
    fld_char_sep = OxmlElement("w:fldChar")
    fld_char_sep.set(qn("w:fldCharType"), "separate")
    fld_char_end = OxmlElement("w:fldChar")
    fld_char_end.set(qn("w:fldCharType"), "end")
    r._r.append(fld_char_begin)
    r._r.append(instr_text)
    r._r.append(fld_char_sep)
    r._r.append(fld_char_end)


def _page_break(doc: Document) -> None:
    doc.add_page_break()


def _title_block(doc: Document, title: str, meta_lines: list[str]) -> None:
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run(title)
    run.bold = True
    run.font.size = Pt(18)
    run.font.name = "Times New Roman"

    doc.add_paragraph()
    for line in meta_lines:
        p = doc.add_paragraph(line)
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for r in p.runs:
            r.font.name = "Times New Roman"
            r.font.size = Pt(12)


def _heading(doc: Document, text: str, level: int = 1) -> None:
    doc.add_paragraph(text, style=f"Heading {level}")


def _para(doc: Document, text: str) -> None:
    p = doc.add_paragraph(text)
    for r in p.runs:
        r.font.name = "Times New Roman"
        r.font.size = Pt(12)


def _bullets(doc: Document, items: list[str]) -> None:
    available = {s.name for s in doc.styles}
    preferred = [
        "List Bullet",
        "ListBullet",
        "Bullet List",
        "List Paragraph",
        "ListParagraph",
    ]
    style_name = next((name for name in preferred if name in available), None)
    for item in items:
        if style_name:
            doc.add_paragraph(item, style=style_name)
        else:
            # Worst-case fallback: plain paragraph with a bullet character.
            doc.add_paragraph(f"• {item}")

def _apply_table_borders(tbl) -> None:
    # The provided university template has minimal styles; many Word viewers show tables
    # without visible borders. This enforces a simple grid so tables are clearly visible.
    tbl_pr = tbl._tbl.tblPr
    borders = OxmlElement("w:tblBorders")
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        el = OxmlElement(f"w:{edge}")
        el.set(qn("w:val"), "single")
        el.set(qn("w:sz"), "8")  # 1/2 pt
        el.set(qn("w:space"), "0")
        el.set(qn("w:color"), "000000")
        borders.append(el)
    tbl_pr.append(borders)


def _table(doc: Document, caption: str, columns: list[str], rows: list[list[str]]) -> None:
    cap = doc.add_paragraph(caption)
    cap.runs[0].bold = True
    tbl = doc.add_table(rows=1, cols=len(columns))
    _apply_table_borders(tbl)
    hdr_cells = tbl.rows[0].cells
    for idx, col in enumerate(columns):
        hdr_cells[idx].text = col
    for row in rows:
        cells = tbl.add_row().cells
        for idx, cell_text in enumerate(row):
            cells[idx].text = cell_text
    doc.add_paragraph()


def _code_block(doc: Document, title: str, lines: list[str]) -> None:
    cap = doc.add_paragraph(title)
    cap.runs[0].bold = True
    box = doc.add_paragraph()
    run = box.add_run("\n".join(lines))
    run.font.name = "Courier New"
    run.font.size = Pt(10)
    doc.add_paragraph()


def _figure_placeholder(doc: Document, fig_title: str, note: str) -> None:
    p = doc.add_paragraph(fig_title)
    p.runs[0].bold = True
    available = {s.name for s in doc.styles}
    style_name = "Intense Quote" if "Intense Quote" in available else None
    if style_name:
        doc.add_paragraph("[INSERT SCREENSHOT HERE]", style=style_name)
    else:
        q = doc.add_paragraph("[INSERT SCREENSHOT HERE]")
        if q.runs:
            q.runs[0].italic = True
    _para(doc, f"Description: {note}")

def _safe_font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    # Try common fonts; fall back to PIL default.
    candidates = [
        "/System/Library/Fonts/Supplemental/Times New Roman.ttf",
        "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/Supplemental/Helvetica.ttf",
    ]
    for c in candidates:
        try:
            return ImageFont.truetype(c, size)
        except Exception:
            pass
    return ImageFont.load_default()


def _draw_box(draw: ImageDraw.ImageDraw, xy: tuple[int, int, int, int], text: str) -> None:
    draw.rectangle(xy, outline=(0, 0, 0), width=3)
    font = _safe_font(28)
    x1, y1, x2, y2 = xy
    tw, th = draw.textbbox((0, 0), text, font=font)[2:]
    tx = x1 + (x2 - x1 - tw) // 2
    ty = y1 + (y2 - y1 - th) // 2
    draw.text((tx, ty), text, font=font, fill=(0, 0, 0))


def _arrow(draw: ImageDraw.ImageDraw, start: tuple[int, int], end: tuple[int, int]) -> None:
    draw.line([start, end], fill=(0, 0, 0), width=4)
    # simple arrow head
    ex, ey = end
    sx, sy = start
    dx, dy = ex - sx, ey - sy
    mag = max((dx * dx + dy * dy) ** 0.5, 1.0)
    ux, uy = dx / mag, dy / mag
    # perpendicular
    px, py = -uy, ux
    size = 14
    p1 = (ex - int(ux * 22) + int(px * size), ey - int(uy * 22) + int(py * size))
    p2 = (ex - int(ux * 22) - int(px * size), ey - int(uy * 22) - int(py * size))
    draw.polygon([end, p1, p2], fill=(0, 0, 0))


def _make_diagrams() -> dict[str, Path]:
    ASSETS_DIR.mkdir(parents=True, exist_ok=True)
    out: dict[str, Path] = {}

    def save(name: str, img: Image.Image) -> None:
        path = ASSETS_DIR / name
        img.save(path, format="PNG")
        out[name] = path

    # 1) Architecture
    img = Image.new("RGB", (1600, 900), "white")
    d = ImageDraw.Draw(img)
    title_f = _safe_font(40)
    d.text((40, 30), "System Architecture (SplitSync)", font=title_f, fill=(0, 0, 0))
    _draw_box(d, (120, 160, 540, 290), "Next.js UI")
    _draw_box(d, (640, 160, 1060, 290), "Clerk Auth")
    _draw_box(d, (120, 380, 540, 510), "Convex API")
    _draw_box(d, (640, 380, 1060, 510), "Convex DB")
    _draw_box(d, (1150, 380, 1520, 510), "Inngest")
    _arrow(d, (540, 225), (640, 225))
    _arrow(d, (330, 290), (330, 380))
    _arrow(d, (540, 445), (640, 445))
    _arrow(d, (1060, 445), (1150, 445))
    save("fig_architecture.png", img)

    # 2) Data Flow
    img = Image.new("RGB", (1600, 900), "white")
    d = ImageDraw.Draw(img)
    d.text((40, 30), "Data Flow Diagram (Level 0)", font=title_f, fill=(0, 0, 0))
    _draw_box(d, (90, 180, 460, 300), "User")
    _draw_box(d, (520, 180, 1080, 300), "Add Expense UI Form")
    _draw_box(d, (520, 360, 1080, 480), "Convex Mutation")
    _draw_box(d, (520, 540, 1080, 660), "Convex DB Insert")
    _draw_box(d, (1150, 360, 1540, 480), "Realtime Queries")
    _draw_box(d, (1150, 540, 1540, 660), "Dashboard/Group UI")
    _arrow(d, (460, 240), (520, 240))
    _arrow(d, (800, 300), (800, 360))
    _arrow(d, (800, 480), (800, 540))
    _arrow(d, (1080, 420), (1150, 420))
    _arrow(d, (1345, 480), (1345, 540))
    save("fig_dfd.png", img)

    # 3) Use Case
    img = Image.new("RGB", (1600, 900), "white")
    d = ImageDraw.Draw(img)
    d.text((40, 30), "Use Case Diagram (High-Level)", font=title_f, fill=(0, 0, 0))
    _draw_box(d, (120, 190, 520, 310), "User")
    _draw_box(d, (650, 140, 1500, 760), "SplitSync System")
    font = _safe_font(28)
    use_cases = [
        "Create Group",
        "Add Members",
        "Add Expense",
        "Approve/Reject",
        "Upload Receipt",
        "View Balances",
        "Record Settlement",
        "Favorites/Recurring",
        "Set Budget Goal",
    ]
    y = 200
    for uc in use_cases:
        d.ellipse((720, y, 1150, y + 70), outline=(0, 0, 0), width=3)
        tw, th = d.textbbox((0, 0), uc, font=font)[2:]
        d.text((720 + (430 - tw) // 2, y + (70 - th) // 2), uc, font=font, fill=(0, 0, 0))
        _arrow(d, (520, 250), (720, y + 35))
        y += 75
        if y > 640:
            break
    save("fig_usecase.png", img)

    # 4) ER Diagram (simplified)
    img = Image.new("RGB", (1600, 1000), "white")
    d = ImageDraw.Draw(img)
    d.text((40, 30), "ER Diagram (Simplified)", font=title_f, fill=(0, 0, 0))
    _draw_box(d, (120, 180, 520, 310), "Users")
    _draw_box(d, (640, 180, 1100, 310), "Groups")
    _draw_box(d, (120, 420, 520, 550), "Expenses")
    _draw_box(d, (640, 420, 1100, 550), "ExpenseSplits")
    _draw_box(d, (1150, 420, 1530, 550), "Settlements")
    _draw_box(d, (640, 660, 1100, 790), "Templates")
    _arrow(d, (520, 245), (640, 245))
    _arrow(d, (320, 310), (320, 420))
    _arrow(d, (520, 485), (640, 485))
    _arrow(d, (1100, 485), (1150, 485))
    _arrow(d, (870, 550), (870, 660))
    save("fig_er.png", img)

    # 5) Sequence (approval flow)
    img = Image.new("RGB", (1600, 900), "white")
    d = ImageDraw.Draw(img)
    d.text((40, 30), "Sequence Diagram: Add Expense With Approval", font=title_f, fill=(0, 0, 0))
    lanes = [("User", 140), ("UI", 520), ("Convex", 900), ("DB", 1280)]
    lane_font = _safe_font(30)
    for label, x in lanes:
        d.text((x - 40, 110), label, font=lane_font, fill=(0, 0, 0))
        d.line([(x, 160), (x, 820)], fill=(0, 0, 0), width=2)
    step_f = _safe_font(26)
    steps = [
        ("submit expense", 180, 0, 1),
        ("addExpense()", 260, 1, 2),
        ("insert pending", 340, 2, 3),
        ("realtime update", 420, 3, 1),
        ("approve", 520, 0, 1),
        ("approveExpense()", 600, 1, 2),
        ("patch approved", 680, 2, 3),
        ("balances update", 760, 3, 1),
    ]
    for text, y, a, b in steps:
        x1 = lanes[a][1]
        x2 = lanes[b][1]
        _arrow(d, (x1, y), (x2, y))
        d.text((min(x1, x2) + 10, y - 30), text, font=step_f, fill=(0, 0, 0))
    save("fig_sequence.png", img)

    return out


def _insert_figure_image(doc: Document, title: str, image_path: Path, note: str) -> None:
    p = doc.add_paragraph(title)
    p.runs[0].bold = True
    doc.add_picture(str(image_path), width=Inches(6.5))
    _para(doc, f"Description: {note}")

def _feature_block(
    doc: Document,
    heading: str,
    need: str,
    explanation: str,
    implementation: str,
    difficulty: str,
    code_title: str,
    code_lines: list[str],
    example: str,
) -> None:
    _heading(doc, heading, 3)
    _heading(doc, "Need", 4) if "Heading 4" in {s.name for s in doc.styles} else _para(doc, "Need:")
    _para(doc, need)
    _heading(doc, "Explanation", 4) if "Heading 4" in {s.name for s in doc.styles} else _para(doc, "Explanation:")
    _para(doc, explanation)
    _heading(doc, "Implementation", 4) if "Heading 4" in {s.name for s in doc.styles} else _para(doc, "Implementation:")
    _para(doc, implementation)
    _heading(doc, "Difficulty / Challenges", 4) if "Heading 4" in {s.name for s in doc.styles} else _para(doc, "Difficulty / Challenges:")
    _para(doc, difficulty)
    _code_block(doc, code_title, code_lines)
    _heading(doc, "Example", 4) if "Heading 4" in {s.name for s in doc.styles} else _para(doc, "Example:")
    _para(doc, example)
    doc.add_paragraph()


def build_report() -> Path:
    doc = Document(str(TEMPLATE)) if TEMPLATE.exists() else Document()
    _set_normal_style(doc)
    figures = _make_diagrams()

    # Some templates start with content; clear if empty-ish. If not, we still append
    # because exam templates may include formatted cover/certificate blocks already.
    today = _dt.date.today()

    # FRONT MATTER
    _heading(doc, "COVER PAGE", 1)
    _title_block(
        doc,
        "SplitSync: A Real-Time Shared Expense Tracking and Settlement System",
        [
            "Name: [FILL: Your Full Name]",
            "Registration No: [FILL: Reg No]",
            "University/College: [FILL: University/College Name]",
            "Department: [FILL: Department]",
            f"Month–Year: {today.strftime('%B %Y')}",
        ],
    )
    _page_break(doc)

    _heading(doc, "INNER TITLE PAGE", 1)
    _title_block(
        doc,
        "SplitSync: A Real-Time Shared Expense Tracking and Settlement System",
        [
            "Name: [FILL: Your Full Name]",
            "Registration No: [FILL: Reg No]",
            "Supervisor/Guide: [FILL: Guide Name]",
            "University/College: [FILL: University/College Name]",
            "Department: [FILL: Department]",
            f"Month–Year: {today.strftime('%B %Y')}",
        ],
    )
    _page_break(doc)

    _heading(doc, "CERTIFICATE", 1)
    _para(
        doc,
        "This is to certify that [FILL: Your Full Name] (Registration No: [FILL]) "
        "has successfully completed the project titled “SplitSync: A Real-Time Shared Expense Tracking and Settlement System” "
        "in partial fulfillment of the requirements for the award of [FILL: Degree/Program] at [FILL: University/College] "
        f"during {today.strftime('%B %Y')}.",
    )
    _para(doc, "The work presented in this report is original and has not been submitted elsewhere for any other degree or diploma.")
    _para(doc, "Supervisor/Guide: ____________________    Date: ___/___/2026")
    _para(doc, "Head of Department: __________________    Date: ___/___/2026")
    _para(doc, "External Examiner: ___________________    Date: ___/___/2026")
    _page_break(doc)

    _heading(doc, "ACKNOWLEDGEMENT", 1)
    _para(doc, "I would like to express my sincere gratitude to my project supervisor [FILL: Guide Name] for continuous guidance, valuable suggestions, and feedback throughout the development of this project.")
    _para(doc, "I also thank the faculty and staff of [FILL: University/College] for providing the necessary resources and evaluation. I am grateful to my friends for peer feedback during iteration and testing.")
    _para(doc, "Finally, I thank my family for encouragement and support during the project timeline.")
    _page_break(doc)

    _heading(doc, "ABSTRACT", 1)
    _para(doc, "Shared expense tracking is a recurring real-world problem in settings such as college trips, roommates, teams, and shared subscriptions. Manual tracking often leads to inconsistent records, disputes, and delayed settlements. This project presents SplitSync, a real-time shared expense tracking system supporting individual and group expenses, flexible splitting strategies, and settlement recording.")
    _para(doc, "SplitSync is designed around a unified balance model so that dashboard totals, person-to-person balances, group balances, and settlement views remain consistent. The system supports equal, percentage-based, and exact amount splits with validation to ensure correctness and reduce human error.")
    _para(doc, "To reduce operational friction, SplitSync introduces receipt upload, favorites, and recurring expenses. The system supports group expense approval mode (pending → approved/rejected) so that group spending can be reviewed before it impacts balances. Additionally, auto-categorization improves data entry speed and enhances analytics readiness.")
    _para(doc, "The implementation uses Next.js for UI, Convex for real-time database and server-side logic, and Clerk for authentication. Automation is supported through Inngest for recurring expense generation and scheduled insights/reminders. The result is a modern application suitable for practical use and a comprehensive final-year project demonstration.")
    _para(doc, "Beyond feature completeness, SplitSync is built to improve trust between participants. Receipt attachments, an approval workflow for group spends, and an explicit settlement log provide traceability. These elements are important in real usage and also strengthen the academic value of the project by demonstrating careful system thinking around correctness, governance, and usability.")
    _page_break(doc)

    _heading(doc, "LIST OF TABLES", 1)
    _bullets(
        doc,
        [
            "Table 2.1: Comparison of Existing Expense Applications",
            "Table 2.2: Core Concepts and Their Definitions",
            "Table 2.3: Technology Stack Overview",
            "Table 3.1: Major System Modules and Responsibilities",
            "Table 4.1: Database Entities (Summary)",
            "Table 5.1: Test Scenarios and Expected Output",
            "Table 5.2: Sample Data for Goa Trip (Group)",
            "Table 5.3: Sample Data for Flatmates (Group)",
            "Table 5.4: Sample Data for Individual (1:1)",
            "Table 5.5: Performance/Behavior Observations",
            "Table 5.6: Edge Cases and Handling",
            "Table A.1: Expanded Sample Dataset",
        ],
    )
    _page_break(doc)

    _heading(doc, "LIST OF FIGURES", 1)
    _bullets(
        doc,
        [
            "Figure 3.1: System Architecture Diagram",
            "Figure 3.2: Data Flow Diagram (DFD Level 0)",
            "Figure 3.3: User Flow Diagram",
            "Figure 3.4: Use Case Diagram (Placeholder)",
            "Figure 3.5: ER Diagram (Placeholder)",
            "Figure 4.1: Landing Page Screenshot",
            "Figure 4.2: Dashboard Screenshot",
            "Figure 4.3: Add Expense Screenshot",
            "Figure 4.4: Group Page Screenshot",
            "Figure 4.5: Individual Page Screenshot",
            "Figure 4.6: Settlement Page Screenshot",
            "Figure 4.7: Approval Queue Screenshot",
            "Figure 4.8: Budget Goals Screenshot",
            "Figure 4.9: Receipt Viewer Screenshot",
            "Figure 4.10: Favorites and Recurring Screenshot",
            "Figure A.1: ER Diagram",
            "Figure A.2: Sequence Diagram (Approval Flow)",
        ],
    )
    _page_break(doc)

    _heading(doc, "TABLE OF CONTENTS", 1)
    p = doc.add_paragraph()
    _add_field(p, r'TOC \o "1-3" \h \z \u')
    _para(doc, "Note: Right-click the table above in Word and choose “Update Field” → “Update entire table”.")
    _page_break(doc)

    # CHAPTER 1
    _heading(doc, "CHAPTER 1: INTRODUCTION", 1)
    for sec, text in [
        ("1.1 Introduction", "Expense splitting is a practical requirement in daily life: shared meals, travel, hostel expenses, flat rent and utilities, club activities, and subscriptions. The real difficulty is not only computation; it is maintaining trust and clarity over time. When records are distributed across chats or spreadsheets, errors become likely and final settlement becomes uncomfortable."),
        ("1.2 Motivation", "The motivation behind SplitSync arises from frequent confusion in college environments during trips and shared flat/hostel expenses. Many teams lack a single reliable source of truth; as a result, disputes occur due to missing context. This project aims to demonstrate a system that is both technically robust and presentation-ready for academic evaluation."),
        ("1.3 Problem Statement", "Design and implement a real-time shared expense system that records group and individual expenses, supports multiple split strategies, computes consistent net balances, and provides settlement recording along with auditability features such as receipts and history."),
        ("1.4 Objectives", "The objectives include accurate expense recording, flexible splits, unified balances across screens, real-time synchronization, and settlement recording. Additional objectives include approval mode for group governance, budget goals, recurring templates and favorites, and auto-categorization."),
        ("1.5 Scope", "The scope covers authentication, contacts and groups, expense entry for both contexts, split validation, unified balance computation, settlement entry, approvals, budgets, templates, automation, and receipt attachment. The scope excludes bank integrations, payment processing, and OCR extraction in the current version."),
        ("1.6 Applications", "SplitSync can be used for college trips, roommates, club and team expenses, and subscription sharing. The system is also suitable as a demonstrable final-year project because it includes real-time systems, backend logic, and a full UI."),
        ("1.7 Advantages", "Key advantages include consistent balances (unified model), reduced disputes via approvals and receipts, reduced repetitive entry via templates, and faster entry via auto-categorization."),
        ("1.8 Organization of Report", "This report is organized into introduction, background, methodology, implementation, results/analysis, conclusion/future scope, references, and annexure."),
    ]:
        _heading(doc, sec, 2)
        _para(doc, text)
        _para(doc, "In addition, this system emphasizes clarity of balances. A key design choice is that dashboard totals, group pages, and person pages must never contradict each other. All views are derived from a single ledger model. This approach simplifies debugging, improves trust, and makes the product easier to demonstrate to examiners.")
        _para(doc, "From a software engineering standpoint, expense tracking is a useful domain because it combines structured data modeling with algorithmic computation (splits, netting, simplification) and strict UX constraints (speed, clarity, and reduced friction). SplitSync therefore acts as an end-to-end system design case study rather than only a UI application.")
    _page_break(doc)

    # CHAPTER 2
    _heading(doc, "CHAPTER 2: BACKGROUND MATERIAL", 1)
    _heading(doc, "2.1 Overview of Expense Systems", 2)
    _para(doc, "Expense splitting systems are structured around (i) recording expenses, (ii) specifying participants and split rules, (iii) computing net balances, and (iv) recording settlements. A complete system also provides history, auditability, and usability features to reduce repetitive tasks.")
    _para(doc, "Modern expense systems often incorporate synchronization so multiple users see updates instantly. This introduces concepts such as eventual consistency, derived views, and access-controlled queries. In SplitSync, these concerns are handled using Convex, which provides real-time reactive queries backed by server-side functions.")
    _para(doc, "Although the arithmetic for splitting can be written in a few lines, a reliable expense system requires careful definition of the data model. For example, an expense is not just an amount; it also has a payer, context (group or individual), a description, a timestamp, and a split strategy. Similarly, a settlement is not merely a payment; it is a ledger event that must be reflected consistently across all balance views.")
    _para(doc, "Another important requirement is auditability. In real groups, disputes often arise because participants do not remember why an entry was made. Therefore, systems that support receipts, notes, and an immutable history typically perform better in practice. SplitSync treats receipts and settlement logs as first-class records to improve trust and reduce confusion.")

    _heading(doc, "2.2 Existing Applications", 2)
    _para(doc, "Splitwise and Tricount are well-known systems for shared expenses. Spreadsheet-based solutions are still common in classrooms and small groups because they are flexible, but they are error-prone and not real-time. Many real-world failures come from missing context (what the expense was for) and inconsistent updates across participants.")
    _para(doc, "SplitSync aims to provide a practical and demonstrable alternative that includes auditability (receipts), automation (recurring), governance (approval mode), and consistency (unified balance model).")
    _para(doc, "From an academic perspective, the comparison is useful because it clarifies the novelty of the project. SplitSync is intentionally designed as a full-stack system with real-time updates, an explicit approval workflow, and modular backend functions that can be explained and defended in a viva. These characteristics go beyond a basic CRUD project and highlight system design decisions.")

    _heading(doc, "2.3 Comparison Table", 2)
    _table(
        doc,
        "Table 2.1: Comparison of Existing Expense Applications",
        ["Feature", "Splitwise", "Tricount", "Spreadsheet", "SplitSync"],
        [
            ["Real-time sync", "Yes", "Yes", "No", "Yes (Convex)"],
            ["Group + 1:1 support", "Yes", "Mostly group", "Manual", "Yes"],
            ["Multiple split types", "Yes", "Limited", "Yes", "Yes"],
            ["Unified balance clarity", "Medium", "Medium", "Low", "High"],
            ["Receipt attachment", "Limited", "No", "Manual", "Yes"],
            ["Approval mode", "No", "No", "Manual", "Yes"],
            ["Budget goals", "Limited", "No", "Manual", "Yes"],
            ["Recurring templates", "Limited", "No", "Manual", "Yes"],
            ["Favorites/templates", "Limited", "No", "Manual", "Yes"],
        ],
    )

    _heading(doc, "2.4 Core Concepts", 2)
    _table(
        doc,
        "Table 2.2: Core Concepts and Their Definitions",
        ["Concept", "Definition in SplitSync", "Practical significance"],
        [
            ["Ledger event", "A stored expense or settlement record", "Single source of truth"],
            ["Split strategy", "Rule that maps participants to shares", "Fairness and flexibility"],
            ["Net balance", "Sum of all deltas for a user (credit/debit)", "Clear settlement target"],
            ["Simplification", "Reduce transfers by netting debtors/creditors", "Fewer payments needed"],
            ["Approval gating", "Pending expenses excluded until approved", "Governance and dispute reduction"],
            ["Budget goal", "Group-level spending target and progress", "Planning and awareness"],
        ],
    )
    _heading(doc, "Splitting", 3)
    _para(doc, "Splitting refers to dividing an expense among participants. Equal splitting is the most common and divides equally. Percentage splitting enables proportional shares. Exact splitting supports situations such as different meal costs or varying contributions. A correct system validates that split totals match the expense total to avoid drift.")
    _heading(doc, "Debt Simplification", 3)
    _para(doc, "Debt simplification reduces cognitive load by presenting net balances rather than raw transaction lists. A debt simplification algorithm typically converts many owed relationships into fewer net transfers. SplitSync uses a unified ledger and can present smart settle recommendations based on net balances.")
    _heading(doc, "Real-time Systems", 3)
    _para(doc, "Real-time systems propagate updates quickly across clients. In the context of expenses, real-time updates reduce duplicate entries and avoid inconsistent manual refresh. Convex queries naturally support this: when data changes, derived queries re-run and the UI updates automatically.")

    _heading(doc, "2.5 System Design Approach", 2)
    _para(doc, "SplitSync follows a design where all screen totals are derived from server-side queries, not manually stored totals. This ensures correctness. Access control is central: users only access groups they belong to and only see relevant records.")
    _para(doc, "This approach reduces the chance of balance drift. If stored balances were updated incrementally with each operation, a single bug could permanently corrupt the financial state. By contrast, derived balances can always be re-computed from the ledger. For typical college-scale usage, this tradeoff is acceptable and simplifies correctness arguments in the report.")
    _para(doc, "The design is modular: separate mutations handle creation of expenses, approval/rejection, settlements, and template operations. UI pages call queries that are intentionally narrow and context-specific (dashboard, group detail, person detail) but all reuse the same underlying balance derivation rules.")

    _heading(doc, "2.6 Unified Balance Model (IMPORTANT)", 2)
    _para(doc, "The unified balance model is the core of correctness. Instead of computing balances separately for dashboard, person view, and group view, SplitSync derives each from the same ledger events. Expenses and settlements form the ledger. Unapproved group expenses are excluded from computations to avoid premature balance changes.")
    _para(doc, "This model prevents contradictory states. For example, if the dashboard shows that the user owes money, the person view and group view must align with that. A unified model ensures a single interpretation of debts.")
    _para(doc, "Formally, each expense is transformed into a set of balance deltas: the payer receives a positive delta equal to the total paid amount, while each participant receives a negative delta equal to their share. Summing deltas across all events yields net balances. Settlements are treated as deltas in the opposite direction, reducing debt and credit consistently.")
    _para(doc, "This model also supports new features safely. For example, approval mode is a filter on which expenses are included. Recurring expenses simply insert future ledger events. Auto-categorization affects only metadata, not computation. By keeping the core ledger definition stable, the project can evolve without breaking correctness.")

    _heading(doc, "2.7 Technologies", 2)
    _table(
        doc,
        "Table 2.3: Technology Stack Overview",
        ["Layer", "Technology", "Purpose"],
        [
            ["Frontend", "Next.js (App Router)", "UI rendering, routing, SSR/CSR"],
            ["Backend", "Convex", "DB, queries/mutations, realtime sync"],
            ["Auth", "Clerk", "Sign-in, sessions, identity"],
            ["Automation", "Inngest", "Recurring expense generation, scheduled jobs"],
            ["UI", "Tailwind + Radix", "Accessible components + styling"],
            ["Charts", "Recharts", "Monthly spending visualization"],
            ["AI", "Gemini client lib (optional)", "Insights generation pipeline support"],
        ],
    )
    _page_break(doc)

    # CHAPTER 3
    _heading(doc, "CHAPTER 3: METHODOLOGY", 1)
    _heading(doc, "3.1 System Architecture", 2)
    _para(doc, "SplitSync is implemented as a real-time web application. Clients authenticate via Clerk. Data operations run through Convex functions which store and retrieve records from Convex DB. Clients subscribe to queries and receive real-time updates when the underlying data changes. Inngest runs scheduled functions for recurring expenses and optional reminders/insights.")
    _para(doc, "Methodologically, the system is developed in layers. First, a correct ledger model is implemented (expenses and settlements). Second, derived balance queries are built and validated using hand-calculated examples. Third, user-facing flows are implemented: groups, expense forms, and settlement screens. Finally, productivity and governance features (favorites, recurring generation, receipts, approvals, and budget goals) are layered on top without changing the underlying correctness definition.")
    _para(doc, "This approach is chosen because it makes correctness easier to reason about. Even if optional features are removed, the core ledger and balance model still functions. Conversely, additional features can be added by writing new ledger events or metadata without rewriting the computations.")

    _insert_figure_image(
        doc,
        "Figure 3.1: System Architecture Diagram",
        figures["fig_architecture.png"],
        "High-level architecture showing Next.js UI, Clerk authentication, Convex backend/database, and Inngest automation.",
    )

    _heading(doc, "3.2 Data Flow", 2)
    _para(doc, "The primary data flow begins with the Add Expense form. The UI validates splits, then submits a mutation. The server verifies membership for group expenses, assigns approvalStatus, and inserts the record. Queries subscribed by dashboard and group/person pages re-run, updating balances in real time.")
    _insert_figure_image(
        doc,
        "Figure 3.2: Data Flow Diagram (DFD Level 0)",
        figures["fig_dfd.png"],
        "Level-0 DFD showing how user input becomes a mutation, a database write, and then realtime UI updates.",
    )

    _heading(doc, "3.3 Expense Processing", 2)
    _para(doc, "Expense processing includes split validation, membership validation for group expenses, and assignment of approval status based on group configuration. For group expenses, if approvalRequired is enabled, new expenses are inserted as pending and excluded from balances until approved.")
    _para(doc, "Receipt uploads are stored as receipt metadata along with a data URL representation. Favorites and recurring templates are stored in a separate expenseTemplates table and can later be reused or scheduled for generation.")
    _para(doc, "For equal splits in group context, the system supports participant selection via checkboxes. By default, all members are selected, which matches the most common scenario. If a subset is selected, the equal split is computed only across the selected members. This design reduces user friction while still supporting partial participation scenarios such as taxis or small sub-group purchases.")
    _para(doc, "Auto-categorization is applied at entry time as a suggestion. The user can edit the category before saving. This makes the feature explainable and deterministic in an academic setting: it is primarily rule-based and does not require opaque model behavior to justify results.")

    _heading(doc, "3.4 Balance Model", 2)
    _para(doc, "Balances are derived from ledger entries. Each expense indicates one payer and multiple participant splits. The balance algorithm nets who paid vs who owes. Settlements subtract from the net. This derived approach ensures correctness and avoids manual drift.")
    _para(doc, "The balance computation is implemented in backend queries so that the same logic is used across UI pages. This prevents a common class of bugs where the dashboard and the group view compute totals differently. A single balance function also makes testing easier, because expected outputs can be validated using a fixed dataset.")

    _heading(doc, "3.5 Algorithms", 2)
    _heading(doc, "Debt Simplification", 3)
    _para(doc, "Debt simplification reduces the number of transfers required. In a group setting, if A owes B and B owes C, simplification can propose A pays C directly to reduce steps. SplitSync’s settle recommendation feature operates on derived net balances.")
    _heading(doc, "Splitting", 3)
    _para(doc, "Splitting algorithms compute participant shares. Equal split divides amount by participant count. Percentage split multiplies amount by percentage. Exact split validates sum. SplitSync validates split totals within a small tolerance to handle floating-point rounding.")
    _heading(doc, "Auto-categorization", 3)
    _para(doc, "The baseline auto-categorization algorithm is keyword-driven. For example, tokens like 'uber', 'ola', 'taxi' map to Transport; 'pizza', 'cafe' map to Food; and 'hotel' maps to Stay. The chosen category is stored with the expense and can be overridden. Future improvements can use user corrections to refine the mapping.")

    _heading(doc, "3.6 Real-time Sync", 2)
    _para(doc, "Real-time sync is achieved through Convex queries. Clients subscribe to queries and automatically receive updates when data changes. This results in fast feedback: after inserting an expense, the dashboard updates without explicit refresh.")

    _heading(doc, "3.7 User Flow", 2)
    _code_block(
        doc,
        "Figure 3.3: User Flow Diagram (Text Representation)",
        [
            "Sign In -> Dashboard -> (Create Group / Select Person)",
            "-> Add Expense -> (Approval Required? pending -> approve/reject)",
            "-> Balances Update -> Settle Up -> Record Settlement -> Balances Reduce",
        ],
    )
    _page_break(doc)

    _heading(doc, "3.7.1 Use Case Diagram (Placeholder)", 2)
    _insert_figure_image(
        doc,
        "Figure 3.4: Use Case Diagram",
        figures["fig_usecase.png"],
        "High-level use cases supported by SplitSync across groups, expenses, approvals, settlements, templates, receipts, and budgeting.",
    )
    _page_break(doc)

    _heading(doc, "3.7.2 ER Diagram (Placeholder)", 2)
    _insert_figure_image(
        doc,
        "Figure 3.5: ER Diagram",
        figures["fig_er.png"],
        "Simplified ER diagram showing main entities and relations (users, groups, expenses, splits, settlements, templates).",
    )
    _page_break(doc)

    _heading(doc, "3.8 Modules", 2)
    _table(
        doc,
        "Table 3.1: Major Modules and Responsibilities",
        ["Module", "Responsibilities"],
        [
            ["Authentication", "Clerk sign-in/sign-up, identity, session management"],
            ["Contacts/Groups", "Group creation, membership roles, contacts list"],
            ["Expense", "Expense creation, split validation, receipt attach"],
            ["Balance", "Unified computations for dashboard/person/group"],
            ["Settlement", "Settlement entry and history"],
            ["Approval Mode", "Pending queue + approve/reject actions"],
            ["Templates", "Favorites and recurring templates storage"],
            ["Automation", "Scheduled generation and insights/reminders"],
        ],
    )

    _heading(doc, "3.9 Key Pseudocode (For Evaluation)", 2)
    _code_block(
        doc,
        "Pseudocode 3.1: Compute Shares",
        [
            "COMPUTE_SHARES(amount, splitType, participants):",
            "  if splitType == 'equal':",
            "    n = count(participants.selected)",
            "    share = round(amount / n, 2)",
            "    distribute rounding remainder to first k participants",
            "    return shares",
            "  if splitType == 'percentage':",
            "    for each participant p:",
            "      shares[p] = round(amount * p.percent / 100, 2)",
            "    assert sum(shares) == amount (within tolerance)",
            "    return shares",
            "  if splitType == 'exact':",
            "    assert sum(p.exact) == amount (within tolerance)",
            "    return p.exact",
        ],
    )
    _code_block(
        doc,
        "Pseudocode 3.2: Approval Gating",
        [
            "ON_ADD_GROUP_EXPENSE(group, expense):",
            "  if group.approvalRequired:",
            "    expense.status = 'pending'",
            "  else:",
            "    expense.status = 'approved'",
            "",
            "BALANCE_QUERY(events):",
            "  include only expenses where status == 'approved'",
        ],
    )
    _code_block(
        doc,
        "Pseudocode 3.3: Recurring Template Generation",
        [
            "RUN_RECURRING_TICK(now):",
            "  templates = db.query(templates where recurring=true and nextRunAt <= now)",
            "  for each template t:",
            "    create expense from template fields",
            "    t.nextRunAt = advance(t.nextRunAt, t.interval)",
            "    db.patch(t)",
        ],
    )

    _page_break(doc)
    _heading(doc, "3.10 Feature Methodology (Detailed)", 2)
    _para(doc, "This section documents each major product feature in SplitSync. For every feature, the report includes: why it is needed, how it works, the implementation approach, difficulties faced during development, a representative code snippet, and a small example. This format is intentionally aligned to what examiners expect in a final-year project methodology chapter.")

    _feature_block(
        doc,
        "3.10.1 Unified Balance Model (Single Source of Truth)",
        need="In shared money systems, users lose trust if different screens show different balances. A unified balance model ensures dashboard totals, group balances, and 1:1 balances are consistent and derived from the same ledger rules.",
        explanation="SplitSync treats expenses and settlements as ledger events. Each approved expense increases the payer’s credit and increases each participant’s debt by their share. Settlements reduce debts and credits. All views are projections of the same underlying aggregation, which prevents drift and contradictions.",
        implementation="Balances are computed on the backend in Convex queries so the client does not duplicate arithmetic. Approval mode is implemented as a filter: pending expenses are excluded from balance derivation. Pairwise ledgers are netted only for reciprocal debts between the same two people to avoid creating artificial new debts.",
        difficulty="The main challenge is avoiding double-counting and keeping settlement effects consistent across multiple contexts (group and 1:1). Another issue is ensuring pending approvals never leak into totals. Implementation requires careful filtering and deterministic ordering so results are stable and testable.",
        code_title="Code Snippet: Group balance ledger (convex/groups.js)",
        code_lines=[
            "/* apply expenses */",
            "for (const exp of approvedExpenses) {",
            "  const payer = exp.paidByUserId;",
            "  for (const split of exp.splits) {",
            "    if (split.userId === payer || split.paid) continue;",
            "    const debtor = split.userId;",
            "    const amt = split.amount;",
            "    totals[payer] += amt;",
            "    totals[debtor] -= amt;",
            "    ledger[debtor][payer] += amt; // debtor owes payer",
            "  }",
            "}",
            "/* apply settlements */",
            "for (const s of settlements) {",
            "  totals[s.paidByUserId] += s.amount;",
            "  totals[s.receivedByUserId] -= s.amount;",
            "  ledger[s.paidByUserId][s.receivedByUserId] -= s.amount;",
            "}",
        ],
        example="Example: In a group of A, B, C, if A pays 1200 for dinner split equally, then B owes A 400 and C owes A 400. If B later settles 200 to A, the ledger reduces B→A by 200. The dashboard and group page both reflect the same updated net positions.",
    )

    _feature_block(
        doc,
        "3.10.2 Split Types (Equal / Percentage / Exact)",
        need="Different real-world situations require different split rules. Equal split is common, percentage split supports proportional contributions, and exact split supports uneven items such as different meal costs.",
        explanation="SplitSync stores splits explicitly per user in the expense record. The UI helps the user generate splits and validates totals. The backend re-validates the sum to prevent incorrect submissions and rounding drift.",
        implementation="The split editor is implemented as a reusable component that recalculates splits when amount/participants/type changes. For percentage, a slider and input allow editing values; for exact, numeric inputs are used. Totals are shown and validated with tolerance.",
        difficulty="The challenge is floating-point rounding and the risk that sums slightly differ from the total. SplitSync uses a small tolerance (0.01) for validations and surfaces user-friendly messages when totals do not match.",
        code_title="Code Snippet: Split generation (app/(main)/expenses/new/components/split-selector.jsx)",
        code_lines=[
            "if (type === \"equal\") {",
            "  const shareAmount = amount / participants.length;",
            "  newSplits = participants.map((participant) => ({",
            "    userId: participant.id,",
            "    amount: shareAmount,",
            "    percentage: 100 / participants.length,",
            "    paid: participant.id === paidByUserId,",
            "  }));",
            "}",
        ],
        example="Example: Amount=1000 and 4 participants. Equal split produces 250 each. Percentage split defaults to 25% each (250). Exact split can be edited to 400/200/200/200 as long as the sum is 1000.",
    )

    _feature_block(
        doc,
        "3.10.3 Expense Approval Mode (Pending → Approved/Rejected)",
        need="In some groups, not all expenses should immediately affect balances. Approval mode prevents disputes by allowing admins/creators to review expenses before they count.",
        explanation="If approvalRequired is enabled on a group, new group expenses are stored with approvalStatus='pending'. Pending expenses are excluded from balance calculations. Admins can approve (status becomes approved) or reject (expense is deleted).",
        implementation="Approval mode is implemented at two layers: (1) createExpense sets the initial approvalStatus based on group settings, and (2) group queries separate pending and approved expenses and compute balances using only approved expenses.",
        difficulty="The key difficulty is correctness: pending expenses must not leak into totals anywhere (dashboard, group page, settlements). Another difficulty is authorization: only admin/creator can approve or reject, so server-side checks are required.",
        code_title="Code Snippet: Approval gate on creation (convex/expenses.js)",
        code_lines=[
            "// If the group requires approval, new group expenses start pending.",
            "const approvalStatus = group.approvalRequired ? \"pending\" : \"approved\";",
            "const expenseId = await ctx.db.insert(",
            "  \"expenses\",",
            "  buildExpenseDocument(args, user, { approvalStatus })",
            ");",
        ],
        example="Example: Group 'Goa Trip' has approval enabled. When a member adds 'Hotel 12000', it appears in 'Pending approvals' and balances remain unchanged. When an admin approves it, the group balances update instantly for all members due to realtime queries.",
    )

    _feature_block(
        doc,
        "3.10.4 Group Budget Goals (Spend vs Goal)",
        need="During trips and shared living, teams want an overall spending target. Budget goals provide awareness without changing debts and credits.",
        explanation="Budget goals are stored on the group record as budgetGoal. Group spent amount is computed from approved expenses only. The UI shows progress percentage and remaining amount.",
        implementation="The backend exposes groupSpent (sum of approved expenses) and budgetGoal. The group page renders a budget card and allows admin/creator to set the goal. The mutation validates positive numbers and enforces permissions.",
        difficulty="The challenge is aligning budget progress with approval mode. Only approved expenses should count toward spent. Another difficulty is ensuring only authorized members can edit the goal, which is enforced by server-side membership role checks.",
        code_title="Code Snippet: Budget goal UI progress (app/(main)/groups/[id]/components/group-budget-goal.jsx)",
        code_lines=[
            "const parsedGoal = Number.parseFloat(value);",
            "const hasGoal = Number.isFinite(parsedGoal) && parsedGoal > 0;",
            "const progress = hasGoal ? Math.min(100, (spentAmount / parsedGoal) * 100) : 0;",
            "const remaining = hasGoal ? parsedGoal - spentAmount : null;",
        ],
        example="Example: Budget goal set to 30000. Approved spending so far is 12000, so progress is 40% and remaining is 18000. If approvals are enabled, pending expenses do not increase spent until approved.",
    )

    _feature_block(
        doc,
        "3.10.5 Receipt Upload (JPG/PNG/WEBP/PDF)",
        need="Receipts reduce disputes and help users remember why an expense was added. In evaluation, receipts also demonstrate auditability and completeness.",
        explanation="SplitSync allows attaching a receipt file when creating an expense. The file is stored as metadata plus a data URL snapshot. The UI previews image receipts and indicates when a PDF is attached.",
        implementation="The client validates file type and size (<= 1.5 MB). A FileReader loads the receipt as a data URL for preview and submission. Convex stores receiptName, receiptType, and receiptDataUrl in the expense record.",
        difficulty="The challenge is payload size and performance. Data URLs can be heavy, so the system enforces a size limit. Another challenge is consistent UX: images should preview immediately, while PDFs show a clear label without attempting to render inline.",
        code_title="Code Snippet: Receipt validation + snapshot (app/(main)/expenses/new/components/expense-form.jsx)",
        code_lines=[
            "const allowedTypes = [\"image/jpeg\",\"image/png\",\"image/webp\",\"application/pdf\"];",
            "if (!allowedTypes.includes(file.type)) {",
            "  toast.error(\"Please upload a JPG, PNG, WEBP, or PDF receipt.\");",
            "  clearReceipt();",
            "  return;",
            "}",
            "if (file.size > 1.5 * 1024 * 1024) {",
            "  toast.error(\"Receipts must be 1.5 MB or smaller.\");",
            "  clearReceipt();",
            "  return;",
            "}",
            "reader.onload = () => {",
            "  setReceiptFile(file);",
            "  setReceiptPreview(String(reader.result || \"\"));",
            "};",
        ],
        example="Example: User attaches 'dinner.jpg' while adding expense. The form shows an inline preview. On submit, receiptName/type/dataUrl are saved with the expense and a receipt badge appears in the expense list.",
    )

    _feature_block(
        doc,
        "3.10.6 Auto-Categorization (Rule-Based Suggestion)",
        need="Categorization improves analytics and reduces manual work. Users often skip categories if it adds friction, so the system should suggest a category automatically.",
        explanation="SplitSync uses deterministic keyword rules (regular expressions) to suggest categories based on the description. The suggestion is applied automatically if the user has not manually changed the category; otherwise it is shown as a recommendation the user can apply.",
        implementation="The rules live in lib/auto-categorize.js. The expense form watches the description and uses a guarded effect to set the category only when it is safe to do so (categoryTouched=false).",
        difficulty="The main challenge is avoiding infinite update loops (setValue causing re-render causing setValue). The implementation uses guards: it only sets category when description is non-empty, suggestion exists, and the user has not manually touched the category field.",
        code_title="Code Snippet: Auto-category rules (lib/auto-categorize.js)",
        code_lines=[
            "{",
            "  categoryId: \"transportation\",",
            "  patterns: [",
            "    /\\b(uber|lyft|ola|taxi|cab|ride|metro|bus|toll|fuel)\\b/i,",
            "  ],",
            "  reason: \"Ride and transport keywords found\",",
            "}",
        ],
        example="Example: Description='Uber to airport' matches the transportation rule, so category is auto-selected as Transportation. If the user changes category to Travel manually, the system stops auto-overwriting and instead shows a small 'Use suggestion' link.",
    )

    _feature_block(
        doc,
        "3.10.7 Favorites and Quick-Add Templates",
        need="Many expenses repeat (rent, groceries, subscriptions). Favorites and templates reduce repeated typing and make the app faster to use during trips.",
        explanation="When creating an expense, the user can tick 'Save as favorite'. This creates an expenseTemplate record containing description, amount, category, payer, splitType, and splits. Templates are listed at the top of the expense form as 'Quick add templates'.",
        implementation="Templates are stored in the expenseTemplates table. The expense form queries templates and provides a 'Use template' action to apply values into the form (including participants and splits).",
        difficulty="The challenge is mapping template splits back into UI participants. The applyTemplate function rebuilds participant objects and rehydrates the split state. Another difficulty is ensuring templates are scoped to the creating user and permission-checked on deletion.",
        code_title="Code Snippet: Applying a template into the form (app/(main)/expenses/new/components/expense-form.jsx)",
        code_lines=[
            "setValue(\"description\", template.description || \"\");",
            "setValue(\"amount\", template.amount?.toString() || \"\");",
            "setValue(\"splitType\", template.splitType || \"equal\");",
            "setParticipants(template.splits.map((split) => ({",
            "  id: split.userId,",
            "  name: split.name || split.email || \"Unknown\",",
            "})));",
            "setSplits(Array.isArray(template.splits) ? template.splits : []);",
        ],
        example="Example: Saving 'Netflix $499 split equally in Flat group' as favorite allows one-click reuse next month. The template fills amount, payer, group, and split details automatically.",
    )

    _feature_block(
        doc,
        "3.10.8 Recurring Expenses (Automation via Inngest)",
        need="Subscriptions and recurring bills should not require manual re-entry every time. Recurring templates automate expense creation and strengthen novelty for evaluation.",
        explanation="Recurring expenses are implemented as templates with recurrenceFrequency, recurrenceInterval, and nextRunAt. A daily cron job fetches due templates and generates expense occurrences. If a recurring expense belongs to a group with approvalRequired, the generated expense is created as pending.",
        implementation="The recurrence date logic is implemented in lib/recurrence.js. Convex exposes an internal query to fetch templates due by nextRunAt, and an internal mutation to generate the expense and advance nextRunAt. Inngest triggers this on a schedule.",
        difficulty="Scheduling is tricky because jobs can be delayed or missed. The function advanceNextRunUntilFuture safely advances nextRunAt in a loop with a safety limit to avoid infinite loops. Another challenge is ensuring generated expenses follow the same approval and balance rules as manual expenses.",
        code_title="Code Snippet: Cron generation (lib/inngest/recurring-expenses.js)",
        code_lines=[
            "export const recurringExpenses = inngest.createFunction(",
            "  { name: \"Generate Recurring Expenses\" },",
            "  { cron: \"0 7 * * *\" },",
            "  async ({ step }) => {",
            "    const templates = await convex.query(api.expenses.getDueRecurringExpenseTemplates);",
            "    for (const template of templates) {",
            "      await convex.mutation(api.expenses.runRecurringExpenseTemplate, { templateId: template._id });",
            "    }",
            "  }",
            ");",
        ],
        example="Example: A recurring 'Rent' template with frequency=monthly and nextRunAt=June 1 will automatically create an expense on June 1. If the group requires approval, it is created pending and appears in the approvals queue until approved.",
    )

    _feature_block(
        doc,
        "3.10.9 Smart Settle Recommendation",
        need="Users often ask 'what should I settle first?'. A smart recommendation reduces decision fatigue and helps users take action from the dashboard.",
        explanation="SplitSync computes net balances (youOwe and youAreOwedBy). Smart settle picks the largest relevant balance based on totalBalance direction and suggests either paying or requesting payment.",
        implementation="The recommendation is a pure function in lib/smart-settle.js. The UI card consumes it and links the user directly to the settlement flow for that counterpart.",
        difficulty="The challenge is producing a recommendation that feels helpful without being complex. The chosen heuristic is simple and explainable: pick the largest magnitude balance in the direction that best matches the user’s net position.",
        code_title="Code Snippet: Recommendation selection (lib/smart-settle.js)",
        code_lines=[
            "const youOwe = balances?.oweDetails?.youOwe ?? [];",
            "const youAreOwedBy = balances?.oweDetails?.youAreOwedBy ?? [];",
            "const totalBalance = balances?.totalBalance ?? 0;",
            "if (totalBalance < 0 && youOwe.length > 0) { candidates = youOwe; direction = \"owe\"; }",
            "else if (totalBalance > 0 && youAreOwedBy.length > 0) { candidates = youAreOwedBy; direction = \"owed\"; }",
            "const bestMatch = [...candidates].sort((a, b) => b.amount - a.amount)[0];",
        ],
        example="Example: If you owe B $200 and owe C $50, smart settle recommends paying B because it is the largest owing balance.",
    )

    _feature_block(
        doc,
        "3.10.10 Email Automation: Payment Reminders and Monthly Insights",
        need="Reminders and insights improve engagement and demonstrate novelty. For academic evaluation, scheduled jobs and AI insights show advanced system capabilities beyond CRUD.",
        explanation="SplitSync sends daily payment reminders for users with outstanding debts and monthly spending insights. Insights are generated using Gemini with an HTML prompt and delivered through email sending actions.",
        implementation="Inngest runs cron functions. Payment reminders query outstanding debts, build an HTML table, and send one email per user. Monthly insights fetch last-month expenses and use Gemini to produce concise HTML recommendations, then emails the result.",
        difficulty="The challenges include safe scheduling, handling errors (email failures, AI failures), and limiting content length. The implementation wraps major steps in step.run blocks and collects success/failure results for cron logs.",
        code_title="Code Snippet: Reminder email HTML table (lib/inngest/payment-reminders.js)",
        code_lines=[
            "const rows = u.debts.map((d) => `",
            "  <tr><td>${d.name}</td><td>$${d.amount.toFixed(2)}</td></tr>`).join(\"\");",
            "const html = `",
            "  <h2>SplitSync – Payment Reminder</h2>",
            "  <table border=\"1\" style=\"border-collapse:collapse;\">${rows}</table>`;",
        ],
        example="Example: If a user owes two people (A: $120, B: $45), the reminder email shows a simple table with both rows. On the 1st of each month, the insights email summarizes categories and highlights unusual spending patterns.",
    )

    _feature_block(
        doc,
        "3.10.11 Authentication and Access Control",
        need="Expense data is private and group data should be visible only to members. Authentication is required to make the application safe and realistic, and examiners often check whether access control is implemented properly.",
        explanation="SplitSync uses Clerk for authentication in the Next.js app and Convex identity on the backend. Protected routes redirect unauthenticated users to sign-in. Server functions use the authenticated identity to locate the corresponding user record and enforce authorization checks on every sensitive query and mutation.",
        implementation="On the frontend, middleware guards routes like /dashboard, /groups, and /expenses. On the backend, Convex queries call ctx.auth.getUserIdentity() and map the tokenIdentifier to a user record in the users table (indexed by token). This identity is then used to validate membership and role for group actions.",
        difficulty="The common pitfall is relying only on client-side checks. SplitSync enforces server-side checks consistently. Another challenge is keeping user identity in sync (e.g., name changes), which is handled by patching the stored user record when the identity name changes.",
        code_title="Code Snippet: Protected routes via Clerk middleware (middleware.js)",
        code_lines=[
            "const isProtectedRoute = createRouteMatcher([",
            "  \"/dashboard(.*)\", \"/expenses(.*)\", \"/groups(.*)\", \"/settlements(.*)\",",
            "]);",
            "export default clerkMiddleware(async (auth, req) => {",
            "  const { userId } = await auth();",
            "  if (!userId && isProtectedRoute(req)) {",
            "    const { redirectToSignIn } = await auth();",
            "    return redirectToSignIn();",
            "  }",
            "  return NextResponse.next();",
            "});",
        ],
        example="Example: If a user opens /dashboard without signing in, they are redirected to Clerk sign-in. After authentication, Convex queries can safely fetch the user’s groups and expenses because the identity is verified server-side.",
    )

    _feature_block(
        doc,
        "3.10.12 Settlement Module (1:1 and Group)",
        need="Even with correct balances, users need a way to record real payments. Without settlement records, balances never reduce and the system cannot represent real-world closure.",
        explanation="A settlement records that one user paid another a certain amount. In SplitSync, settlements are ledger events that reduce net debts. Settlements can be recorded in a 1:1 context or within a group context (ensuring both users are members).",
        implementation="The backend mutation createSettlement validates positive amounts, prevents payer=receiver, ensures the caller is involved, and verifies group membership when groupId is provided. Queries for settlement pages compute net amounts owed/owing by scanning approved expenses and settlements.",
        difficulty="The main difficulty is validation and preventing invalid settlements. Another challenge is ensuring settlement computations match balance computations, so that recorded settlements correctly reduce what the UI shows across dashboard and group/person pages.",
        code_title="Code Snippet: Settlement validation (convex/settlements.js)",
        code_lines=[
            "if (args.amount <= 0) throw new Error(\"Amount must be positive\");",
            "if (args.paidByUserId === args.receivedByUserId) {",
            "  throw new Error(\"Payer and receiver cannot be the same user\");",
            "}",
            "if (caller._id !== args.paidByUserId && caller._id !== args.receivedByUserId) {",
            "  throw new Error(\"You must be either the payer or the receiver\");",
            "}",
            "if (args.groupId) {",
            "  const group = await ctx.db.get(args.groupId);",
            "  if (!group) throw new Error(\"Group not found\");",
            "  const isMember = (uid) => group.members.some((m) => m.userId === uid);",
            "  if (!isMember(args.paidByUserId) || !isMember(args.receivedByUserId)) {",
            "    throw new Error(\"Both parties must be members of the group\");",
            "  }",
            "}",
        ],
        example="Example: If A owes B $500 and A pays B $300, the settlement reduces the net owing to $200. This reduction is reflected immediately across the dashboard and group/person pages.",
    )

    _feature_block(
        doc,
        "3.10.13 Real-Time Sync (Reactive Queries)",
        need="In shared groups, multiple people add expenses and settlements. Real-time updates reduce conflicts, prevent duplicate entries, and make the demo feel modern and premium.",
        explanation="SplitSync uses Convex reactive queries. When an expense is inserted or approved, subscribed queries re-run and the UI updates automatically. This removes the need for manual refresh and ensures all participants see consistent state.",
        implementation="The frontend wraps Convex useQuery/useMutation in helper hooks that expose data/isLoading/error. Pages like the dashboard call useConvexQuery(api.dashboard.getUserBalances) and render loaders until data is ready. When the underlying data changes, Convex pushes updates and the hook sets new state.",
        difficulty="A common UI difficulty is handling 'undefined' query results during initial load. The hook explicitly treats undefined as loading state. Another difficulty is preventing infinite update loops when controlled form fields set state repeatedly; SplitSync uses guard checks in effects (e.g., auto-categorization) to avoid maximum update depth errors.",
        code_title="Code Snippet: Convex query wrapper (hooks/use-convex-query.js)",
        code_lines=[
            "const result = useQuery(query, ...args);",
            "useEffect(() => {",
            "  if (result === undefined) {",
            "    setIsLoading(true);",
            "  } else {",
            "    setData(result);",
            "    setIsLoading(false);",
            "  }",
            "}, [result]);",
        ],
        example="Example: When an admin approves a pending expense, group balances and dashboard totals update instantly for all connected members without refreshing the browser.",
    )

    _feature_block(
        doc,
        "3.10.14 Dashboard Analytics (Monthly Spending Chart)",
        need="A report and demo become stronger when the system shows insights, not only raw transactions. A monthly spending chart helps users understand trends and also demonstrates data aggregation and visualization.",
        explanation="SplitSync computes monthly spending from the current year’s expenses, using the user’s share of each expense. The dashboard displays this as a bar chart, along with total spent for month and year.",
        implementation="Convex query getMonthlySpending groups expenses by month start timestamps and sums the user’s split. The UI maps these into chart data and renders a Recharts bar chart inside a responsive container.",
        difficulty="The main challenge is defining 'spent' consistently. SplitSync uses personal share (userSplit.amount) rather than total expense amount so analytics reflect personal spending rather than group totals. Another challenge is handling months with zero spending, which is solved by initializing all months to zero.",
        code_title="Code Snippet: Chart rendering (app/(main)/dashboard/components/expense-summary.jsx)",
        code_lines=[
            "const chartData = monthlySpending?.map((item) => {",
            "  const date = new Date(item.month);",
            "  return { name: monthNames[date.getMonth()], amount: item.total };",
            "}) || [];",
            "<ResponsiveContainer width=\"100%\" height=\"100%\">",
            "  <BarChart data={chartData}>",
            "    <Bar dataKey=\"amount\" fill=\"#36d7b7\" radius={[4,4,0,0]} />",
            "  </BarChart>",
            "</ResponsiveContainer>",
        ],
        example="Example: If the user’s personal shares in January total $1200 and in February total $800, the chart shows a higher January bar. This is consistent with the raw expense list because it is computed from the same split values.",
    )

    _heading(doc, "PSEUDOCODE BLOCKS", 2)
    _code_block(
        doc,
        "Pseudocode 1: Create Expense (Approval Gate)",
        [
            "CREATE_EXPENSE(input):",
            "  user <- getCurrentUser()",
            "  assert abs(sum(splits) - amount) <= tolerance",
            "  approvalStatus <- approved",
            "  if groupId:",
            "    group <- db.get(groupId)",
            "    assert user is member",
            "    if group.approvalRequired: approvalStatus <- pending",
            "  insert expense with approvalStatus",
        ],
    )
    _code_block(
        doc,
        "Pseudocode 2: Unified Balance Computation (High Level)",
        [
            "COMPUTE_NET(A,B,scope):",
            "  net <- 0",
            "  for expense in expenses(scope):",
            "    if expense not approved: continue",
            "    add/subtract owed amounts between A and B",
            "  for settlement in settlements(scope):",
            "    subtract/ add settlement amounts between A and B",
            "  return net",
        ],
    )
    _code_block(
        doc,
        "Pseudocode 3: Recurring Template Generator (Inngest)",
        [
            "RUN_RECURRING():",
            "  templates <- query where nextRunAt <= now",
            "  for template in templates:",
            "    status <- approved unless group requires approval",
            "    insert expense occurrence",
            "    update template nextRunAt",
        ],
    )
    _code_block(
        doc,
        "Pseudocode 4: Debt Simplification (Greedy Matching)",
        [
            "SIMPLIFY(netBalances):",
            "  creditors <- positive nets",
            "  debtors <- negative nets",
            "  match debtor->creditor payments until cleared",
        ],
    )
    _page_break(doc)

    # CHAPTER 4
    _heading(doc, "CHAPTER 4: IMPLEMENTATION", 1)
    _heading(doc, "4.1 Introduction", 2)
    _para(doc, "This chapter describes implementation details across frontend and backend modules. The app uses Next.js for pages/components, Convex for server functions and DB schema, and Clerk for identity. Implementation details are presented module-wise so examiners can evaluate completeness.")

    _heading(doc, "4.2 Development Environment", 2)
    _bullets(
        doc,
        [
            "Framework: Next.js (App Router)",
            "Backend: Convex (queries, mutations, indexes)",
            "Auth: Clerk (sign-in/sign-up)",
            "Automation: Inngest (scheduled tasks)",
            "UI: Tailwind CSS + Radix components",
            "Charts: Recharts",
        ],
    )
    _para(doc, "Code organization separates frontend routes under app/ and backend functions under convex/. Shared utility logic exists in lib/. The application uses a single schema definition to enforce typed tables and predictable records.")

    _heading(doc, "4.3 Modules", 2)
    _heading(doc, "Authentication Module", 3)
    _para(doc, "Authentication is handled using Clerk. Users sign in and obtain a session identity. Convex server functions use the authenticated identity to enforce access control on queries and mutations. This ensures that expense and group data is only accessible to authorized users.")
    _para(doc, "Server-side guards ensure that only authorized members can view or mutate group data. This is essential in a multi-user system because client-only checks are not sufficient. Each sensitive mutation (add expense, approve expense, settle) validates membership and roles before writing to the database.")
    _heading(doc, "Expense Module", 3)
    _para(doc, "Expense entry supports group and individual contexts, split types, receipt upload, auto-categorization, and template creation. Expenses are stored in the expenses table. Templates are stored in expenseTemplates and can be used for quick entry or scheduled generation.")
    _para(doc, "The expense form is designed for correctness-first behavior. It provides immediate feedback on invalid input (for example, exact split sums not matching the total). In equal split mode, the participant checkbox list defaults to all members selected and recalculates shares automatically when a member is toggled. This reduces the chance of wrong participant selection, which is a common real-world error.")
    _para(doc, "Receipt upload is implemented as an attachment metadata field so that each expense can store proof (image or PDF). This increases trust and helps resolve disagreements later. Favorites are implemented as templates that store common expense parameters; the user can quickly reuse them without retyping.")

    _heading(doc, "Approval Workflow Module", 3)
    _para(doc, "Approval mode implements a simple, demonstrable workflow: when enabled on a group, new group expenses are stored as pending. An admin can approve or reject them. Pending expenses are visible in the group approvals queue but do not affect balances until approved. This is implemented as a status field that is checked inside balance queries, ensuring a single source of truth.")

    _heading(doc, "Group Module", 3)
    _para(doc, "Groups store members and roles. Group budget goals and approval mode are stored on the group record. The group page displays balances, members, approved expenses, pending approvals, and settlement history.")
    _para(doc, "Budget goals are stored as a group-level configuration. The UI displays progress (spent vs goal) to create awareness during trips or shared living. This feature is intentionally separated from balances so it does not affect debts; it is a planning layer rather than a financial computation layer.")
    _heading(doc, "Balance Module", 3)
    _para(doc, "Balances are computed from approved expenses and settlements. Pending expenses are excluded until approved, ensuring that group governance does not create premature financial obligations.")
    _para(doc, "Balances are computed using a deterministic pipeline based on the unified ledger. This ensures that the dashboard, group page, and person page never contradict each other. Any difference is treated as a bug and can be debugged by replaying the ledger dataset.")
    _heading(doc, "Settlement Module", 3)
    _para(doc, "Settlements record payments and reduce net balances. Settlements can be recorded for 1:1 or group contexts and are stored with timestamps and optional notes.")
    _para(doc, "Settlement entries are intentionally explicit rather than inferred. Even if simplification suggests a payment, the system stores the settlement only when the user confirms it. This keeps history clear and avoids confusion in evaluation scenarios.")

    _heading(doc, "Database Schema (Summary)", 2)
    _table(
        doc,
        "Table 4.1: Database Entities (Summary)",
        ["Entity", "Key Fields", "Purpose"],
        [
            ["groups", "name, createdBy, approvalRequired, budgetGoal", "Group configuration and governance"],
            ["groupMembers", "groupId, userId, role", "Membership and authorization"],
            ["expenses", "groupId?, payerId, amount, status, category, createdAt", "Ledger event (approval gating)"],
            ["expenseSplits", "expenseId, userId, share", "Participant shares derived from split strategy"],
            ["settlements", "groupId?, fromUser, toUser, amount, createdAt", "Ledger event (payments)"],
            ["expenseTemplates", "ownerId, groupId?, name, fields, recurring, nextRunAt", "Favorites and recurring sources"],
        ],
    )

    _page_break(doc)

    _heading(doc, "SCREENSHOTS (VERY IMPORTANT)", 2)
    _figure_placeholder(doc, "Figure 4.1: Landing Page", "Landing page presenting SplitSync features and guided story.")
    _page_break(doc)
    _figure_placeholder(doc, "Figure 4.2: Dashboard", "Dashboard showing net balance, owed/owing, spending chart, group list, and smart settle suggestion.")
    _page_break(doc)
    _figure_placeholder(doc, "Figure 4.3: Add Expense", "Expense form supporting split strategies, auto-category, receipt upload, favorites, recurring templates.")
    _page_break(doc)
    _figure_placeholder(doc, "Figure 4.4: Group Page", "Group balances, members, budget goal, approval mode toggle, pending approvals queue, expenses, settlements.")
    _page_break(doc)
    _figure_placeholder(doc, "Figure 4.5: Individual Page", "Person-to-person balance card with expenses and settlement tabs.")
    _page_break(doc)
    _figure_placeholder(doc, "Figure 4.6: Settlement Page", "Settlement form for user or group context, updating balances immediately.")
    _page_break(doc)
    _figure_placeholder(doc, "Figure 4.7: Approval Queue", "Pending approvals list with approve/reject actions and audit trail fields (who requested, createdAt).")
    _page_break(doc)
    _figure_placeholder(doc, "Figure 4.8: Budget Goals", "Group budget goal configuration and budget progress indicator (spent vs goal).")
    _page_break(doc)
    _figure_placeholder(doc, "Figure 4.9: Receipt Viewer", "Expense details view showing receipt preview, download/open, and attachment metadata.")
    _page_break(doc)
    _figure_placeholder(doc, "Figure 4.10: Favorites and Recurring", "Templates list with favorite toggle and recurring schedule controls (interval, next run).")
    _page_break(doc)

    # CHAPTER 5
    _heading(doc, "CHAPTER 5: RESULTS & ANALYSIS", 1)
    _heading(doc, "5.1 Test Scenarios", 2)
    _table(
        doc,
        "Table 5.1: Test Scenarios and Expected Output",
        ["Scenario", "Input", "Expected Output"],
        [
            ["Individual equal split", "1 payer, 2 participants", "Net balance updated correctly"],
            ["Group pending approval", "approvalRequired=true", "Expense pending; balances unchanged"],
            ["Approve expense", "admin approves pending", "Expense becomes approved and contributes to balances"],
            ["Recurring generation", "template nextRunAt <= now", "New expense created from template"],
            ["Receipt upload", "JPG/PDF attached", "Expense shows receipt metadata and badge"],
        ],
    )
    _para(doc, "Testing focused on correctness of split validation, correctness of balances across screens, behavior of approval gating, and stability of recurring generation. Each scenario was tested with multiple participants to verify derived net balances.")
    _heading(doc, "5.1.1 Edge Cases Considered", 3)
    _table(
        doc,
        "Table 5.6: Edge Cases and Handling",
        ["Edge case", "Risk", "Handling in SplitSync"],
        [
            ["Rounding in equal splits", "Sum mismatch due to decimals", "Round shares and distribute remainder deterministically"],
            ["Partial participation", "Wrong members included", "Participant checkbox selection + validation"],
            ["Pending approvals", "Balances change prematurely", "Filter pending expenses in balance queries"],
            ["Duplicate submissions", "Repeated expenses", "UI disables submit while pending; server idempotency can be added"],
            ["Settlement larger than debt", "Negative over-clear", "Validate settlement amount against net balance where applicable"],
        ],
    )
    _para(doc, "These cases were chosen because they are common failure points in expense systems and because they are easy for examiners to verify during evaluation. For example, rounding behavior can be validated by selecting 3 participants and entering a non-divisible amount.")

    _heading(doc, "5.2 Sample Calculations (IMPORTANT)", 2)
    _para(doc, "This section presents sample calculations to demonstrate unified balance behavior. These examples are intentionally detailed because examiners often evaluate correctness by verifying arithmetic consistency.")
    _table(
        doc,
        "Table 5.2: Sample Goa Trip Expenses",
        ["Expense", "Paid By", "Amount", "Split Type", "Participants", "Shares"],
        [
            ["Hotel", "A (You)", "12000", "Equal", "A,B,C,D", "3000 each"],
            ["Dinner", "B", "4000", "Equal", "A,B,C,D", "1000 each"],
            ["Taxi", "C", "2000", "Exact", "A,C,D", "A=700,C=500,D=800"],
        ],
    )
    _para(doc, "From these entries, net balances can be derived between any pair. For example, between A and B: B owes A 3000 from hotel; A owes B 1000 from dinner. Net is B owes A 2000. If B pays A 1500 (settlement), net becomes 500.")
    _table(
        doc,
        "Table 5.3: Sample Flat Group Expenses",
        ["Expense", "Paid By", "Amount", "Split Type", "Shares"],
        [
            ["Rent", "A (You)", "15000", "Equal", "A=5000,E=5000,F=5000"],
            ["WiFi", "E", "1200", "Equal", "A=400,E=400,F=400"],
            ["Groceries", "F", "3000", "Percentage", "A=40%,E=30%,F=30%"],
        ],
    )
    _para(doc, "The flat group example demonstrates mixed split types. Percentage splits are computed as amount * percentage/100. The unified model ensures that totals match across dashboard and group pages.")
    _table(
        doc,
        "Table 5.4: Individual (1:1) Expenses",
        ["Expense", "Paid By", "Amount", "Split Type", "Shares"],
        [
            ["Movie", "A (You)", "600", "Equal", "A=300, G=300"],
            ["Snacks", "G", "400", "Exact", "A=250, G=150"],
        ],
    )
    _para(doc, "Net(A,G) = (G owes A 300) - (A owes G 250) = 50. Therefore, G owes A 50. Recording a settlement of 50 clears the balance to zero.")

    _heading(doc, "5.3 Performance Analysis", 2)
    _para(doc, "The system is optimized for responsiveness rather than heavy offline computation. Convex enables fast queries and real-time updates. For typical college datasets (tens to hundreds of expenses), balance computation remains fast enough for interactive use.")
    _table(
        doc,
        "Table 5.5: Performance/Behavior Observations",
        ["Metric", "Observation"],
        [
            ["Expense submission", "Fast mutation and immediate UI update via reactive queries"],
            ["Balance recompute", "Efficient for small/medium histories"],
            ["Real-time sync", "Consistent across dashboard/group/person"],
            ["Approval gating", "Pending expenses excluded until approved"],
            ["Recurring generation", "Scheduled insertion based on nextRunAt timestamps"],
        ],
    )
    _heading(doc, "5.4 Advantages Observed", 2)
    _bullets(
        doc,
        [
            "Unified balance model prevents contradictory totals.",
            "Approval mode improves governance and reduces disputes.",
            "Receipt attachment improves auditability.",
            "Favorites and recurring templates reduce repeated manual work.",
            "Auto-categorization speeds data entry and supports analytics.",
        ],
    )
    _heading(doc, "5.5 Limitations", 2)
    _bullets(
        doc,
        [
            "Receipt storage uses data URLs; very large files may be heavy.",
            "OCR extraction from receipts is not implemented.",
            "No banking integration or payment processing.",
            "Very large histories may need incremental aggregation optimizations.",
        ],
    )
    _page_break(doc)

    # CHAPTER 6
    _heading(doc, "CHAPTER 6: CONCLUSION & FUTURE SCOPE", 1)
    _heading(doc, "6.1 Conclusion", 2)
    _para(doc, "SplitSync successfully implements a real-time shared expense tracking and settlement system. The project demonstrates correct balance computation through a unified model, flexible split strategies, real-time synchronization, and usability features such as templates, recurring expenses, approval mode, budget goals, receipt upload, and auto-categorization.")
    _para(doc, "From an academic perspective, the project demonstrates full-stack engineering, database design, algorithmic reasoning for balances and simplification, and a complete user interface suitable for evaluation and demonstration.")
    _heading(doc, "6.2 Future Scope", 2)
    _bullets(
        doc,
        [
            "Add OCR for receipts to extract merchant/date/amount automatically.",
            "Improve AI categorization by learning from user corrections.",
            "Extend monthly insights with anomaly detection and spending trends.",
            "Add tone-controlled reminders and schedule preferences per group.",
            "Deploy as a production app with robust environment config and monitoring.",
            "Optimize large-history performance with caching/incremental aggregates.",
        ],
    )
    _page_break(doc)

    # REFERENCES
    _heading(doc, "REFERENCES", 1)
    _bullets(
        doc,
        [
            "Next.js Documentation (App Router, Routing, Metadata)",
            "Convex Documentation (Queries, Mutations, Real-time Sync, Indexes)",
            "Clerk Documentation (Authentication, Sessions, User Management)",
            "Inngest Documentation (Scheduling, Workflows, Background Jobs)",
            "Gemini / Google Generative AI Documentation (optional insights pipeline)",
        ],
    )
    _page_break(doc)

    # ANNEXURE
    _heading(doc, "ANNEXURE", 1)
    _heading(doc, "A.1 ER Diagram (Text)", 2)
    _code_block(
        doc,
        "Figure A.1: ER Diagram (Text Representation)",
        [
            "USERS 1---* EXPENSES",
            "USERS 1---* SETTLEMENTS",
            "GROUPS 1---* EXPENSES",
            "GROUPS 1---* SETTLEMENTS",
            "USERS 1---* EXPENSE_TEMPLATES",
            "GROUPS *---* USERS (memberships)",
        ],
    )
    _heading(doc, "A.2 Extra Pseudocode: Approval Handling", 2)
    _code_block(
        doc,
        "Approval Handling",
        [
            "APPROVE_EXPENSE(groupId, expenseId, admin):",
            "  group <- db.get(groupId)",
            "  assert admin is creator or role=admin",
            "  expense <- db.get(expenseId)",
            "  assert expense.status == pending",
            "  patch expense.status = approved",
        ],
    )
    _heading(doc, "A.3 Sample Data Table Template", 2)
    _table(
        doc,
        "Sample Data Table",
        ["Date", "Description", "Amount", "Paid By", "Group", "Split Type", "Notes"],
        [["[FILL]", "[FILL]", "[FILL]", "[FILL]", "[FILL]", "[FILL]", "[FILL]"]],
    )

    _heading(doc, "A.4 Additional Test Dataset (Expanded)", 2)
    _para(doc, "This expanded sample dataset is suitable for demonstrating multiple split types, partial participation via participant checkboxes, approvals, and a settlement. Examiners can verify that balances computed on the dashboard match balances on the group and person screens because all are derived from the same ledger.")
    _table(
        doc,
        "Table A.1: Expanded Sample Dataset",
        ["Context", "Description", "Paid By", "Amount", "Participants", "Split Type", "Notes"],
        [
            ["Goa Trip", "Hotel", "A", "12000", "A,B,C,D", "Equal", "All selected by default"],
            ["Goa Trip", "Taxi (subset)", "B", "900", "B,C", "Equal", "Only selected participants included"],
            ["Goa Trip", "Dinner", "C", "2600", "A,B,C,D", "Percentage", "25% each"],
            ["Flat", "Electricity", "E", "2200", "A,E,F", "Exact", "A=700,E=800,F=700"],
            ["Individual", "Concert Tickets", "A", "3000", "A,G", "Equal", "A=1500,G=1500"],
            ["Settlement", "G pays A", "G", "1500", "A,G", "Settlement", "Clears ticket debt"],
        ],
    )

    _heading(doc, "A.5 Extra Diagram (Text)", 2)
    _insert_figure_image(
        doc,
        "Figure A.2: Sequence Diagram (Approval Flow)",
        figures["fig_sequence.png"],
        "Sequence of calls for adding an expense in approval-required group and then approving it to affect balances.",
    )

    _page_break(doc)
    _heading(doc, "A.6 Full Pseudocode: Balance Derivation (Expanded)", 2)
    _code_block(
        doc,
        "Balance Derivation (Expanded)",
        [
            "DERIVE_BALANCES(context):",
            "  expenses <- query expenses where context matches AND status='approved'",
            "  splits   <- query splits for those expenses",
            "  settlements <- query settlements where context matches",
            "",
            "  net[user] = 0 for all users in context",
            "  for expense e in expenses:",
            "    net[e.payer] += e.amount",
            "    for split s in splits where s.expenseId == e.id:",
            "      net[s.user] -= s.share",
            "",
            "  for settlement t in settlements:",
            "    net[t.fromUser] += t.amount",
            "    net[t.toUser]   -= t.amount",
            "",
            "  return net",
        ],
    )
    _para(doc, "This derivation is used as the single source of truth for all UI views. Any view-specific numbers are computed from this net output by filtering or projecting the relevant subset (e.g., person-to-person net).")

    _page_break(doc)
    _heading(doc, "A.7 Validation Rules (Checklist)", 2)
    _bullets(
        doc,
        [
            "Expense amount must be positive and non-zero.",
            "At least two participants must be selected for group equal split (or at least one for individual context).",
            "Exact split: sum of shares must match amount (within tolerance).",
            "Percentage split: sum of percentages must equal 100 (within tolerance).",
            "Approval actions restricted to creator/admin role.",
            "Settlements should not exceed the outstanding balance in strict mode (optional).",
            "Receipt attachment size limits enforced to avoid oversized payloads.",
        ],
    )

    out_docx = OUT_DIR / "SplitSync_Final_Report.docx"
    doc.save(str(out_docx))
    return out_docx


if __name__ == "__main__":
    out = build_report()
    print(str(out))
