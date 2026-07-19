import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth, shopFilter, denyStaff } from "@/lib/auth";
import { monthRange } from "@/lib/dates";
import ExcelJS from "exceljs";

export async function GET(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;
  const staff = denyStaff(user); if (staff) return staff;

  const p     = new URL(req.url).searchParams;
  // Prefer an explicit from–to range (used by the Reports date-range filter); fall back to month/year.
  let start: string, end: string, monthName: string;
  if (p.get("from") && p.get("to")) {
    start = p.get("from")!; end = p.get("to")!;
    const fmt = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    monthName = start === end ? fmt(start) : `${fmt(start)} - ${fmt(end)}`;
  } else {
    const month = parseInt(p.get("month") || String(new Date().getMonth() + 1));
    const year  = parseInt(p.get("year")  || String(new Date().getFullYear()));
    ({ start, end } = monthRange(year, month));
    monthName = new Date(year, month - 1, 1).toLocaleString("en-IN", { month: "long", year: "numeric" });
  }

  const sf = shopFilter(user, req);
  const [entries, customers, payments, expenses, labours, allEnt, allPay] = await Promise.all([
    prisma.laundryEntry.findMany({
      where: { entry_date: { gte: start, lte: end }, ...sf },
      include: { customer: true, items: true },
      orderBy: { entry_date: "asc" },
    }),
    prisma.customer.findMany({ where: { ...sf }, orderBy: { name: "asc" } }),
    prisma.payment.findMany({ where: { date: { gte: start, lte: end }, ...sf }, include: { customer: true }, orderBy: [{ date: "desc" }] }),
    prisma.expense.findMany({ where: { date: { gte: start, lte: end }, ...sf }, orderBy: [{ date: "desc" }] }),
    prisma.labour.findMany({ where: { ...sf }, include: { works: true, advances: true } }),
    prisma.laundryEntry.findMany({ where: { ...sf }, select: { customer_id: true, total_amount: true } }),
    prisma.payment.findMany({ where: { ...sf }, select: { customer_id: true, amount: true } }),
  ]);
  // All-time billed/paid per customer → outstanding (udhaar) for the Customers sheet.
  const billedMap = new Map<string, number>();
  allEnt.forEach(e => billedMap.set(e.customer_id, (billedMap.get(e.customer_id) || 0) + Number(e.total_amount)));
  const paidMap = new Map<string, number>();
  allPay.forEach(p => paidMap.set(p.customer_id, (paidMap.get(p.customer_id) || 0) + Number(p.amount)));

  const wb = new ExcelJS.Workbook();
  wb.creator = "LaundryMax";
  wb.created = new Date();

  const headerFill: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E40AF" } };
  const headerFont: Partial<ExcelJS.Font> = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
  const altFill:    ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0F9FF" } };

  const styleHeader = (ws: ExcelJS.Worksheet) => {
    ws.getRow(1).eachCell(cell => {
      cell.fill = headerFill;
      cell.font = headerFont;
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = { bottom: { style: "thin", color: { argb: "FF93C5FD" } } };
    });
    ws.getRow(1).height = 28;
  };

  const stripeRows = (ws: ExcelJS.Worksheet, startRow: number, endRow: number) => {
    for (let r = startRow; r <= endRow; r++) {
      if (r % 2 === 0) {
        ws.getRow(r).eachCell(cell => { cell.fill = altFill; });
      }
    }
  };

  // ── Sheet 1: Summary ──
  const wsSummary = wb.addWorksheet("📊 Summary");
  wsSummary.columns = [
    { key: "label",  width: 30 },
    { key: "value",  width: 20 },
  ];
  const titleRow = wsSummary.addRow([`LaundryMax Report — ${monthName}`, ""]);
  titleRow.getCell(1).font = { bold: true, size: 14, color: { argb: "FF1E3A8A" } };
  titleRow.height = 32;
  wsSummary.addRow([]);

  const totalRevenue     = entries.reduce((s, e) => s + Number(e.total_amount), 0);
  const deliveredCount   = entries.filter(e => e.delivery_status === "delivered").length;
  const pendingCount     = entries.filter(e => e.delivery_status !== "delivered").length;
  const uniqueCustomers  = new Set(entries.map(e => e.customer_id)).size;
  const totalItems       = entries.reduce((s, e) => s + e.items.reduce((ss, i) => ss + i.quantity, 0), 0);

  const summaryData = [
    ["Month",              monthName],
    ["Total Revenue (₹)",  totalRevenue],
    ["Total Entries",      entries.length],
    ["Delivered Entries",  deliveredCount],
    ["Pending Entries",    pendingCount],
    ["Unique Customers",   uniqueCustomers],
    ["Total Items",        totalItems],
    ["Avg per Entry (₹)",  entries.length ? Math.round(totalRevenue / entries.length) : 0],
  ];
  summaryData.forEach(([label, value]) => {
    const row = wsSummary.addRow([label, value]);
    row.getCell(1).font  = { bold: true, color: { argb: "FF475569" } };
    row.getCell(2).font  = { bold: true, color: { argb: "FF1E40AF" }, size: 12 };
    row.getCell(2).alignment = { horizontal: "left" };
    row.height = 22;
  });

  // Service breakdown
  wsSummary.addRow([]);
  const svcHeaderRow = wsSummary.addRow(["Service Breakdown", ""]);
  svcHeaderRow.getCell(1).font = { bold: true, size: 12, color: { argb: "FF1E3A8A" } };

  const svcMap = new Map<string, { qty: number; revenue: number }>();
  entries.forEach(e => e.items.forEach(item => {
    const ex = svcMap.get(item.service_name) || { qty: 0, revenue: 0 };
    ex.qty     += item.quantity;
    ex.revenue += Number(item.subtotal);
    svcMap.set(item.service_name, ex);
  }));
  const svcHeaderRow2 = wsSummary.addRow(["Service Name", "Qty", "Revenue (₹)"]);
  svcHeaderRow2.eachCell(cell => { cell.font = { bold: true, color: { argb: "FFFFFFFF" } }; cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF7C3AED" } }; });
  wsSummary.getColumn(3).width = 16;
  [...svcMap.entries()].sort((a, b) => b[1].revenue - a[1].revenue).forEach(([name, d]) => {
    wsSummary.addRow([name, d.qty, d.revenue]);
  });

  // ── Sheet 2: Monthly Entries ──
  const wsEntries = wb.addWorksheet(`📋 Entries`);
  wsEntries.columns = [
    { header: "Date",     key: "date",     width: 14 },
    { header: "Customer", key: "customer", width: 22 },
    { header: "Phone",    key: "phone",    width: 14 },
    { header: "Flat",     key: "flat",     width: 12 },
    { header: "Society",  key: "society",  width: 20 },
    { header: "Service",  key: "service",  width: 22 },
    { header: "Qty",      key: "qty",      width: 8  },
    { header: "Rate (₹)", key: "rate",     width: 12 },
    { header: "Amount (₹)",key:"amount",   width: 14 },
    { header: "Status",   key: "status",   width: 14 },
  ];
  styleHeader(wsEntries);

  let rowNum = 2;
  entries.forEach(e => {
    e.items.forEach(item => {
      wsEntries.addRow({
        date:     e.entry_date,
        customer: e.customer?.name || "",
        phone:    e.customer?.phone || "",
        flat:     e.customer?.flat_number || "",
        society:  e.customer?.society_name || "",
        service:  item.service_name,
        qty:      item.quantity,
        rate:     Number(item.price_per_unit),
        amount:   Number(item.subtotal),
        status:   e.delivery_status,
      });
      // Color status cell
      const statusCell = wsEntries.getRow(rowNum).getCell(10);
      if (e.delivery_status === "delivered") {
        statusCell.font = { color: { argb: "FF16A34A" }, bold: true };
      } else {
        statusCell.font = { color: { argb: "FFD97706" }, bold: true };
      }
      rowNum++;
    });
  });
  stripeRows(wsEntries, 2, rowNum - 1);

  // Total row
  const totalRow = wsEntries.addRow({ amount: totalRevenue });
  totalRow.getCell(8).value = "TOTAL";
  totalRow.getCell(8).font  = { bold: true };
  totalRow.getCell(9).font  = { bold: true, color: { argb: "FF1E40AF" }, size: 12 };
  totalRow.getCell(9).fill  = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDBEAFE" } };

  // ── Sheet 3: Customers + Udhaar ──
  const wsCustomers = wb.addWorksheet("👥 Customers");
  wsCustomers.columns = [
    { header: "Name",    key: "name",    width: 22 },
    { header: "Phone",   key: "phone",   width: 14 },
    { header: "Flat",    key: "flat",    width: 12 },
    { header: "Society", key: "society", width: 22 },
    { header: "Billed (₹)",      key: "billed",  width: 14 },
    { header: "Paid (₹)",        key: "paid",    width: 14 },
    { header: "Outstanding (₹)", key: "due",     width: 16 },
  ];
  styleHeader(wsCustomers);
  customers.forEach(c => {
    const billed = billedMap.get(c.id) || 0;
    const paid = paidMap.get(c.id) || 0;
    const row = wsCustomers.addRow({ name: c.name, phone: c.phone, flat: c.flat_number, society: c.society_name, billed, paid, due: billed - paid });
    if (billed - paid > 0) row.getCell(7).font = { bold: true, color: { argb: "FFD97706" } };
  });
  stripeRows(wsCustomers, 2, customers.length + 1);

  // ── Sheet 4: Payments (collection) ──
  const wsPay = wb.addWorksheet("💰 Payments");
  wsPay.columns = [
    { header: "Date",       key: "date",     width: 14 },
    { header: "Customer",   key: "customer", width: 22 },
    { header: "Amount (₹)", key: "amount",   width: 14 },
    { header: "Method",     key: "method",   width: 12 },
    { header: "Note",       key: "note",     width: 28 },
  ];
  styleHeader(wsPay);
  payments.forEach(p => wsPay.addRow({ date: p.date, customer: p.customer?.name || "", amount: Number(p.amount), method: p.method, note: p.note || "" }));
  const payTotal = payments.reduce((s, p) => s + Number(p.amount), 0);
  stripeRows(wsPay, 2, payments.length + 1);
  const payTotalRow = wsPay.addRow({ method: "TOTAL", amount: payTotal });
  payTotalRow.getCell(3).font = { bold: true, color: { argb: "FF16A34A" }, size: 12 };

  // ── Sheet 5: Expenses ──
  const wsExp = wb.addWorksheet("🧾 Expenses");
  wsExp.columns = [
    { header: "Date",        key: "date",     width: 14 },
    { header: "Category",    key: "category", width: 18 },
    { header: "Description", key: "desc",     width: 30 },
    { header: "Amount (₹)",  key: "amount",   width: 14 },
  ];
  styleHeader(wsExp);
  expenses.forEach(e => wsExp.addRow({ date: e.date, category: e.category, desc: e.description, amount: Number(e.amount) }));
  const expTotal = expenses.reduce((s, e) => s + Number(e.amount), 0);
  stripeRows(wsExp, 2, expenses.length + 1);
  const expTotalRow = wsExp.addRow({ desc: "TOTAL", amount: expTotal });
  expTotalRow.getCell(4).font = { bold: true, color: { argb: "FFDC2626" }, size: 12 };

  // ── Sheet 6: Labour (for the period) ──
  const wsLab = wb.addWorksheet("👷 Labour");
  wsLab.columns = [
    { header: "Name",         key: "name",  width: 22 },
    { header: "Pieces",       key: "press", width: 10 },
    { header: "Earned (₹)",   key: "pay",   width: 14 },
    { header: "Advances (₹)", key: "adv",   width: 14 },
    { header: "Net (₹)",      key: "net",   width: 14 },
  ];
  styleHeader(wsLab);
  const inR = (d: string) => d >= start && d <= end;
  labours.forEach(l => {
    const w = l.works.filter(x => inR(x.work_date));
    const press = w.reduce((s, x) => s + x.press_count, 0);
    const pay = w.reduce((s, x) => s + x.press_count * Number(x.rate_per_piece), 0);
    const adv = l.advances.filter(a => inR(a.advance_date)).reduce((s, a) => s + Number(a.amount), 0);
    wsLab.addRow({ name: l.name, press, pay, adv, net: pay - adv });
  });
  stripeRows(wsLab, 2, labours.length + 1);

  const buffer = await wb.xlsx.writeBuffer();
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="LaundryMax-Report-${start}_${end}.xlsx"`,
    },
  });
}
