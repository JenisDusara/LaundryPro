import { NextRequest, NextResponse } from "next/server";
import prisma, { withRetry } from "@/lib/prisma";
import { requireAuth, shopFilter, requireWrite } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;
  const search = new URL(req.url).searchParams.get("search") || "";
  const filter = shopFilter(user, req);
  const customers = await withRetry(() => prisma.customer.findMany({
    where: {
      ...filter,
      ...(search ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { phone: { contains: search } },
          { flat_number: { contains: search, mode: "insensitive" } },
        ],
      } : {}),
    },
    orderBy: { name: "asc" },
  }));
  return NextResponse.json(customers);
}

export async function POST(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;
  const ro = requireWrite(user); if (ro) return ro;
  const data = await req.json();
  if (!data.phone || !/^\d{10}$/.test(data.phone)) {
    return NextResponse.json({ detail: "Phone number must be exactly 10 digits" }, { status: 400 });
  }
  const shop_id = user.role === "superadmin" ? (data.shop_id || "shop1") : user.shop_id;
  const existing = await prisma.customer.findFirst({ where: { phone: data.phone, shop_id } });
  if (existing) return NextResponse.json({ detail: "Phone already registered" }, { status: 400 });
  const customer = await prisma.customer.create({ data: { ...data, shop_id } });
  return NextResponse.json(customer, { status: 201 });
}
