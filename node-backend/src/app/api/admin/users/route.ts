import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;
  const admins = await prisma.admin.findMany({ orderBy: { created_at: "asc" } });
  return NextResponse.json(admins.map(a => ({ id: a.id, username: a.username, name: a.name, created_at: a.created_at })));
}

export async function POST(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;
  const { username, password, name } = await req.json();
  const existing = await prisma.admin.findUnique({ where: { username } });
  if (existing) return NextResponse.json({ detail: "Username taken" }, { status: 400 });
  const hash = await bcrypt.hash(password, 12);
  const admin = await prisma.admin.create({ data: { username, password_hash: hash, name: name || username } });
  return NextResponse.json({ id: admin.id, username: admin.username }, { status: 201 });
}
