import { NextRequest, NextResponse } from "next/server";
import prisma, { withRetry } from "@/lib/prisma";

const SHOP = process.env.SHOP_ID || "shop1";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const customer = await withRetry(() => prisma.customer.findFirst({ where: { id: params.id, shop_id: SHOP }, include: { entries: { orderBy: { created_at: "desc" }, take: 20 } } }));
  if (!customer) return NextResponse.json({ detail: "Not found" }, { status: 404 });
  return NextResponse.json(customer);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const data = await req.json();
  const updated = await withRetry(() => prisma.customer.updateMany({ where: { id: params.id, shop_id: SHOP }, data }));
  if (updated.count === 0) return NextResponse.json({ detail: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await withRetry(() => prisma.customer.deleteMany({ where: { id: params.id, shop_id: SHOP } }));
  return NextResponse.json({ ok: true });
}
