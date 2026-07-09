import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma, { withRetry } from "@/lib/prisma";
import { requireAuth, requireWrite } from "@/lib/auth";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;
  const ro = requireWrite(user); if (ro) return ro;

  // Shop-scoped delete — a shop can only remove its own payment records.
  const scope = user.role !== "superadmin"
    ? Prisma.sql`AND shop_id = ${user.shop_id}`
    : (() => { const s = req.headers.get("x-selected-shop"); return s ? Prisma.sql`AND shop_id = ${s}` : Prisma.empty; })();

  const affected = await withRetry(() => prisma.$executeRaw`
    DELETE FROM payments WHERE id::text = ${params.id} ${scope}
  `);
  if (affected === 0) return NextResponse.json({ detail: "Not found" }, { status: 404 });
  return NextResponse.json({ message: "Deleted" });
}
