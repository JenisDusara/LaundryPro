import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma, { withRetry } from "@/lib/prisma";
import { requireActiveAuth, requireWrite } from "@/lib/auth";
import { logDataAction } from "@/lib/dataAudit";

const METHODS = ["cash", "upi", "card", "other"];

// Shop scope fragment shared by PUT/DELETE — a shop can only touch its own payments.
function scopeSql(user: { role: string; shop_id: string }, req: NextRequest): Prisma.Sql {
  if (user.role !== "superadmin") return Prisma.sql`AND shop_id = ${user.shop_id}`;
  const s = req.headers.get("x-selected-shop");
  return s ? Prisma.sql`AND shop_id = ${s}` : Prisma.empty;
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireActiveAuth(req);
  if (user instanceof NextResponse) return user;
  const ro = requireWrite(user); if (ro) return ro;

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ detail: "Invalid request body" }, { status: 400 }); }
  const { amount, method, date, note } = body;
  const amt = Number(amount);
  if (!amt || amt <= 0) return NextResponse.json({ detail: "A positive amount is required" }, { status: 400 });
  const pmethod = METHODS.includes(method) ? method : "cash";
  const scope = scopeSql(user, req);

  const rows = await withRetry(() => prisma.$queryRaw<{ id: string }[]>`
    UPDATE payments SET amount = ${amt}::numeric, method = ${pmethod}, date = COALESCE(${date || null}, date), note = ${note || ""}
    WHERE id::text = ${params.id} AND deleted_at IS NULL ${scope}
    RETURNING id::text
  `);
  if (rows.length === 0) return NextResponse.json({ detail: "Not found" }, { status: 404 });
  return NextResponse.json({ message: "Updated" });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireActiveAuth(req);
  if (user instanceof NextResponse) return user;
  const ro = requireWrite(user); if (ro) return ro;

  // Shop-scoped delete — a shop can only remove its own payment records.
  const scope = user.role !== "superadmin"
    ? Prisma.sql`AND shop_id = ${user.shop_id}`
    : (() => { const s = req.headers.get("x-selected-shop"); return s ? Prisma.sql`AND shop_id = ${s}` : Prisma.empty; })();

  const existing = await withRetry(() => prisma.$queryRaw<{
    id: string; customer_id: string; customer_name: string; amount: number; shop_id: string;
  }[]>`
    SELECT p.id::text, p.customer_id::text, c.name AS customer_name, p.amount::float8 AS amount, p.shop_id
    FROM payments p
    LEFT JOIN customers c ON c.id = p.customer_id
    WHERE p.id::text = ${params.id} AND p.deleted_at IS NULL ${scope}
    LIMIT 1
  `);
  if (existing.length === 0) return NextResponse.json({ detail: "Not found" }, { status: 404 });
  const reason = new URL(req.url).searchParams.get("reason") || "payment_delete";
  const affected = await withRetry(() => prisma.$executeRaw`
    UPDATE payments
    SET deleted_at = now(), deleted_by = ${user.sub}, deleted_by_username = ${user.username}, delete_reason = ${reason}
    WHERE id::text = ${params.id} AND deleted_at IS NULL ${scope}
  `);
  if (affected === 0) return NextResponse.json({ detail: "Not found" }, { status: 404 });
  await logDataAction(req, user, {
    action: "payment.soft_deleted",
    shop_id: existing[0].shop_id,
    entity_type: "payment",
    entity_id: existing[0].id,
    entity_label: `${existing[0].customer_name || "Customer"} payment`,
    metadata: { reason, amount: Number(existing[0].amount) },
  });
  return NextResponse.json({ message: "Deleted" });
}
