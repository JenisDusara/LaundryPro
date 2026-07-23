import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import prisma, { withRetry } from "@/lib/prisma";
import { requireActiveAuth, shopFilter, requireWrite, type TokenPayload } from "@/lib/auth";
import { getShopProfile } from "@/lib/settings";
import { makeToken, qrDataUrl, tagUrl } from "@/lib/qr";

const MODES = new Set(["order", "stickers", "item"]);

function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "";
}

async function logTagEvent(
  req: NextRequest,
  user: TokenPayload,
  entry: { id: string; shop_id: string },
  action: string,
  detail = "",
  token = "",
  status = "",
  mode = ""
) {
  await prisma.$executeRawUnsafe(
    `INSERT INTO qr_tag_events (id, entry_id, shop_id, token, action, status, mode, detail, user_id, username, ip)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    randomUUID(),
    entry.id,
    entry.shop_id,
    token.slice(0, 120),
    action,
    status.slice(0, 40),
    mode.slice(0, 40),
    detail.slice(0, 500),
    user.sub,
    user.username,
    clientIp(req)
  ).catch(() => {});
}

function maskPhone(phone = "", showFull = false): string {
  if (showFull) return phone;
  const digits = phone.replace(/\D/g, "");
  return digits ? `••••••${digits.slice(-4)}` : "";
}

function maskAddress(customer: any, showFull = false): { flat_number: string; society_name: string; address: string } {
  if (showFull) return {
    flat_number: customer?.flat_number ?? "",
    society_name: customer?.society_name ?? "",
    address: customer?.address ?? "",
  };
  return {
    flat_number: customer?.flat_number ?? "",
    society_name: customer?.society_name ?? "",
    address: "",
  };
}

async function revokeToken(user: TokenPayload, entry: { id: string; shop_id: string }, token: string | null | undefined, reason: string) {
  if (!token) return;
  await prisma.$executeRawUnsafe(
    `INSERT INTO qr_revoked_tokens (token, entry_id, shop_id, reason, revoked_by, username)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (token) DO UPDATE SET reason = EXCLUDED.reason, revoked_by = EXCLUDED.revoked_by, username = EXCLUDED.username, revoked_at = now()`,
    token,
    entry.id,
    entry.shop_id,
    reason.slice(0, 300),
    user.sub,
    user.username
  ).catch(() => {});
}

// Generates (or backfills) QR tokens for an order and returns everything the print view needs —
// idempotent, so re-opening the print page after the first generation just re-fetches the same
// tokens instead of rotating them. The tag columns / entry_item_tags table aren't in the generated
// Prisma client yet (schema drift, same as delivery_date), so they're read/written via raw SQL,
// matching the rest of this codebase's pattern for newly-added columns.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireActiveAuth(req);
  if (user instanceof NextResponse) return user;
  const ro = requireWrite(user); if (ro) return ro;

  let body: any = {};
  try { body = await req.json(); } catch { /* no body sent — defaults below */ }
  const mode = MODES.has(body.mode) ? body.mode : "order";
  const tagNotes = typeof body.tag_notes === "string" ? body.tag_notes.slice(0, 500) : undefined;
  const regenerate = body.regenerate === true;
  const regenerateReason = typeof body.reason === "string" ? body.reason.trim().slice(0, 300) : "";
  const labels = body.labels && typeof body.labels === "object" ? body.labels as Record<string, unknown> : {};
  if (regenerate) {
    if (user.role === "staff") return NextResponse.json({ detail: "Forbidden" }, { status: 403 });
    if (!regenerateReason) return NextResponse.json({ detail: "Regenerate reason is required" }, { status: 400 });
  }

  const entry = await withRetry(() => prisma.laundryEntry.findFirst({
    where: { id: params.id, deleted_at: null, ...shopFilter(user, req) },
    include: { customer: true },
  } as any));
  if (!entry) return NextResponse.json({ detail: "Not found" }, { status: 404 });
  const profile = await getShopProfile(entry.shop_id);

  const rows: { qr_token: string | null; tag_notes: string; delivery_date: string | null }[] =
    await prisma.$queryRawUnsafe(
      `SELECT qr_token, tag_notes, delivery_date FROM laundry_entries WHERE id::text = $1`,
      params.id
    );
  let orderToken = rows[0]?.qr_token ?? null;
  if (!orderToken || (regenerate && mode !== "item")) {
    if (regenerate && orderToken) await revokeToken(user, entry, orderToken, regenerateReason);
    orderToken = makeToken();
    await prisma.$executeRawUnsafe(`UPDATE laundry_entries SET qr_token = $1 WHERE id::text = $2`, orderToken, params.id);
    if (regenerate) await logTagEvent(req, user, entry, "tag.regenerate", regenerateReason, orderToken, "", mode);
  }
  await prisma.$executeRawUnsafe(
    `UPDATE laundry_entries SET tag_mode = $1, tag_notes = COALESCE($3, tag_notes) WHERE id::text = $2`,
    mode, params.id, tagNotes ?? null
  );
  if (tagNotes !== undefined) await logTagEvent(req, user, entry, "tag.note_update", "", orderToken || "", "", mode);

  const itemRows: { id: string; service_name: string; quantity: number }[] =
    await prisma.$queryRawUnsafe(
      `SELECT id::text, service_name, quantity FROM entry_items WHERE entry_id::text = $1 ORDER BY service_name`,
      params.id
    );

  type Tag = { token: string; url: string; qr_data_url: string; label: string };
  const tags: Tag[] = [];

  if (mode === "item") {
    if (regenerate) {
      const oldTokens: { qr_token: string }[] = await prisma.$queryRawUnsafe(
        `SELECT qr_token FROM entry_item_tags WHERE entry_id::text = $1`,
        params.id
      );
      for (const old of oldTokens) await revokeToken(user, entry, old.qr_token, regenerateReason);
      await prisma.$executeRawUnsafe(`DELETE FROM entry_item_tags WHERE entry_id::text = $1`, params.id);
      await logTagEvent(req, user, entry, "tag.regenerate", regenerateReason, "", "", mode);
    }
    // True garment-level: an item of quantity N gets N individual tags (Saree 1/5 … 5/5), each
    // its own token in entry_item_tags. Reuse any already-generated rows so re-printing is stable;
    // only create the ones that are missing (idempotent, and safe if quantity grew on an edit).
    for (const it of itemRows) {
      await prisma.$executeRawUnsafe(
        `DELETE FROM entry_item_tags WHERE entry_item_id::text = $1 AND seq > $2`,
        it.id, it.quantity
      );
      const existing: { seq: number; qr_token: string; label: string }[] = await prisma.$queryRawUnsafe(
        `SELECT seq, qr_token, label FROM entry_item_tags WHERE entry_item_id::text = $1 ORDER BY seq`,
        it.id
      );
      const bySeq = new Map(existing.map(r => [r.seq, r]));
      for (let seq = 1; seq <= it.quantity; seq++) {
        let row = bySeq.get(seq);
        if (!row) {
          const token = makeToken();
          await prisma.$executeRawUnsafe(
            `INSERT INTO entry_item_tags (id, entry_id, entry_item_id, seq, qr_token)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (entry_item_id, seq) DO NOTHING`,
            randomUUID(), params.id, it.id, seq, token
          );
          const created: { seq: number; qr_token: string; label: string }[] = await prisma.$queryRawUnsafe(
            `SELECT seq, qr_token, label FROM entry_item_tags WHERE entry_item_id::text = $1 AND seq = $2 LIMIT 1`,
            it.id, seq
          );
          row = created[0] ?? { seq, qr_token: token, label: "" };
        }
        const rawLabel = labels[row.qr_token];
        if (typeof rawLabel === "string" && rawLabel.slice(0, 120) !== row.label) {
          const label = rawLabel.slice(0, 120).trim();
          await prisma.$executeRawUnsafe(
            `UPDATE entry_item_tags SET label = $1 WHERE qr_token = $2`,
            label, row.qr_token
          );
          row = { ...row, label };
          await logTagEvent(req, user, entry, "tag.label_update", `${it.service_name} ${seq}/${it.quantity}: ${label}`, row.qr_token, "", mode);
        }
        const url = tagUrl(row.qr_token, req);
        const custom = row.label ? ` - ${row.label}` : "";
        tags.push({ token: row.qr_token, url, qr_data_url: await qrDataUrl(url), label: `${it.service_name} ${seq}/${it.quantity}${custom}` });
      }
    }
  } else if (mode === "stickers") {
    const totalQty = itemRows.reduce((s, i) => s + Number(i.quantity), 0);
    const count = Math.max(1, Math.min(200, Math.floor(Number(body.count)) || totalQty || 1));
    const url = tagUrl(orderToken, req);
    const qr = await qrDataUrl(url);
    for (let i = 1; i <= count; i++) tags.push({ token: orderToken, url, qr_data_url: qr, label: `${i}/${count}` });
  } else {
    const url = tagUrl(orderToken, req);
    tags.push({ token: orderToken, url, qr_data_url: await qrDataUrl(url), label: "Order" });
  }

  await logTagEvent(req, user, entry, "tag.print_data", `${tags.length} tag(s)`, mode === "item" ? "" : orderToken, "", mode);

  return NextResponse.json({
    mode,
    entry: {
      id: entry.id,
      entry_date: entry.entry_date,
      delivery_date: rows[0]?.delivery_date ?? null,
      tag_notes: tagNotes !== undefined ? tagNotes : (rows[0]?.tag_notes ?? ""),
      items: itemRows.map(i => ({ service_name: i.service_name, quantity: i.quantity })),
    },
    customer: {
      name: (entry as any).customer?.name ?? "",
      phone: maskPhone((entry as any).customer?.phone ?? "", profile.qr_show_full_phone),
      ...maskAddress((entry as any).customer, profile.qr_show_full_address),
    },
    tags,
  });
}
