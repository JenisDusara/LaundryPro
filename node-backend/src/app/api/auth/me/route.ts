import { NextRequest, NextResponse } from "next/server";
import prisma, { withRetry } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;
  const admin = await withRetry(() => prisma.admin.findUnique({ where: { id: user.sub } }));
  if (!admin) return NextResponse.json({ detail: "Not found" }, { status: 404 });
  return NextResponse.json({ id: admin.id, username: admin.username, name: admin.name, role: admin.role, shop_id: admin.shop_id, shop_name: admin.shop_name });
}
