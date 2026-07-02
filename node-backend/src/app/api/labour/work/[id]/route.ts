import { NextRequest, NextResponse } from "next/server";
import prisma, { withRetry } from "@/lib/prisma";
import { requireAuth, requireWrite, denyStaff } from "@/lib/auth";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;
  const staff = denyStaff(user); if (staff) return staff;
  const ro = requireWrite(user); if (ro) return ro;
  // Scope by the parent labour's shop (labour_work has no shop_id column of its own).
  const scope = user.role === "superadmin" ? {} : { labour: { shop_id: user.shop_id } };
  await withRetry(() => prisma.labourWork.deleteMany({ where: { id: params.id, ...scope } }));
  return NextResponse.json({ message: "Deleted" });
}
