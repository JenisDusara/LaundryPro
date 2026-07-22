import { NextResponse } from "next/server";
import { ensureTables, sql } from "@/lib/db";
import { isAuthed } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!isAuthed()) return NextResponse.json({ ok: false }, { status: 401 });
  await ensureTables();
  const activity = await sql`
    SELECT id, action, entity, entity_id, detail, ip, created_at
    FROM marketing_admin_activity
    ORDER BY created_at DESC
    LIMIT 100
  `;
  return NextResponse.json({ ok: true, activity });
}
