import { NextRequest, NextResponse } from "next/server";
import { requireActiveAuth, denyStaff, requireWrite } from "@/lib/auth";
import { waConnect, waConfigured } from "@/lib/waAuto";

function shopOf(req: NextRequest, user: { role: string; shop_id: string }): string {
  if (user.role === "superadmin") return req.headers.get("x-selected-shop") || "shop1";
  return user.shop_id;
}

// Starts/resumes linking this shop's WhatsApp number. The QR is returned here (and also
// via GET /api/whatsapp/status) — the UI polls status until state === "open".
export async function POST(req: NextRequest) {
  const user = await requireActiveAuth(req);
  if (user instanceof NextResponse) return user;
  const staff = denyStaff(user); if (staff) return staff;
  const ro = requireWrite(user); if (ro) return ro;
  if (!waConfigured()) return NextResponse.json({ state: "not_configured" });
  const result = await waConnect(shopOf(req, user));
  return NextResponse.json(result);
}
