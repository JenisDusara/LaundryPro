import PDFDocument from "pdfkit";

export interface InvoicePdfItem { service_name: string; quantity: number; price_per_unit: number; subtotal: number; item_status?: string; }
export interface InvoicePdfData {
  shopName: string;
  tagline?: string;
  phone?: string;
  address?: string;
  email?: string;
  gstNumber?: string;
  upiId?: string;
  footerNote?: string;
  customerName: string;
  customerSub?: string;   // flat / society
  customerContact?: string; // phone · email
  period: string;
  invoiceNo: string;
  dateStr: string;
  items: InvoicePdfItem[];
  total: number;
  logo?: Buffer | null;
}

// PDFKit's built-in Helvetica has no ₹ glyph, so amounts use "Rs." — renders reliably
// everywhere without bundling a custom font.
const money = (n: number) => "Rs. " + Number(n).toLocaleString("en-IN");

const NAVY = "#1e3a8a";
const BLUE = "#2563eb";
const GREY = "#64748b";
const LIGHT = "#94a3b8";
const LINE = "#e2e8f0";

// Renders a clean, branded one-page invoice to a PDF Buffer (no headless browser needed).
export function buildInvoicePdf(d: InvoicePdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 40 });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const M = 40;
    const pageW = doc.page.width;
    const contentW = pageW - M * 2;

    // ── Header band ──
    const headerH = 92;
    doc.roundedRect(M, M, contentW, headerH, 10).fill(NAVY);
    let hx = M + 18;
    if (d.logo) {
      try {
        doc.roundedRect(hx, M + 18, 46, 46, 8).fill("#ffffff");
        doc.image(d.logo, hx + 3, M + 21, { fit: [40, 40] });
        hx += 60;
      } catch { /* bad logo buffer — skip it */ }
    }
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(18).text(d.shopName, hx, M + 20, { width: contentW - (hx - M) - 150 });
    if (d.tagline) doc.font("Helvetica").fontSize(9).fillColor("#c7d7f5").text(d.tagline, hx, doc.y + 1, { width: contentW - (hx - M) - 150 });
    const contactBits = [d.phone, d.address, d.email].filter(Boolean).join("   ·   ");
    if (contactBits) doc.font("Helvetica").fontSize(8).fillColor("#c7d7f5").text(contactBits, hx, doc.y + 4, { width: contentW - (hx - M) - 150 });
    if (d.gstNumber) doc.font("Helvetica-Bold").fontSize(7.5).fillColor("#c7d7f5").text(`GSTIN: ${d.gstNumber}`, hx, doc.y + 3);

    // Invoice number panel (right side of header)
    doc.font("Helvetica-Bold").fontSize(9).fillColor("#c7d7f5").text("INVOICE", M + contentW - 150, M + 18, { width: 132, align: "right" });
    doc.font("Helvetica-Bold").fontSize(16).fillColor("#ffffff").text(`#${d.invoiceNo}`, M + contentW - 150, M + 30, { width: 132, align: "right" });
    doc.font("Helvetica").fontSize(8.5).fillColor("#dbeafe").text(`Date: ${d.dateStr}`, M + contentW - 150, M + 54, { width: 132, align: "right" });
    doc.text(`Period: ${d.period}`, M + contentW - 150, doc.y + 1, { width: 132, align: "right" });

    // ── Bill To ──
    let y = M + headerH + 22;
    doc.font("Helvetica-Bold").fontSize(8).fillColor(BLUE).text("BILL TO", M, y);
    doc.font("Helvetica-Bold").fontSize(14).fillColor("#1e293b").text(d.customerName, M, y + 12);
    let subY = y + 30;
    if (d.customerSub) { doc.font("Helvetica").fontSize(10).fillColor(GREY).text(d.customerSub, M, subY); subY += 13; }
    if (d.customerContact) { doc.font("Helvetica").fontSize(10).fillColor(GREY).text(d.customerContact, M, subY); subY += 13; }

    // ── Items table ──
    y = subY + 14;
    const cols = { num: M, svc: M + 34, qty: M + contentW - 200, rate: M + contentW - 130, amt: M + contentW - 60 };
    doc.roundedRect(M, y, contentW, 22, 5).fill("#f1f5f9");
    doc.font("Helvetica-Bold").fontSize(8.5).fillColor(LIGHT);
    doc.text("#", cols.num + 6, y + 7);
    doc.text("SERVICE", cols.svc, y + 7);
    doc.text("QTY", cols.qty, y + 7, { width: 40, align: "center" });
    doc.text("RATE", cols.rate, y + 7, { width: 50, align: "right" });
    doc.text("AMOUNT", cols.amt - 10, y + 7, { width: 70, align: "right" });
    y += 26;

    doc.fontSize(10);
    d.items.forEach((it, i) => {
      if (y > doc.page.height - 160) { doc.addPage(); y = M; }
      const rowH = 22;
      if (i % 2 === 1) doc.rect(M, y - 4, contentW, rowH, ).fill("#f8fafc");
      const [svcName, ...rest] = it.service_name.split(" - ");
      doc.font("Helvetica-Bold").fontSize(9).fillColor(BLUE).text(String(i + 1), cols.num + 6, y);
      doc.font("Helvetica-Bold").fontSize(10).fillColor("#1e293b").text(svcName, cols.svc, y, { width: cols.qty - cols.svc - 6 });
      if (rest.length) doc.font("Helvetica").fontSize(8).fillColor(LIGHT).text(rest.join(" - "), cols.svc, doc.y, { width: cols.qty - cols.svc - 6 });
      doc.font("Helvetica").fontSize(10).fillColor("#1e293b").text(String(it.quantity), cols.qty, y, { width: 40, align: "center" });
      doc.text(money(Number(it.price_per_unit)), cols.rate - 10, y, { width: 60, align: "right" });
      doc.font("Helvetica-Bold").text(money(Number(it.subtotal)), cols.amt - 20, y, { width: 80, align: "right" });
      y += rowH;
    });

    // ── Total ──
    y += 8;
    doc.moveTo(M + contentW - 220, y).lineTo(M + contentW, y).strokeColor(LINE).stroke();
    y += 12;
    doc.font("Helvetica-Bold").fontSize(13).fillColor("#1e293b").text("Total", M + contentW - 220, y);
    doc.font("Helvetica-Bold").fontSize(16).fillColor(BLUE).text(money(d.total), M + contentW - 140, y - 2, { width: 140, align: "right" });

    // ── Payment / footer ──
    y += 40;
    if (d.upiId) {
      doc.font("Helvetica-Bold").fontSize(9).fillColor(BLUE).text("PAY VIA UPI", M, y);
      doc.font("Helvetica").fontSize(11).fillColor("#1e293b").text(d.upiId, M, y + 12);
      y += 34;
    }
    doc.font("Helvetica-Bold").fontSize(10).fillColor("#1e293b").text(d.footerNote || "Thank you for your business", M, y);

    doc.end();
  });
}
