import { NextRequest, NextResponse } from "next/server";
import { requireAuth, denyStaff } from "@/lib/auth";
import { waDisconnect, waConfigured } from "@/lib/waAuto";

function shopOf(req: NextRequest, user: { role: string; shop_id: string }): string {
  if (user.role === "superadmin") return req.headers.get("x-selected-shop") || "shop1";
  return user.shop_id;
}

export async function POST(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;
  const staff = denyStaff(user); if (staff) return staff;
  if (!waConfigured()) return NextResponse.json({ ok: false, state: "not_configured" });
  const result = await waDisconnect(shopOf(req, user));
  return NextResponse.json({ ok: true, ...result });
}
