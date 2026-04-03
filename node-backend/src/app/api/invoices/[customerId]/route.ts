import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import PDFDocument from "pdfkit";

export async function GET(req: NextRequest, { params }: { params: { customerId: string } }) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;

  const p = new URL(req.url).searchParams;
  const month = p.get("month") ? parseInt(p.get("month")!) : null;
  const year  = p.get("year")  ? parseInt(p.get("year")!)  : null;
  const entry_date = p.get("entry_date");

  const customer = await prisma.customer.findUnique({ where: { id: params.customerId } });
  if (!customer) return NextResponse.json({ detail: "Customer not found" }, { status: 404 });

  const where: any = { customer_id: params.customerId };
  if (entry_date) {
    where.entry_date = entry_date;
  } else if (month && year) {
    const start = new Date(year, month - 1, 1).toISOString().slice(0, 10);
    const end   = new Date(year, month,     0).toISOString().slice(0, 10);
    where.entry_date = { gte: start, lte: end };
  }

  const entries = await prisma.laundryEntry.findMany({
    where, include: { items: true }, orderBy: { entry_date: "asc" },
  });

  const settings = getSettings();
  const doc = new PDFDocument({ margin: 0, size: "A4" });
  const chunks: Buffer[] = [];
  doc.on("data", c => chunks.push(c));

  const PAGE_W = 595;
  const MARGIN = 40;
  const COL_W  = PAGE_W - MARGIN * 2;

  // ── helpers ────────────────────────────────────────────────────────────────
  const fmtDate = (d: string) =>
    new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  const invoiceLabel = entry_date
    ? fmtDate(entry_date)
    : month && year
      ? new Date(year, month - 1, 1).toLocaleString("en-IN", { month: "long", year: "numeric" })
      : "All Entries";

  await new Promise<void>(resolve => {
    doc.on("end", resolve);

    // ── HEADER BAND ───────────────────────────────────────────────────────────
    doc.rect(0, 0, PAGE_W, 110).fill("#1e40af");

    // Shop name
    doc.font("Helvetica-Bold").fontSize(24).fillColor("#ffffff")
       .text(settings.shop_name || "LaundryPro", MARGIN, 22, { width: COL_W, align: "center" });

    // Contact / address line
    const subLines = [settings.contact, settings.address].filter(Boolean).join("   |   ");
    if (subLines) {
      doc.font("Helvetica").fontSize(9).fillColor("#bfdbfe")
         .text(subLines, MARGIN, 52, { width: COL_W, align: "center" });
    }

    // INVOICE badge (right side)
    doc.roundedRect(PAGE_W - MARGIN - 110, 65, 110, 28, 4).fill("#1d4ed8");
    doc.font("Helvetica-Bold").fontSize(13).fillColor("#ffffff")
       .text("INVOICE", PAGE_W - MARGIN - 110, 73, { width: 110, align: "center" });

    // ── INVOICE META ROW ──────────────────────────────────────────────────────
    doc.rect(0, 110, PAGE_W, 36).fill("#eff6ff");
    const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    doc.font("Helvetica").fontSize(9).fillColor("#475569")
       .text(`Date: ${today}`, MARGIN, 122, { width: 200 });
    doc.font("Helvetica").fontSize(9).fillColor("#475569")
       .text(`Period: ${invoiceLabel}`, MARGIN + 200, 122, { width: 200, align: "center" });
    doc.font("Helvetica-Bold").fontSize(9).fillColor("#1e40af")
       .text(`Entries: ${entries.length}`, MARGIN + 400, 122, { width: 115, align: "right" });

    // ── CUSTOMER BOX ──────────────────────────────────────────────────────────
    doc.roundedRect(MARGIN, 158, COL_W, 72, 8).fill("#f8fafc").stroke("#e2e8f0");
    doc.roundedRect(MARGIN, 158, 6, 72, 3).fill("#1e40af");

    doc.font("Helvetica-Bold").fontSize(8).fillColor("#94a3b8")
       .text("BILL TO", MARGIN + 16, 166);
    doc.font("Helvetica-Bold").fontSize(13).fillColor("#1e293b")
       .text(customer.name, MARGIN + 16, 178);

    const custDetails: string[] = [];
    if (customer.phone) custDetails.push(`Phone: ${customer.phone}`);
    if (customer.flat_number) custDetails.push(`Flat: ${customer.flat_number}`);
    if (customer.society_name) custDetails.push(`Society: ${customer.society_name}`);
    doc.font("Helvetica").fontSize(9).fillColor("#64748b")
       .text(custDetails.join("   |   "), MARGIN + 16, 196, { width: COL_W - 32 });

    // ── ITEMS TABLE ───────────────────────────────────────────────────────────
    let y = 248;

    // Table header
    doc.rect(MARGIN, y, COL_W, 22).fill("#1e40af");
    doc.font("Helvetica-Bold").fontSize(9).fillColor("#ffffff");
    doc.text("Date",        MARGIN + 8,   y + 7, { width: 68  });
    doc.text("Service",     MARGIN + 80,  y + 7, { width: 200 });
    doc.text("Qty",         MARGIN + 285, y + 7, { width: 50, align: "center" });
    doc.text("Rate",        MARGIN + 340, y + 7, { width: 70, align: "right"  });
    doc.text("Amount",      MARGIN + 415, y + 7, { width: 95, align: "right"  });
    y += 22;

    let grandTotal = 0;
    let rowIdx = 0;

    entries.forEach(entry => {
      entry.items.forEach(item => {
        const sub = Number(item.subtotal);
        grandTotal += sub;

        // Alternating row background
        const rowBg = rowIdx % 2 === 0 ? "#ffffff" : "#f8fafc";
        doc.rect(MARGIN, y, COL_W, 20).fill(rowBg);

        // Status dot
        const dotColor = item.item_status === "delivered" ? "#16a34a" : "#f59e0b";
        doc.circle(MARGIN + 8, y + 10, 3).fill(dotColor);

        doc.font("Helvetica").fontSize(8.5).fillColor("#64748b")
           .text(fmtDate(entry.entry_date), MARGIN + 16, y + 6, { width: 64 });
        doc.font("Helvetica").fontSize(9).fillColor("#1e293b")
           .text(item.service_name, MARGIN + 80, y + 6, { width: 200 });
        doc.font("Helvetica").fontSize(9).fillColor("#475569")
           .text(String(item.quantity), MARGIN + 285, y + 6, { width: 50, align: "center" });
        doc.font("Helvetica").fontSize(9).fillColor("#475569")
           .text(`Rs.${Number(item.price_per_unit)}`, MARGIN + 340, y + 6, { width: 70, align: "right" });
        doc.font("Helvetica-Bold").fontSize(9).fillColor("#1e40af")
           .text(`Rs.${sub}`, MARGIN + 415, y + 6, { width: 95, align: "right" });

        // Bottom border
        doc.moveTo(MARGIN, y + 20).lineTo(MARGIN + COL_W, y + 20).stroke("#e2e8f0");

        y += 20;
        rowIdx++;
      });
    });

    // ── TOTAL BOX ─────────────────────────────────────────────────────────────
    y += 12;
    doc.roundedRect(MARGIN + 280, y, COL_W - 280, 42, 6).fill("#1e40af");
    doc.font("Helvetica").fontSize(10).fillColor("#bfdbfe")
       .text("GRAND TOTAL", MARGIN + 290, y + 8, { width: COL_W - 300, align: "left" });
    doc.font("Helvetica-Bold").fontSize(16).fillColor("#ffffff")
       .text(`Rs.${grandTotal}`, MARGIN + 290, y + 20, { width: COL_W - 300, align: "right" });

    // ── LEGEND ────────────────────────────────────────────────────────────────
    y += 56;
    doc.circle(MARGIN + 6,  y, 4).fill("#16a34a");
    doc.font("Helvetica").fontSize(8).fillColor("#64748b").text("Delivered", MARGIN + 14, y - 4);
    doc.circle(MARGIN + 70, y, 4).fill("#f59e0b");
    doc.font("Helvetica").fontSize(8).fillColor("#64748b").text("Pending",   MARGIN + 78, y - 4);

    // ── FOOTER ────────────────────────────────────────────────────────────────
    const footerY = 800;
    doc.moveTo(MARGIN, footerY).lineTo(MARGIN + COL_W, footerY).stroke("#e2e8f0");
    doc.font("Helvetica").fontSize(9).fillColor("#94a3b8")
       .text("Thank you for your business!", MARGIN, footerY + 8, { width: COL_W, align: "center" });
    if (settings.contact) {
      doc.font("Helvetica").fontSize(8).fillColor("#cbd5e1")
         .text(settings.contact, MARGIN, footerY + 22, { width: COL_W, align: "center" });
    }

    doc.end();
  });

  const buffer = Buffer.concat(chunks);
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="invoice-${customer.name}.pdf"`,
    },
  });
}
