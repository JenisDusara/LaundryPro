import { NextResponse } from "next/server";
import { sql, ensureTables, logActivity } from "@/lib/db";
import { clientIp, requireAdmin } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES = ["new", "contacted", "converted"];

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = requireAdmin(req); if (auth) return auth;
  await ensureTables();
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ ok: false, error: "Bad lead id" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const action = String(body.action || "");
  if (action === "archive" || action === "restore") {
    await sql`
      UPDATE marketing_leads
      SET archived_at = CASE WHEN ${action} = 'archive' THEN now() ELSE NULL END
      WHERE id = ${id}
    `;
    await logActivity(`lead.${action}`, "lead", id, "", clientIp(req));
    return NextResponse.json({ ok: true });
  }

  const hasStatus = typeof body.status === "string";
  const status = hasStatus ? String(body.status) : "";
  if (hasStatus && !STATUSES.includes(status)) {
    return NextResponse.json({ ok: false, error: "Bad status" }, { status: 400 });
  }
  const hasNotes = typeof body.notes === "string";
  const notes = hasNotes ? String(body.notes).slice(0, 1000).trim() : "";
  const hasFollowUp = typeof body.follow_up_date === "string";
  const followUp = hasFollowUp ? String(body.follow_up_date).slice(0, 10).trim() : "";
  if (!hasStatus && !hasNotes && !hasFollowUp) {
    return NextResponse.json({ ok: false, error: "Nothing to update" }, { status: 400 });
  }

  await sql`
    UPDATE marketing_leads
    SET
      status = CASE WHEN ${hasStatus}::boolean THEN ${status} ELSE status END,
      notes = CASE WHEN ${hasNotes}::boolean THEN ${notes} ELSE notes END,
      follow_up_date = CASE WHEN ${hasFollowUp}::boolean THEN ${followUp} ELSE follow_up_date END
    WHERE id = ${id}
  `;
  await logActivity("lead.update", "lead", id, [
    hasStatus ? `status:${status}` : "",
    hasNotes ? "notes" : "",
    hasFollowUp ? `follow_up:${followUp || "clear"}` : "",
  ].filter(Boolean).join(", "), clientIp(req));
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
    return NextResponse.json({ ok: false, error: "Bad lead id" }, { status: 400 });
  }
  await sql`UPDATE marketing_leads SET archived_at = now() WHERE id = ${id}`;
  await logActivity("lead.archive", "lead", id, "", clientIp(req));
  return NextResponse.json({ ok: true });
}
