import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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
  token_version?: number;
  must_change_password?: boolean;
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

export async function requireActiveAuth(req: NextRequest): Promise<TokenPayload | NextResponse> {
  const payload = requireAuth(req);
  if (payload instanceof NextResponse) return payload;

  type LiveAdminRow = {
    id: string;
    username: string;
    shop_id: string;
    shop_name: string;
    role: string;
    is_active: boolean;
    expires_at: Date | null;
    token_version: number;
    must_change_password: boolean;
  };

  let tokenVersionAvailable = true;
  let rows: LiveAdminRow[];
  try {
    rows = await prisma.$queryRaw<LiveAdminRow[]>`
      SELECT id, username, shop_id, shop_name, role, is_active, expires_at, token_version, must_change_password
      FROM admins
      WHERE id = ${payload.sub}
      LIMIT 1
    `;
  } catch (e: any) {
    const msg = String(e?.message || "");
    if (!msg.includes("token_version") && !msg.includes("must_change_password")) throw e;
    tokenVersionAvailable = false;
    rows = await prisma.$queryRaw<LiveAdminRow[]>`
      SELECT id, username, shop_id, shop_name, role, is_active, expires_at, 0::int AS token_version, false AS must_change_password
      FROM admins
      WHERE id = ${payload.sub}
      LIMIT 1
    `;
  }
  const live = rows[0];
  if (!live) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (live.is_active === false) return NextResponse.json({ detail: "Account disabled" }, { status: 401 });
  if (tokenVersionAvailable && (payload.token_version === undefined || Number(payload.token_version) !== Number(live.token_version || 0))) {
    return NextResponse.json({ detail: "Session expired" }, { status: 401 });
  }

  payload.username = live.username;
  payload.shop_id = live.shop_id;
  payload.shop_name = live.shop_name;
  payload.role = live.role;
  payload.token_version = Number(live.token_version || 0);
  payload.must_change_password = Boolean(live.must_change_password);

  const pathname = new URL(req.url).pathname;
  if (payload.must_change_password && pathname !== "/api/admin/change-password") {
    return NextResponse.json({ detail: "Password change required" }, { status: 403 });
  }

  let expiresAt = live.expires_at;
  if (live.role === "staff" && !expiresAt) {
    const adminRows = await prisma.$queryRaw<{ expires_at: Date | null }[]>`
      SELECT expires_at FROM admins WHERE shop_id = ${live.shop_id} AND role = 'admin' LIMIT 1
    `;
    expiresAt = adminRows[0]?.expires_at ?? null;
  }

  if (expiresAt && live.role !== "superadmin") {
    const expiry = new Date(expiresAt).getTime();
    const now = Date.now();
    if (now > expiry + THREE_DAYS_MS) {
      await prisma.$executeRaw`
        UPDATE admins SET is_active = false, token_version = token_version + 1
        WHERE shop_id = ${live.shop_id} AND role IN ('admin','staff')
      `.catch(() => {});
      return NextResponse.json({ detail: "Subscription expired. Contact administrator to renew." }, { status: 403 });
    }
    payload.expires_at = new Date(expiresAt).toISOString();
    payload.read_only = now > expiry && now <= expiry + THREE_DAYS_MS;
  } else {
    payload.expires_at = undefined;
    payload.read_only = false;
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
