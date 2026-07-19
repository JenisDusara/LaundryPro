import { NextRequest } from "next/server";

// Resolve the real client IP for rate-limiting / audit logs.
//
// The naive `x-forwarded-for`.split(",")[0] is spoofable: XFF is a client-writable header and the
// LEFTMOST value is whatever the client claims, so an attacker can rotate it to dodge a per-IP
// throttle. We instead trust the platform-injected header first (Netlify's
// `x-nf-client-connection-ip`, which the edge sets and the client cannot forge), then `x-real-ip`,
// and only fall back to the RIGHTMOST XFF entry — the hop appended by the trusted proxy — rather
// than the attacker-controlled leftmost one.
export function getClientIp(req: NextRequest): string {
  const nf = req.headers.get("x-nf-client-connection-ip");
  if (nf) return nf.trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const parts = xff.split(",").map(s => s.trim()).filter(Boolean);
    if (parts.length) return parts[parts.length - 1];
  }
  return "unknown";
}
