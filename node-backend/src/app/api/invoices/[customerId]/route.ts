import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth, shopFilter } from "@/lib/auth";
import { monthRange } from "@/lib/dates";
import { getShopProfile } from "@/lib/settings";

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const rupee = (n: number) => `₹${Number(n).toLocaleString("en-IN")}`;

export async function GET(req: NextRequest, { params }: { params: { customerId: string } }) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;

  const p = new URL(req.url).searchParams;
  const month = p.get("month") ? parseInt(p.get("month")!) : null;
  const year  = p.get("year")  ? parseInt(p.get("year")!)  : null;
  const entry_date = p.get("entry_date");
  const discount = Math.max(0, Number(p.get("discount")) || 0); // admin-entered discount (₹), 0 if none

  const customer = await prisma.customer.findFirst({ where: { id: params.customerId, ...shopFilter(user, req) } });
  if (!customer) return NextResponse.json({ detail: "Customer not found" }, { status: 404 });

  const where: any = { customer_id: params.customerId, ...shopFilter(user, req) };
  if (p.get("entry_id")) {
    where.id = p.get("entry_id");            // per-order invoice (single entry)
  } else if (entry_date) {
    where.entry_date = entry_date;
  } else if (month && year) {
    const { start, end } = monthRange(year, month);
    where.entry_date = { gte: start, lte: end };
  }

  const entries = await prisma.laundryEntry.findMany({
    where, include: { items: true }, orderBy: { entry_date: "asc" },
  });

  const profile = await getShopProfile(customer.shop_id);

  const fmtDate = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const invNum = 1000 + (params.customerId.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 9000);

  // Stats + rows
  let grandTotal = 0, totalQty = 0;
  const catSet = new Set<string>();
  const deliveryDates: string[] = [];
  const rows: string[] = [];
  let idx = 0;
  entries.forEach(e => {
    if (e.delivery_date) deliveryDates.push(e.delivery_date);
    e.items.forEach(it => {
      idx++;
      grandTotal += Number(it.subtotal);
      totalQty += it.quantity;
      catSet.add(it.service_name);
      const delivered = it.item_status === "delivered";
      // service_name may embed a note as "Service - note" → split into name + subtitle
      const [svcName, ...restParts] = it.service_name.split(" - ");
      const subParts = [restParts.join(" - "), fmtDate(e.entry_date)].filter(Boolean);
      rows.push(`
        <tr>
          <td class="num">${idx}</td>
          <td>
            <div class="svc">${esc(svcName)}</div>
            <div class="svcsub">${esc(subParts.join(" · "))}</div>
          </td>
          <td class="c">${it.quantity}</td>
          <td class="r">${rupee(Number(it.price_per_unit))}</td>
          <td class="r amt">${rupee(Number(it.subtotal))}
            <span class="dot ${delivered ? "d" : "p"}" title="${delivered ? "Delivered" : "Pending"}"></span>
          </td>
        </tr>`);
    });
  });

  const expDelivery = deliveryDates.length ? fmtDate(deliveryDates.sort().slice(-1)[0]) : "—";
  const shopName = profile.shop_name || "LaundryPro";
  const tagline = profile.tagline || "Professional Dry Cleaning & Laundry Services";
  const upiId: string = profile.upi_id || "";

  const svgPhone = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`;
  const svgPin   = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`;
  const svgMail  = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 5L2 7"/></svg>`;
  const contactItems = [
    profile.phone   ? { icon: svgPhone, text: profile.phone }   : null,
    profile.address ? { icon: svgPin,   text: profile.address } : null,
    profile.email   ? { icon: svgMail,  text: profile.email }   : null,
  ].filter(Boolean) as { icon: string; text: string }[];

  // Totals: subtotal → less discount → plus GST (per-shop rate) → total
  const subtotal = grandTotal;
  const discountAmt = Math.min(discount, subtotal);
  const taxable = subtotal - discountAmt;
  const gstRate = Number(profile.gst_rate) || 0;
  const taxAmt = Math.round(taxable * gstRate / 100);
  const total = taxable + taxAmt;
  const period = entry_date ? fmtDate(entry_date) : (month && year ? new Date(year, month - 1, 1).toLocaleString("en-IN", { month: "long", year: "numeric" }) : "All entries");

  const svgCash = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/></svg>`;
  const svgCard = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>`;
  const svgUpi  = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><line x1="14" y1="4" x2="21" y2="4"/><line x1="4" y1="14" x2="4" y2="21"/></svg>`;

  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Invoice ${invNum}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{height:100%}
  body{font-family:'Segoe UI',system-ui,-apple-system,Arial,sans-serif;color:#1e293b;background:#fff;padding:26px;font-size:13px;min-height:100vh;display:flex;flex-direction:column;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .header{background:linear-gradient(135deg,#1e3a8a,#3b6fd4);border-radius:18px;padding:22px 24px;color:#fff;display:flex;justify-content:space-between;gap:16px}
  .brand{display:flex;gap:14px;align-items:flex-start}
  .logo{width:46px;height:46px;border-radius:12px;background:#fff;color:#1e40af;font-weight:800;font-size:22px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
  .shopname{font-size:20px;font-weight:800;letter-spacing:-.01em}
  .tag{font-size:11px;color:#c7d7f5;margin-top:2px}
  .contact{font-size:10.5px;color:#c7d7f5;margin-top:14px;display:flex;gap:18px;flex-wrap:wrap}
  .contact .cbit{display:inline-flex;align-items:center;gap:5px}
  .contact .cbit svg{opacity:.85;flex-shrink:0}
  .gstline{font-size:10px;color:#c7d7f5;margin-top:6px;font-weight:600;letter-spacing:.02em}
  .invpanel{background:rgba(255,255,255,0.14);border-radius:12px;padding:14px 16px;min-width:172px;text-align:left}
  .invpanel .lbl{font-size:10px;color:#c7d7f5;font-weight:700;letter-spacing:.06em}
  .invpanel .no{font-size:21px;font-weight:800;margin:2px 0 9px}
  .invpanel .r{font-size:10.5px;color:#dbeafe;margin-top:3px}
  .billrow{display:flex;justify-content:space-between;gap:20px;margin:24px 4px 18px}
  .lbl2{font-size:10px;font-weight:800;letter-spacing:.08em;color:#2563eb}
  .lbl2.grey{color:#94a3b8}
  .cust{font-size:16px;font-weight:800;margin-top:5px}
  .muted{color:#64748b;font-size:11.5px;margin-top:4px}
  .right{text-align:right}
  .bigdate{font-size:15px;font-weight:800;margin-top:4px}
  table{width:100%;border-collapse:collapse;margin-top:2px}
  thead td{background:#f1f5f9;color:#94a3b8;font-size:10px;font-weight:800;letter-spacing:.06em;padding:11px 12px}
  thead td:first-child{border-radius:7px 0 0 7px}thead td:last-child{border-radius:0 7px 7px 0}
  tbody td{padding:11px 12px;font-size:12.5px;border-bottom:1px solid #f1f5f9;vertical-align:middle}
  tbody tr:nth-child(even){background:#f8fafc}
  .num{color:#2563eb;font-weight:800;width:34px}
  .svc{font-weight:700;color:#1e293b}
  .svcsub{color:#94a3b8;font-size:10.5px;margin-top:1px}
  .c{text-align:center}.r{text-align:right}
  .amt{font-weight:800;white-space:nowrap}
  .dot{display:inline-block;width:7px;height:7px;border-radius:50%;margin-left:6px;vertical-align:middle}
  .dot.d{background:#16a34a}.dot.p{background:#f59e0b}
  .bottom{display:flex;justify-content:space-between;gap:24px;margin-top:24px}
  .pm .lbl2{margin-bottom:12px}
  .pmrow{display:flex;align-items:center;gap:11px;margin-bottom:11px}
  .pmicon{width:30px;height:22px;border:1px solid #dbeafe;background:#eff6ff;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#2563eb;flex-shrink:0}
  .pmname{font-weight:600;font-size:12.5px}
  .pmsub{color:#94a3b8;font-size:10.5px}
  .totals{width:240px;background:#f8fafc;border:1px solid #eef2f7;border-radius:12px;padding:16px 18px;flex-shrink:0}
  .trow{display:flex;justify-content:space-between;font-size:12.5px;color:#64748b;margin-bottom:9px}
  .trow .v{color:#1e293b;font-weight:600}
  .tdiv{border-top:1px solid #e2e8f0;margin:4px 0 12px}
  .total{display:flex;justify-content:space-between;align-items:center}
  .total .t{font-size:15px;font-weight:800;color:#1e293b}
  .total .tv{font-size:23px;font-weight:800;color:#2563eb}
  .foot{display:flex;justify-content:space-between;align-items:flex-end;border-top:1px dashed #e2e8f0;margin-top:auto;padding-top:16px}
  .foot .ty{font-weight:800;color:#1e293b}
  .foot .terms{color:#94a3b8;font-size:10.5px;margin-top:4px}
  .foot .sign{color:#94a3b8;font-size:11px}
  @media print{ body{padding:0} @page{margin:14mm} }
</style></head>
<body>
  <div class="header">
    <div class="brand">
      ${profile.logo_data ? `<img class="logo" src="${esc(profile.logo_data)}" alt="" style="object-fit:cover">` : ""}
      <div>
        <div class="shopname">${esc(shopName)}</div>
        <div class="tag">${esc(tagline)}</div>
        ${contactItems.length ? `<div class="contact">${contactItems.map(c => `<span class="cbit">${c.icon}${esc(c.text)}</span>`).join("")}</div>` : ""}
        ${profile.gst_number ? `<div class="gstline">GSTIN: ${esc(profile.gst_number)}</div>` : ""}
      </div>
    </div>
    <div class="invpanel">
      <div class="lbl">INVOICE</div>
      <div class="no">#INV-${invNum}</div>
      <div class="r">Date: ${today}</div>
      <div class="r">Period: ${esc(period)}</div>
    </div>
  </div>

  <div class="billrow">
    <div>
      <div class="lbl2">BILL TO</div>
      <div class="cust">${esc(customer.name)}</div>
      ${[customer.flat_number, customer.society_name].filter(Boolean).length ? `<div class="muted">${esc([customer.flat_number, customer.society_name].filter(Boolean).join(", "))}</div>` : ""}
      <div class="muted">${[esc(customer.phone), esc(customer.email)].filter(Boolean).join("  ·  ")}</div>
    </div>
    <div class="right">
      <div class="lbl2 grey">EXPECTED DELIVERY</div>
      <div class="bigdate">${esc(expDelivery)}</div>
      <div class="muted">${totalQty} items · ${catSet.size} categories</div>
    </div>
  </div>

  <table>
    <thead><tr><td>#</td><td>SERVICE</td><td class="c">QTY</td><td class="r">RATE</td><td class="r">AMOUNT</td></tr></thead>
    <tbody>${rows.join("") || `<tr><td colspan="5" style="text-align:center;color:#94a3b8;padding:24px">No items for this period</td></tr>`}</tbody>
  </table>

  <div class="bottom">
    <div class="pm">
      <div class="lbl2">PAYMENT METHODS</div>
      <div class="pmrow"><span class="pmicon">${svgCash}</span><span class="pmname">Cash</span></div>
      <div class="pmrow"><span class="pmicon">${svgCard}</span><span class="pmname">Card</span></div>
      <div class="pmrow"><span class="pmicon">${svgUpi}</span><span class="pmname">UPI</span>${upiId ? `<span class="pmsub">${esc(upiId)}</span>` : ""}</div>
    </div>
    <div class="totals">
      <div class="trow"><span>Subtotal</span><span class="v">${rupee(subtotal)}</span></div>
      <div class="trow"><span>Discount</span><span class="v">${discountAmt > 0 ? "−" : ""}${rupee(discountAmt)}</span></div>
      ${gstRate > 0 ? `<div class="trow"><span>Tax (GST ${gstRate}%)</span><span class="v">${rupee(taxAmt)}</span></div>` : ""}
      <div class="tdiv"></div>
      <div class="total"><span class="t">Total</span><span class="tv">${rupee(total)}</span></div>
    </div>
  </div>

  <div class="foot">
    <div>
      <div class="ty">${esc(profile.footer_note || "Thank you for your business")}</div>
      ${profile.invoice_terms ? `<div class="terms">${esc(profile.invoice_terms)}</div>` : ""}
    </div>
    <div class="sign">Authorised signature</div>
  </div>
</body></html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
