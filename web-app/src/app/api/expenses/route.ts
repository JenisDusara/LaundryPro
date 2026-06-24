import { NextRequest, NextResponse } from "next/server";
import prisma, { withRetry } from "@/lib/prisma";

const SHOP = process.env.SHOP_ID || "shop1";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month"); const year = searchParams.get("year");
  const where: any = { shop_id: SHOP };
  if (month && year) { const m = month.padStart(2,"0"); where.date = { gte: `${year}-${m}-01`, lte: `${year}-${m}-31` }; }
  const expenses = await withRetry(() => prisma.expense.findMany({ where, orderBy: { date: "desc" } }));
  return NextResponse.json(expenses);
}

export async function POST(req: NextRequest) {
  const { date, category, description, amount } = await req.json();
  if (!date || !category || !amount) return NextResponse.json({ detail: "Missing fields" }, { status: 400 });
  const expense = await withRetry(() => prisma.expense.create({ data: { date, category, description: description || "", amount: parseFloat(amount), shop_id: SHOP } }));
  return NextResponse.json(expense, { status: 201 });
}
