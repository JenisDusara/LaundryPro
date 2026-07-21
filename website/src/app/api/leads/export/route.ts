import { NextResponse } from "next/server";
import { sql, ensureTables } from "@/lib/db";
import { isAuthed } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cell(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET() {
  if (!isAuthed()) return NextResponse.json({ ok: false }, { status: 401 });
  await ensureTables();
  const leads = await sql`SELECT * FROM marketing_leads ORDER BY created_at DESC`;
  const cols = ["id", "name", "shop", "phone", "email", "status", "created_at"];
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
