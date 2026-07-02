import { NextRequest, NextResponse } from "next/server";
import prisma, { withRetry } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;
  if (user.role !== "superadmin") return NextResponse.json({ detail: "Forbidden" }, { status: 403 });
  // Prevent a superadmin from deleting themselves or another superadmin account.
  if (params.id === user.sub) {
    return NextResponse.json({ detail: "You cannot delete your own account" }, { status: 400 });
  }
  const target = await prisma.admin.findUnique({ where: { id: params.id }, select: { role: true } });
  if (!target) return NextResponse.json({ detail: "Not found" }, { status: 404 });
  if (target.role === "superadmin") {
    return NextResponse.json({ detail: "Cannot delete a superadmin account" }, { status: 400 });
  }
  await prisma.admin.delete({ where: { id: params.id } });
  return NextResponse.json({ message: "Deleted" });
}
