import { NextRequest, NextResponse } from "next/server";

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const [, payload] = token.split(".");
    const padded = payload.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only intercept API write requests
  if (!pathname.startsWith("/api/")) return NextResponse.next();
  if (!WRITE_METHODS.has(req.method)) return NextResponse.next();

  // Skip public / superadmin routes
  if (pathname.startsWith("/api/auth/login")) return NextResponse.next();
  if (pathname.startsWith("/api/admin/")) return NextResponse.next();

  // Decode JWT (no verification — routes do that; we just need expires_at)
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return NextResponse.next();

  const payload = decodeJwtPayload(auth.slice(7));
  if (!payload?.expires_at || payload.role === "superadmin") return NextResponse.next();

  const expiry = new Date(payload.expires_at as string).getTime();
  const now = Date.now();

  if (now > expiry && now <= expiry + THREE_DAYS_MS) {
    return NextResponse.json(
      { detail: "Subscription expired. You can view data but cannot make changes. Renew your plan to continue." },
      { status: 403 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
