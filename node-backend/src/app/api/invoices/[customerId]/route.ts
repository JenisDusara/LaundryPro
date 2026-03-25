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
  const year = p.get("year") ? parseInt(p.get("year")!) : null;
  const entry_date = p.get("entry_date");

  const customer = await prisma.customer.findUnique({ where: { id: params.customerId } });
  if (!customer) return NextResponse.json({ detail: "Customer not found" }, { status: 404 });

  const where: any = { customer_id: params.customerId };
  if (entry_date) {
    where.entry_date = entry_date;
  } else if (month && year) {
    const start = new Date(year, month - 1, 1).toISOString().slice(0, 10);
    const end = new Date(year, month, 0).toISOString().slice(0, 10);
    where.entry_date = { gte: start, lte: end };
  }

  const entries = await prisma.laundryEntry.findMany({
    where, include: { items: true }, orderBy: { entry_date: "asc" },
  });

  const settings = getSettings();
  const doc = new PDFDocument({ margin: 40, size: "A4" });
  const chunks: Buffer[] = [];
  doc.on("data", c => chunks.push(c));

  await new Promise<void>(resolve => {
    doc.on("end", resolve);

    // Header
    doc.fontSize(22).fillColor("#1e3a8a").text(settings.shop_name || "LaundryPro", { align: "center" });
    if (settings.contact) doc.fontSize(10).fillColor("#64748b").text(settings.contact, { align: "center" });
    if (settings.address) doc.fontSize(10).fillColor("#64748b").text(settings.address, { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(14).fillColor("#1e293b").text("INVOICE", { align: "center" });
    doc.moveTo(40, doc.y + 5).lineTo(555, doc.y + 5).stroke("#e2e8f0");
    doc.moveDown(1);

    // Customer info
    doc.fontSize(11).fillColor("#1e293b").text(`Customer: ${customer.name}`);
    doc.text(`Phone: ${customer.phone}`);
    if (customer.flat_number) doc.text(`Flat: ${customer.flat_number}`);
    if (customer.society_name) doc.text(`Society: ${customer.society_name}`);
    doc.moveDown(1);

    let grandTotal = 0;
    entries.forEach(entry => {
      doc.fontSize(10).fillColor("#475569").text(`Date: ${entry.entry_date}`, { underline: true });
      doc.moveDown(0.3);
      entry.items.forEach(item => {
        const sub = Number(item.subtotal);
        grandTotal += sub;
        doc.fontSize(10).fillColor("#1e293b")
          .text(`  ${item.service_name}`, 40, doc.y, { continued: true, width: 300 })
          .text(`${item.quantity} x Rs.${Number(item.price_per_unit)}`, { continued: true, width: 120, align: "center" })
          .text(`Rs.${sub}`, { width: 80, align: "right" });
      });
      doc.moveDown(0.5);
    });

    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke("#1e40af");
    doc.moveDown(0.3);
    doc.fontSize(13).fillColor("#1e3a8a").text(`Total: Rs.${grandTotal}`, { align: "right" });
    doc.end();
  });

  const buffer = Buffer.concat(chunks);
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="invoice-${customer.name}.pdf"`,
    },
  });
}
