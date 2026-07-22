import { NextRequest, NextResponse } from "next/server";
import { requireActiveAuth, denyStaff, requireWrite } from "@/lib/auth";
import { waDisconnect, waConfigured } from "@/lib/waAuto";

function shopOf(req: NextRequest, user: { role: string; shop_id: string }): string {
  if (user.role === "superadmin") return req.headers.get("x-selected-shop") || "shop1";
  return user.shop_id;
}

export async function POST(req: NextRequest) {
  const user = await requireActiveAuth(req);
  if (user instanceof NextResponse) return user;
  const staff = denyStaff(user); if (staff) return staff;
  const ro = requireWrite(user); if (ro) return ro;
  if (!waConfigured()) return NextResponse.json({ ok: false, state: "not_configured" });
  const result = await waDisconnect(shopOf(req, user));
  return NextResponse.json({ ok: true, ...result });
}
