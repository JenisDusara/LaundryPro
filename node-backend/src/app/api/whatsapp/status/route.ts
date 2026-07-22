import { NextRequest, NextResponse } from "next/server";
import { requireActiveAuth } from "@/lib/auth";
import { waStatus, waConfigured } from "@/lib/waAuto";

function shopOf(req: NextRequest, user: { role: string; shop_id: string }): string {
  if (user.role === "superadmin") return req.headers.get("x-selected-shop") || "shop1";
  return user.shop_id;
}

export async function GET(req: NextRequest) {
  const user = await requireActiveAuth(req);
  if (user instanceof NextResponse) return user;
  if (!waConfigured()) return NextResponse.json({ state: "not_configured" });
  const status = await waStatus(shopOf(req, user));
  return NextResponse.json(status);
}
