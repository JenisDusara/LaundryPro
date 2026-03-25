import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;
  const { name, price, parent_id } = await req.json();
  const service = await prisma.service.update({
    where: { id: params.id },
    data: { name, price: price ?? null, parent_id: parent_id || null },
  });
  return NextResponse.json(service);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;
  await prisma.service.update({ where: { id: params.id }, data: { is_active: false } });
  return NextResponse.json({ message: "Deactivated" });
}
