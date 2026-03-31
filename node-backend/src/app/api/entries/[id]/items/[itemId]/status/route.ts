import { NextRequest, NextResponse } from "next/server";
import prisma, { withRetry } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string; itemId: string } }) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;
  const status = new URL(req.url).searchParams.get("status") || "pending";
  await withRetry(() => prisma.entryItem.update({ where: { id: params.itemId }, data: { item_status: status } }));
  return NextResponse.json({ message: "Updated" });
}
