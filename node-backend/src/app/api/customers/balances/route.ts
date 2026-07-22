import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma, { withRetry } from "@/lib/prisma";
import { requireActiveAuth } from "@/lib/auth";

// Per-customer running balance (lifetime): total billed (entries) minus total paid (payments).
// outstanding > 0 means the customer owes money (udhaar). Shop-scoped.
export async function GET(req: NextRequest) {
  const user = await requireActiveAuth(req);
  if (user instanceof NextResponse) return user;

  const shopCond = user.role !== "superadmin"
    ? Prisma.sql`c.shop_id = ${user.shop_id}`
    : (() => { const s = req.headers.get("x-selected-shop"); return s ? Prisma.sql`c.shop_id = ${s}` : Prisma.sql`TRUE`; })();

  const rows = await withRetry(() => prisma.$queryRaw<{
    customer_id: string; billed: number; paid: number;
  }[]>`
    SELECT c.id::text AS customer_id,
           COALESCE(e.billed, 0)::float8 AS billed,
           COALESCE(pm.paid, 0)::float8 AS paid
    FROM customers c
    LEFT JOIN (SELECT customer_id, SUM(total_amount) AS billed FROM laundry_entries WHERE deleted_at IS NULL GROUP BY customer_id) e
           ON e.customer_id = c.id
    LEFT JOIN (SELECT customer_id, SUM(amount) AS paid FROM payments WHERE deleted_at IS NULL GROUP BY customer_id) pm
           ON pm.customer_id = c.id
    WHERE c.deleted_at IS NULL AND ${shopCond}
  `);

  // Round to paise — the SUMs come back as float8, so subtracting them can leave artifacts
  // like 149.99999999998 that make the same balance look different across pages.
  const r2 = (n: number) => Math.round(n * 100) / 100;
  return NextResponse.json(rows.map(r => ({
    customer_id: r.customer_id,
    billed: r2(Number(r.billed)),
    paid: r2(Number(r.paid)),
    outstanding: r2(Number(r.billed) - Number(r.paid)),
  })));
}
