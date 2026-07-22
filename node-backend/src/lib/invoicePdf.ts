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

// Renders a simple black-and-white invoice to a PDF Buffer.
export function buildInvoicePdf(d: InvoicePdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 40 });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const M = 40;
    const pageW = doc.page.width;
    const pageH = doc.page.height;
    const contentW = pageW - M * 2;

    doc.fillColor("#000000").strokeColor("#000000");

    doc.font("Helvetica-Bold").fontSize(20).text(d.shopName.toUpperCase(), M, M, { width: contentW - 170 });
    if (d.tagline) doc.font("Helvetica").fontSize(9).text(d.tagline, M, doc.y + 2, { width: contentW - 170 });
    if (d.address) doc.font("Helvetica").fontSize(9).text(d.address, M, doc.y + 2, { width: contentW - 170 });
    const shopContact = [d.phone && `Phone: ${d.phone}`, d.email && `Email: ${d.email}`].filter(Boolean).join("   ");
    if (shopContact) doc.font("Helvetica").fontSize(9).text(shopContact, M, doc.y + 2, { width: contentW - 170 });
    if (d.gstNumber) doc.font("Helvetica").fontSize(9).text(`GSTIN: ${d.gstNumber}`, M, doc.y + 2, { width: contentW - 170 });

    doc.font("Helvetica-Bold").fontSize(18).text("INVOICE", M + contentW - 150, M, { width: 150, align: "right" });
    doc.font("Helvetica").fontSize(10).text(`No: ${d.invoiceNo}`, M + contentW - 150, M + 28, { width: 150, align: "right" });
    doc.text(`Date: ${d.dateStr}`, M + contentW - 150, M + 43, { width: 150, align: "right" });
    doc.text(`Period: ${d.period}`, M + contentW - 150, M + 58, { width: 150, align: "right" });

    let y = Math.max(doc.y, M + 78) + 12;
    doc.moveTo(M, y).lineTo(M + contentW, y).lineWidth(1.5).stroke();
    y += 16;

    doc.font("Helvetica-Bold").fontSize(10).text("BILL TO", M, y);
    y += 15;
    doc.rect(M, y, contentW, 56).stroke();
    doc.font("Helvetica-Bold").fontSize(12).text(d.customerName, M + 8, y + 8, { width: contentW - 16 });
    if (d.customerSub) doc.font("Helvetica").fontSize(10).text(d.customerSub, M + 8, doc.y + 2, { width: contentW - 16 });
    if (d.customerContact) doc.font("Helvetica").fontSize(10).text(d.customerContact, M + 8, doc.y + 2, { width: contentW - 16 });
    y += 76;

    const col = {
      num: M,
      service: M + 34,
      qty: M + contentW - 188,
      rate: M + contentW - 130,
      amount: M + contentW - 68,
    };
    const drawHeader = () => {
      doc.rect(M, y, contentW, 24).stroke();
      doc.font("Helvetica-Bold").fontSize(9);
      doc.text("#", col.num + 6, y + 8, { width: 24 });
      doc.text("SERVICE", col.service, y + 8, { width: col.qty - col.service - 8 });
      doc.text("QTY", col.qty, y + 8, { width: 40, align: "center" });
      doc.text("RATE", col.rate, y + 8, { width: 54, align: "right" });
      doc.text("AMOUNT", col.amount, y + 8, { width: 68, align: "right" });
      y += 24;
    };
    drawHeader();

    d.items.forEach((it, i) => {
      if (y > pageH - 150) {
        doc.addPage();
        y = M;
        drawHeader();
      }
      const rowH = 24;
      doc.rect(M, y, contentW, rowH).stroke();
      doc.font("Helvetica").fontSize(9);
      doc.text(String(i + 1), col.num + 6, y + 7, { width: 24 });
      doc.text(it.service_name, col.service, y + 7, { width: col.qty - col.service - 8 });
      doc.text(String(it.quantity), col.qty, y + 7, { width: 40, align: "center" });
      doc.text(money(Number(it.price_per_unit)), col.rate, y + 7, { width: 54, align: "right" });
      doc.text(money(Number(it.subtotal)), col.amount, y + 7, { width: 68, align: "right" });
      y += rowH;
    });

    y += 14;
    const totalW = 220;
    doc.rect(M + contentW - totalW, y, totalW, 32).stroke();
    doc.font("Helvetica-Bold").fontSize(12).text("TOTAL", M + contentW - totalW + 8, y + 10, { width: 80 });
    doc.text(money(d.total), M + contentW - 120, y + 10, { width: 112, align: "right" });
    y += 52;

    if (d.upiId) {
      doc.font("Helvetica-Bold").fontSize(10).text("UPI", M, y);
      doc.font("Helvetica").fontSize(10).text(d.upiId, M + 32, y);
      y += 22;
    }
    doc.moveTo(M, y).lineTo(M + contentW, y).stroke();
    y += 10;
    doc.font("Helvetica-Bold").fontSize(10).text(d.footerNote || "Thank you for your business", M, y);

    doc.end();
  });
}
