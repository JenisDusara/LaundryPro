import { NextRequest, NextResponse } from "next/server";
import prisma, { withRetry } from "@/lib/prisma";
import { requireActiveAuth, requireWrite, denyStaff } from "@/lib/auth";
import { logDataAction } from "@/lib/dataAudit";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireActiveAuth(req);
  if (user instanceof NextResponse) return user;
  const staff = denyStaff(user); if (staff) return staff;
  const ro = requireWrite(user); if (ro) return ro;
  // Scope by the parent labour's shop (labour_advance has no shop_id column of its own).
  const scope = user.role === "superadmin" ? {} : { labour: { shop_id: user.shop_id } };
  const existing: any = await withRetry(() => prisma.labourAdvance.findFirst({
    where: { id: params.id, deleted_at: null, ...scope },
    include: { labour: true },
  } as any));
  if (!existing) return NextResponse.json({ detail: "Not found" }, { status: 404 });
  const reason = new URL(req.url).searchParams.get("reason") || "labour_advance_delete";
  await withRetry(() => prisma.labourAdvance.update({
    where: { id: params.id },
    data: { deleted_at: new Date(), deleted_by: user.sub, deleted_by_username: user.username, delete_reason: reason } as any,
  }));
  // Remove the linked expense so accounting stays reconciled.
  const linkRows = await prisma.$queryRaw<{ expense_id: string }[]>`SELECT expense_id FROM labour_advances WHERE id::text = ${params.id} LIMIT 1`;
  const expenseId = linkRows[0]?.expense_id;
  if (expenseId) {
    await withRetry(() => prisma.$executeRaw`UPDATE expenses SET deleted_at = now() WHERE id::text = ${expenseId} AND deleted_at IS NULL`);
  }
  await logDataAction(req, user, {
    action: "labour_advance.soft_deleted",
    shop_id: existing.labour.shop_id,
    entity_type: "labour_advance",
    entity_id: existing.id,
    entity_label: `${existing.labour.name} ${existing.advance_date}`,
    metadata: { reason, amount: Number(existing.amount), description: existing.description },
  });
  return NextResponse.json({ message: "Deleted" });
}
