import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth, shopFilter, requireWrite, denyStaff } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;
  const staff = denyStaff(user); if (staff) return staff;
  const ro = requireWrite(user); if (ro) return ro;
  const { date, category, description, amount } = await req.json();
  if (!date || !category || !amount) {
    return NextResponse.json({ detail: "date, category and amount are required" }, { status: 400 });
  }
  const amt = Number(amount);
  if (!Number.isFinite(amt) || amt <= 0) {
    return NextResponse.json({ detail: "Amount must be a positive number" }, { status: 400 });
  }
  const existing = await prisma.expense.findFirst({ where: { id: params.id, ...shopFilter(user, req) } });
  if (!existing) return NextResponse.json({ detail: "Not found" }, { status: 404 });
  const updated = await prisma.expense.update({
    where: { id: params.id },
    data: { date, category, description: description || "", amount: amt },
  });
  return NextResponse.json({ ...updated, amount: Number(updated.amount) });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;
  const staff = denyStaff(user); if (staff) return staff;
  const ro = requireWrite(user); if (ro) return ro;
  const existing = await prisma.expense.findFirst({ where: { id: params.id, ...shopFilter(user, req) } });
  if (!existing) return NextResponse.json({ detail: "Not found" }, { status: 404 });
  await prisma.expense.delete({ where: { id: params.id } });
  return NextResponse.json({ message: "Deleted" });
}
