import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";

// Resolve the JWT signing secret lazily (at request time, not module import) so a
// missing SECRET_KEY never crashes `next build` while it collects route data. In
// production the check still fails fast — on the first token sign/verify — because
// the dev fallback below is public knowledge and would allow token forgery.
function getSecret(): string {
  const s = process.env.SECRET_KEY;
  if (s) return s;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SECRET_KEY environment variable must be set in production");
  }
  return "laundrypro-secret";
}

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

export interface TokenPayload {
  sub: string;
  username: string;
  shop_id: string;
  shop_name: string;
  role: string;
  expires_at?: string; // ISO string — shop subscription expiry
  read_only?: boolean; // true when in 3-day grace period after expiry
}

export function signToken(payload: object): string {
  return jwt.sign(payload, getSecret(), { expiresIn: "7d" });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, getSecret()) as TokenPayload;
  } catch {
    return null;
  }
}

export function getTokenFromRequest(req: NextRequest): string | null {
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  const url = new URL(req.url);
  return url.searchParams.get("token");
}

export function requireAuth(req: NextRequest): TokenPayload | NextResponse {
  const token = getTokenFromRequest(req);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  // Compute read_only dynamically so it's always accurate regardless of when token was issued
  if (payload.expires_at && payload.role !== "superadmin") {
    const expiry = new Date(payload.expires_at).getTime();
    const now = Date.now();
    payload.read_only = now > expiry && now <= expiry + THREE_DAYS_MS;
  }
  return payload;
}

// Returns shop_id filter for Prisma queries.
// Superadmin with an x-selected-shop header filters to that shop; otherwise sees all.
export function shopFilter(user: TokenPayload, req?: NextRequest): { shop_id?: string } {
  if (user.role !== "superadmin") return { shop_id: user.shop_id };
  if (req) {
    const selected = req.headers.get("x-selected-shop");
    if (selected) return { shop_id: selected };
  }
  return {};
}

// Resolves which shop a newly-created record should belong to.
// Superadmin writes are attributed to the shop selected in the picker
// (x-selected-shop header); if none is selected, falls back to `fallback`.
// Regular users always write to their own shop — the header is ignored for
// them, so it can never be used to plant data in another shop.
export function writeShopId(user: TokenPayload, req: NextRequest, fallback = "shop1"): string {
  if (user.role !== "superadmin") return user.shop_id;
  return req.headers.get("x-selected-shop") || fallback;
}

// Blocks write operations while a shop is in the post-expiry grace period.
// Returns a 403 response to short-circuit the handler, or null to proceed.
export function requireWrite(user: TokenPayload): NextResponse | null {
  if (user.read_only) {
    return NextResponse.json(
      { detail: "Your subscription has expired. Access is read-only during the grace period." },
      { status: 403 }
    );
  }
  return null;
}

// Blocks staff-role users from admin-only areas (reports, accounting, labour, expenses).
// Returns a 403 response to short-circuit the handler, or null to proceed.
export function denyStaff(user: TokenPayload): NextResponse | null {
  if (user.role === "staff") {
    return NextResponse.json({ detail: "Forbidden" }, { status: 403 });
  }
  return null;
}
