import { NextRequest, NextResponse } from "next/server";
import prisma, { withRetry } from "@/lib/prisma";
import { requireActiveAuth } from "@/lib/auth";
import { logSuperadminAction } from "@/lib/superadminAudit";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireActiveAuth(req);
  if (user instanceof NextResponse) return user;
  if (user.role !== "superadmin") return NextResponse.json({ detail: "Forbidden" }, { status: 403 });
  // Prevent a superadmin from deleting themselves or another superadmin account.
  if (params.id === user.sub) {
    return NextResponse.json({ detail: "You cannot delete your own account" }, { status: 400 });
  }
  const target = await prisma.admin.findUnique({ where: { id: params.id }, select: { role: true, shop_id: true, shop_name: true, username: true } });
  if (!target) return NextResponse.json({ detail: "Not found" }, { status: 404 });
  if (target.role === "superadmin") {
    return NextResponse.json({ detail: "Cannot delete a superadmin account" }, { status: 400 });
  }
  if (target.role === "admin") {
    await prisma.$executeRaw`UPDATE admins SET token_version = token_version + 1, is_active = false WHERE shop_id = ${target.shop_id} AND role IN ('admin','staff')`;
    await prisma.admin.deleteMany({ where: { shop_id: target.shop_id, role: { in: ["admin", "staff"] } } });
  } else {
    await prisma.$executeRaw`UPDATE admins SET token_version = token_version + 1, is_active = false WHERE id = ${params.id}`;
    await prisma.admin.delete({ where: { id: params.id } });
  }
  await logSuperadminAction(req, user, {
    action: "client.remove_access",
    target_admin_id: params.id,
    target_shop_id: target.shop_id,
    target_shop_name: target.shop_name,
    metadata: { role: target.role, username: target.username },
  });
  return NextResponse.json({ message: "Deleted" });
}
