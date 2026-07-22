import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { ensureTables, sql } from "@/lib/db";

export const ADMIN_COOKIE = "mkt_admin";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

/** Deterministic session token derived from the admin password. */
export function expectedToken(): string {
  const pw = process.env.ADMIN_PASSWORD || "";
  const secret = process.env.ADMIN_SESSION_SECRET || pw;
  return crypto
    .createHmac("sha256", secret)
    .update(`mkt-admin-session-v2:${pw}`)
    .digest("hex");
}

export function verifyPassword(pw: string): boolean {
  const real = process.env.ADMIN_PASSWORD || "";
  if (!real || !pw) return false;
  // constant-time compare
  const a = Buffer.from(pw);
  const b = Buffer.from(real);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function adminCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "strict" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  };
}

/** True when the current request carries a valid admin session cookie. */
export function isAuthed(): boolean {
  if (!process.env.ADMIN_PASSWORD) return false;
  const token = cookies().get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  const expected = expectedToken();
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return fwd || req.headers.get("x-real-ip") || "unknown";
}

export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  return origin === new URL(req.url).origin;
}

export function requireAdmin(req: Request): NextResponse | null {
  if (!isAuthed()) return NextResponse.json({ ok: false }, { status: 401 });
  if (!sameOrigin(req)) return NextResponse.json({ ok: false, error: "Bad origin" }, { status: 403 });
  return null;
}

export async function adminLoginLimited(ip: string): Promise<boolean> {
  try {
    await ensureTables();
    const rows = await sql`
      SELECT COUNT(*)::int AS count
      FROM marketing_admin_login_events
      WHERE ip = ${ip}
        AND ok = false
        AND created_at >= now() - interval '15 minutes'
    `;
    return Number(rows[0]?.count || 0) >= 8;
  } catch (e) {
    console.error("Admin login rate-limit unavailable:", e instanceof Error ? e.message : e);
    return false;
  }
}

export async function logAdminLogin(ip: string, ok: boolean): Promise<void> {
  try {
    await ensureTables();
    await sql`
      INSERT INTO marketing_admin_login_events (ip, ok)
      VALUES (${ip}, ${ok})
    `;
  } catch (e) {
    console.error("Admin login event not recorded:", e instanceof Error ? e.message : e);
  }
}
