import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth, shopFilter } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;
  const p = new URL(req.url).searchParams;
  const where: any = { ...shopFilter(user, req) };
  if (p.get("month") && p.get("year")) {
    const m = parseInt(p.get("month")!), y = parseInt(p.get("year")!);
    const start = new Date(y, m - 1, 1).toISOString().slice(0, 10);
    const end   = new Date(y, m, 0).toISOString().slice(0, 10);
    where.date  = { gte: start, lte: end };
  }
  if (p.get("date")) where.date = p.get("date");
  const expenses = await prisma.expense.findMany({ where, orderBy: { date: "desc" } });
  return NextResponse.json(expenses.map(e => ({ ...e, amount: Number(e.amount) })));
}

export async function POST(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;
  const { date, category, description, amount } = await req.json();
  if (!date || !category || !amount) {
    return NextResponse.json({ detail: "date, category and amount are required" }, { status: 400 });
  }
  const shop_id = user.role === "superadmin" ? "superadmin" : user.shop_id;
  const expense = await prisma.expense.create({
    data: { date, category, description: description || "", amount: Number(amount), shop_id },
  });
  return NextResponse.json({ ...expense, amount: Number(expense.amount) }, { status: 201 });
}
