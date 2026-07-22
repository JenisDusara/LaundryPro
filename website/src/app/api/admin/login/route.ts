import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  adminCookieOptions,
  adminLoginLimited,
  clientIp,
  expectedToken,
  logAdminLogin,
  sameOrigin,
  verifyPassword,
} from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!sameOrigin(req)) {
    return NextResponse.json({ ok: false, error: "Bad origin" }, { status: 403 });
  }
  const ip = clientIp(req);
  if (await adminLoginLimited(ip)) {
    return NextResponse.json({ ok: false, error: "Too many attempts" }, { status: 429 });
  }
  const { password } = await req.json().catch(() => ({ password: "" }));
  if (!verifyPassword(password || "")) {
    await logAdminLogin(ip, false);
    return NextResponse.json({ ok: false, error: "Wrong password" }, { status: 401 });
  }
  await logAdminLogin(ip, true);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, expectedToken(), adminCookieOptions());
  return res;
}
