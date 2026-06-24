import { NextRequest, NextResponse } from "next/server";
import prisma, { withRetry } from "@/lib/prisma";

const SHOP = process.env.SHOP_ID || "shop1";

export async function GET() {
  const services = await withRetry(() => prisma.service.findMany({
    where: { is_active: true, shop_id: SHOP },
    include: { children: { where: { is_active: true }, orderBy: { name: "asc" } } },
    orderBy: { name: "asc" },
  }));
  return NextResponse.json(services);
}

export async function POST(req: NextRequest) {
  const { name, parent_id, price } = await req.json();
  if (!name) return NextResponse.json({ detail: "Name required" }, { status: 400 });
  const service = await withRetry(() => prisma.service.create({
    data: { name, parent_id: parent_id || null, price: price ? parseFloat(price) : null, shop_id: SHOP },
  }));
  return NextResponse.json(service, { status: 201 });
}
