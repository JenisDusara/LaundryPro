import { NextRequest, NextResponse } from "next/server";
import prisma, { withRetry } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;
  const entry = await withRetry(() => prisma.laundryEntry.findUnique({
    where: { id: params.id },
    include: { customer: true, items: true },
  }));
  if (!entry) return NextResponse.json({ detail: "Not found" }, { status: 404 });
  return NextResponse.json({
    ...entry,
    total_amount: Number(entry.total_amount),
    items: entry.items.map(i => ({ ...i, price_per_unit: Number(i.price_per_unit), subtotal: Number(i.subtotal) })),
  });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;
  const { notes, items } = await req.json();

  // Delete existing items first
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

  return NextResponse.json({
    ...entry,
    total_amount: Number(entry.total_amount),
    items: entry.items.map(i => ({ ...i, price_per_unit: Number(i.price_per_unit), subtotal: Number(i.subtotal) })),
  });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;
  await withRetry(() => prisma.laundryEntry.delete({ where: { id: params.id } }));
  return NextResponse.json({ message: "Deleted" });
}
