import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;
  const customer = await prisma.customer.findUnique({ where: { id: params.id } });
  if (!customer) return NextResponse.json({ detail: "Not found" }, { status: 404 });
  return NextResponse.json(customer);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;
  const data = await req.json();
  const customer = await prisma.customer.update({ where: { id: params.id }, data });
  return NextResponse.json(customer);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;
  await prisma.customer.delete({ where: { id: params.id } });
  return NextResponse.json({ message: "Deleted" });
}
