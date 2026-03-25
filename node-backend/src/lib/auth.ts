import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";

const SECRET = process.env.SECRET_KEY || "laundrypro-secret";

export function signToken(payload: object): string {
  return jwt.sign(payload, SECRET, { expiresIn: "24h" });
}

export function verifyToken(token: string): { sub: string; username: string } | null {
  try {
    return jwt.verify(token, SECRET) as { sub: string; username: string };
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

export function requireAuth(req: NextRequest): { sub: string; username: string } | NextResponse {
  const token = getTokenFromRequest(req);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  return payload;
}
