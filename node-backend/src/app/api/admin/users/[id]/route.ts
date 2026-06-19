import { NextRequest, NextResponse } from "next/server";
import prisma, { withRetry } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;
  if (user.role !== "superadmin") return NextResponse.json({ detail: "Forbidden" }, { status: 403 });
  await prisma.admin.delete({ where: { id: params.id } });
  return NextResponse.json({ message: "Deleted" });
}
