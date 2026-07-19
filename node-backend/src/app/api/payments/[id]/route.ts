import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma, { withRetry } from "@/lib/prisma";
import { requireAuth, requireWrite } from "@/lib/auth";

const METHODS = ["cash", "upi", "card", "other"];

// Shop scope fragment shared by PUT/DELETE — a shop can only touch its own payments.
function scopeSql(user: { role: string; shop_id: string }, req: NextRequest): Prisma.Sql {
  if (user.role !== "superadmin") return Prisma.sql`AND shop_id = ${user.shop_id}`;
  const s = req.headers.get("x-selected-shop");
  return s ? Prisma.sql`AND shop_id = ${s}` : Prisma.empty;
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;
  const ro = requireWrite(user); if (ro) return ro;

  const { amount, method, date, note } = await req.json();
  const amt = Number(amount);
  if (!amt || amt <= 0) return NextResponse.json({ detail: "A positive amount is required" }, { status: 400 });
  const pmethod = METHODS.includes(method) ? method : "cash";
  const scope = scopeSql(user, req);

  const rows = await withRetry(() => prisma.$queryRaw<{ id: string }[]>`
    UPDATE payments SET amount = ${amt}::numeric, method = ${pmethod}, date = COALESCE(${date || null}, date), note = ${note || ""}
    WHERE id::text = ${params.id} ${scope}
    RETURNING id::text
  `);
  if (rows.length === 0) return NextResponse.json({ detail: "Not found" }, { status: 404 });
  return NextResponse.json({ message: "Updated" });
}

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
