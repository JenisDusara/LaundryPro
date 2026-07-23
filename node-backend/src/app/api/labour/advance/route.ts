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

  // Date-range (from/to) takes precedence — used by the Payments page money-out ledger; otherwise
  // fall back to a month/year window.
  const from = p.get("from"); const to = p.get("to");
  const range = from && to
    ? { start: from, end: to }
    : monthRange(parseInt(p.get("year") || String(new Date().getFullYear())), parseInt(p.get("month") || "1"));
  const advances: any[] = await withRetry(() => prisma.labourAdvance.findMany({
    where: { advance_date: { gte: range.start, lte: range.end }, deleted_at: null, ...labourFilter(user, req) },
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
    select: { id: true, shop_id: true, name: true },
  });
  if (!labour) return NextResponse.json({ detail: "Labour not found" }, { status: 404 });
  const advance = await withRetry(() => prisma.labourAdvance.create({
    data: { labour_id, advance_date, amount: amt, description: description || "" },
    include: { labour: true },
  }));
  // An advance is cash paid to the worker → mirror it into the expenses ledger (category "Labour")
  // so accounting/reports capture it. Linked via expense_id for clean deletion.
  const expense = await prisma.expense.create({
    data: {
      date: advance_date, category: "Labour",
      description: `Labour advance — ${labour.name}${description ? ` · ${description}` : ""}`,
      amount: amt, shop_id: labour.shop_id,
    },
  });
  await withRetry(() => prisma.$executeRaw`UPDATE labour_advances SET expense_id = ${expense.id} WHERE id::text = ${advance.id}`);
  return NextResponse.json({
    id:           advance.id,
    labour_id:    advance.labour_id,
    labour_name:  advance.labour.name,
    advance_date: advance.advance_date,
    amount:       Number(advance.amount),
    description:  advance.description,
  }, { status: 201 });
}
