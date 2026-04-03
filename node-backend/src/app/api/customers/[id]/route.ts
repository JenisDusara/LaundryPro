import { NextRequest, NextResponse } from "next/server";
import prisma, { withRetry } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;
  const customer = await withRetry(() => prisma.customer.findUnique({ where: { id: params.id } }));
  if (!customer) return NextResponse.json({ detail: "Not found" }, { status: 404 });
  return NextResponse.json(customer);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;
  const data = await req.json();
  if (data.phone !== undefined && !/^\d{10}$/.test(data.phone)) {
    return NextResponse.json({ detail: "Phone number must be exactly 10 digits" }, { status: 400 });
  }
  const customer = await withRetry(() => prisma.customer.update({ where: { id: params.id }, data }));
  return NextResponse.json(customer);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;
  // Delete entry items → entries → customer (foreign key order)
  const entries = await withRetry(() => prisma.laundryEntry.findMany({ where: { customer_id: params.id }, select: { id: true } }));
  const entryIds = entries.map(e => e.id);
  if (entryIds.length > 0) {
    await withRetry(() => prisma.entryItem.deleteMany({ where: { entry_id: { in: entryIds } } }));
    await withRetry(() => prisma.laundryEntry.deleteMany({ where: { customer_id: params.id } }));
  }
  await withRetry(() => prisma.customer.delete({ where: { id: params.id } }));
  return NextResponse.json({ message: "Deleted" });
}
