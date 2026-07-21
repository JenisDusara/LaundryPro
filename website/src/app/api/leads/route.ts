import { NextResponse } from "next/server";
import { sql, ensureTables } from "@/lib/db";
import { isAuthed } from "@/lib/adminAuth";
import { sendLeadEmail } from "@/lib/mail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Public: a demo-form submission. */
export async function POST(req: Request) {
  await ensureTables();
  const body = await req.json().catch(() => ({}));
  const name = String(body.name || "").slice(0, 120).trim();
  const shop = String(body.shop || "").slice(0, 160).trim();
  const phone = String(body.phone || "").slice(0, 40).trim();
  if (!name && !shop && !phone) {
    return NextResponse.json({ ok: false, error: "Empty submission" }, { status: 400 });
  }
  const rows = await sql`
    INSERT INTO marketing_leads (name, shop, phone)
    VALUES (${name}, ${shop}, ${phone})
    RETURNING id`;
  // Notify the owner by email (does not block or fail the submission).
  await sendLeadEmail({ name, shop, phone });
  return NextResponse.json({ ok: true, id: rows[0].id });
}

/** Admin only: full list. */
export async function GET() {
  if (!isAuthed()) return NextResponse.json({ ok: false }, { status: 401 });
  await ensureTables();
  const leads = await sql`SELECT * FROM marketing_leads ORDER BY created_at DESC`;
  return NextResponse.json({ ok: true, leads });
}
