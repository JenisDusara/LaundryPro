import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth, shopFilter, denyStaff } from "@/lib/auth";
import ExcelJS from "exceljs";

export async function GET(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;
  const staff = denyStaff(user); if (staff) return staff;

  // Scope the dump to EXACTLY ONE shop — a backup must never mix two shops' data.
  // A regular admin is always locked to their own shop_id. A superadmin is scoped to the
  // shop picked in the picker (x-selected-shop); if none is selected shopFilter returns {}
  // (= all shops), which we reject here so the download can never overlap shops.
  const scope = shopFilter(user, req);
  if (!scope.shop_id) {
    return NextResponse.json(
      { detail: "Pehle ek shop select karein — backup ek hi shop ka hota hai." },
      { status: 400 }
    );
  }
  const [customers, services, entries, labours] = await Promise.all([
    prisma.customer.findMany({ where: scope, orderBy: { name: "asc" } }),
    prisma.service.findMany({ where: scope }),
    prisma.laundryEntry.findMany({ where: scope, include: { items: true, customer: true }, orderBy: { entry_date: "asc" } }),
    prisma.labour.findMany({ where: scope, include: { works: true } }),
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
    ws.getRow(1).height = 26;
  };
  const stripeRows = (ws: ExcelJS.Worksheet, endRow: number) => {
    for (let r = 2; r <= endRow; r++) {
      if (r % 2 === 0) ws.getRow(r).eachCell(cell => { cell.fill = altFill; });
    }
  };

  // ── Sheet 1: Customers ──
  const wsCustomers = wb.addWorksheet("👥 Customers");
  wsCustomers.columns = [
    { header: "Name",    key: "name",    width: 22 },
    { header: "Phone",   key: "phone",   width: 14 },
    { header: "Flat",    key: "flat",    width: 12 },
    { header: "Society", key: "society", width: 22 },
    { header: "Address", key: "address", width: 30 },
    { header: "Email",   key: "email",   width: 26 },
  ];
  styleHeader(wsCustomers);
  customers.forEach(c => wsCustomers.addRow({
    name: c.name, phone: c.phone, flat: c.flat_number, society: c.society_name, address: c.address, email: c.email || "",
  }));
  stripeRows(wsCustomers, customers.length + 1);

  // ── Sheet 2: Entries (one row per item) ──
  const wsEntries = wb.addWorksheet("📋 Entries");
  wsEntries.columns = [
    { header: "Date",         key: "date",     width: 13 },
    { header: "Customer",     key: "customer", width: 22 },
    { header: "Phone",        key: "phone",    width: 14 },
    { header: "Service",      key: "service",  width: 22 },
    { header: "Qty",          key: "qty",      width: 8  },
    { header: "Rate (₹)",     key: "rate",     width: 11 },
    { header: "Amount (₹)",   key: "amount",   width: 13 },
    { header: "Item Status",  key: "istatus",  width: 13 },
    { header: "Delivery",     key: "dstatus",  width: 12 },
    { header: "Notes",        key: "notes",    width: 24 },
  ];
  styleHeader(wsEntries);
  let entryRows = 1;
  let grandTotal = 0;
  entries.forEach(e => {
    grandTotal += Number(e.total_amount);
    e.items.forEach(item => {
      wsEntries.addRow({
        date:     e.entry_date,
        customer: e.customer?.name || "",
        phone:    e.customer?.phone || "",
        service:  item.service_name,
        qty:      item.quantity,
        rate:     Number(item.price_per_unit),
        amount:   Number(item.subtotal),
        istatus:  item.item_status,
        dstatus:  e.delivery_status,
        notes:    e.notes || "",
      });
      entryRows++;
    });
  });
  stripeRows(wsEntries, entryRows);
  const totalRow = wsEntries.addRow({ rate: "TOTAL", amount: grandTotal });
  totalRow.getCell(6).font = { bold: true };
  totalRow.getCell(7).font = { bold: true, color: { argb: "FF1E40AF" }, size: 12 };
  totalRow.getCell(7).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDBEAFE" } };

  // ── Sheet 3: Services ──
  const wsServices = wb.addWorksheet("🧺 Services");
  wsServices.columns = [
    { header: "Service",   key: "name",   width: 26 },
    { header: "Price (₹)", key: "price",  width: 12 },
    { header: "Active",    key: "active", width: 10 },
  ];
  styleHeader(wsServices);
  services.forEach(s => wsServices.addRow({
    name: s.name, price: s.price != null ? Number(s.price) : "", active: s.is_active ? "Yes" : "No",
  }));
  stripeRows(wsServices, services.length + 1);

  // ── Sheet 4: Labour work ──
  const wsLabour = wb.addWorksheet("👷 Labour");
  wsLabour.columns = [
    { header: "Labour",      key: "labour", width: 22 },
    { header: "Work Date",   key: "date",   width: 13 },
    { header: "Pieces",      key: "pieces", width: 10 },
    { header: "Rate (₹)",    key: "rate",   width: 11 },
    { header: "Amount (₹)",  key: "amount", width: 13 },
  ];
  styleHeader(wsLabour);
  let labourRows = 1;
  labours.forEach(l => {
    l.works.forEach(w => {
      const amt = w.press_count * Number(w.rate_per_piece);
      wsLabour.addRow({ labour: l.name, date: w.work_date, pieces: w.press_count, rate: Number(w.rate_per_piece), amount: amt });
      labourRows++;
    });
  });
  stripeRows(wsLabour, labourRows);

  const buffer = await wb.xlsx.writeBuffer();
  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="laundrypro-backup-${date}.xlsx"`,
    },
  });
}
