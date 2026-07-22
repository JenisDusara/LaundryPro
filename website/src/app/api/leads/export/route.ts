import { NextResponse } from "next/server";
import { sql, ensureTables } from "@/lib/db";
import { isAuthed } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cell(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

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
    SELECT
      id, name, shop, phone, email, status, notes, follow_up_date,
      email_status, email_error, archived_at, created_at
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
  const cols = [
    "id",
    "name",
    "shop",
    "phone",
    "email",
    "status",
    "notes",
    "follow_up_date",
    "email_status",
    "email_error",
    "archived_at",
    "created_at",
  ];
  const csv = [
    cols.join(","),
    ...leads.map((l) => cols.map((c) => cell((l as Record<string, unknown>)[c])).join(",")),
  ].join("\n");
  return new Response("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="laundrymax-leads.csv"`,
    },
  });
}
