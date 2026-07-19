import { NextRequest, NextResponse } from "next/server";
import prisma, { withRetry } from "@/lib/prisma";
import { lastWeekRange } from "@/lib/dates";
import { sendWeeklyReportForShop } from "@/lib/weeklyReport";

// Sends the previous week's report for every active shop. Not user-facing — there is no
// logged-in user, so it authenticates with the CRON_SECRET shared secret instead of a JWT.
async function runWeeklyReport() {
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

// Vercel Cron Jobs (see vercel.json) hit this route with a GET and, when CRON_SECRET is set as an
// env var, send it as `Authorization: Bearer <CRON_SECRET>`.
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }
  return runWeeklyReport();
}

// Kept for manual triggers / other schedulers that POST with the x-cron-secret header.
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }
  return runWeeklyReport();
}
