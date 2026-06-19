import { NextRequest, NextResponse } from "next/server";
import prisma, { withRetry } from "@/lib/prisma";
import { requireAuth, shopFilter } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;
  const { name } = await req.json();
  const labour = await withRetry(() => prisma.labour.updateMany({
    where: { id: params.id, ...shopFilter(user, req) },
    data: { name },
  }));
  return NextResponse.json(labour);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;
  await withRetry(() => prisma.labour.updateMany({
    where: { id: params.id, ...shopFilter(user, req) },
    data: { is_active: false },
  }));
  return NextResponse.json({ message: "Deactivated" });
}
