import { NextRequest, NextResponse } from "next/server";
import prisma, { withRetry } from "@/lib/prisma";
import { lastWeekRange } from "@/lib/dates";
import { sendWeeklyReportForShop } from "@/lib/weeklyReport";

// Triggered by a Netlify scheduled function every Sunday morning (IST). Not user-facing —
// authenticated with a shared secret instead of a JWT since there is no logged-in user.
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const { start, end } = lastWeekRange();
  const shops = await withRetry(() => prisma.admin.findMany({
    where: { role: "admin", is_active: true },
    select: { shop_id: true, shop_name: true },
    distinct: ["shop_id"],
  }));

  const results: { shop_id: string; status: string; reason?: string }[] = [];
  for (const shop of shops) {
    const r = await sendWeeklyReportForShop(shop.shop_id, shop.shop_name, start, end);
    results.push({ shop_id: shop.shop_id, ...r });
  }

  return NextResponse.json({ start, end, results });
}
