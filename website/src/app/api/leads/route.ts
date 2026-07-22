import { NextResponse } from "next/server";
import { sql, ensureTables } from "@/lib/db";
import { clientIp, isAuthed } from "@/lib/adminAuth";
import { sendLeadEmail } from "@/lib/mail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Public: a demo-form submission. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const name = String(body.name || "").slice(0, 120).trim();
  const shop = String(body.shop || "").slice(0, 160).trim();
  const phone = String(body.phone || "").slice(0, 40).trim();
  const email = String(body.email || "").slice(0, 160).trim();

  // Name & shop required; phone must be exactly 10 digits; email optional.
  const digits = phone.replace(/\D/g, "");
  if (!name || !shop || digits.length !== 10) {
    return NextResponse.json(
      { ok: false, error: "Name, shop and a 10-digit phone number are required" },
      { status: 400 }
    );
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "Invalid email" }, { status: 400 });
  }
  await ensureTables();
  const ip = clientIp(req);
  const recent = await sql`
    SELECT COUNT(*)::int AS count
    FROM marketing_leads
    WHERE ip = ${ip}
      AND created_at >= now() - interval '1 hour'
  `;
  if (Number(recent[0]?.count || 0) >= 5) {
    return NextResponse.json({ ok: false, error: "Too many requests. Please try again later." }, { status: 429 });
  }

  const rows = await sql`
    INSERT INTO marketing_leads (name, shop, phone, email, ip)
    VALUES (${name}, ${shop}, ${phone}, ${email}, ${ip})
    RETURNING id`;
  // Notify the owner by email (does not block or fail the submission).
  const mail = await sendLeadEmail({ name, shop, phone, email });
  await sql`
    UPDATE marketing_leads
    SET email_status = ${mail.ok ? "sent" : "failed"}, email_error = ${mail.error || ""}
    WHERE id = ${rows[0].id}
  `;
  return NextResponse.json({ ok: true, id: rows[0].id, email_status: mail.ok ? "sent" : "failed" });
}

/** Admin only: full list. */
export async function GET(req: Request) {
  if (!isAuthed()) return NextResponse.json({ ok: false }, { status: 401 });
  await ensureTables();
  const params = new URL(req.url).searchParams;
  const q = (params.get("q") || "").trim().toLowerCase().slice(0, 120);
  const qLike = `%${q}%`;
  const status = (params.get("status") || "").trim();
  const archived = params.get("archived") === "1";
  const from = (params.get("from") || "").trim().slice(0, 10);
  const to = (params.get("to") || "").trim().slice(0, 10);
  const follow = (params.get("follow") || "").trim();

  const leads = await sql`
    SELECT *
    FROM marketing_leads
    WHERE (${archived}::boolean = false AND archived_at IS NULL OR ${archived}::boolean = true AND archived_at IS NOT NULL)
      AND (${status} = '' OR status = ${status})
      AND (
        ${q} = ''
        OR lower(name) LIKE ${qLike}
        OR lower(shop) LIKE ${qLike}
        OR lower(phone) LIKE ${qLike}
        OR lower(email) LIKE ${qLike}
      )
      AND (${from} = '' OR to_char(created_at, 'YYYY-MM-DD') >= ${from})
      AND (${to} = '' OR to_char(created_at, 'YYYY-MM-DD') <= ${to})
      AND (${follow} != 'due' OR follow_up_date != '' AND follow_up_date <= to_char(now(), 'YYYY-MM-DD'))
    ORDER BY created_at DESC
    LIMIT 500
  `;
  return NextResponse.json({ ok: true, leads });
}
