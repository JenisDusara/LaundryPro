import { NextRequest, NextResponse } from "next/server";
import prisma, { withRetry } from "@/lib/prisma";
import { requireAuth, signToken } from "@/lib/auth";

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

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
  const versionRows = await prisma.$queryRaw<{ token_version: number }[]>`SELECT token_version FROM admins WHERE id = ${admin.id}`;
  const tokenVersion = Number(versionRows[0]?.token_version ?? 0);
  if (user.token_version !== undefined && user.token_version !== tokenVersion) {
    return NextResponse.json({ detail: "Session expired" }, { status: 401 });
  }
  const mustChangeRows = await prisma.$queryRaw<{ must_change_password: boolean }[]>`
    SELECT must_change_password FROM admins WHERE id = ${admin.id}
  `.catch(() => [{ must_change_password: false }]);
  const mustChangePassword = Boolean(mustChangeRows[0]?.must_change_password);

  // Resolve the LIVE subscription expiry from the DB, not the token. The token bakes in
  // whatever expiry was current at login, so after a superadmin renews the plan the token
  // is stale — without this the owner would stay stuck in read-only until they log out
  // and back in. Staff inherit their shop admin's expiry.
  let expiresAt: Date | null = admin.expires_at ?? null;
  if (admin.role === "staff" && !expiresAt) {
    const shopAdmin = await withRetry(() => prisma.admin.findFirst({
      where: { shop_id: admin.shop_id, role: "admin" },
      select: { expires_at: true },
    }));
    expiresAt = shopAdmin?.expires_at ?? null;
  }

  // Compute read_only from the live expiry (0–3 day grace period after expiry).
  let read_only = false;
  if (expiresAt && admin.role !== "superadmin") {
    const exp = new Date(expiresAt).getTime();
    const now = Date.now();
    read_only = now > exp && now <= exp + THREE_DAYS_MS;
  }

  // If the token's expiry no longer matches the DB (e.g. the plan was just renewed),
  // mint a fresh token so the write-blocking middleware and requireWrite guards pick up
  // the new expiry immediately — no manual re-login needed. The client stores this token.
  const liveIso = expiresAt ? new Date(expiresAt).toISOString() : undefined;
  let refreshed: string | undefined;
  if (
    user.token_version === undefined ||
    user.must_change_password !== mustChangePassword ||
    (admin.role !== "superadmin" && liveIso !== user.expires_at)
  ) {
    refreshed = signToken({
      sub: admin.id, username: admin.username,
      shop_id: admin.shop_id, shop_name: admin.shop_name, role: admin.role,
      token_version: tokenVersion,
      must_change_password: mustChangePassword,
      ...(liveIso ? { expires_at: liveIso } : {}),
    });
  }

  return NextResponse.json({
    id: admin.id, username: admin.username, name: admin.name, role: admin.role,
    shop_id: admin.shop_id, shop_name: admin.shop_name,
    read_only, expires_at: liveIso ?? null,
    must_change_password: mustChangePassword,
    ...(refreshed ? { access_token: refreshed } : {}),
  });
}
