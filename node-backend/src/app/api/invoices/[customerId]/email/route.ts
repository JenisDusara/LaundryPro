import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireActiveAuth, shopFilter, requireWrite } from "@/lib/auth";
import { monthRange } from "@/lib/dates";
import { sendEmail } from "@/lib/email";
import { getShopProfile } from "@/lib/settings";

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

export async function POST(req: NextRequest, { params }: { params: { customerId: string } }) {
  const user = await requireActiveAuth(req);
  if (user instanceof NextResponse) return user;
  const ro = requireWrite(user); if (ro) return ro;

  const p = new URL(req.url).searchParams;
  const month = parseInt(p.get("month") || String(new Date().getMonth() + 1));
  const year = parseInt(p.get("year") || String(new Date().getFullYear()));
  if (!Number.isInteger(month) || !Number.isInteger(year) || month < 1 || month > 12 || year < 2000 || year > 2100) {
    return NextResponse.json({ detail: "Invalid month/year" }, { status: 400 });
  }

  const customer = await prisma.customer.findFirst({ where: { id: params.customerId, deleted_at: null, ...shopFilter(user, req) } as any });
  if (!customer) return NextResponse.json({ detail: "Customer not found" }, { status: 404 });
  if (!customer.email) return NextResponse.json({ detail: "Customer has no email" }, { status: 400 });

  const { start, end } = monthRange(year, month);
  const entries: any[] = await prisma.laundryEntry.findMany({
    where: { customer_id: params.customerId, deleted_at: null, entry_date: { gte: start, lte: end }, ...shopFilter(user, req) },
    include: { items: true },
  } as any);

  if (entries.length === 0) return NextResponse.json({ detail: "No entries for this period" }, { status: 400 });

  const total = entries.reduce((s, e) => s + Number(e.total_amount), 0);
  const profile = await getShopProfile(customer.shop_id);
  const shopName = profile.shop_name || "LaundryMax";

  const rows = entries.flatMap(e => e.items).map(i =>
    `<tr>
      <td style="border:1px solid #000;padding:6px">${esc(i.service_name)}</td>
      <td style="border:1px solid #000;padding:6px;text-align:center">${i.quantity}</td>
      <td style="border:1px solid #000;padding:6px;text-align:right">₹${Number(i.subtotal)}</td>
    </tr>`
  ).join("");

  const period = new Date(year, month - 1).toLocaleString("en-IN", { month: "long", year: "numeric" });
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#000">
    <h2 style="margin:0 0 8px">${esc(shopName)}</h2>
    <p>Dear <strong>${esc(customer.name)}</strong>,</p>
    <p>Please find your invoice for ${period}.</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      <tr>
        <th style="border:1px solid #000;padding:6px;text-align:left">Item</th>
        <th style="border:1px solid #000;padding:6px">Qty</th>
        <th style="border:1px solid #000;padding:6px;text-align:right">Amount</th>
      </tr>
      ${rows}
    </table>
    <p style="font-weight:700;font-size:16px">Total: ₹${total}</p>
  </div>`;

  await sendEmail(customer.email, `Invoice - ${shopName} - ${period}`, html);
  return NextResponse.json({ message: "Invoice sent" });
}
