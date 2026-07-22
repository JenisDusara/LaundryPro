import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireActiveAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await requireActiveAuth(req);
  if (user instanceof NextResponse) return user;
  if (user.role !== "superadmin") return NextResponse.json({ detail: "Forbidden" }, { status: 403 });

  const p = new URL(req.url).searchParams;
  const shopId = p.get("shop_id") || "";
  const type = p.get("type") || "";
  const search = p.get("search") || "";
  const from = p.get("from") || "";
  const to = p.get("to") || "";
  const limit = Math.min(200, Math.max(1, Number(p.get("limit")) || 100));
  const fromDate = /^\d{4}-\d{2}-\d{2}$/.test(from) ? new Date(`${from}T00:00:00.000Z`) : null;
  const toDate = /^\d{4}-\d{2}-\d{2}$/.test(to) ? new Date(new Date(`${to}T00:00:00.000Z`).getTime() + 86400000) : null;

  const conds: Prisma.Sql[] = [Prisma.sql`TRUE`];
  if (shopId) conds.push(Prisma.sql`d.shop_id = ${shopId}`);
  if (type) conds.push(Prisma.sql`d.entity_type = ${type}`);
  if (search) conds.push(Prisma.sql`d.entity_label ILIKE ${`%${search}%`}`);
  if (fromDate) conds.push(Prisma.sql`d.deleted_at >= ${fromDate}`);
  if (toDate) conds.push(Prisma.sql`d.deleted_at < ${toDate}`);

  const rows = await prisma.$queryRaw<{
    entity_type: string;
    entity_id: string;
    shop_id: string;
    entity_label: string;
    deleted_at: Date;
    deleted_by_username: string;
    delete_reason: string;
  }[]>`
    SELECT *
    FROM (
      SELECT 'customer' AS entity_type, id::text AS entity_id, shop_id,
             name || ' (' || phone || ')' AS entity_label, deleted_at, deleted_by_username, delete_reason
      FROM customers
      WHERE deleted_at IS NOT NULL

      UNION ALL
      SELECT 'entry' AS entity_type, e.id::text AS entity_id, e.shop_id,
             COALESCE(c.name, 'Customer') || ' - ' || e.entry_date || ' - Rs. ' || e.total_amount::text AS entity_label,
             e.deleted_at, e.deleted_by_username, e.delete_reason
      FROM laundry_entries e
      LEFT JOIN customers c ON c.id = e.customer_id
      WHERE e.deleted_at IS NOT NULL

      UNION ALL
      SELECT 'payment' AS entity_type, p.id::text AS entity_id, p.shop_id,
             COALESCE(c.name, 'Customer') || ' - payment Rs. ' || p.amount::text || ' - ' || p.date AS entity_label,
             p.deleted_at, p.deleted_by_username, p.delete_reason
      FROM payments p
      LEFT JOIN customers c ON c.id = p.customer_id
      WHERE p.deleted_at IS NOT NULL

      UNION ALL
      SELECT 'expense' AS entity_type, id::text AS entity_id, shop_id,
             category || ' - Rs. ' || amount::text || ' - ' || date AS entity_label,
             deleted_at, deleted_by_username, delete_reason
      FROM expenses
      WHERE deleted_at IS NOT NULL

      UNION ALL
      SELECT 'labour_work' AS entity_type, w.id::text AS entity_id, l.shop_id,
             l.name || ' - work - ' || w.work_date || ' - ' || w.press_count::text || ' pcs' AS entity_label,
             w.deleted_at, w.deleted_by_username, w.delete_reason
      FROM labour_work w
      JOIN labours l ON l.id = w.labour_id
      WHERE w.deleted_at IS NOT NULL

      UNION ALL
      SELECT 'labour_advance' AS entity_type, a.id::text AS entity_id, l.shop_id,
             l.name || ' - advance Rs. ' || a.amount::text || ' - ' || a.advance_date AS entity_label,
             a.deleted_at, a.deleted_by_username, a.delete_reason
      FROM labour_advances a
      JOIN labours l ON l.id = a.labour_id
      WHERE a.deleted_at IS NOT NULL
    ) d
    WHERE ${Prisma.join(conds, " AND ")}
    ORDER BY d.deleted_at DESC
    LIMIT ${limit}
  `;

  return NextResponse.json(rows);
}
