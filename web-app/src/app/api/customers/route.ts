import { NextRequest, NextResponse } from "next/server";
import prisma, { withRetry } from "@/lib/prisma";

const SHOP = process.env.SHOP_ID || "shop1";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const where: any = { shop_id: SHOP };
  if (search) where.OR = [{ name: { contains: search, mode: "insensitive" } }, { phone: { contains: search } }];
  const customers = await withRetry(() => prisma.customer.findMany({ where, orderBy: { name: "asc" } }));
  return NextResponse.json(customers);
}

export async function POST(req: NextRequest) {
  const { name, phone, flat_number, society_name, address, email } = await req.json();
  if (!name || !phone) return NextResponse.json({ detail: "Name and phone required" }, { status: 400 });
  try {
    const customer = await withRetry(() => prisma.customer.create({
      data: { name, phone, flat_number: flat_number || "", society_name: society_name || "", address: address || "", email: email || null, shop_id: SHOP },
    }));
    return NextResponse.json(customer, { status: 201 });
  } catch (e: any) {
    if (e.code === "P2002") return NextResponse.json({ detail: "Phone already exists" }, { status: 400 });
    throw e;
  }
}
