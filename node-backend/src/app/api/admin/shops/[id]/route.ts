import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { requireActiveAuth } from "@/lib/auth";
import { logSuperadminAction } from "@/lib/superadminAudit";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireActiveAuth(req);
  if (user instanceof NextResponse) return user;
  if (user.role !== "superadmin") return NextResponse.json({ detail: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const existingClient = await prisma.admin.findFirst({
    where: { id: params.id, role: "admin" },
    select: { id: true, username: true, shop_id: true, shop_name: true, plan_type: true, expires_at: true },
  });
  if (!existingClient) return NextResponse.json({ detail: "Client not found" }, { status: 404 });

  // Renewal: plan_type provided → use custom expires_at if given, else auto-calculate
  if (body.plan_type) {
    const plan: string = body.plan_type;
    if (plan !== "monthly" && plan !== "yearly") {
      return NextResponse.json({ detail: "plan_type must be monthly or yearly" }, { status: 400 });
    }

    let newExpiry: Date;
    if (body.expires_at) {
      // Custom date provided by superadmin
      newExpiry = new Date(body.expires_at);
      if (isNaN(newExpiry.getTime())) {
        return NextResponse.json({ detail: "Invalid expires_at date" }, { status: 400 });
      }
      // Set to end of that day
      newExpiry.setHours(23, 59, 59, 999);
    } else {
      // Auto-calculate from current expiry
      const rows = await prisma.$queryRaw<{ expires_at: Date | null }[]>`SELECT expires_at FROM admins WHERE id = ${params.id}`;
      const current = rows[0]?.expires_at;
      const base = current && new Date(current) > new Date() ? new Date(current) : new Date();
      newExpiry = new Date(base);
      if (plan === "monthly") newExpiry.setDate(newExpiry.getDate() + 30);
      else newExpiry.setFullYear(newExpiry.getFullYear() + 1);
    }

    await prisma.$executeRaw`UPDATE admins SET plan_type = ${plan}, expires_at = ${newExpiry}, is_active = true, token_version = token_version + 1 WHERE id = ${params.id}`;
    await prisma.$executeRaw`UPDATE admins SET is_active = true, token_version = token_version + 1 WHERE shop_id = ${existingClient.shop_id} AND role = 'staff'`;
    await logSuperadminAction(req, user, {
      action: "client.renew",
      target_admin_id: existingClient.id,
      target_shop_id: existingClient.shop_id,
      target_shop_name: existingClient.shop_name,
      metadata: {
        old_plan_type: existingClient.plan_type,
        old_expires_at: existingClient.expires_at,
        new_plan_type: plan,
        new_expires_at: newExpiry,
      },
    });
    return NextResponse.json({ id: params.id, plan_type: plan, expires_at: newExpiry, is_active: true });
  }

  // Toggle is_active
  const val = Boolean(body.is_active);
  await prisma.$executeRaw`UPDATE admins SET is_active = ${val}, token_version = token_version + 1 WHERE shop_id = ${existingClient.shop_id} AND role IN ('admin','staff')`;
  await logSuperadminAction(req, user, {
    action: val ? "client.enable" : "client.disable",
    target_admin_id: existingClient.id,
    target_shop_id: existingClient.shop_id,
    target_shop_name: existingClient.shop_name,
    metadata: { is_active: val },
  });
  return NextResponse.json({ id: params.id, is_active: val });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireActiveAuth(req);
  if (user instanceof NextResponse) return user;
  if (user.role !== "superadmin") return NextResponse.json({ detail: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const username = typeof body.username === "string" ? body.username.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const shop_id = typeof body.shop_id === "string" ? body.shop_id.trim() : "";
  const shop_name = typeof body.shop_name === "string" ? body.shop_name.trim() : "";
  const before = await prisma.admin.findFirst({
    where: { id: params.id, role: "admin" },
    select: { id: true, username: true, name: true, shop_id: true, shop_name: true },
  });
  if (!before) return NextResponse.json({ detail: "Client not found" }, { status: 404 });

  // Check username conflict (ignore self)
  if (username) {
    const conflict = await prisma.admin.findFirst({ where: { username, NOT: { id: params.id } } });
    if (conflict) return NextResponse.json({ detail: "Username already taken" }, { status: 400 });
  }

  // Moving a client onto a shop_id another business already owns would merge their
  // data. Block it (ignore self so a no-op re-save is allowed).
  if (shop_id) {
    const shopConflict = await prisma.admin.findFirst({
      where: { shop_id, role: "admin", NOT: { id: params.id } },
      select: { id: true },
    });
    if (shopConflict) {
      return NextResponse.json({ detail: `Shop ID "${shop_id}" is already in use by another client.` }, { status: 400 });
    }
  }
  if (password && password.length < 6) {
    return NextResponse.json({ detail: "Temporary password must be at least 6 characters" }, { status: 400 });
  }

  const data: any = {};
  if (username)  data.username  = username;
  if (name)      data.name      = name;
  if (shop_id)   data.shop_id   = shop_id;
  if (shop_name) data.shop_name = shop_name;
  if (password) {
    data.password_hash = await bcrypt.hash(password, 12);
  }

  const updated = await prisma.admin.update({ where: { id: params.id }, data });
  if (password) {
    await prisma.$executeRaw`UPDATE admins SET token_version = token_version + 1, must_change_password = true WHERE id = ${updated.id}`;
  }

  // Resetting the password also lifts any active brute-force lockout, so the client
  // (or their staff, who share the login-attempt window by username) can sign in at once.
  if (password) {
    const since = new Date(Date.now() - 15 * 60 * 1000);
    await prisma.loginLog.deleteMany({
      where: { username: updated.username, status: "failed", created_at: { gte: since } },
    }).catch(() => {});
  }

  await logSuperadminAction(req, user, {
    action: password ? "client.edit_with_password_reset" : "client.edit",
    target_admin_id: updated.id,
    target_shop_id: updated.shop_id,
    target_shop_name: updated.shop_name,
    metadata: {
      before: { username: before.username, name: before.name, shop_id: before.shop_id, shop_name: before.shop_name },
      after: { username: updated.username, name: updated.name, shop_id: updated.shop_id, shop_name: updated.shop_name },
      password_reset: Boolean(password),
      temporary_password: Boolean(password),
    },
  });

  return NextResponse.json({
    id: updated.id, username: updated.username, name: updated.name,
    shop_id: updated.shop_id, shop_name: updated.shop_name,
  });
}
