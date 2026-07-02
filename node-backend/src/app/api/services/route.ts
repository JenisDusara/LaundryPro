import { NextRequest, NextResponse } from "next/server";
import prisma, { withRetry } from "@/lib/prisma";
import { requireAuth, shopFilter, requireWrite } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;
  const all = await withRetry(() => prisma.service.findMany({
    where: { is_active: true, ...shopFilter(user, req) },
    orderBy: { created_at: "asc" },
  }));
  const parents = all.filter(s => !s.parent_id);
  const result = parents.map(p => ({
    ...p,
    price: p.price != null ? Number(p.price) : null,
    children: all.filter(c => c.parent_id === p.id).map(c => ({
      ...c, price: c.price != null ? Number(c.price) : null, children: [],
    })),
  }));
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;
  const ro = requireWrite(user); if (ro) return ro;
  const { name, price, parent_id } = await req.json();
  const shop_id = user.role === "superadmin" ? "shop1" : user.shop_id;
  const service = await prisma.service.create({
    data: { name, price: price ?? null, parent_id: parent_id || null, shop_id },
  });
  return NextResponse.json({ ...service, price: service.price != null ? Number(service.price) : null, children: [] }, { status: 201 });
}
