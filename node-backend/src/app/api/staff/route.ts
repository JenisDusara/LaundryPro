import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { requireAuth, requireWrite } from "@/lib/auth";

// GET — list all staff for the logged-in admin's shop
export async function GET(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;
  if (user.role !== "admin") return NextResponse.json({ detail: "Forbidden" }, { status: 403 });

  const staff = await prisma.$queryRaw<{
    id: string; username: string; name: string; is_active: boolean; created_at: Date;
  }[]>`
    SELECT id, username, name, is_active, created_at
    FROM admins
    WHERE role = 'staff' AND shop_id = ${user.shop_id}
    ORDER BY created_at ASC
  `;

  return NextResponse.json(staff.map(s => ({
    id: s.id, username: s.username, name: s.name,
    is_active: s.is_active, created_at: s.created_at,
  })));
}

// POST — create new staff for admin's shop
export async function POST(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;
  if (user.role !== "admin") return NextResponse.json({ detail: "Forbidden" }, { status: 403 });
  const ro = requireWrite(user); if (ro) return ro;

  const { username, password, name } = await req.json();
  if (!username || !password) {
    return NextResponse.json({ detail: "Username and password are required" }, { status: 400 });
  }

  const existing = await prisma.admin.findUnique({ where: { username } });
  if (existing) return NextResponse.json({ detail: "Username already taken" }, { status: 400 });

  const hash = await bcrypt.hash(password, 12);
  const staff = await prisma.admin.create({
    data: {
      username,
      password_hash: hash,
      name: name || username,
      shop_id: user.shop_id,
      shop_name: user.shop_name,
      role: "staff",
    },
  });

  return NextResponse.json({
    id: staff.id, username: staff.username, name: staff.name,
    is_active: staff.is_active, created_at: staff.created_at,
  }, { status: 201 });
}
