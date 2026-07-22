import { NextRequest, NextResponse } from "next/server";
import prisma, { withRetry } from "@/lib/prisma";
import { requireActiveAuth, shopFilter, requireWrite } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireActiveAuth(req);
  if (user instanceof NextResponse) return user;
  const ro = requireWrite(user); if (ro) return ro;
  const { name, price, parent_id, category } = await req.json();
  const sf = shopFilter(user, req);
  const service = await withRetry(() => prisma.service.updateMany({
    where: { id: params.id, ...sf },
    data: { name, price: price ?? null, parent_id: parent_id || null },
  }));
  if (category !== undefined) {
    if (sf.shop_id) await prisma.$executeRawUnsafe(`UPDATE services SET category = $1 WHERE id::text = $2 AND shop_id = $3`, category || null, params.id, sf.shop_id);
    else await prisma.$executeRawUnsafe(`UPDATE services SET category = $1 WHERE id::text = $2`, category || null, params.id);
  }
  return NextResponse.json(service);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireActiveAuth(req);
  if (user instanceof NextResponse) return user;
  const ro = requireWrite(user); if (ro) return ro;
  await withRetry(() => prisma.service.updateMany({
    where: { id: params.id, ...shopFilter(user, req) },
    data: { is_active: false },
  }));
  return NextResponse.json({ message: "Deactivated" });
}
