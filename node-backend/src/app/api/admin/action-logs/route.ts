import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireActiveAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await requireActiveAuth(req);
  if (user instanceof NextResponse) return user;
  if (user.role !== "superadmin") return NextResponse.json({ detail: "Forbidden" }, { status: 403 });

  const p = new URL(req.url).searchParams;
  const limit = Math.min(200, Math.max(1, Number(p.get("limit")) || 100));
  const shopId = p.get("shop_id") || "";
  const action = p.get("action") || "";
  const from = p.get("from") || "";
  const to = p.get("to") || "";
  const fromDate = /^\d{4}-\d{2}-\d{2}$/.test(from) ? new Date(`${from}T00:00:00.000Z`) : null;
  const toDate = /^\d{4}-\d{2}-\d{2}$/.test(to) ? new Date(new Date(`${to}T00:00:00.000Z`).getTime() + 86400000) : null;

  const rows = await prisma.$queryRaw<{
    id: string;
    actor_id: string;
    actor_username: string;
    action: string;
    target_admin_id: string;
    target_shop_id: string;
    target_shop_name: string;
    metadata: unknown;
    ip: string;
    created_at: Date;
  }[]>`
    SELECT *
    FROM (
      SELECT id::text, actor_id, actor_username, action, target_admin_id, target_shop_id,
             target_shop_name, metadata, ip, created_at
      FROM superadmin_action_logs

      UNION ALL
      SELECT id::text, actor_id, actor_username, action, '' AS target_admin_id,
             shop_id AS target_shop_id, '' AS target_shop_name, metadata, ip, created_at
      FROM data_action_logs

      UNION ALL
      SELECT id::text, '' AS actor_id, username AS actor_username,
             'login.' || status AS action, '' AS target_admin_id,
             shop_id AS target_shop_id, shop_name AS target_shop_name,
             jsonb_build_object('role', role, 'reason', reason, 'name', name) AS metadata,
             ip, created_at
      FROM login_logs
    ) logs
    WHERE (${shopId} = '' OR target_shop_id = ${shopId})
      AND (${action} = '' OR action = ${action})
      AND (${fromDate}::timestamp IS NULL OR created_at >= ${fromDate})
      AND (${toDate}::timestamp IS NULL OR created_at < ${toDate})
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;

  return NextResponse.json(rows);
}
