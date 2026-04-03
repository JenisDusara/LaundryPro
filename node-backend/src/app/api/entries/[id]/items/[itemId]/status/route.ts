import { NextRequest, NextResponse } from "next/server";
import prisma, { withRetry } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string; itemId: string } }) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;
  const status = new URL(req.url).searchParams.get("status") || "pending";
  await withRetry(() => prisma.entryItem.update({ where: { id: params.itemId }, data: { item_status: status } }));
  // If all items are now delivered, update entry delivery_status too
  const allItems = await withRetry(() => prisma.entryItem.findMany({ where: { entry_id: params.id } }));
  const allDone = allItems.every(i => i.item_status === "delivered");
  await withRetry(() => prisma.laundryEntry.update({ where: { id: params.id }, data: { delivery_status: allDone ? "delivered" : "pending" } }));
  return NextResponse.json({ message: "Updated" });
}
