import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireWrite, denyStaff } from "@/lib/auth";
import { getShopProfile, upsertShopProfile } from "@/lib/settings";

// Resolve which shop the settings request targets.
// Normal admins are locked to their own shop; a superadmin targets the shop
// picked via the x-selected-shop header (frontend sends it from `sa_shop_id`).
function resolveShopId(user: { role: string; shop_id: string }, req: NextRequest): string | null {
  if (user.role === "superadmin") {
    return req.headers.get("x-selected-shop") || null;
  }
  return user.shop_id;
}

export async function GET(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;
  const shopId = resolveShopId(user, req);
  if (!shopId) return NextResponse.json({ detail: "Select a shop first" }, { status: 400 });
  return NextResponse.json(await getShopProfile(shopId));
}

export async function PUT(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;
  const staff = denyStaff(user); if (staff) return staff;
  const ro = requireWrite(user); if (ro) return ro;
  const shopId = resolveShopId(user, req);
  if (!shopId) return NextResponse.json({ detail: "Select a shop first" }, { status: 400 });
  const data = await req.json();
  return NextResponse.json(await upsertShopProfile(shopId, data));
}
