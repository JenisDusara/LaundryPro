import { NextRequest, NextResponse } from "next/server";
import prisma, { withRetry } from "@/lib/prisma";

const SHOP = process.env.SHOP_ID || "shop1";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const date   = searchParams.get("date");
  const where: any = { shop_id: SHOP };
  if (status) where.delivery_status = status;
  if (date)   where.entry_date = date;
  const entries = await withRetry(() => prisma.laundryEntry.findMany({
    where, orderBy: { created_at: "desc" }, take: 200,
    include: { customer: true, items: { include: { service: true } } },
  }));
  return NextResponse.json(entries);
}

export async function POST(req: NextRequest) {
  const { customer_id, entry_date, items, notes } = await req.json();
  if (!customer_id || !entry_date || !items?.length) return NextResponse.json({ detail: "Missing fields" }, { status: 400 });

  const total = items.reduce((s: number, i: any) => s + i.quantity * (i.price || i.price_per_unit), 0);
  const entry = await withRetry(() => prisma.laundryEntry.create({
    data: {
      customer_id, entry_date, notes: notes || "",
      total_amount: total, shop_id: SHOP,
      items: { create: items.map((i: any) => ({ service_id: i.service_id, service_name: i.service_name || "", price_per_unit: i.price || i.price_per_unit, quantity: i.quantity, subtotal: i.quantity * (i.price || i.price_per_unit) })) },
    },
    include: { customer: true, items: true },
  }));
  return NextResponse.json(entry, { status: 201 });
}
