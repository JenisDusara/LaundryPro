import { NextRequest, NextResponse } from "next/server";
import prisma, { withRetry } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;
  const p = new URL(req.url).searchParams;
  const labourId = p.get("labour_id");

  // If labour_id given → return full history for that labour (no month filter)
  if (labourId) {
    const works = await withRetry(() => prisma.labourWork.findMany({
      where: { labour_id: labourId },
      include: { labour: true },
      orderBy: { work_date: "desc" },
    }));
    return NextResponse.json(works.map(w => ({
      id: w.id, labour_id: w.labour_id, labour_name: w.labour.name,
      work_date: w.work_date, press_count: w.press_count,
      rate_per_piece: Number(w.rate_per_piece),
      total: w.press_count * Number(w.rate_per_piece),
    })));
  }

  const month = parseInt(p.get("month") || "1");
  const year = parseInt(p.get("year") || String(new Date().getFullYear()));
  const start = new Date(year, month - 1, 1).toISOString().slice(0, 10);
  const end = new Date(year, month, 0).toISOString().slice(0, 10);
  const works = await withRetry(() => prisma.labourWork.findMany({
    where: { work_date: { gte: start, lte: end } },
    include: { labour: true },
    orderBy: { work_date: "asc" },
  }));
  return NextResponse.json(works.map(w => ({
    id: w.id,
    labour_id: w.labour_id,
    labour_name: w.labour.name,
    work_date: w.work_date,
    press_count: w.press_count,
    rate_per_piece: Number(w.rate_per_piece),
    total: w.press_count * Number(w.rate_per_piece),
  })));
}

export async function POST(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;
  const { labour_id, work_date, press_count, rate_per_piece } = await req.json();
  const existing = await prisma.labourWork.findFirst({ where: { labour_id, work_date } });
  if (existing) {
    const updated = await prisma.labourWork.update({
      where: { id: existing.id },
      data: { press_count, rate_per_piece },
      include: { labour: true },
    });
    return NextResponse.json({ ...updated, total: updated.press_count * Number(updated.rate_per_piece) });
  }
  const work = await prisma.labourWork.create({
    data: { labour_id, work_date, press_count, rate_per_piece },
    include: { labour: true },
  });
  return NextResponse.json({ ...work, total: work.press_count * Number(work.rate_per_piece) }, { status: 201 });
}
