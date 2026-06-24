import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;
  if (user.role !== "superadmin") return NextResponse.json({ detail: "Forbidden" }, { status: 403 });

  const body = await req.json();

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

    await prisma.$executeRaw`UPDATE admins SET plan_type = ${plan}, expires_at = ${newExpiry}, is_active = true WHERE id = ${params.id}`;
    const shopRow = await prisma.$queryRaw<{ shop_id: string }[]>`SELECT shop_id FROM admins WHERE id = ${params.id}`;
    if (shopRow[0]) {
      await prisma.$executeRaw`UPDATE admins SET is_active = true WHERE shop_id = ${shopRow[0].shop_id} AND role = 'staff'`;
    }
    return NextResponse.json({ id: params.id, plan_type: plan, expires_at: newExpiry, is_active: true });
  }

  // Toggle is_active
  const val = Boolean(body.is_active);
  await prisma.$executeRaw`UPDATE admins SET is_active = ${val} WHERE id = ${params.id}`;
  const rows = await prisma.$queryRaw<{ is_active: boolean }[]>`SELECT is_active FROM admins WHERE id = ${params.id}`;
  return NextResponse.json({ id: params.id, is_active: rows[0]?.is_active ?? val });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;
  if (user.role !== "superadmin") return NextResponse.json({ detail: "Forbidden" }, { status: 403 });

  const { username, password, name, shop_id, shop_name } = await req.json();

  // Check username conflict (ignore self)
  if (username) {
    const conflict = await prisma.admin.findFirst({ where: { username, NOT: { id: params.id } } });
    if (conflict) return NextResponse.json({ detail: "Username already taken" }, { status: 400 });
  }

  const data: any = {};
  if (username)  data.username  = username;
  if (name)      data.name      = name;
  if (shop_id)   data.shop_id   = shop_id;
  if (shop_name) data.shop_name = shop_name;
  if (password)  data.password_hash = await bcrypt.hash(password, 12);

  const updated = await prisma.admin.update({ where: { id: params.id }, data });
  return NextResponse.json({
    id: updated.id, username: updated.username, name: updated.name,
    shop_id: updated.shop_id, shop_name: updated.shop_name,
  });
}
