import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireActiveAuth, shopFilter, requireWrite } from "@/lib/auth";
import { monthRange } from "@/lib/dates";
import { getShopProfile } from "@/lib/settings";
import { waSendDocument } from "@/lib/waAuto";
import { sendEmail } from "@/lib/email";
import { buildInvoicePdf } from "@/lib/invoicePdf";

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

// Bulk monthly billing: send every MONTHLY-billing customer with activity in the selected
// month their invoice in one shot.
export async function POST(req: NextRequest) {
  const user = await requireActiveAuth(req);
  if (user instanceof NextResponse) return user;
  const ro = requireWrite(user); if (ro) return ro;

  const p = new URL(req.url).searchParams;
  const month = parseInt(p.get("month") || String(new Date().getMonth() + 1));
  const year  = parseInt(p.get("year")  || String(new Date().getFullYear()));
  const channel = (p.get("channel") || "both") as "whatsapp" | "email" | "both";
  if (!Number.isInteger(month) || !Number.isInteger(year) || month < 1 || month > 12 || year < 2000 || year > 2100) {
    return NextResponse.json({ detail: "Invalid month/year" }, { status: 400 });
  }
  if (channel !== "whatsapp" && channel !== "email" && channel !== "both") {
    return NextResponse.json({ detail: "Invalid channel" }, { status: 400 });
  }
  const wantWa    = channel === "whatsapp" || channel === "both";
  const wantEmail = channel === "email"    || channel === "both";

  // A bill blast must target exactly one shop — never mix shops (same rule as backup).
  const scope = shopFilter(user, req);
  if (!scope.shop_id) {
    return NextResponse.json({ detail: "Pehle ek shop select karein." }, { status: 400 });
  }
  const shopId = scope.shop_id;

  const { start, end } = monthRange(year, month);
  const monthlyCustomers = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id::text AS id
    FROM customers
    WHERE shop_id = ${shopId} AND billing_type = 'monthly' AND deleted_at IS NULL
  `;
  const monthlyCustomerIds = monthlyCustomers.map(c => c.id);
  const entries: any[] = await prisma.laundryEntry.findMany({
    where: { entry_date: { gte: start, lte: end }, deleted_at: null, shop_id: shopId, customer_id: { in: monthlyCustomerIds } },
    include: { customer: true, items: true },
    orderBy: { entry_date: "asc" },
  } as any);

  // Group this month's entries by customer.
  const byCustomer = new Map<string, { customer: NonNullable<typeof entries[number]["customer"]>; items: typeof entries[number]["items"]; total: number }>();
  for (const e of entries) {
    if (!e.customer) continue;
    const g = byCustomer.get(e.customer_id) || { customer: e.customer, items: [] as typeof e.items, total: 0 };
    g.items.push(...e.items);
    g.total += Number(e.total_amount);
    byCustomer.set(e.customer_id, g);
  }

  const profile = await getShopProfile(shopId);
  const shopName = profile.shop_name || "LaundryMax";
  const monthName = new Date(year, month - 1, 1).toLocaleString("en-IN", { month: "long", year: "numeric" });
  const inr = (n: number) => `Rs. ${Number(n).toLocaleString("en-IN")}`;
  const dateStr = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  // Decode the shop logo (data URI) once, reused across every invoice.
  let logo: Buffer | null = null;
  if (profile.logo_data && typeof profile.logo_data === "string" && profile.logo_data.includes("base64,")) {
    try { logo = Buffer.from(profile.logo_data.split("base64,")[1], "base64"); } catch { logo = null; }
  }

  let waSent = 0, emailSent = 0, skipped = 0, failed = 0;
  const groups = Array.from(byCustomer.values());

  for (const g of groups) {
    const { customer, items, total } = g;
    let did = false;

    // Build the same simple invoice we print as a PDF for both channels.
    const pdf = await buildInvoicePdf({
      shopName, tagline: profile.tagline, phone: profile.phone, address: profile.address,
      email: profile.email, gstNumber: profile.gst_number, upiId: profile.upi_id, footerNote: profile.footer_note,
      customerName: customer.name,
      customerSub: [customer.flat_number, customer.society_name].filter(Boolean).join(", ") || undefined,
      customerContact: [customer.phone, customer.email].filter(Boolean).join("  ·  ") || undefined,
      period: monthName,
      invoiceNo: String(1000 + (customer.id.split("").reduce((a: number, c: string) => a + c.charCodeAt(0), 0) % 9000)),
      dateStr,
      items: items.map((i: any) => ({ service_name: i.service_name, quantity: i.quantity, price_per_unit: Number(i.price_per_unit), subtotal: Number(i.subtotal) })),
      total,
      logo,
    });
    const filename = `Invoice-${shopName.replace(/[^a-z0-9]+/gi, "-")}-${monthName.replace(/\s+/g, "-")}.pdf`;

    // ── WhatsApp: send the invoice PDF as a document with a short caption ──
    if (wantWa && customer.phone) {
      const caption = `${shopName}\n🧾 ${monthName} invoice\nTotal: ${inr(total)}` + (profile.upi_id ? `\nPay via UPI: ${profile.upi_id}` : "");
      const ok = await waSendDocument(shopId, customer.phone, { fileBase64: pdf.toString("base64"), filename, caption });
      if (ok) { waSent++; did = true; }
      // Gentle pacing between WhatsApp sends to avoid the number being flagged for spam.
      await new Promise(r => setTimeout(r, 500));
    }

    // ── Email: attach the same PDF ──
    if (wantEmail && customer.email) {
      const html = `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#000">
        <h2 style="margin:0 0 8px">${esc(shopName)}</h2>
        <p>Dear <strong>${esc(customer.name)}</strong>, please find your invoice for ${monthName} attached.</p>
        <p style="font-weight:700;font-size:16px">Total: ${inr(total)}</p>
        ${profile.upi_id ? `<p>Pay via UPI: <strong>${esc(profile.upi_id)}</strong></p>` : ""}
      </div>`;
      try {
        await sendEmail(customer.email, `Invoice - ${shopName} - ${monthName}`, html, [{ filename, content: pdf }]);
        emailSent++; did = true;
      } catch { /* one bad address shouldn't abort the whole blast */ }
    }

    if (!did) {
      // No channel could reach this customer (no phone/email, or WhatsApp not connected).
      if ((wantWa && customer.phone) || (wantEmail && customer.email)) failed++;
      else skipped++;
    }
  }

  return NextResponse.json({
    month, year, monthName,
    customers: groups.length,
    waSent, emailSent, skipped, failed,
  });
}
