import { NextRequest, NextResponse } from "next/server";
import prisma, { withRetry } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { labour_id, advance_date, amount, description } = await req.json();
  if (!labour_id || !advance_date || !amount) return NextResponse.json({ detail: "Missing fields" }, { status: 400 });
  const advance = await withRetry(() => prisma.labourAdvance.create({ data: { labour_id, advance_date, amount: parseFloat(amount), description: description || "" } }));
  return NextResponse.json(advance, { status: 201 });
}
