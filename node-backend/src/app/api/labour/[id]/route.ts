import { NextRequest, NextResponse } from "next/server";
import prisma, { withRetry } from "@/lib/prisma";
import { requireAuth, shopFilter, requireWrite, denyStaff } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;
  const staff = denyStaff(user); if (staff) return staff;
  const ro = requireWrite(user); if (ro) return ro;
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
  const staff = denyStaff(user); if (staff) return staff;
  const ro = requireWrite(user); if (ro) return ro;
  await withRetry(() => prisma.labour.updateMany({
    where: { id: params.id, ...shopFilter(user, req) },
    data: { is_active: false },
  }));
  return NextResponse.json({ message: "Deactivated" });
}
