import { NextRequest, NextResponse } from "next/server";
import prisma, { withRetry } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;
  const admin = await withRetry(() => prisma.admin.findUnique({ where: { id: user.sub } }));
  if (!admin) return NextResponse.json({ detail: "Not found" }, { status: 404 });
  // Re-check is_active on every app load so an account disabled mid-session (while its
  // 7-day token is still valid) gets logged out on the next load/refresh. The 401 makes
  // the api client clear the token and redirect to /login.
  if (admin.is_active === false) {
    return NextResponse.json({ detail: "Account disabled" }, { status: 401 });
  }
  return NextResponse.json({ id: admin.id, username: admin.username, name: admin.name, role: admin.role, shop_id: admin.shop_id, shop_name: admin.shop_name, read_only: user.read_only ?? false, expires_at: user.expires_at ?? null });
}
