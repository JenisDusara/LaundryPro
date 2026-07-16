import { NextRequest, NextResponse } from "next/server";
import prisma, { withRetry } from "@/lib/prisma";
import { requireAuth, shopFilter, requireWrite, writeShopId } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;
  const all = await withRetry(() => prisma.service.findMany({
    where: { is_active: true, ...shopFilter(user, req) },
    orderBy: { created_at: "asc" },
  }));
  // category lives in a column the generated client may not know yet — read it via raw SQL.
  const ids = all.map(s => s.id);
  const catRows: { id: string; category: string | null }[] = ids.length
    ? await prisma.$queryRawUnsafe(`SELECT id::text, category FROM services WHERE id::text = ANY($1::text[])`, ids)
    : [];
  const catMap = new Map(catRows.map(r => [r.id, r.category ?? null]));
  const parents = all.filter(s => !s.parent_id);
  const result = parents.map(p => ({
    ...p,
    price: p.price != null ? Number(p.price) : null,
    category: catMap.get(p.id) ?? null,
    children: all.filter(c => c.parent_id === p.id).map(c => ({
      ...c, price: c.price != null ? Number(c.price) : null, category: catMap.get(c.id) ?? null, children: [],
    })),
  }));
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;
  const ro = requireWrite(user); if (ro) return ro;
  const { name, price, parent_id, category } = await req.json();
  const shop_id = writeShopId(user, req);
  const service = await prisma.service.create({
    data: { name, price: price ?? null, parent_id: parent_id || null, shop_id },
  });
  if (category) {
    await prisma.$executeRawUnsafe(`UPDATE services SET category = $1 WHERE id::text = $2`, category, service.id);
  }
  return NextResponse.json({ ...service, price: service.price != null ? Number(service.price) : null, category: category || null, children: [] }, { status: 201 });
}
