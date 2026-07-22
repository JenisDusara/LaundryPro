import { NextResponse } from "next/server";
import { sql, ensureTables, logActivity } from "@/lib/db";
import { clientIp, isAuthed, requireAdmin } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Public returns published reviews. Admin (?all=1) returns everything. */
export async function GET(req: Request) {
  await ensureTables();
  const all = new URL(req.url).searchParams.get("all") === "1";
  if (all) {
    if (!isAuthed()) return NextResponse.json({ ok: false }, { status: 401 });
    const reviews = await sql`SELECT * FROM marketing_reviews ORDER BY created_at DESC`;
    return NextResponse.json({ ok: true, reviews });
  }
  const reviews = await sql`
    SELECT id, name, city, quote, rating
    FROM marketing_reviews
    WHERE published = true
    ORDER BY created_at DESC`;
  return NextResponse.json({ ok: true, reviews });
}

/** Admin only: add a review. */
export async function POST(req: Request) {
  const auth = requireAdmin(req); if (auth) return auth;
  await ensureTables();
  const body = await req.json().catch(() => ({}));
  const name = String(body.name || "").slice(0, 120).trim();
  const city = String(body.city || "").slice(0, 80).trim();
  const quote = String(body.quote || "").slice(0, 600).trim();
  const rating = Math.min(5, Math.max(1, Number(body.rating) || 5));
  if (!name || !quote) {
    return NextResponse.json(
      { ok: false, error: "Name and review text are required" },
      { status: 400 }
    );
  }
  const rows = await sql`
    INSERT INTO marketing_reviews (name, city, quote, rating)
    VALUES (${name}, ${city}, ${quote}, ${rating})
    RETURNING id`;
  await logActivity("review.create", "review", rows[0].id, name, clientIp(req));
  return NextResponse.json({ ok: true, id: rows[0].id });
}
