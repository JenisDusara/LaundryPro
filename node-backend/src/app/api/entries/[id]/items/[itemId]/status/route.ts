import { NextRequest, NextResponse } from "next/server";
import prisma, { withRetry } from "@/lib/prisma";
import { requireActiveAuth, shopFilter, requireWrite } from "@/lib/auth";

// Marks how much of an item has been handed over.
//   ?status=delivered            → deliver the whole quantity
//   ?status=pending              → reset to nothing delivered
//   ?qty=N                       → partial: exactly N of `quantity` delivered
// item_status stays in sync: "delivered" once delivered_qty >= quantity, else "pending".
// delivered_qty lives in a column the generated client may not know yet, so it is read
// and written via raw SQL (same pattern as delivery_date).
export async function PATCH(req: NextRequest, { params }: { params: { id: string; itemId: string } }) {
  const user = await requireActiveAuth(req);
  if (user instanceof NextResponse) return user;
  const ro = requireWrite(user); if (ro) return ro;

  const sp = new URL(req.url).searchParams;
  const status = sp.get("status") || "pending";
  const qtyParam = sp.get("qty");

  // Ownership check — the parent entry (and thus the item) must belong to the caller's shop.
  const owned = await withRetry(() => prisma.laundryEntry.findFirst({
    where: { id: params.id, deleted_at: null, ...shopFilter(user, req) },
    select: { id: true },
  } as any));
  if (!owned) return NextResponse.json({ detail: "Not found" }, { status: 404 });

  // The item must belong to this entry (blocks cross-entry/cross-shop item writes).
  const item = await withRetry(() => prisma.entryItem.findFirst({
    where: { id: params.itemId, entry_id: params.id },
    select: { quantity: true },
  }));
  if (!item) return NextResponse.json({ detail: "Item not found" }, { status: 404 });

  // Resolve how many are delivered.
  let deliveredQty: number;
  if (qtyParam !== null) {
    deliveredQty = Math.max(0, Math.min(item.quantity, Math.floor(Number(qtyParam)) || 0));
  } else {
    deliveredQty = status === "delivered" ? item.quantity : 0;
  }
  const itemStatus = deliveredQty >= item.quantity ? "delivered" : "pending";

  await withRetry(() => prisma.$executeRaw`
    UPDATE entry_items SET delivered_qty = ${deliveredQty}, item_status = ${itemStatus}
    WHERE id::text = ${params.itemId} AND entry_id::text = ${params.id}
  `);

  // Recompute the entry's overall status from its items.
  const allItems = await withRetry(() => prisma.entryItem.findMany({
    where: { entry_id: params.id }, select: { item_status: true },
  }));
  const allDone = allItems.length > 0 && allItems.every(i => i.item_status === "delivered");
  await withRetry(() => prisma.laundryEntry.update({
    where: { id: params.id }, data: { delivery_status: allDone ? "delivered" : "pending" },
  }));
  // Stamp/clear delivered_at + sync tag_status in step with delivery_status, same as the
  // entry-level status route — it drives the QR tag's 2h post-delivery auto-expiry.
  if (allDone) {
    await withRetry(() => prisma.$executeRaw`
      UPDATE laundry_entries SET delivered_at = now(), tag_status = 'delivered' WHERE id::text = ${params.id}
    `);
  } else {
    await withRetry(() => prisma.$executeRaw`
      UPDATE laundry_entries
      SET delivered_at = NULL,
          tag_status = CASE WHEN tag_status = 'delivered' THEN 'ready' ELSE tag_status END
      WHERE id::text = ${params.id}
    `);
  }

  return NextResponse.json({ message: "Updated", delivered_qty: deliveredQty, item_status: itemStatus });
}
