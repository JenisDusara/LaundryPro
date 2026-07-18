import { NextRequest, NextResponse } from "next/server";
import prisma, { withRetry } from "@/lib/prisma";
import { requireAuth, shopFilter, requireWrite } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;
  const entry = await withRetry(() => prisma.laundryEntry.findFirst({
    where: { id: params.id, ...shopFilter(user, req) },
    include: { customer: true, items: true },
  }));
  if (!entry) return NextResponse.json({ detail: "Not found" }, { status: 404 });
  const ex: { delivery_date: string | null; invoice_no: number | null; discount: any; extra_charge: any; amount_paid: any; payment_method: string | null }[] =
    await prisma.$queryRawUnsafe(`SELECT delivery_date, invoice_no, discount, extra_charge, amount_paid, payment_method FROM laundry_entries WHERE id::text = $1`, params.id);
  const dqRows: { id: string; delivered_qty: number }[] = await prisma.$queryRawUnsafe(`SELECT id::text, delivered_qty FROM entry_items WHERE entry_id::text = $1`, params.id);
  const dqMap = new Map(dqRows.map(r => [r.id, Number(r.delivered_qty) || 0]));
  const b = ex[0];
  return NextResponse.json({
    ...entry,
    delivery_date: b?.delivery_date ?? null,
    invoice_no: b?.invoice_no ?? null,
    discount: b?.discount != null ? Number(b.discount) : 0,
    extra_charge: b?.extra_charge != null ? Number(b.extra_charge) : 0,
    amount_paid: b?.amount_paid != null ? Number(b.amount_paid) : 0,
    payment_method: b?.payment_method ?? "",
    total_amount: Number(entry.total_amount),
    items: entry.items.map(i => ({ ...i, price_per_unit: Number(i.price_per_unit), subtotal: Number(i.subtotal), delivered_qty: dqMap.get(i.id) ?? 0 })),
  });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;
  const ro = requireWrite(user); if (ro) return ro;

  // Ownership check — ensure this entry belongs to the caller's shop before mutating.
  const owned = await withRetry(() => prisma.laundryEntry.findFirst({
    where: { id: params.id, ...shopFilter(user, req) },
    select: { id: true },
  }));
  if (!owned) return NextResponse.json({ detail: "Not found" }, { status: 404 });

  const { notes, items, delivery_date } = await req.json();

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ detail: "At least one item is required" }, { status: 400 });
  }
  // Same validation as create — a bad edit must not be able to write a negative/garbage total.
  for (const item of items) {
    const q = Number(item.quantity), pr = Number(item.price_per_unit);
    if (!Number.isInteger(q) || q < 1 || !Number.isFinite(pr) || pr < 0) {
      return NextResponse.json({ detail: "Each item needs a whole quantity ≥ 1 and a price ≥ 0" }, { status: 400 });
    }
  }

  await withRetry(() => prisma.entryItem.deleteMany({ where: { entry_id: params.id } }));

  let total = 0;
  const entryItems = (items as any[]).map((item) => {
    const subtotal = Number(item.price_per_unit) * Number(item.quantity);
    total += subtotal;
    return {
      entry_id: params.id,
      service_id: item.service_id,
      service_name: item.service_name,
      price_per_unit: Number(item.price_per_unit),
      quantity: Number(item.quantity),
      subtotal,
      item_status: item.item_status || "pending",
    };
  });

  const entry = await withRetry(() => prisma.laundryEntry.update({
    where: { id: params.id },
    data: {
      notes: notes || "",
      total_amount: total,
      items: { createMany: { data: entryItems.map(({ entry_id, ...rest }) => rest) } },
    },
    include: { customer: true, items: true },
  }));

  // Items were deleted and recreated above, which resets delivered_qty to its default (0).
  // Re-derive it from the item_status the client sent so the partial-delivery count and the
  // "delivered" indicator stay consistent: delivered → full quantity, otherwise nothing.
  await prisma.$executeRawUnsafe(
    `UPDATE entry_items SET delivered_qty = CASE WHEN item_status = 'delivered' THEN quantity ELSE 0 END WHERE entry_id::text = $1`,
    params.id
  );

  // Update delivery_date via raw SQL if provided
  if (delivery_date !== undefined) {
    if (delivery_date) {
      await prisma.$executeRawUnsafe(`UPDATE laundry_entries SET delivery_date = $1 WHERE id::text = $2`, delivery_date, params.id);
    } else {
      await prisma.$executeRawUnsafe(`UPDATE laundry_entries SET delivery_date = NULL WHERE id::text = $1`, params.id);
    }
  }

  const ddRows2: { delivery_date: string | null }[] = await prisma.$queryRawUnsafe(`SELECT delivery_date FROM laundry_entries WHERE id::text = $1`, params.id);
  return NextResponse.json({
    ...entry,
    delivery_date: ddRows2[0]?.delivery_date ?? null,
    total_amount: Number(entry.total_amount),
    items: entry.items.map(i => ({ ...i, price_per_unit: Number(i.price_per_unit), subtotal: Number(i.subtotal) })),
  });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;
  const ro = requireWrite(user); if (ro) return ro;
  await withRetry(() => prisma.laundryEntry.deleteMany({ where: { id: params.id, ...shopFilter(user, req) } }));
  return NextResponse.json({ message: "Deleted" });
}
