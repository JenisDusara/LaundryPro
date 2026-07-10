import { Prisma } from "@prisma/client";
import ExcelJS from "exceljs";
import prisma, { withRetry } from "@/lib/prisma";
import { sendEmail, weeklyReportEmailHtml, WeeklyReportStats } from "@/lib/email";
import { getShopProfile } from "@/lib/settings";

export interface WeeklyReportResult {
  status: "sent" | "skipped" | "failed";
  reason?: string;
}

// Shared by the Sunday cron trigger (respects each shop's on/off toggle) and the
// admin's manual "Send now" button (force: true — always sends regardless of the
// toggle, since it's an explicit user action). Every call is recorded in
// WeeklyReportLog so the superadmin panel can show history for both paths.
export async function sendWeeklyReportForShop(
  shopId: string,
  shopNameFallback: string,
  start: string,
  end: string,
  opts?: { force?: boolean }
): Promise<WeeklyReportResult> {
  const profile = await getShopProfile(shopId);
  if (!profile.email) {
    return logResult(shopId, start, end, { status: "skipped", reason: "No shop email configured" });
  }
  if (!opts?.force && !profile.weekly_report_enabled) {
    return logResult(shopId, start, end, { status: "skipped", reason: "Weekly report disabled for this shop" });
  }

  try {
    const entries = await withRetry(() => prisma.laundryEntry.findMany({
      where: { shop_id: shopId, entry_date: { gte: start, lte: end } },
      include: { customer: true, items: true },
      orderBy: { entry_date: "asc" },
    }));

    const newCustomers = await withRetry(() => prisma.customer.count({
      where: { shop_id: shopId, created_at: { gte: new Date(`${start}T00:00:00+05:30`), lte: new Date(`${end}T23:59:59+05:30`) } },
    }));

    const expenseAgg = await withRetry(() => prisma.expense.aggregate({
      where: { shop_id: shopId, date: { gte: start, lte: end } },
      _sum: { amount: true },
    }));

    const dueRows = await withRetry(() => prisma.$queryRaw<{ outstanding: number }[]>`
      SELECT COALESCE(e.billed, 0)::float8 - COALESCE(pm.paid, 0)::float8 AS outstanding
      FROM customers c
      LEFT JOIN (SELECT customer_id, SUM(total_amount) AS billed FROM laundry_entries GROUP BY customer_id) e
             ON e.customer_id = c.id
      LEFT JOIN (SELECT customer_id, SUM(amount) AS paid FROM payments GROUP BY customer_id) pm
             ON pm.customer_id = c.id
      WHERE c.shop_id = ${shopId}
    `);
    const totalDue = dueRows.reduce((s, r) => s + Math.max(0, Number(r.outstanding)), 0);

    const totalRevenue = entries.reduce((s, e) => s + Number(e.total_amount), 0);
    const deliveredCount = entries.filter(e => e.delivery_status === "delivered").length;
    const pendingCount = entries.filter(e => e.delivery_status !== "delivered").length;

    const svcMap = new Map<string, { qty: number; revenue: number }>();
    entries.forEach(e => e.items.forEach(item => {
      const ex = svcMap.get(item.service_name) || { qty: 0, revenue: 0 };
      ex.qty += item.quantity;
      ex.revenue += Number(item.subtotal);
      svcMap.set(item.service_name, ex);
    }));
    const topServices = [...svcMap.entries()]
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 10)
      .map(([name, d]) => ({ name, ...d }));

    const stats: WeeklyReportStats = {
      start, end, totalRevenue,
      totalEntries: entries.length,
      deliveredCount, pendingCount, newCustomers,
      totalExpenses: Number(expenseAgg._sum.amount || 0),
      totalDue: Math.round(totalDue),
      topServices,
    };

    const buffer = await buildWeeklyWorkbook(profile.shop_name || shopNameFallback, stats, entries);
    const shopName = profile.shop_name || shopNameFallback;

    await sendEmail(
      profile.email,
      `${shopName} — Weekly Report (${start} to ${end})`,
      weeklyReportEmailHtml(shopName, stats),
      [{ filename: `Weekly-Report-${start}-to-${end}.xlsx`, content: buffer }]
    );
    return logResult(shopId, start, end, { status: "sent" });
  } catch (err: any) {
    return logResult(shopId, start, end, { status: "failed", reason: err?.message || String(err) });
  }
}

async function logResult(shopId: string, start: string, end: string, result: WeeklyReportResult): Promise<WeeklyReportResult> {
  await withRetry(() => prisma.weeklyReportLog.create({
    data: { shop_id: shopId, week_start: start, week_end: end, status: result.status, reason: result.reason || "" },
  }));
  return result;
}

async function buildWeeklyWorkbook(
  shopName: string,
  stats: WeeklyReportStats,
  entries: Prisma.LaundryEntryGetPayload<{ include: { customer: true; items: true } }>[]
) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "LaundryPro";
  wb.created = new Date();

  const wsSummary = wb.addWorksheet("Summary");
  wsSummary.columns = [{ key: "label", width: 26 }, { key: "value", width: 20 }];
  wsSummary.addRow([`${shopName} — Weekly Report`, ""]).getCell(1).font = { bold: true, size: 14, color: { argb: "FF1E3A8A" } };
  wsSummary.addRow([`${stats.start} to ${stats.end}`, ""]);
  wsSummary.addRow([]);
  [
    ["Total Revenue (₹)", stats.totalRevenue],
    ["Total Entries", stats.totalEntries],
    ["Delivered", stats.deliveredCount],
    ["Pending", stats.pendingCount],
    ["New Customers", stats.newCustomers],
    ["Expenses (₹)", stats.totalExpenses],
    ["Outstanding Udhaar (₹)", stats.totalDue],
  ].forEach(([label, value]) => wsSummary.addRow([label, value]));

  wsSummary.addRow([]);
  wsSummary.addRow(["Service", "Qty", "Revenue (₹)"]).eachCell(c => { c.font = { bold: true }; });
  stats.topServices.forEach(s => wsSummary.addRow([s.name, s.qty, s.revenue]));

  const wsEntries = wb.addWorksheet("Entries");
  wsEntries.columns = [
    { header: "Date", key: "date", width: 14 },
    { header: "Customer", key: "customer", width: 22 },
    { header: "Phone", key: "phone", width: 14 },
    { header: "Service", key: "service", width: 22 },
    { header: "Qty", key: "qty", width: 8 },
    { header: "Amount (₹)", key: "amount", width: 14 },
    { header: "Status", key: "status", width: 14 },
  ];
  wsEntries.getRow(1).font = { bold: true };
  entries.forEach(e => e.items.forEach(item => {
    wsEntries.addRow({
      date: e.entry_date,
      customer: e.customer?.name || "",
      phone: e.customer?.phone || "",
      service: item.service_name,
      qty: item.quantity,
      amount: Number(item.subtotal),
      status: e.delivery_status,
    });
  }));

  return Buffer.from(await wb.xlsx.writeBuffer());
}
