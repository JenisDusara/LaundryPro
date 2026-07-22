import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireActiveAuth, shopFilter } from "@/lib/auth";
import { monthRange } from "@/lib/dates";
import { getShopProfile } from "@/lib/settings";

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const rupee = (n: number) => `₹${Number(n).toLocaleString("en-IN")}`;

function validMonthYear(month: number | null, year: number | null): boolean {
  if (month == null && year == null) return true;
  return Number.isInteger(month) && Number.isInteger(year) && month! >= 1 && month! <= 12 && year! >= 2000 && year! <= 2100;
}

export async function GET(req: NextRequest, { params }: { params: { customerId: string } }) {
  const user = await requireActiveAuth(req);
  if (user instanceof NextResponse) return user;

  const p = new URL(req.url).searchParams;
  const month = p.get("month") ? parseInt(p.get("month")!) : null;
  const year  = p.get("year")  ? parseInt(p.get("year")!)  : null;
  const entry_date = p.get("entry_date");
  const discount = Math.max(0, Number(p.get("discount")) || 0); // admin-entered discount (₹), 0 if none
  if (!validMonthYear(month, year)) {
    return NextResponse.json({ detail: "Invalid month/year" }, { status: 400 });
  }

  const customer = await prisma.customer.findFirst({ where: { id: params.customerId, deleted_at: null, ...shopFilter(user, req) } as any });
  if (!customer) return NextResponse.json({ detail: "Customer not found" }, { status: 404 });

  const where: any = { customer_id: params.customerId, deleted_at: null, ...shopFilter(user, req) };
  if (p.get("entry_id")) {
    where.id = p.get("entry_id");            // per-order invoice (single entry)
  } else if (entry_date) {
    where.entry_date = entry_date;
  } else if (month && year) {
    const { start, end } = monthRange(year, month);
    where.entry_date = { gte: start, lte: end };
  }

  const entries: any[] = await prisma.laundryEntry.findMany({
    where, include: { items: true }, orderBy: { entry_date: "asc" },
  } as any);

  // Sum the billing adjustments actually stored on these entries so the invoice total matches the
  // customer's real balance. Without this the invoice only reflected item subtotals (± a one-off
  // query-param discount) and silently ignored every discount/extra charge saved at billing time.
  // Raw SQL because these columns aren't in the Prisma schema yet.
  const entryIds = entries.map(e => e.id);
  let storedDiscount = 0, storedExtra = 0;
  if (entryIds.length > 0) {
    const bill: { discount: number; extra_charge: number }[] = await prisma.$queryRawUnsafe(
      `SELECT COALESCE(SUM(discount),0)::float8 AS discount, COALESCE(SUM(extra_charge),0)::float8 AS extra_charge
       FROM laundry_entries WHERE deleted_at IS NULL AND id::text = ANY($1::text[])`,
      entryIds
    );
    storedDiscount = Number(bill[0]?.discount) || 0;
    storedExtra = Number(bill[0]?.extra_charge) || 0;
  }

  const profile = await getShopProfile(customer.shop_id);

  const fmtDate = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const invNum = 1000 + (params.customerId.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 9000);

  // Per-order invoice (entry_id): show that order's REAL invoice number and use its
  // date as the period, instead of the customer-derived number / "All entries".
  let singleInvoiceNo: number | null = null;
  const singleEntryDate: string | null = p.get("entry_id") && entries.length > 0 ? entries[0].entry_date : null;
  if (p.get("entry_id") && entries.length > 0) {
    try {
      const rows: { invoice_no: number | null }[] = await prisma.$queryRawUnsafe(
        `SELECT invoice_no FROM laundry_entries WHERE id::text = $1`, entries[0].id);
      singleInvoiceNo = rows[0]?.invoice_no ?? null;
    } catch { /* column missing → fall back to derived number */ }
  }
  const invoiceLabel = singleInvoiceNo != null ? `INV-${String(singleInvoiceNo).padStart(4, "0")}` : `INV-${invNum}`;

  // Stats + rows
  let grandTotal = 0, totalQty = 0;
  const rows: string[] = [];
  let idx = 0;
  entries.forEach(e => {
    e.items.forEach((it: any) => {
      idx++;
      grandTotal += Number(it.subtotal);
      totalQty += it.quantity;
      rows.push(`
        <tr>
          <td>${idx}</td>
          <td>${fmtDate(e.entry_date)}</td>
          <td>${esc(it.service_name)}</td>
          <td class="center">${it.quantity}</td>
          <td class="right">${rupee(Number(it.price_per_unit))}</td>
          <td class="right">${rupee(Number(it.subtotal))}</td>
        </tr>`);
    });
  });

  const shopName = profile.shop_name || "LaundryMax";
  const tagline = profile.tagline || "Professional Dry Cleaning & Laundry Services";
  const upiId: string = profile.upi_id || "";

  // Totals match the ledger: item subtotal - stored/query discount + stored extra charge.
  // GST is not added here because laundry_entries.total_amount currently stores this same
  // non-GST total and balances/bulk-send are based on that ledger amount.
  const subtotal = grandTotal;
  const discountAmt = discount + storedDiscount;
  const extraAmt = storedExtra;
  const total = Math.max(0, subtotal - discountAmt + extraAmt);
  const period = entry_date ? fmtDate(entry_date) : (singleEntryDate ? fmtDate(singleEntryDate) : (month && year ? new Date(year, month - 1, 1).toLocaleString("en-IN", { month: "long", year: "numeric" }) : "All entries"));

  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${invoiceLabel}</title>
<style>
  *{box-sizing:border-box}
  body{font-family:Arial,Helvetica,sans-serif;color:#000;background:#fff;margin:0;padding:24px;font-size:12px;line-height:1.35}
  .invoice{max-width:780px;margin:0 auto}
  .top{display:flex;justify-content:space-between;gap:20px;border-bottom:2px solid #000;padding-bottom:12px;margin-bottom:16px}
  h1{font-size:22px;margin:0 0 3px;text-transform:uppercase}
  h2{font-size:18px;margin:0 0 8px;text-align:right;text-transform:uppercase}
  .muted{color:#333}
  .small{font-size:11px}
  .section{margin-top:14px}
  .box{border:1px solid #000;padding:10px;margin-top:6px}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
  table{width:100%;border-collapse:collapse;margin-top:10px}
  th,td{border:1px solid #000;padding:6px 7px;vertical-align:top}
  th{font-weight:700;text-align:left;background:#fff}
  .center{text-align:center}
  .right{text-align:right}
  .totals{width:300px;margin:14px 0 0 auto}
  .totals td:first-child{font-weight:700}
  .grand td{border-top:2px solid #000;font-size:14px;font-weight:700}
  .footer{border-top:1px solid #000;margin-top:24px;padding-top:10px;display:flex;justify-content:space-between;gap:20px}
  @media print{body{padding:0}@page{margin:12mm}}
</style></head>
<body>
  <div class="invoice">
    <div class="top">
      <div>
        <h1>${esc(shopName)}</h1>
        <div class="muted">${esc(tagline)}</div>
        ${profile.address ? `<div class="small">${esc(profile.address)}</div>` : ""}
        ${profile.phone ? `<div class="small">Phone: ${esc(profile.phone)}</div>` : ""}
        ${profile.email ? `<div class="small">Email: ${esc(profile.email)}</div>` : ""}
        ${profile.gst_number ? `<div class="small">GSTIN: ${esc(profile.gst_number)}</div>` : ""}
      </div>
      <div>
        <h2>Invoice</h2>
        <div><strong>No:</strong> ${invoiceLabel}</div>
        <div><strong>Date:</strong> ${today}</div>
        <div><strong>Period:</strong> ${esc(period)}</div>
      </div>
    </div>

    <div class="grid">
      <div class="section">
        <strong>Bill To</strong>
        <div class="box">
          <div><strong>${esc(customer.name)}</strong></div>
          ${[customer.flat_number, customer.society_name].filter(Boolean).length ? `<div>${esc([customer.flat_number, customer.society_name].filter(Boolean).join(", "))}</div>` : ""}
          ${customer.phone ? `<div>Phone: ${esc(customer.phone)}</div>` : ""}
          ${customer.email ? `<div>Email: ${esc(customer.email)}</div>` : ""}
        </div>
      </div>
      <div class="section">
        <strong>Summary</strong>
        <div class="box">
          <div>Total items: ${totalQty}</div>
          <div>Entries: ${entries.length}</div>
          ${upiId ? `<div>UPI: ${esc(upiId)}</div>` : ""}
        </div>
      </div>
    </div>

    <table>
      <thead><tr><th>#</th><th>Date</th><th>Service</th><th class="center">Qty</th><th class="right">Rate</th><th class="right">Amount</th></tr></thead>
      <tbody>${rows.join("") || `<tr><td colspan="6" class="center">No items for this period</td></tr>`}</tbody>
    </table>

    <table class="totals">
      <tbody>
        <tr><td>Subtotal</td><td class="right">${rupee(subtotal)}</td></tr>
        ${discountAmt > 0 ? `<tr><td>Discount</td><td class="right">-${rupee(discountAmt)}</td></tr>` : ""}
        ${extraAmt > 0 ? `<tr><td>Extra charge</td><td class="right">+${rupee(extraAmt)}</td></tr>` : ""}
        <tr class="grand"><td>Total</td><td class="right">${rupee(total)}</td></tr>
      </tbody>
    </table>

    <div class="footer">
      <div>
        <strong>${esc(profile.footer_note || "Thank you for your business")}</strong>
        ${profile.invoice_terms ? `<div class="small muted">${esc(profile.invoice_terms)}</div>` : ""}
      </div>
      <div>Authorised signature</div>
    </div>
  </div>
</body></html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
