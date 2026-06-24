import { NextRequest, NextResponse } from "next/server";
import prisma, { withRetry } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { delivery_status, delivery_date } = await req.json();
  const updated = await withRetry(() => prisma.laundryEntry.update({
    where: { id: params.id },
    data: { delivery_status, delivery_date: delivery_date || null },
  }));
  return NextResponse.json(updated);
}
