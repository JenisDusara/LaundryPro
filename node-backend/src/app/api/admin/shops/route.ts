import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { requireActiveAuth } from "@/lib/auth";
import { todayIST, monthRange } from "@/lib/dates";
import { logSuperadminAction } from "@/lib/superadminAudit";

export async function GET(req: NextRequest) {
  const user = await requireActiveAuth(req);
  if (user instanceof NextResponse) return user;
  if (user.role !== "superadmin") return NextResponse.json({ detail: "Forbidden" }, { status: 403 });

  const clients = await prisma.$queryRaw<{
    id: string; username: string; name: string;
    shop_id: string; shop_name: string; is_active: boolean; created_at: Date;
    staff_count: bigint; plan_type: string | null; expires_at: Date | null; must_change_password: boolean;
  }[]>`
    SELECT a.id, a.username, a.name, a.shop_id, a.shop_name, a.is_active, a.created_at,
           a.plan_type, a.expires_at, a.must_change_password, COUNT(s.id) AS staff_count
    FROM admins a
    LEFT JOIN admins s ON s.shop_id = a.shop_id AND s.role = 'staff'
    WHERE a.role = 'admin'
    GROUP BY a.id
    ORDER BY a.created_at ASC
  `;

  // Per-shop business activity — computed separately to avoid multiplying the staff join.
  const [yy, mm] = todayIST().split("-").map(Number);
  const { start, end } = monthRange(yy, mm);
  const stats = await prisma.$queryRaw<{
    shop_id: string; total_entries: bigint; month_revenue: number | null; last_activity: string | null;
  }[]>`
    SELECT shop_id,
           COUNT(*) AS total_entries,
           SUM(CASE WHEN entry_date >= ${start} AND entry_date <= ${end} THEN total_amount ELSE 0 END) AS month_revenue,
           MAX(entry_date) AS last_activity
    FROM laundry_entries
    WHERE deleted_at IS NULL
    GROUP BY shop_id
  `;
  const statMap = new Map(stats.map(s => [s.shop_id, s]));

  return NextResponse.json(clients.map(c => {
    const st = statMap.get(c.shop_id);
    return {
      id: c.id,
      username: c.username,
      name: c.name,
      shop_id: c.shop_id,
      shop_name: c.shop_name,
      is_active: c.is_active,
      created_at: c.created_at,
      staff_count: Number(c.staff_count),
      plan_type: c.plan_type,
      expires_at: c.expires_at,
      must_change_password: c.must_change_password,
      total_entries: Number(st?.total_entries ?? 0),
      month_revenue: Number(st?.month_revenue ?? 0),
      last_activity: st?.last_activity ?? null,
    };
  }));
}

export async function POST(req: NextRequest) {
  const user = await requireActiveAuth(req);
  if (user instanceof NextResponse) return user;
  if (user.role !== "superadmin") return NextResponse.json({ detail: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const username = typeof body.username === "string" ? body.username.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const shop_id = typeof body.shop_id === "string" ? body.shop_id.trim() : "";
  const shop_name = typeof body.shop_name === "string" ? body.shop_name.trim() : "";
  const plan_type = body.plan_type;
  const expires_at = body.expires_at;
  const signup_request_id = body.signup_request_id;
  if (signup_request_id) {
    return NextResponse.json({ detail: "Public signup approval is disabled. Create the client manually with a temporary password." }, { status: 410 });
  }
  if (!shop_id || !shop_name) {
    return NextResponse.json({ detail: "shop_id and shop_name are required" }, { status: 400 });
  }

  // shop_id is the tenant key every query filters on. If a new client reuses an
  // existing shop's id (a typo on approval, or copy-paste), the two businesses'
  // customers, entries, payments and udhaar silently merge. Reject collisions.
  const shopTaken = await prisma.admin.findFirst({ where: { shop_id, role: "admin" }, select: { id: true } });
  if (shopTaken) {
    return NextResponse.json({ detail: `Shop ID "${shop_id}" is already in use. Choose a unique Shop ID.` }, { status: 400 });
  }

  if (!username || !password) {
    return NextResponse.json({ detail: "username and password are required" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ detail: "Temporary password must be at least 6 characters" }, { status: 400 });
  }

  if (username) {
    const existing = await prisma.admin.findUnique({ where: { username } });
    if (existing) return NextResponse.json({ detail: "Username already taken" }, { status: 400 });
  }

  let expiryDate = expires_at ? (() => { const d = new Date(expires_at); d.setHours(23,59,59,999); return d; })() : null;
  let finalPlan: string | null = plan_type || null;
  const hash = await bcrypt.hash(password, 12);

  const client = await prisma.admin.create({
    data: {
      username, password_hash: hash, name: name || username,
      shop_id, shop_name, role: "admin",
      plan_type: finalPlan,
      expires_at: expiryDate,
    },
  });
  await prisma.$executeRaw`
    UPDATE admins SET must_change_password = true WHERE id = ${client.id}
  `;

  await logSuperadminAction(req, user, {
    action: "client.create",
    target_admin_id: client.id,
    target_shop_id: client.shop_id,
    target_shop_name: client.shop_name,
    metadata: {
      plan_type: client.plan_type,
      expires_at: client.expires_at,
      temporary_password: true,
    },
  });

  return NextResponse.json({
    id: client.id, username: client.username, name: client.name,
    shop_id: client.shop_id, shop_name: client.shop_name,
    plan_type: client.plan_type, expires_at: client.expires_at,
  }, { status: 201 });
}
