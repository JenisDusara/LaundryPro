from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import extract
from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, HRFlowable, Image
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
import calendar
import os
from datetime import date

from db.database import get_db
from models import Customer, LaundryEntry
from routers.auth import get_current_admin

router = APIRouter(prefix="/api/invoices", tags=["invoices"])


def p(text, size=9, bold=False, color="#1e293b", align=TA_LEFT, leading=None):
    return Paragraph(str(text), ParagraphStyle(
        "x", fontSize=size,
        fontName="Helvetica-Bold" if bold else "Helvetica",
        textColor=colors.HexColor(color),
        alignment=align,
        leading=leading or size + 4,
    ))


def generate_invoice_pdf(customer: Customer, entries: list, month: int, year: int) -> BytesIO:
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        rightMargin=14*mm, leftMargin=14*mm,
        topMargin=12*mm, bottomMargin=12*mm
    )

    TEAL     = colors.HexColor("#1a6fa8")
    TEAL_HDR = colors.HexColor("#1a6fa8")
    ROW_ALT  = colors.HexColor("#fef3e8")
    BORDER   = colors.HexColor("#f4c89a")
    NAVY     = colors.HexColor("#1a4f7a")
    WHITE    = colors.white
    CUST_BG1 = colors.HexColor("#fef3e8")
    CUST_BG2 = colors.HexColor("#fff9f4")

    month_name = calendar.month_name[month]
    last_day   = calendar.monthrange(year, month)[1]
    bill_date  = date(year, month, last_day)
    elements   = []

    # ── LOGO ─────────────────────────────────────────────────
    logo_path = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "static", "logo1.jpg"))

    if os.path.exists(logo_path):
        logo_img = Image(logo_path, width=178*mm, height=45*mm)
        header_tbl = Table([[logo_img]], colWidths=[178*mm])
        header_tbl.setStyle(TableStyle([
            ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
            ("ALIGN",  (0,0), (-1,-1), "CENTER"),
        ]))
        elements.append(header_tbl)
    else:
        elements.append(p("Chamunda Laundry", size=22, bold=True, color="#0e7490", align=TA_CENTER))

    elements.append(Spacer(1, 3*mm))
    elements.append(HRFlowable(width="100%", thickness=2, color=TEAL, spaceAfter=3))

    # ── INVOICE TITLE ────────────────────────────────────────
    inv_row = Table([[
        p(f"INVOICE — {month_name} {year}", size=11, bold=True, color="#164e63"),
        p(f"Bill Date: {bill_date.strftime('%d-%m-%Y')}", size=10, bold=True, color="#475569", align=TA_RIGHT),
    ]], colWidths=[110*mm, 64*mm])
    inv_row.setStyle(TableStyle([("VALIGN", (0,0), (-1,-1), "MIDDLE")]))
    elements.append(inv_row)
    elements.append(Spacer(1, 3*mm))

    # ── CUSTOMER BOX ─────────────────────────────────────────
    def lbl(t): return p(t, size=9, bold=True, color="#0e7490")
    def val(t): return p(t or "-", size=9, color="#1e293b")

    cust_data = [
        [lbl("Customer:"), val(customer.name),         lbl("Phone:"), val(customer.phone)],
        [lbl("Society:"),  val(customer.society_name), lbl("Flat:"),  val(customer.flat_number)],
        [lbl("Address:"),  val(customer.address),      p(""),         p("")],
    ]
    cust_tbl = Table(cust_data, colWidths=[26*mm, 68*mm, 20*mm, 64*mm])
    cust_tbl.setStyle(TableStyle([
        ("ROWBACKGROUNDS", (0,0), (-1,-1), [CUST_BG1, CUST_BG2, CUST_BG1]),
        ("BOX",       (0,0), (-1,-1), 0.8, TEAL),
        ("INNERGRID", (0,0), (-1,-1), 0.3, BORDER),
        ("TOPPADDING",    (0,0), (-1,-1), 5),
        ("BOTTOMPADDING", (0,0), (-1,-1), 5),
        ("LEFTPADDING",   (0,0), (-1,-1), 6),
        ("VALIGN",    (0,0), (-1,-1), "MIDDLE"),
    ]))
    elements.append(cust_tbl)
    elements.append(Spacer(1, 5*mm))

    # ── SERVICE DETAILS ──────────────────────────────────────
    elements.append(p("Service Details", size=11, bold=True, color="#164e63"))
    elements.append(Spacer(1, 2*mm))

    def th(t, align=TA_LEFT):
        return p(t, size=9, bold=True, color="#ffffff", align=align)

    rows = [[
        th("Date"),
        th("Service"),
        th("Qty", TA_CENTER),
        th("Rate (Rs.)", TA_RIGHT),
        th("Amount (Rs.)", TA_RIGHT),
    ]]

    total = 0
    for entry in entries:
        for item in entry.items:
            rows.append([
                p(str(entry.entry_date), size=9, color="#475569"),
                p(item.service_name, size=9, color="#1e293b"),
                p(str(item.quantity), size=9, align=TA_CENTER),
                p(f"Rs.{float(item.price_per_unit):.2f}", size=9, align=TA_RIGHT),
                p(f"Rs.{float(item.subtotal):.2f}", size=9, bold=True, align=TA_RIGHT),
            ])
            total += float(item.subtotal)

    rows.append([
        p(""), p(""), p(""),
        p("TOTAL", size=10, bold=True, color="#ffffff", align=TA_RIGHT),
        p(f"Rs.{total:.0f}", size=10, bold=True, color="#ffffff", align=TA_RIGHT),
    ])

    col_w = [26*mm, 86*mm, 14*mm, 26*mm, 26*mm]
    tbl = Table(rows, colWidths=col_w, repeatRows=1)
    n = len(rows)
    tbl.setStyle(TableStyle([
        ("BACKGROUND",    (0,0),  (-1,0),   TEAL_HDR),
        ("FONTNAME",      (0,0),  (-1,0),   "Helvetica-Bold"),
        ("ROWBACKGROUNDS",(0,1),  (-1,n-2), [WHITE, ROW_ALT]),
        ("BACKGROUND",    (0,n-1),(-1,n-1), NAVY),
        ("BOX",      (0,0), (-1,-1), 1,   TEAL),
        ("INNERGRID",(0,0), (-1,-1), 0.4, BORDER),
        ("TOPPADDING",    (0,0), (-1,-1), 6),
        ("BOTTOMPADDING", (0,0), (-1,-1), 6),
        ("LEFTPADDING",   (0,0), (-1,-1), 5),
        ("RIGHTPADDING",  (0,0), (-1,-1), 5),
        ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
    ]))
    elements.append(tbl)
    elements.append(Spacer(1, 8*mm))

    # ── FOOTER ───────────────────────────────────────────────
    elements.append(HRFlowable(width="100%", thickness=1, color=BORDER, spaceAfter=4))
    elements.append(p("Thank you for your business!", size=10, color="#475569", align=TA_CENTER))

    doc.build(elements)
    buffer.seek(0)
    return buffer


@router.get("/{customer_id}")
def get_invoice(
    customer_id: str,
    month: int,
    year: int,
    entry_id: str | None = None,
    entry_date: str | None = None,
    token: str | None = None,
    db: Session = Depends(get_db),
):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(404, "Customer not found")

    if entry_id:
        entries = db.query(LaundryEntry).filter(LaundryEntry.id == entry_id).all()
    elif entry_date:
        entries = (
            db.query(LaundryEntry)
            .filter(
                LaundryEntry.customer_id == customer_id,
                LaundryEntry.entry_date == entry_date,
            )
            .all()
        )
    else:
        entries = (
            db.query(LaundryEntry)
            .filter(
                LaundryEntry.customer_id == customer_id,
                extract("month", LaundryEntry.entry_date) == month,
                extract("year", LaundryEntry.entry_date) == year,
            )
            .all()
        )

    if not entries:
        raise HTTPException(404, "No entries found for this period")

    pdf_buffer = generate_invoice_pdf(customer, entries, month, year)
    filename = f"invoice_{customer.name}_{month}_{year}.pdf"

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename={filename}"},
    )


@router.post("/{customer_id}/email")
def email_invoice(
    customer_id: str,
    month: int,
    year: int,
    db: Session = Depends(get_db),
):
    from utils.email import send_email_with_pdf, invoice_email_html
    import calendar

    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(404, "Customer not found")
    if not customer.email:
        raise HTTPException(400, "Customer has no email address")

    entries = (
        db.query(LaundryEntry)
        .filter(
            LaundryEntry.customer_id == customer_id,
            extract("month", LaundryEntry.entry_date) == month,
            extract("year", LaundryEntry.entry_date) == year,
        )
        .all()
    )
    if not entries:
        raise HTTPException(404, "No entries found for this period")

    total = sum(float(i.subtotal) for e in entries for i in e.items)
    month_name = calendar.month_name[month]

    pdf_buffer = generate_invoice_pdf(customer, entries, month, year)
    pdf_bytes = pdf_buffer.read()

    html = invoice_email_html(customer.name, month_name, year, total)
    filename = f"Invoice_{customer.name}_{month_name}_{year}.pdf"
    success = send_email_with_pdf(customer.email, f"Chamunda Laundry - Invoice {month_name} {year}", html, pdf_bytes, filename)

    if not success:
        raise HTTPException(500, "Failed to send email")

    return {"detail": f"Invoice emailed to {customer.email}"}