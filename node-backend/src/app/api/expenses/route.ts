import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireActiveAuth, shopFilter, requireWrite, denyStaff, writeShopId } from "@/lib/auth";
import { monthRange } from "@/lib/dates";

export async function GET(req: NextRequest) {
  const user = await requireActiveAuth(req);
  if (user instanceof NextResponse) return user;
  const staff = denyStaff(user); if (staff) return staff;
  const p = new URL(req.url).searchParams;
  const where: any = { deleted_at: null, ...shopFilter(user, req) };
  // Apply exactly ONE date filter (priority: exact day → range → month) so multiple
  // params never silently override each other; guard against NaN month/year.
  if (p.get("date")) {
    where.date = p.get("date");
  } else if (p.get("from") && p.get("to")) {
    where.date = { gte: p.get("from")!, lte: p.get("to")! };
  } else if (p.get("month") && p.get("year")) {
    const m = parseInt(p.get("month")!), y = parseInt(p.get("year")!);
    if (Number.isNaN(m) || Number.isNaN(y)) return NextResponse.json({ detail: "Invalid month/year" }, { status: 400 });
    const { start, end } = monthRange(y, m);
    where.date = { gte: start, lte: end };
  }
  const expenses = await prisma.expense.findMany({ where, orderBy: { date: "desc" } });
  return NextResponse.json(expenses.map(e => ({ ...e, amount: Number(e.amount) })));
}

export async function POST(req: NextRequest) {
  const user = await requireActiveAuth(req);
  if (user instanceof NextResponse) return user;
  const staff = denyStaff(user); if (staff) return staff;
  const ro = requireWrite(user); if (ro) return ro;
  const { date, category, description, amount } = await req.json();
  if (!date || !category || !amount) {
    return NextResponse.json({ detail: "date, category and amount are required" }, { status: 400 });
  }
  const amt = Number(amount);
  if (!Number.isFinite(amt) || amt <= 0) {
    return NextResponse.json({ detail: "Amount must be a positive number" }, { status: 400 });
  }
  const shop_id = writeShopId(user, req, "superadmin");
  const expense = await prisma.expense.create({
    data: { date, category, description: description || "", amount: Number(amount), shop_id },
  });
  return NextResponse.json({ ...expense, amount: Number(expense.amount) }, { status: 201 });
}
