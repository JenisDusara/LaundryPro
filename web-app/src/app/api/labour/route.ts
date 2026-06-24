import { NextRequest, NextResponse } from "next/server";
import prisma, { withRetry } from "@/lib/prisma";

const SHOP = process.env.SHOP_ID || "shop1";

export async function GET() {
  const labours = await withRetry(() => prisma.labour.findMany({ where: { is_active: true, shop_id: SHOP }, orderBy: { name: "asc" } }));
  return NextResponse.json(labours);
}

export async function POST(req: NextRequest) {
  const { name } = await req.json();
  if (!name) return NextResponse.json({ detail: "Name required" }, { status: 400 });
  const labour = await withRetry(() => prisma.labour.create({ data: { name, shop_id: SHOP } }));
  return NextResponse.json(labour, { status: 201 });
}
