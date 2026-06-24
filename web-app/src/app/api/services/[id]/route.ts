import { NextRequest, NextResponse } from "next/server";
import prisma, { withRetry } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { name, price } = await req.json();
  await withRetry(() => prisma.service.update({ where: { id: params.id }, data: { name, price: price ? parseFloat(price) : null } }));
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await withRetry(() => prisma.service.update({ where: { id: params.id }, data: { is_active: false } }));
  return NextResponse.json({ ok: true });
}
