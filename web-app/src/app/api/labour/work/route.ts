import { NextRequest, NextResponse } from "next/server";
import prisma, { withRetry } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { labour_id, work_date, press_count, rate_per_piece } = await req.json();
  if (!labour_id || !work_date || !press_count) return NextResponse.json({ detail: "Missing fields" }, { status: 400 });
  const work = await withRetry(() => prisma.labourWork.create({ data: { labour_id, work_date, press_count: Number(press_count), rate_per_piece: rate_per_piece || 2 } }));
  return NextResponse.json(work, { status: 201 });
}
