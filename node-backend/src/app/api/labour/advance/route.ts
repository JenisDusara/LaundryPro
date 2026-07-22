import { NextRequest, NextResponse } from "next/server";
import prisma, { withRetry } from "@/lib/prisma";
import { requireActiveAuth, requireWrite, denyStaff } from "@/lib/auth";
import { monthRange } from "@/lib/dates";

function labourFilter(user: { role: string; shop_id: string }, req: NextRequest) {
  if (user.role !== "superadmin") return { labour: { shop_id: user.shop_id } };
  const selected = req.headers.get("x-selected-shop");
  return selected ? { labour: { shop_id: selected } } : {};
}

export async function GET(req: NextRequest) {
  const user = await requireActiveAuth(req);
  if (user instanceof NextResponse) return user;
  const staff = denyStaff(user); if (staff) return staff;
  const p = new URL(req.url).searchParams;
  const labourId = p.get("labour_id");

  // If labour_id given → return full history for that labour (no month filter)
  if (labourId) {
    const advances: any[] = await withRetry(() => prisma.labourAdvance.findMany({
      where: { labour_id: labourId, deleted_at: null, ...labourFilter(user, req) },
      include: { labour: true },
      orderBy: { advance_date: "desc" },
    } as any));
    return NextResponse.json(advances.map(a => ({
      id: a.id, labour_id: a.labour_id, labour_name: a.labour.name,
      advance_date: a.advance_date, amount: Number(a.amount), description: a.description,
    })));
  }

  const month = parseInt(p.get("month") || "1");
  const year  = parseInt(p.get("year")  || String(new Date().getFullYear()));
  const { start, end } = monthRange(year, month);
  const advances: any[] = await withRetry(() => prisma.labourAdvance.findMany({
    where: { advance_date: { gte: start, lte: end }, deleted_at: null, ...labourFilter(user, req) },
    include: { labour: true },
    orderBy: { advance_date: "desc" },
  } as any));
  return NextResponse.json(advances.map(a => ({
    id:           a.id,
    labour_id:    a.labour_id,
    labour_name:  a.labour.name,
    advance_date: a.advance_date,
    amount:       Number(a.amount),
    description:  a.description,
  })));
}

export async function POST(req: NextRequest) {
  const user = await requireActiveAuth(req);
  if (user instanceof NextResponse) return user;
  const staff = denyStaff(user); if (staff) return staff;
  const ro = requireWrite(user); if (ro) return ro;
  const { labour_id, advance_date, amount, description } = await req.json();
  if (!labour_id || !advance_date || !amount) {
    return NextResponse.json({ detail: "labour_id, advance_date and amount are required" }, { status: 400 });
  }
  const amt = Number(amount);
  if (!Number.isFinite(amt) || amt <= 0) {
    return NextResponse.json({ detail: "Amount must be a positive number" }, { status: 400 });
  }
  // Verify the labour belongs to the caller's shop before writing an advance against it.
  const labour = await prisma.labour.findFirst({
    where: { id: labour_id, ...(user.role === "superadmin" ? {} : { shop_id: user.shop_id }) },
    select: { id: true },
  });
  if (!labour) return NextResponse.json({ detail: "Labour not found" }, { status: 404 });
  const advance = await withRetry(() => prisma.labourAdvance.create({
    data: { labour_id, advance_date, amount: amt, description: description || "" },
    include: { labour: true },
  }));
  return NextResponse.json({
    id:           advance.id,
    labour_id:    advance.labour_id,
    labour_name:  advance.labour.name,
    advance_date: advance.advance_date,
    amount:       Number(advance.amount),
    description:  advance.description,
  }, { status: 201 });
}
