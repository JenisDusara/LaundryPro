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

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ detail: "Invalid request body" }, { status: 400 }); }
  const { notes, items, delivery_date, discount, extra_charge } = body;

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

  // Preserve the entry's billing adjustments. total_amount = items − discount + extra_charge, so
  // recomputing it from items alone (as this used to) silently dropped any discount/extra charge
  // and drifted the customer's balance. Use the values from the edit form when sent, else keep the
  // stored ones (read via raw SQL — these columns aren't in the Prisma schema yet).
  const stored: { discount: any; extra_charge: any }[] =
    await prisma.$queryRawUnsafe(`SELECT discount, extra_charge FROM laundry_entries WHERE id::text = $1`, params.id);
  const discountN = Math.max(0, Number(discount ?? stored[0]?.discount) || 0);
  const extraN    = Math.max(0, Number(extra_charge ?? stored[0]?.extra_charge) || 0);

  let itemsTotal = 0;
  const entryItems = (items as any[]).map((item) => {
    const subtotal = Number(item.price_per_unit) * Number(item.quantity);
    itemsTotal += subtotal;
    return {
      service_id: item.service_id,
      service_name: item.service_name,
      price_per_unit: Number(item.price_per_unit),
      quantity: Number(item.quantity),
      subtotal,
      item_status: item.item_status || "pending",
    };
  });
  const grandTotal = Math.max(0, itemsTotal - discountN + extraN);

  // Delete + recreate items, update the total, and re-derive delivered_qty / discount / extra /
  // delivery_date — all inside ONE interactive transaction. Previously these ran as separate
  // statements: a crash between the delete and the recreate left the entry with zero items but a
  // stale total, and two concurrent edits could interleave. The transaction makes the whole edit
  // atomic (all-or-nothing).
  const entry = await withRetry(() => prisma.$transaction(async (tx) => {
    await tx.entryItem.deleteMany({ where: { entry_id: params.id } });
    const updated = await tx.laundryEntry.update({
      where: { id: params.id },
      data: {
        notes: notes || "",
        total_amount: grandTotal,
        items: { createMany: { data: entryItems } },
      },
      include: { customer: true, items: true },
    });
    // Recreated items reset delivered_qty to 0; re-derive from the item_status the client sent.
    await tx.$executeRawUnsafe(
      `UPDATE entry_items SET delivered_qty = CASE WHEN item_status = 'delivered' THEN quantity ELSE 0 END WHERE entry_id::text = $1`,
      params.id
    );
    await tx.$executeRawUnsafe(
      `UPDATE laundry_entries SET discount = $1, extra_charge = $2 WHERE id::text = $3`,
      discountN, extraN, params.id
    );
    if (delivery_date !== undefined) {
      await tx.$executeRawUnsafe(`UPDATE laundry_entries SET delivery_date = $1 WHERE id::text = $2`, delivery_date || null, params.id);
    }
    return updated;
  }));

  const ddRows2: { delivery_date: string | null }[] = await prisma.$queryRawUnsafe(`SELECT delivery_date FROM laundry_entries WHERE id::text = $1`, params.id);
  return NextResponse.json({
    ...entry,
    delivery_date: ddRows2[0]?.delivery_date ?? null,
    discount: discountN,
    extra_charge: extraN,
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
