import { NextRequest, NextResponse } from "next/server";
import prisma, { withRetry } from "@/lib/prisma";
import { requireActiveAuth, shopFilter, requireWrite, writeShopId } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await requireActiveAuth(req);
  if (user instanceof NextResponse) return user;
  const all = await withRetry(() => prisma.service.findMany({
    where: { is_active: true, ...shopFilter(user, req) },
    orderBy: { created_at: "asc" },
  }));
  // category/description live in columns the generated client may not know yet — read via raw SQL.
  const ids = all.map(s => s.id);
  const catRows: { id: string; category: string | null; description: string | null }[] = ids.length
    ? await prisma.$queryRawUnsafe(`SELECT id::text, category, description FROM services WHERE id::text = ANY($1::text[])`, ids)
    : [];
  const catMap = new Map(catRows.map(r => [r.id, { category: r.category ?? null, description: r.description ?? null }]));
  const meta = (id: string) => catMap.get(id) ?? { category: null, description: null };
  const parents = all.filter(s => !s.parent_id);
  const result = parents.map(p => ({
    ...p,
    price: p.price != null ? Number(p.price) : null,
    category: meta(p.id).category,
    description: meta(p.id).description,
    children: all.filter(c => c.parent_id === p.id).map(c => ({
      ...c, price: c.price != null ? Number(c.price) : null, category: meta(c.id).category, description: meta(c.id).description, children: [],
    })),
  }));
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const user = await requireActiveAuth(req);
  if (user instanceof NextResponse) return user;
  const ro = requireWrite(user); if (ro) return ro;
  const { name, price, parent_id, category, description } = await req.json();
  const shop_id = writeShopId(user, req);
  const service = await prisma.service.create({
    data: { name, price: price ?? null, parent_id: parent_id || null, shop_id },
  });
  if (category || description) {
    await prisma.$executeRawUnsafe(`UPDATE services SET category = $1, description = $2 WHERE id::text = $3`, category || null, description || null, service.id);
  }
  return NextResponse.json({ ...service, price: service.price != null ? Number(service.price) : null, category: category || null, description: description || null, children: [] }, { status: 201 });
}
