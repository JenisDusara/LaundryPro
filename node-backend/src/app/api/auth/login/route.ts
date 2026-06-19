import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma, { withRetry } from "@/lib/prisma";
import { signToken } from "@/lib/auth";

function getIp(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  const { username, password } = await req.json().catch(() => ({}));
  const ip = getIp(req);

  try {
    const admin = await withRetry(() => prisma.admin.findUnique({ where: { username } }));

    if (!admin) {
      await withRetry(() => prisma.loginLog.create({
        data: { username: username || "", name: "", shop_id: "", shop_name: "", role: "", status: "failed", reason: "User not found", ip },
      })).catch(() => {});
      return NextResponse.json({ detail: "Invalid credentials" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, admin.password_hash);

    if (!valid) {
      await withRetry(() => prisma.loginLog.create({
        data: { username: admin.username, name: admin.name, shop_id: admin.shop_id, shop_name: admin.shop_name, role: admin.role, status: "failed", reason: "Wrong password", ip },
      })).catch(() => {});
      return NextResponse.json({ detail: "Invalid credentials" }, { status: 401 });
    }

    const activeRow = await prisma.$queryRaw<{ is_active: boolean }[]>`SELECT is_active FROM admins WHERE id = ${admin.id}`;
    if (activeRow[0]?.is_active === false) {
      await withRetry(() => prisma.loginLog.create({
        data: { username: admin.username, name: admin.name, shop_id: admin.shop_id, shop_name: admin.shop_name, role: admin.role, status: "failed", reason: "Account disabled", ip },
      })).catch(() => {});
      return NextResponse.json({ detail: "Your account has been disabled. Contact the administrator." }, { status: 403 });
    }

    await withRetry(() => prisma.loginLog.create({
      data: { username: admin.username, name: admin.name, shop_id: admin.shop_id, shop_name: admin.shop_name, role: admin.role, status: "success", reason: "", ip },
    })).catch(() => {});

    const token = signToken({
      sub:       admin.id,
      username:  admin.username,
      shop_id:   admin.shop_id,
      shop_name: admin.shop_name,
      role:      admin.role,
    });
    return NextResponse.json({ access_token: token, token_type: "bearer" });
  } catch {
    return NextResponse.json({ detail: "Server error" }, { status: 500 });
  }
}
