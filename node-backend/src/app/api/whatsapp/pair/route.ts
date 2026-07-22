import { NextRequest, NextResponse } from "next/server";
import { requireActiveAuth, denyStaff, requireWrite } from "@/lib/auth";
import { waPair, waConfigured } from "@/lib/waAuto";

function shopOf(req: NextRequest, user: { role: string; shop_id: string }): string {
  if (user.role === "superadmin") return req.headers.get("x-selected-shop") || "shop1";
  return user.shop_id;
}

// Link this shop's WhatsApp via an 8-char pairing code (single-phone friendly) instead of a QR.
export async function POST(req: NextRequest) {
  const user = await requireActiveAuth(req);
  if (user instanceof NextResponse) return user;
  const staff = denyStaff(user); if (staff) return staff;
  const ro = requireWrite(user); if (ro) return ro;
  if (!waConfigured()) return NextResponse.json({ state: "not_configured" });
  const { phone } = await req.json().catch(() => ({}));
  if (!phone) return NextResponse.json({ detail: "phone required" }, { status: 400 });
  const result = await waPair(shopOf(req, user), String(phone));
  return NextResponse.json(result);
}
