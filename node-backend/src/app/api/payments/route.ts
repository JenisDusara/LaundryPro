import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma, { withRetry } from "@/lib/prisma";
import { requireAuth, shopFilter, requireWrite } from "@/lib/auth";
import { monthRange, todayIST } from "@/lib/dates";

const METHODS = ["cash", "upi", "card", "other"];

// Payments are stored via raw SQL (the generated Prisma client is not regenerated in the
// running dev server), matching how delivery_date is handled elsewhere.

// Builds the shop scope as a SQL fragment for the payments table alias `p`.
function shopSql(user: { role: string; shop_id: string }, req: NextRequest): Prisma.Sql {
  if (user.role !== "superadmin") return Prisma.sql`p.shop_id = ${user.shop_id}`;
  const selected = req.headers.get("x-selected-shop");
  return selected ? Prisma.sql`p.shop_id = ${selected}` : Prisma.sql`TRUE`;
}

export async function GET(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;

  const p = new URL(req.url).searchParams;
  const conds: Prisma.Sql[] = [shopSql(user, req)];
  if (p.get("month") && p.get("year")) {
    const { start, end } = monthRange(parseInt(p.get("year")!), parseInt(p.get("month")!));
    conds.push(Prisma.sql`p.date >= ${start} AND p.date <= ${end}`);
  }
  if (p.get("date")) conds.push(Prisma.sql`p.date = ${p.get("date")}`);
  if (p.get("customer_id")) conds.push(Prisma.sql`p.customer_id = ${p.get("customer_id")}`);
  if (p.get("method")) conds.push(Prisma.sql`p.method = ${p.get("method")}`);
  const where = Prisma.sql`WHERE ${Prisma.join(conds, " AND ")}`;

  const rows = await withRetry(() => prisma.$queryRaw<{
    id: string; customer_id: string; customer_name: string;
    amount: number; method: string; date: string; note: string; created_at: Date;
  }[]>`
    SELECT p.id::text, p.customer_id::text, c.name AS customer_name,
           p.amount::float8 AS amount, p.method, p.date, p.note, p.created_at
    FROM payments p
    JOIN customers c ON c.id = p.customer_id
    ${where}
    ORDER BY p.date DESC, p.created_at DESC
  `);

  // Method breakdown so the UI can show cash vs UPI vs card at a glance.
  const summary = { total: 0, cash: 0, upi: 0, card: 0, other: 0, count: rows.length };
  for (const r of rows) {
    const amt = Number(r.amount);
    summary.total += amt;
    if (r.method === "cash" || r.method === "upi" || r.method === "card") summary[r.method] += amt;
    else summary.other += amt;
  }

  return NextResponse.json({ payments: rows, summary });
}

export async function POST(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;
  const ro = requireWrite(user); if (ro) return ro;

  const { customer_id, amount, method, date, note } = await req.json();
  const amt = Number(amount);
  if (!customer_id || !amt || amt <= 0) {
    return NextResponse.json({ detail: "customer_id and a positive amount are required" }, { status: 400 });
  }
  const pmethod = METHODS.includes(method) ? method : "cash";
  const pdate = date || todayIST();

  // Verify the customer belongs to the caller's shop; bind the payment to the customer's shop
  // (same rule as entries — a superadmin's payment lands in the selected shop, not "superadmin").
  const customer = await prisma.customer.findFirst({ where: { id: customer_id, ...shopFilter(user, req) } });
  if (!customer) return NextResponse.json({ detail: "Customer not found" }, { status: 404 });

  const rows = await withRetry(() => prisma.$queryRaw<{
    id: string; customer_id: string; amount: number; method: string; date: string; note: string; created_at: Date;
  }[]>`
    INSERT INTO payments (id, customer_id, amount, method, date, note, shop_id, created_at)
    VALUES (gen_random_uuid(), ${customer_id}, ${amt}::numeric, ${pmethod}, ${pdate}, ${note || ""}, ${customer.shop_id}, now())
    RETURNING id::text, customer_id::text, amount::float8 AS amount, method, date, note, created_at
  `);

  return NextResponse.json({ ...rows[0], customer_name: customer.name }, { status: 201 });
}
