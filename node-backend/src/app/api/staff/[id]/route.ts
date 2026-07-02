import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth, requireWrite } from "@/lib/auth";

// PATCH — toggle is_active for a staff member
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;
  if (user.role !== "admin") return NextResponse.json({ detail: "Forbidden" }, { status: 403 });
  const ro = requireWrite(user); if (ro) return ro;

  const member = await prisma.admin.findFirst({
    where: { id: params.id, role: "staff", shop_id: user.shop_id },
  });
  if (!member) return NextResponse.json({ detail: "Staff not found" }, { status: 404 });

  const { is_active } = await req.json();
  const updated = await prisma.admin.update({
    where: { id: params.id },
    data: { is_active },
  });
  return NextResponse.json({ id: updated.id, is_active: updated.is_active });
}

// DELETE — remove a staff member
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;
  if (user.role !== "admin") return NextResponse.json({ detail: "Forbidden" }, { status: 403 });
  const ro = requireWrite(user); if (ro) return ro;

  const member = await prisma.admin.findFirst({
    where: { id: params.id, role: "staff", shop_id: user.shop_id },
  });
  if (!member) return NextResponse.json({ detail: "Staff not found" }, { status: 404 });

  await prisma.admin.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
