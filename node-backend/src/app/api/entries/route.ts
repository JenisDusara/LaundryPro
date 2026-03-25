import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { sendEmail, pickupEmailHtml } from "@/lib/email";
import { sendSms } from "@/lib/sms";
import { getSettings } from "@/lib/settings";

export async function GET(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;
  const p = new URL(req.url).searchParams;
  const where: any = {};
  if (p.get("entry_date")) where.entry_date = p.get("entry_date");
  if (p.get("month") && p.get("year")) {
    const m = parseInt(p.get("month")!), y = parseInt(p.get("year")!);
    const start = new Date(y, m - 1, 1).toISOString().slice(0, 10);
    const end = new Date(y, m, 0).toISOString().slice(0, 10);
    where.entry_date = { gte: start, lte: end };
  }
  if (p.get("customer_id")) where.customer_id = p.get("customer_id");

  const entries = await prisma.laundryEntry.findMany({
    where,
    include: { customer: true, items: true },
    orderBy: { entry_date: "desc" },
  });
  return NextResponse.json(entries.map(e => ({
    ...e,
    total_amount: Number(e.total_amount),
    items: e.items.map(i => ({ ...i, price_per_unit: Number(i.price_per_unit), subtotal: Number(i.subtotal) })),
  })));
}

export async function POST(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;
  const { customer_id, notes, items } = await req.json();

  const customer = await prisma.customer.findUnique({ where: { id: customer_id } });
  if (!customer) return NextResponse.json({ detail: "Customer not found" }, { status: 404 });

  let total = 0;
  const entryItems = items.map((item: any) => {
    const subtotal = Number(item.price_per_unit) * Number(item.quantity);
    total += subtotal;
    return {
      service_id: item.service_id,
      service_name: item.service_name,
      price_per_unit: Number(item.price_per_unit),
      quantity: Number(item.quantity),
      subtotal,
      item_status: "pending",
    };
  });

  const today = new Date().toISOString().slice(0, 10);
  const entry = await prisma.laundryEntry.create({
    data: {
      customer_id,
      entry_date: today,
      total_amount: total,
      delivery_status: "pending",
      notes: notes || "",
      items: { create: entryItems },
    },
    include: { customer: true, items: true },
  });

  const settings = getSettings();
  if (customer.email) {
    sendEmail(customer.email, `Laundry Pickup - ${settings.shop_name}`,
      pickupEmailHtml(customer.name, entryItems, total, settings.shop_name)
    ).catch(() => {});
  }
  if (customer.phone) {
    sendSms(customer.phone, `Dear ${customer.name}, your laundry has been picked up. Total: Rs.${total}. - ${settings.shop_name}`).catch(() => {});
  }

  return NextResponse.json({
    ...entry,
    total_amount: Number(entry.total_amount),
    items: entry.items.map(i => ({ ...i, price_per_unit: Number(i.price_per_unit), subtotal: Number(i.subtotal) })),
  }, { status: 201 });
}
