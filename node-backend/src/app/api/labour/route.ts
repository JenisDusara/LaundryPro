import { NextRequest, NextResponse } from "next/server";
import prisma, { withRetry } from "@/lib/prisma";
import { requireActiveAuth, shopFilter, requireWrite, denyStaff, writeShopId } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await requireActiveAuth(req);
  if (user instanceof NextResponse) return user;
  const staff = denyStaff(user); if (staff) return staff;
  const labours = await withRetry(() => prisma.labour.findMany({ where: { is_active: true, ...shopFilter(user, req) }, orderBy: { name: "asc" } }));
  return NextResponse.json(labours);
}

export async function POST(req: NextRequest) {
  const user = await requireActiveAuth(req);
  if (user instanceof NextResponse) return user;
  const staff = denyStaff(user); if (staff) return staff;
  const ro = requireWrite(user); if (ro) return ro;
  const { name } = await req.json();
  const shop_id = writeShopId(user, req);
  const labour = await withRetry(() => prisma.labour.create({ data: { name, shop_id } }));
  return NextResponse.json(labour, { status: 201 });
}
