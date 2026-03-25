import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import ExcelJS from "exceljs";

export async function GET(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;
  const customers = await prisma.customer.findMany({ orderBy: { name: "asc" } });
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Customers");
  ws.columns = [
    { header: "Name", key: "name", width: 20 },
    { header: "Phone", key: "phone", width: 14 },
    { header: "Flat", key: "flat", width: 12 },
    { header: "Society", key: "society", width: 20 },
    { header: "Address", key: "address", width: 30 },
    { header: "Email", key: "email", width: 25 },
  ];
  ws.getRow(1).font = { bold: true };
  customers.forEach(c => ws.addRow({ name: c.name, phone: c.phone, flat: c.flat_number, society: c.society_name, address: c.address, email: c.email || "" }));
  const buffer = await wb.xlsx.writeBuffer();
  return new NextResponse(buffer as Buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="customers.xlsx"`,
    },
  });
}
