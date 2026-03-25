import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { getSettings } from "@/lib/settings";

export async function POST(req: NextRequest, { params }: { params: { customerId: string } }) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;

  const p = new URL(req.url).searchParams;
  const month = parseInt(p.get("month") || String(new Date().getMonth() + 1));
  const year = parseInt(p.get("year") || String(new Date().getFullYear()));

  const customer = await prisma.customer.findUnique({ where: { id: params.customerId } });
  if (!customer) return NextResponse.json({ detail: "Customer not found" }, { status: 404 });
  if (!customer.email) return NextResponse.json({ detail: "Customer has no email" }, { status: 400 });

  const start = new Date(year, month - 1, 1).toISOString().slice(0, 10);
  const end = new Date(year, month, 0).toISOString().slice(0, 10);
  const entries = await prisma.laundryEntry.findMany({
    where: { customer_id: params.customerId, entry_date: { gte: start, lte: end } },
    include: { items: true },
  });

  if (entries.length === 0) return NextResponse.json({ detail: "No entries for this period" }, { status: 400 });

  const total = entries.reduce((s, e) => s + Number(e.total_amount), 0);
  const settings = getSettings();

  const rows = entries.flatMap(e => e.items).map(i =>
    `<tr><td style="padding:6px 12px;border-bottom:1px solid #f1f5f9">${i.service_name}</td>
     <td style="padding:6px 12px;border-bottom:1px solid #f1f5f9;text-align:center">${i.quantity}</td>
     <td style="padding:6px 12px;border-bottom:1px solid #f1f5f9;text-align:right">₹${Number(i.subtotal)}</td></tr>`
  ).join("");

  const html = `<div style="font-family:sans-serif;max-width:500px;margin:0 auto">
    <h2 style="color:#1e3a8a">👔 ${settings.shop_name}</h2>
    <p>Dear <strong>${customer.name}</strong>, here is your invoice for ${new Date(year, month - 1).toLocaleString("en-IN", { month: "long", year: "numeric" })}.</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      <tr style="background:#f8fafc"><th style="padding:8px 12px;text-align:left">Item</th><th>Qty</th><th style="text-align:right">Amount</th></tr>
      ${rows}
    </table>
    <p style="font-weight:700;color:#1e3a8a;font-size:16px">Total: ₹${total}</p>
  </div>`;

  await sendEmail(customer.email, `Invoice - ${settings.shop_name} - ${new Date(year, month - 1).toLocaleString("en-IN", { month: "long", year: "numeric" })}`, html);
  return NextResponse.json({ message: "Invoice sent" });
}
