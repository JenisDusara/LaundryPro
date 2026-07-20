import { cookies } from "next/headers";
import crypto from "crypto";

export const ADMIN_COOKIE = "mkt_admin";

/** Deterministic session token derived from the admin password. */
export function expectedToken(): string {
  const pw = process.env.ADMIN_PASSWORD || "";
  return crypto
    .createHmac("sha256", pw)
    .update("mkt-admin-session-v1")
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
