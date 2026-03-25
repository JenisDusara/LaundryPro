import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;
  const entry = await prisma.laundryEntry.findUnique({
    where: { id: params.id },
    include: { customer: true, items: true },
  });
  if (!entry) return NextResponse.json({ detail: "Not found" }, { status: 404 });
  return NextResponse.json({
    ...entry,
    total_amount: Number(entry.total_amount),
    items: entry.items.map(i => ({ ...i, price_per_unit: Number(i.price_per_unit), subtotal: Number(i.subtotal) })),
  });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;
  await prisma.laundryEntry.delete({ where: { id: params.id } });
  return NextResponse.json({ message: "Deleted" });
}
