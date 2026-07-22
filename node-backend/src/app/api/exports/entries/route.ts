import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireActiveAuth, shopFilter, denyStaff } from "@/lib/auth";
import { monthRange } from "@/lib/dates";
import ExcelJS from "exceljs";

export async function GET(req: NextRequest) {
  const user = await requireActiveAuth(req);
  if (user instanceof NextResponse) return user;
  const staff = denyStaff(user); if (staff) return staff;
  const p = new URL(req.url).searchParams;
  const month = parseInt(p.get("month") || String(new Date().getMonth() + 1));
  const year = parseInt(p.get("year") || String(new Date().getFullYear()));
  const { start, end } = monthRange(year, month);

  const entries: any[] = await prisma.laundryEntry.findMany({
    where: { entry_date: { gte: start, lte: end }, deleted_at: null, ...shopFilter(user, req) },
    include: { customer: true, items: true },
    orderBy: { entry_date: "asc" },
  } as any);

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Entries");
  ws.columns = [
    { header: "Date", key: "date", width: 14 },
    { header: "Customer", key: "customer", width: 20 },
    { header: "Phone", key: "phone", width: 14 },
    { header: "Flat", key: "flat", width: 12 },
    { header: "Service", key: "service", width: 20 },
    { header: "Qty", key: "qty", width: 8 },
    { header: "Rate", key: "rate", width: 10 },
    { header: "Amount", key: "amount", width: 12 },
    { header: "Status", key: "status", width: 14 },
  ];
  ws.getRow(1).font = { bold: true };
  entries.forEach(e => {
    e.items.forEach((item: any) => {
      ws.addRow({
        date: e.entry_date,
        customer: e.customer?.name || "",
        phone: e.customer?.phone || "",
        flat: e.customer?.flat_number || "",
        service: item.service_name,
        qty: item.quantity,
        rate: Number(item.price_per_unit),
        amount: Number(item.subtotal),
        status: e.delivery_status,
      });
    });
  });

  const buffer = await wb.xlsx.writeBuffer();
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="entries-${year}-${month}.xlsx"`,
    },
  });
}
