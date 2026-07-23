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
    const works: any[] = await withRetry(() => prisma.labourWork.findMany({
      where: { labour_id: labourId, deleted_at: null, ...labourFilter(user, req) },
      include: { labour: true },
      orderBy: { work_date: "desc" },
    } as any));
    return NextResponse.json(works.map(w => ({
      id: w.id, labour_id: w.labour_id, labour_name: w.labour.name,
      work_date: w.work_date, press_count: w.press_count,
      rate_per_piece: Number(w.rate_per_piece),
      total: w.press_count * Number(w.rate_per_piece),
    })));
  }

  // Date-range (from/to) takes precedence — used by the Reports labour report; else month/year.
  const from = p.get("from"); const to = p.get("to");
  const range = from && to
    ? { start: from, end: to }
    : monthRange(parseInt(p.get("year") || String(new Date().getFullYear())), parseInt(p.get("month") || "1"));
  const works: any[] = await withRetry(() => prisma.labourWork.findMany({
    where: { work_date: { gte: range.start, lte: range.end }, deleted_at: null, ...labourFilter(user, req) },
    include: { labour: true },
    orderBy: { work_date: "asc" },
  } as any));
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
  const user = await requireActiveAuth(req);
  if (user instanceof NextResponse) return user;
  const staff = denyStaff(user); if (staff) return staff;
  const ro = requireWrite(user); if (ro) return ro;
  const { labour_id, work_date, press_count, rate_per_piece } = await req.json();
  const pc = Number(press_count);
  const rate = rate_per_piece == null || rate_per_piece === "" ? 2 : Number(rate_per_piece);
  if (!labour_id || !work_date || !Number.isInteger(pc) || pc < 0 || !Number.isFinite(rate) || rate < 0) {
    return NextResponse.json({ detail: "labour_id, work_date, a whole press count ≥ 0 and a rate ≥ 0 are required" }, { status: 400 });
  }

  // Verify the labour belongs to the caller's shop before writing work against it.
  const labour = await prisma.labour.findFirst({
    where: { id: labour_id, ...(user.role === "superadmin" ? {} : { shop_id: user.shop_id }) },
    select: { id: true, name: true },
  });
  if (!labour) return NextResponse.json({ detail: "Labour not found" }, { status: 404 });

  // Atomic upsert on the (labour_id, work_date) unique index. The old check-then-create was
  // racy: two near-simultaneous submits for the same day both missed the existence check and
  // created two rows, silently doubling this labourer's press count / pay. ON CONFLICT makes
  // "one row per labourer per day" a database guarantee. Raw SQL (like payments/delivery_date
  // elsewhere) so it works without regenerating the Prisma client on the running dev server.
  const rows = await withRetry(() => prisma.$queryRaw<{
    id: string; labour_id: string; work_date: string; press_count: number; rate_per_piece: number;
  }[]>`
    INSERT INTO labour_work (id, labour_id, work_date, press_count, rate_per_piece, created_at)
    VALUES (gen_random_uuid(), ${labour_id}, ${work_date}, ${pc}, ${rate}::numeric, now())
    ON CONFLICT (labour_id, work_date)
    DO UPDATE SET press_count = EXCLUDED.press_count, rate_per_piece = EXCLUDED.rate_per_piece,
                  deleted_at = NULL, deleted_by = '', deleted_by_username = '', delete_reason = ''
    RETURNING id::text, labour_id::text, work_date, press_count, rate_per_piece::float8 AS rate_per_piece
  `);
  const w = rows[0];
  return NextResponse.json({
    id: w.id, labour_id: w.labour_id, labour_name: labour.name,
    work_date: w.work_date, press_count: w.press_count, rate_per_piece: Number(w.rate_per_piece),
    total: w.press_count * Number(w.rate_per_piece),
  }, { status: 201 });
}
