import { NextRequest, NextResponse } from "next/server";
import prisma, { withRetry } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;
  const { name } = await req.json();
  const labour = await withRetry(() => prisma.labour.update({ where: { id: params.id }, data: { name } }));
  return NextResponse.json(labour);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;
  await prisma.labour.update({ where: { id: params.id }, data: { is_active: false } });
  return NextResponse.json({ message: "Deactivated" });
}
