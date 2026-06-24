import { NextRequest, NextResponse } from "next/server";
import prisma, { withRetry } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const labour = await withRetry(() => prisma.labour.findUnique({
    where: { id: params.id },
    include: { works: { orderBy: { work_date: "desc" } }, advances: { orderBy: { advance_date: "desc" } } },
  }));
  if (!labour) return NextResponse.json({ detail: "Not found" }, { status: 404 });
  return NextResponse.json(labour);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await withRetry(() => prisma.labour.update({ where: { id: params.id }, data: { is_active: false } }));
  return NextResponse.json({ ok: true });
}
