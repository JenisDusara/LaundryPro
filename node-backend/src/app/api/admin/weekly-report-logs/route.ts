import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireActiveAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await requireActiveAuth(req);
  if (user instanceof NextResponse) return user;
  if (user.role !== "superadmin") return NextResponse.json({ detail: "Forbidden" }, { status: 403 });

  const [logs, shops] = await Promise.all([
    prisma.weeklyReportLog.findMany({ orderBy: { created_at: "desc" }, take: 100 }),
    prisma.admin.findMany({ where: { role: "admin" }, select: { shop_id: true, shop_name: true } }),
  ]);
  const nameMap = new Map(shops.map(s => [s.shop_id, s.shop_name]));

  return NextResponse.json(logs.map(l => ({
    id: l.id,
    shop_id: l.shop_id,
    shop_name: nameMap.get(l.shop_id) || l.shop_id,
    week_start: l.week_start,
    week_end: l.week_end,
    status: l.status,
    reason: l.reason,
    created_at: l.created_at,
  })));
}
