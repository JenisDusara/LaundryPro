import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma, { withRetry } from "@/lib/prisma";
import { requireActiveAuth, requireWrite, denyStaff } from "@/lib/auth";

// Soft-delete a labour payout, scoped to the caller's shop (superadmin: the selected shop).
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireActiveAuth(req);
  if (user instanceof NextResponse) return user;
  const staff = denyStaff(user); if (staff) return staff;
  const ro = requireWrite(user); if (ro) return ro;

  const shopCond: Prisma.Sql =
    user.role !== "superadmin"
      ? Prisma.sql`AND shop_id = ${user.shop_id}`
      : (() => {
          const selected = req.headers.get("x-selected-shop");
          return selected ? Prisma.sql`AND shop_id = ${selected}` : Prisma.sql``;
        })();

  // Fetch the linked expense id first (scoped), so we can soft-delete it too.
  const rows = await prisma.$queryRaw<{ expense_id: string }[]>`
    SELECT expense_id FROM labour_payments WHERE id::text = ${params.id} ${shopCond} LIMIT 1
  `;
  await withRetry(() => prisma.$executeRaw`
    UPDATE labour_payments SET deleted_at = now()
    WHERE id::text = ${params.id} ${shopCond}
  `);
  const expenseId = rows[0]?.expense_id;
  if (expenseId) {
    await withRetry(() => prisma.$executeRaw`
      UPDATE expenses SET deleted_at = now() WHERE id::text = ${expenseId} AND deleted_at IS NULL
    `);
  }
  return NextResponse.json({ message: "Deleted" });
}
