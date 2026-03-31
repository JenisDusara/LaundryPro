import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma, { withRetry } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;
  const { old_password, new_password } = await req.json();
  const admin = await prisma.admin.findUnique({ where: { id: user.sub } });
  if (!admin) return NextResponse.json({ detail: "Not found" }, { status: 404 });
  const valid = await bcrypt.compare(old_password, admin.password_hash);
  if (!valid) return NextResponse.json({ detail: "Wrong password" }, { status: 400 });
  const hash = await bcrypt.hash(new_password, 12);
  await prisma.admin.update({ where: { id: user.sub }, data: { password_hash: hash } });
  return NextResponse.json({ message: "Password changed" });
}
