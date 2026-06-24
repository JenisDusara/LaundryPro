import { NextRequest, NextResponse } from "next/server";
import prisma, { withRetry } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const entry = await withRetry(() => prisma.laundryEntry.findUnique({
    where: { id: params.id },
    include: { customer: true, items: { include: { service: true } } },
  }));
  if (!entry) return NextResponse.json({ detail: "Not found" }, { status: 404 });
  return NextResponse.json(entry);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await withRetry(() => prisma.laundryEntry.delete({ where: { id: params.id } }));
  return NextResponse.json({ ok: true });
}
