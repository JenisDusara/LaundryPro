import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireWrite } from "@/lib/auth";
import { lastWeekRange } from "@/lib/dates";
import { sendWeeklyReportForShop } from "@/lib/weeklyReport";

// Admin-triggered "Send now" — always sends regardless of the shop's automatic
// weekly-report toggle, since this is an explicit manual action.
export async function POST(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;
  const ro = requireWrite(user); if (ro) return ro;

  // Weekly report is a superadmin-managed feature — regular shop admins (and staff) still
  // RECEIVE the Sunday email, but cannot trigger/manage it themselves.
  if (user.role !== "superadmin") {
    return NextResponse.json({ detail: "Only superadmin can send weekly reports" }, { status: 403 });
  }

  const shopId = req.headers.get("x-selected-shop");
  if (!shopId) return NextResponse.json({ detail: "Select a shop first" }, { status: 400 });

  const { start, end } = lastWeekRange();
  const result = await sendWeeklyReportForShop(shopId, user.shop_name, start, end, { force: true });

  if (result.status === "sent") return NextResponse.json({ message: "Weekly report sent", start, end });
  return NextResponse.json({ detail: result.reason || "Could not send report" }, { status: result.status === "failed" ? 500 : 400 });
}
