import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;
  if (user.role !== "superadmin") return NextResponse.json({ detail: "Forbidden" }, { status: 403 });

  const clients = await prisma.admin.findMany({
    where: { role: "admin" },
    orderBy: { created_at: "asc" },
  });
  return NextResponse.json(clients.map(c => ({
    id: c.id,
    username: c.username,
    name: c.name,
    shop_id: c.shop_id,
    shop_name: c.shop_name,
    created_at: c.created_at,
  })));
}

export async function POST(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;
  if (user.role !== "superadmin") return NextResponse.json({ detail: "Forbidden" }, { status: 403 });

  const { username, password, name, shop_id, shop_name } = await req.json();
  if (!username || !password || !shop_id || !shop_name) {
    return NextResponse.json({ detail: "username, password, shop_id, and shop_name are required" }, { status: 400 });
  }

  const existing = await prisma.admin.findUnique({ where: { username } });
  if (existing) return NextResponse.json({ detail: "Username already taken" }, { status: 400 });

  const hash = await bcrypt.hash(password, 12);
  const client = await prisma.admin.create({
    data: { username, password_hash: hash, name: name || username, shop_id, shop_name, role: "admin" },
  });
  return NextResponse.json({
    id: client.id, username: client.username, name: client.name,
    shop_id: client.shop_id, shop_name: client.shop_name,
  }, { status: 201 });
}
