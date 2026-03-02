from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import extract
from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
import calendar
from datetime import date

from db.database import get_db
from models import Customer, LaundryEntry, EntryItem, Service
from routers.auth import get_current_admin

router = APIRouter(prefix="/api/invoices", tags=["invoices"])


def generate_invoice_pdf(customer: Customer, entries: list, month: int, year: int) -> BytesIO:
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4,
                            rightMargin=15*mm, leftMargin=15*mm,
                            topMargin=15*mm, bottomMargin=15*mm)

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle("title", fontSize=20, textColor=colors.HexColor("#1e3a8a"),
                                  alignment=TA_CENTER, fontName="Helvetica-Bold")
    sub_style = ParagraphStyle("sub", fontSize=10, textColor=colors.grey, alignment=TA_CENTER)
    header_style = ParagraphStyle("header", fontSize=12, textColor=colors.HexColor("#1e3a8a"),
                                   fontName="Helvetica-Bold")
    right_style = ParagraphStyle("right", fontSize=10, alignment=TA_RIGHT)

    month_name = calendar.month_name[month]
    elements = []

    # Shop header
    elements.append(Paragraph("👔 Chamunda Laundry", title_style))
    elements.append(Spacer(1, 4*mm))
    elements.append(Paragraph("Ahmedabad, India | +91 1234567890", sub_style))
    elements.append(Spacer(1, 8*mm))
    elements.append(Spacer(1, 8*mm))

    # Invoice title
    elements.append(Paragraph(f"INVOICE — {month_name} {year}", header_style))
    elements.append(Spacer(1, 4*mm))

    # Customer info table
    cust_data = [
        ["Customer:", customer.name, "Phone:", customer.phone],
        ["Society:", customer.society_name or "-", "Flat:", customer.flat_number or "-"],
        ["Address:", customer.address or "-", "", ""],
    ]
    cust_table = Table(cust_data, colWidths=[30*mm, 65*mm, 20*mm, 55*mm])
    cust_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME", (2, 0), (2, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("TEXTCOLOR", (0, 0), (0, -1), colors.HexColor("#1e3a8a")),
        ("TEXTCOLOR", (2, 0), (2, -1), colors.HexColor("#1e3a8a")),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    elements.append(cust_table)
    elements.append(Spacer(1, 6*mm))

    # Items table header
    elements.append(Paragraph("Service Details", header_style))
    elements.append(Spacer(1, 3*mm))

    table_data = [["Date", "Service", "Qty", "Rate (Rs.)", "Amount (Rs.)"]]

    total = 0
    for entry in entries:
        for item in entry.items:
            table_data.append([
                str(entry.entry_date),
                item.service_name,
                str(item.quantity),
                f"Rs.{item.price_per_unit}",
                f"Rs.{item.subtotal}",
            ])
            total += float(item.subtotal)

    # Total row
    table_data.append(["", "", "", "TOTAL", f"Rs.{total:.0f}"])

    col_widths = [30*mm, 65*mm, 15*mm, 30*mm, 30*mm]
    items_table = Table(table_data, colWidths=col_widths)
    items_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e3a8a")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("ROWBACKGROUNDS", (0, 1), (-1, -2), [colors.white, colors.HexColor("#f8fafc")]),
        ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#eff6ff")),
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
        ("TEXTCOLOR", (3, -1), (-1, -1), colors.HexColor("#1e3a8a")),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ("ALIGN", (2, 0), (-1, -1), "RIGHT"),
        ("ALIGN", (0, 0), (1, -1), "LEFT"),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    elements.append(items_table)
    elements.append(Spacer(1, 8*mm))

    # Footer
    elements.append(Paragraph("Thank you for your business! 🙏", sub_style))

    doc.build(elements)
    buffer.seek(0)
    return buffer


@router.get("/{customer_id}")
def get_invoice(
    customer_id: str,
    month: int,
    year: int,
    token: str | None = None,
    db: Session = Depends(get_db),
):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(404, "Customer not found")

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
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )