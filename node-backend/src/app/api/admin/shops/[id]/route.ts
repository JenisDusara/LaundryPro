import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

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
