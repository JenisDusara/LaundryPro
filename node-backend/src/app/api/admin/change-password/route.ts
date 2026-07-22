import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma, { withRetry } from "@/lib/prisma";
import { requireActiveAuth, signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await requireActiveAuth(req);
  if (user instanceof NextResponse) return user;
  const { old_password, new_password } = await req.json().catch(() => ({}));
  // Match the 6-char minimum enforced for temporary passwords — this endpoint previously accepted an
  // empty or 1-character password.
  if (!old_password || typeof new_password !== "string" || new_password.length < 6) {
    return NextResponse.json({ detail: "New password must be at least 6 characters" }, { status: 400 });
  }
  const admin = await prisma.admin.findUnique({ where: { id: user.sub } });
  if (!admin) return NextResponse.json({ detail: "Not found" }, { status: 404 });
  const valid = await bcrypt.compare(old_password, admin.password_hash);
  if (!valid) return NextResponse.json({ detail: "Wrong password" }, { status: 400 });
  const hash = await bcrypt.hash(new_password, 12);
  await prisma.admin.update({ where: { id: user.sub }, data: { password_hash: hash } });
  const versionRows = await prisma.$queryRaw<{ token_version: number }[]>`
    UPDATE admins SET token_version = token_version + 1, must_change_password = false WHERE id = ${user.sub}
    RETURNING token_version
  `;
  const access_token = signToken({
    sub: user.sub,
    username: user.username,
    shop_id: user.shop_id,
    shop_name: user.shop_name,
    role: user.role,
    ...(user.expires_at ? { expires_at: user.expires_at } : {}),
    token_version: Number(versionRows[0]?.token_version ?? 0),
    must_change_password: false,
  });
  return NextResponse.json({ message: "Password changed", access_token });
}
