import { NextResponse } from "next/server";
import { sql, ensureTables, logActivity } from "@/lib/db";
import { clientIp, requireAdmin } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = requireAdmin(req); if (auth) return auth;
  await ensureTables();
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ ok: false, error: "Bad review id" }, { status: 400 });
  }
  const body = await req.json().catch(() => ({}));

  // Publish / unpublish toggle
  if (typeof body.published === "boolean") {
    await sql`UPDATE marketing_reviews SET published = ${body.published} WHERE id = ${id}`;
    await logActivity(body.published ? "review.publish" : "review.unpublish", "review", id, "", clientIp(req));
    return NextResponse.json({ ok: true });
  }

  // Edit fields
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
  await sql`
    UPDATE marketing_reviews
    SET name = ${name}, city = ${city}, quote = ${quote}, rating = ${rating}
    WHERE id = ${id}`;
  await logActivity("review.update", "review", id, name, clientIp(req));
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = requireAdmin(req); if (auth) return auth;
  await ensureTables();
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ ok: false, error: "Bad review id" }, { status: 400 });
  }
  await sql`DELETE FROM marketing_reviews WHERE id = ${id}`;
  await logActivity("review.delete", "review", id, "", clientIp(req));
  return NextResponse.json({ ok: true });
}
