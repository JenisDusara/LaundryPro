import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import ExcelJS from "exceljs";

export async function GET(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;

  const p     = new URL(req.url).searchParams;
  const month = parseInt(p.get("month") || String(new Date().getMonth() + 1));
  const year  = parseInt(p.get("year")  || String(new Date().getFullYear()));
  const start = new Date(year, month - 1, 1).toISOString().slice(0, 10);
  const end   = new Date(year, month, 0).toISOString().slice(0, 10);
  const monthName = new Date(year, month - 1, 1).toLocaleString("en-IN", { month: "long", year: "numeric" });

  const [entries, customers] = await Promise.all([
    prisma.laundryEntry.findMany({
      where: { entry_date: { gte: start, lte: end } },
      include: { customer: true, items: true },
      orderBy: { entry_date: "asc" },
    }),
    prisma.customer.findMany({ orderBy: { name: "asc" } }),
  ]);

  const wb = new ExcelJS.Workbook();
  wb.creator = "LaundryPro";
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
  const titleRow = wsSummary.addRow([`LaundryPro Report — ${monthName}`, ""]);
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
  const wsEntries = wb.addWorksheet(`📋 Entries ${month}-${year}`);
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

  // ── Sheet 3: Customers ──
  const wsCustomers = wb.addWorksheet("👥 Customers");
  wsCustomers.columns = [
    { header: "Name",    key: "name",    width: 22 },
    { header: "Phone",   key: "phone",   width: 14 },
    { header: "Flat",    key: "flat",    width: 12 },
    { header: "Society", key: "society", width: 22 },
    { header: "Address", key: "address", width: 30 },
    { header: "Email",   key: "email",   width: 28 },
  ];
  styleHeader(wsCustomers);
  customers.forEach((c, i) => {
    wsCustomers.addRow({ name: c.name, phone: c.phone, flat: c.flat_number, society: c.society_name, address: c.address, email: c.email || "" });
  });
  stripeRows(wsCustomers, 2, customers.length + 1);

  const buffer = await wb.xlsx.writeBuffer();
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="LaundryPro-Report-${year}-${String(month).padStart(2,"0")}.xlsx"`,
    },
  });
}
