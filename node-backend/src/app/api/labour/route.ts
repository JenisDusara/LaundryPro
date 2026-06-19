import { NextRequest, NextResponse } from "next/server";
import prisma, { withRetry } from "@/lib/prisma";
import { requireAuth, shopFilter } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;
  const labours = await withRetry(() => prisma.labour.findMany({ where: { is_active: true, ...shopFilter(user, req) }, orderBy: { name: "asc" } }));
  return NextResponse.json(labours);
}

export async function POST(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;
  const { name } = await req.json();
  const shop_id = user.role === "superadmin" ? "shop1" : user.shop_id;
  const labour = await withRetry(() => prisma.labour.create({ data: { name, shop_id } }));
  return NextResponse.json(labour, { status: 201 });
}
