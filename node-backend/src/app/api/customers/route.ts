import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;
  const search = new URL(req.url).searchParams.get("search") || "";
  const customers = await prisma.customer.findMany({
    where: search ? {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
        { flat_number: { contains: search, mode: "insensitive" } },
      ],
    } : {},
    orderBy: { name: "asc" },
  });
  return NextResponse.json(customers);
}

export async function POST(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;
  const data = await req.json();
  const existing = await prisma.customer.findFirst({ where: { phone: data.phone } });
  if (existing) return NextResponse.json({ detail: "Phone already registered" }, { status: 400 });
  const customer = await prisma.customer.create({ data });
  return NextResponse.json(customer, { status: 201 });
}
