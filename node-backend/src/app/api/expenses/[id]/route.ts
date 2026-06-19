import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth, shopFilter } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;
  const { date, category, description, amount } = await req.json();
  const existing = await prisma.expense.findFirst({ where: { id: params.id, ...shopFilter(user, req) } });
  if (!existing) return NextResponse.json({ detail: "Not found" }, { status: 404 });
  const updated = await prisma.expense.update({
    where: { id: params.id },
    data: { date, category, description: description || "", amount: Number(amount) },
  });
  return NextResponse.json({ ...updated, amount: Number(updated.amount) });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;
  const existing = await prisma.expense.findFirst({ where: { id: params.id, ...shopFilter(user, req) } });
  if (!existing) return NextResponse.json({ detail: "Not found" }, { status: 404 });
  await prisma.expense.delete({ where: { id: params.id } });
  return NextResponse.json({ message: "Deleted" });
}
