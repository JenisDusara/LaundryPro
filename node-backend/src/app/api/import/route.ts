import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import prisma from "@/lib/prisma";
import { requireActiveAuth } from "@/lib/auth";
import ExcelJS from "exceljs";

// Bulk Excel import — SUPERADMIN ONLY. Imports Customers or Garment (service) prices
// into a selected shop (x-selected-shop header). Additive: existing rows are skipped,
// not overwritten.

const CUSTOMER_COLS = ["Name", "Phone", "Flat", "Society", "Address", "Email"];
const PRICE_COLS = ["Service Type", "Item Name", "Price", "Category"];

async function guard(req: NextRequest) {
  const user = await requireActiveAuth(req);
  if (user instanceof NextResponse) return { err: user };
  if (user.role !== "superadmin") return { err: NextResponse.json({ detail: "Only superadmin can bulk-import." }, { status: 403 }) };
  const shop_id = req.headers.get("x-selected-shop");
  if (!shop_id) return { err: NextResponse.json({ detail: "Select a shop first (top-left shop picker)." }, { status: 400 }) };
  return { shop_id };
}

// GET /api/import?type=customers|prices&sample=1 → download a sample .xlsx template.
export async function GET(req: NextRequest) {
  const g = await guard(req);
  if (g.err) return g.err;
  const type = new URL(req.url).searchParams.get("type") === "prices" ? "prices" : "customers";
  const cols = type === "prices" ? PRICE_COLS : CUSTOMER_COLS;
  const sample = type === "prices"
    ? ["Wash & Fold", "Shirt", 15, "MEN"]
    : ["Ramesh Kumar", "9876543210", "A-101", "Green Society", "Near park", "ramesh@example.com"];

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Import");
  ws.addRow(cols);
  ws.getRow(1).eachCell(c => { c.font = { bold: true, color: { argb: "FFFFFFFF" } }; c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E40AF" } }; });
  ws.addRow(sample);
  cols.forEach((_, i) => { ws.getColumn(i + 1).width = 20; });
  const buffer = await wb.xlsx.writeBuffer();
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="sample-${type}.xlsx"`,
    },
  });
}

// POST /api/import (multipart: type, file) → parse + insert.
export async function POST(req: NextRequest) {
  const g = await guard(req);
  if (g.err) return g.err;
  const shop_id = g.shop_id!;

  const form = await req.formData();
  const type = form.get("type") === "prices" ? "prices" : "customers";
  const file = form.get("file");
  if (!file || typeof file === "string") return NextResponse.json({ detail: "No file uploaded" }, { status: 400 });

  // Cap upload size — the whole file is read into memory, so an oversized file could OOM.
  const MAX_UPLOAD = 5 * 1024 * 1024; // 5 MB is plenty for a customer/price sheet
  if ((file as File).size > MAX_UPLOAD) return NextResponse.json({ detail: "File too large (max 5 MB)" }, { status: 413 });

  const buffer = Buffer.from(await (file as File).arrayBuffer());
  const wb = new ExcelJS.Workbook();
  try { await wb.xlsx.load(buffer as unknown as ExcelJS.Buffer); } catch { return NextResponse.json({ detail: "Could not read the Excel file" }, { status: 400 }); }
  const ws = wb.worksheets[0];
  if (!ws) return NextResponse.json({ detail: "The file has no sheet" }, { status: 400 });

  const cell = (row: ExcelJS.Row, i: number) => {
    const v = row.getCell(i).value as any;
    if (v == null) return "";
    if (typeof v === "object" && "text" in v) return String(v.text).trim(); // rich text / hyperlink
    if (typeof v === "object" && "result" in v) return String(v.result).trim(); // formula
    return String(v).trim();
  };

  let imported = 0, skipped = 0;
  const errors: string[] = [];

  if (type === "customers") {
    const rows: ExcelJS.Row[] = [];
    ws.eachRow((row, n) => { if (n > 1) rows.push(row); });
    for (const row of rows) {
      const name = cell(row, 1), phone = cell(row, 2).replace(/\s/g, "");
      if (!name || !phone) { skipped++; continue; }
      try {
        await prisma.customer.create({
          data: { name, phone, flat_number: cell(row, 3), society_name: cell(row, 4), address: cell(row, 5), email: cell(row, 6) || null, shop_id },
        });
        imported++;
      } catch { skipped++; /* duplicate phone for this shop, or bad data */ }
    }
  } else {
    // prices: Service Type | Item Name | Price | Category. Parent (type) is found/created,
    // then the item is added under it. A parent cache avoids re-querying per row.
    const parentCache = new Map<string, string>();
    const findOrCreateParent = async (typeName: string): Promise<string> => {
      const key = typeName.toLowerCase();
      if (parentCache.has(key)) return parentCache.get(key)!;
      const existing = await prisma.service.findFirst({ where: { name: typeName, parent_id: null, shop_id, is_active: true } });
      if (existing) { parentCache.set(key, existing.id); return existing.id; }
      const created = await prisma.service.create({ data: { name: typeName, parent_id: null, price: null, shop_id } });
      parentCache.set(key, created.id);
      return created.id;
    };
    const rows: ExcelJS.Row[] = [];
    ws.eachRow((row, n) => { if (n > 1) rows.push(row); });
    for (const row of rows) {
      const typeName = cell(row, 1), item = cell(row, 2), priceStr = cell(row, 3), category = cell(row, 4).toUpperCase();
      const price = Number(priceStr);
      if (!typeName || !item || !Number.isFinite(price)) { skipped++; continue; }
      try {
        const parentId = await findOrCreateParent(typeName);
        const svc = await prisma.service.create({ data: { name: item, parent_id: parentId, price, shop_id } });
        if (category) await prisma.$executeRawUnsafe(`UPDATE services SET category = $1 WHERE id::text = $2`, category, svc.id);
        imported++;
      } catch (e: any) { skipped++; errors.push(`${item}: ${e?.message || "failed"}`); }
    }
  }

  return NextResponse.json({ imported, skipped, errors: errors.slice(0, 10) });
}
