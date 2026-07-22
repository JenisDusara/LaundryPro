import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireActiveAuth, shopFilter, requireWrite, denyStaff } from "@/lib/auth";
import { logDataAction } from "@/lib/dataAudit";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireActiveAuth(req);
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
  const existing = await prisma.expense.findFirst({ where: { id: params.id, deleted_at: null, ...shopFilter(user, req) } as any });
  if (!existing) return NextResponse.json({ detail: "Not found" }, { status: 404 });
  const updated = await prisma.expense.update({
    where: { id: params.id },
    data: { date, category, description: description || "", amount: amt },
  });
  return NextResponse.json({ ...updated, amount: Number(updated.amount) });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireActiveAuth(req);
  if (user instanceof NextResponse) return user;
  const staff = denyStaff(user); if (staff) return staff;
  const ro = requireWrite(user); if (ro) return ro;
  const existing = await prisma.expense.findFirst({ where: { id: params.id, deleted_at: null, ...shopFilter(user, req) } as any });
  if (!existing) return NextResponse.json({ detail: "Not found" }, { status: 404 });
  const reason = new URL(req.url).searchParams.get("reason") || "expense_delete";
  await prisma.expense.update({
    where: { id: params.id },
    data: { deleted_at: new Date(), deleted_by: user.sub, deleted_by_username: user.username, delete_reason: reason } as any,
  });
  await logDataAction(req, user, {
    action: "expense.soft_deleted",
    shop_id: existing.shop_id,
    entity_type: "expense",
    entity_id: existing.id,
    entity_label: `${existing.category} ${existing.date}`,
    metadata: { reason, amount: Number(existing.amount), description: existing.description },
  });
  return NextResponse.json({ message: "Deleted" });
}
