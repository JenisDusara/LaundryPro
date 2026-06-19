import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";

const SECRET = process.env.SECRET_KEY || "laundrypro-secret";

export interface TokenPayload {
  sub: string;
  username: string;
  shop_id: string;
  shop_name: string;
  role: string;  // "superadmin" | "admin"
}

export function signToken(payload: object): string {
  return jwt.sign(payload, SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, SECRET) as TokenPayload;
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
