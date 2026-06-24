import { NextRequest, NextResponse } from "next/server";
import prisma, { withRetry } from "@/lib/prisma";

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await withRetry(() => prisma.expense.delete({ where: { id: params.id } }));
  return NextResponse.json({ ok: true });
}
