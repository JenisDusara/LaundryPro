import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma, { withRetry } from "@/lib/prisma";
import { requireActiveAuth, requireWrite, denyStaff } from "@/lib/auth";
import { monthRange, todayIST } from "@/lib/dates";

const METHODS = ["cash", "upi", "card", "other"];

// Payouts to labourers are stored via raw SQL (the generated Prisma client is not regenerated in
// the running dev server), matching how customer payments and delivery_date are handled.

// Shop scope as a SQL fragment for the labour_payments alias `lp`.
function shopSql(user: { role: string; shop_id: string }, req: NextRequest): Prisma.Sql {
  if (user.role !== "superadmin") return Prisma.sql`lp.shop_id = ${user.shop_id}`;
  const selected = req.headers.get("x-selected-shop");
  return selected ? Prisma.sql`lp.shop_id = ${selected}` : Prisma.sql`TRUE`;
}

type Row = {
  id: string; labour_id: string; labour_name: string; period: string;
  pay_date: string; amount: number; method: string; note: string;
  paid_by_username: string; created_at: Date;
};

export async function GET(req: NextRequest) {
  const user = await requireActiveAuth(req);
  if (user instanceof NextResponse) return user;
  const staff = denyStaff(user); if (staff) return staff;

  const p = new URL(req.url).searchParams;
  const conds: Prisma.Sql[] = [shopSql(user, req), Prisma.sql`lp.deleted_at IS NULL`];
  if (p.get("labour_id")) conds.push(Prisma.sql`lp.labour_id = ${p.get("labour_id")}`);
  if (p.get("month") && p.get("year")) {
    const { start, end } = monthRange(parseInt(p.get("year")!), parseInt(p.get("month")!));
    conds.push(Prisma.sql`lp.pay_date >= ${start} AND lp.pay_date <= ${end}`);
  }
  if (p.get("from") && p.get("to")) conds.push(Prisma.sql`lp.pay_date >= ${p.get("from")} AND lp.pay_date <= ${p.get("to")}`);
  const where = Prisma.sql`WHERE ${Prisma.join(conds, " AND ")}`;

  const rows = await withRetry(() => prisma.$queryRaw<Row[]>`
    SELECT lp.id::text, lp.labour_id::text, l.name AS labour_name, lp.period,
           lp.pay_date, lp.amount::float8 AS amount, lp.method, lp.note,
           lp.paid_by_username, lp.created_at
    FROM labour_payments lp
    JOIN labours l ON l.id = lp.labour_id
    ${where}
    ORDER BY lp.pay_date DESC, lp.created_at DESC
  `);
  return NextResponse.json(rows.map(r => ({ ...r, amount: Number(r.amount) })));
}

export async function POST(req: NextRequest) {
  const user = await requireActiveAuth(req);
  if (user instanceof NextResponse) return user;
  const staff = denyStaff(user); if (staff) return staff;
  const ro = requireWrite(user); if (ro) return ro;

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ detail: "Invalid request body" }, { status: 400 }); }
  const { labour_id, period, pay_date, amount, method, note } = body;
  const amt = Number(amount);
  if (!labour_id || !amt || amt <= 0) {
    return NextResponse.json({ detail: "labour_id and a positive amount are required" }, { status: 400 });
  }
  const pmethod = METHODS.includes(method) ? method : "cash";
  const pdate = pay_date || todayIST();

  // Verify the labour belongs to the caller's shop; bind the payment to the labour's shop.
  const labour = await prisma.labour.findFirst({
    where: { id: labour_id, ...(user.role === "superadmin" ? {} : { shop_id: user.shop_id }) },
    select: { id: true, shop_id: true, name: true },
  });
  if (!labour) return NextResponse.json({ detail: "Labour not found" }, { status: 404 });

  // Mirror the payout into the expenses ledger so accounting/reports stay accurate. The two are
  // linked via expense_id so deleting the payout removes the matching expense.
  const periodLabel = period ? ` (${period})` : "";
  const expense = await prisma.expense.create({
    data: {
      date: pdate, category: "Labour",
      description: `Labour payment — ${labour.name}${periodLabel}${note ? ` · ${note}` : ""}`,
      amount: amt, shop_id: labour.shop_id,
    },
  });

  const rows = await withRetry(() => prisma.$queryRaw<Row[]>`
    INSERT INTO labour_payments (id, labour_id, period, pay_date, amount, method, note, shop_id, paid_by, paid_by_username, expense_id, created_at)
    VALUES (gen_random_uuid(), ${labour_id}, ${period || ""}, ${pdate}, ${amt}::numeric, ${pmethod}, ${note || ""}, ${labour.shop_id}, ${user.sub || ""}, ${user.username || ""}, ${expense.id}, now())
    RETURNING id::text, labour_id::text, period, pay_date, amount::float8 AS amount, method, note, paid_by_username, created_at
  `);
  return NextResponse.json({ ...rows[0], amount: Number(rows[0].amount), labour_name: labour.name }, { status: 201 });
}
