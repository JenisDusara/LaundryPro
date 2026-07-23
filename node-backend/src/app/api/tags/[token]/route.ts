import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import prisma, { withRetry } from "@/lib/prisma";
import { requireActiveAuth, shopFilter, requireWrite, type TokenPayload } from "@/lib/auth";
import { getShopProfile } from "@/lib/settings";

// Workflow states a staff member can set from the scan page. Only "delivered" also flips the
// billing-facing delivery_status (and stamps delivered_at); the rest are purely operational.
const TAG_STATUSES = new Set(["collected", "in_process", "ready", "delivered", "issue"]);

type Row = {
  entry_id: string;
  entry_date: string;
  delivery_date: string | null;
  delivery_status: string;
  tag_status: string;
  delivered_at: Date | null;
  tag_notes: string;
  notes: string;
  shop_id: string;
  customer_name: string;
  phone: string;
  flat_number: string;
  society_name: string;
  address: string;
  scanned_seq: number | null;
  scanned_service: string | null;
  scanned_qty: number | null;
};

function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "";
}

function tokenPrefix(token: string): string {
  return token.slice(0, 8);
}

function maskPhone(phone = "", showFull = false): string {
  if (showFull) return phone;
  const digits = phone.replace(/\D/g, "");
  return digits ? `••••••${digits.slice(-4)}` : "";
}

function maskAddress(row: Row, showFull = false) {
  return {
    flat_number: row.flat_number || "",
    society_name: row.society_name || "",
    address: showFull ? row.address || "" : "",
  };
}

async function logScanAttempt(req: NextRequest, reason: string, token: string, user?: TokenPayload, shopId = "") {
  await prisma.$executeRawUnsafe(
    `INSERT INTO qr_scan_attempts (id, token_prefix, shop_id, user_id, username, ip, reason)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    randomUUID(),
    tokenPrefix(token),
    shopId,
    user?.sub || "",
    user?.username || "",
    clientIp(req),
    reason.slice(0, 120)
  ).catch(() => {});
}

async function scanLimited(req: NextRequest, user: TokenPayload): Promise<boolean> {
  const ip = clientIp(req);
  const rows = await prisma.$queryRawUnsafe<{ count: number }[]>(
    `SELECT COUNT(*)::int AS count
     FROM qr_scan_attempts
     WHERE (ip = $1 OR user_id = $2)
       AND created_at >= now() - interval '15 minutes'`,
    ip, user.sub
  ).catch(() => [{ count: 0 }]);
  return Number(rows[0]?.count || 0) >= 30;
}

async function logTagEvent(
  req: NextRequest,
  user: TokenPayload,
  row: Row,
  action: string,
  detail = "",
  token = "",
  status = ""
) {
  await prisma.$executeRawUnsafe(
    `INSERT INTO qr_tag_events (id, entry_id, shop_id, token, action, status, detail, user_id, username, ip)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    randomUUID(),
    row.entry_id,
    row.shop_id,
    token.slice(0, 120),
    action,
    status.slice(0, 40),
    detail.slice(0, 500),
    user.sub,
    user.username,
    clientIp(req)
  ).catch(() => {});
}

// Resolves a scan token to its order. Checks the order-level token first (order/stickers modes),
// then falls back to a garment-level token in entry_item_tags (item mode) — reporting which
// specific garment ("Saree 3/5") was scanned. Shop-scoped so a cross-shop token reads as 404.
async function resolve(token: string, allowedShop?: string): Promise<Row | null> {
  let rows: Row[] = await prisma.$queryRawUnsafe(
    `SELECT e.id AS entry_id, e.entry_date, e.delivery_date, e.delivery_status, e.tag_status,
            e.delivered_at, e.tag_notes, e.notes, e.shop_id,
            c.name AS customer_name, c.phone, c.flat_number, c.society_name, c.address,
            NULL::int AS scanned_seq, NULL::text AS scanned_service, NULL::int AS scanned_qty
     FROM laundry_entries e
     JOIN customers c ON c.id = e.customer_id
     WHERE e.qr_token = $1 AND e.deleted_at IS NULL AND c.deleted_at IS NULL
     LIMIT 1`,
    token
  );
  if (rows.length === 0) {
    rows = await prisma.$queryRawUnsafe(
      `SELECT e.id AS entry_id, e.entry_date, e.delivery_date, e.delivery_status, e.tag_status,
              e.delivered_at, e.tag_notes, e.notes, e.shop_id,
              c.name AS customer_name, c.phone, c.flat_number, c.society_name, c.address,
              t.seq AS scanned_seq, ei.service_name AS scanned_service, ei.quantity AS scanned_qty
       FROM entry_item_tags t
       JOIN laundry_entries e ON e.id = t.entry_id
       JOIN entry_items ei ON ei.id = t.entry_item_id
       JOIN customers c ON c.id = e.customer_id
       WHERE t.qr_token = $1 AND e.deleted_at IS NULL AND c.deleted_at IS NULL
       LIMIT 1`,
      token
    );
  }
  const row = rows[0];
  // Treat a cross-shop hit as "not found" rather than 403 — never confirm the token even exists.
  if (!row || (allowedShop && row.shop_id !== allowedShop)) return null;
  return row;
}

function isExpired(row: Row, settings: { qr_delivery_expiry_hours: number; qr_pending_expiry_days: number }): boolean {
  if (row.delivery_status !== "delivered") return false;
  // No timestamp (historical order) → treat as long-since expired.
  if (!row.delivered_at) return true;
  return Date.now() > new Date(row.delivered_at).getTime() + Math.max(0, settings.qr_delivery_expiry_hours) * 60 * 60 * 1000;
}

function isPendingExpired(row: Row, settings: { qr_pending_expiry_days: number }): boolean {
  if (row.delivery_status === "delivered") return false;
  const t = new Date(`${row.entry_date}T00:00:00`).getTime();
  if (!Number.isFinite(t)) return false;
  return Date.now() > t + Math.max(1, settings.qr_pending_expiry_days) * 24 * 60 * 60 * 1000;
}

// Public-facing scan endpoint (opened by a phone camera via /t/[token]) — but still requires the
// caller to be a logged-in staff member: requireActiveAuth gates it exactly like every other API
// route, so a photographed tag or a search-engine hit is useless without an active staff session.
export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  const user = await requireActiveAuth(req);
  if (user instanceof NextResponse) return user;
  if (await scanLimited(req, user)) {
    await logScanAttempt(req, "rate_limited", params.token, user);
    return NextResponse.json({ detail: "Too many scan attempts" }, { status: 429 });
  }

  const row = await resolve(params.token, shopFilter(user, req).shop_id);
  if (!row) {
    await logScanAttempt(req, "not_found_or_cross_shop", params.token, user);
    return NextResponse.json({ detail: "Not found" }, { status: 404 });
  }
  const revoked = await prisma.$queryRawUnsafe<{ token: string }[]>(
    `SELECT token FROM qr_revoked_tokens WHERE token = $1 LIMIT 1`,
    params.token
  );
  if (revoked[0]) {
    await logScanAttempt(req, "revoked", params.token, user, row.shop_id);
    return NextResponse.json({ detail: "Not found" }, { status: 404 });
  }
  const settings = await getShopProfile(row.shop_id);

  if (isExpired(row, settings) || isPendingExpired(row, settings)) {
    await logScanAttempt(req, "expired", params.token, user, row.shop_id);
    return NextResponse.json({ expired: true, delivered_at: row.delivered_at });
  }
  await logTagEvent(req, user, row, "tag.scan", row.scanned_seq ? `${row.scanned_service} ${row.scanned_seq}/${row.scanned_qty}` : "order", params.token, row.tag_status);

  const items: { service_name: string; quantity: number; item_status: string }[] =
    await prisma.$queryRawUnsafe(
      `SELECT service_name, quantity, item_status FROM entry_items WHERE entry_id::text = $1 ORDER BY service_name`,
      row.entry_id
    );
  const events: { action: string; status: string; detail: string; username: string; created_at: Date }[] =
    await prisma.$queryRawUnsafe(
      `SELECT action, status, detail, username, created_at
       FROM qr_tag_events
       WHERE entry_id::text = $1
       ORDER BY created_at DESC
       LIMIT 10`,
      row.entry_id
    );

  return NextResponse.json({
    expired: false,
    entry_id: row.entry_id,
    entry_date: row.entry_date,
    delivery_date: row.delivery_date,
    delivery_status: row.delivery_status,
    tag_status: row.tag_status,
    tag_notes: row.tag_notes,
    notes: settings.qr_show_order_notes ? row.notes : "",
    scanned_garment: row.scanned_seq
      ? { seq: row.scanned_seq, service_name: row.scanned_service, quantity: row.scanned_qty }
      : null,
    customer: {
      name: row.customer_name,
      phone: maskPhone(row.phone, settings.qr_show_full_phone),
      ...maskAddress(row, settings.qr_show_full_address),
    },
    items,
    events,
  });
}

// Staff update the operational status straight from the scan page. Only "delivered" touches the
// billing-facing delivery_status + delivered_at (keeping reports/accounting and the 2h expiry
// correct); every other state is stored in tag_status alone. Moving AWAY from delivered reverts
// delivery_status to pending and clears delivered_at so a re-opened tag works again.
export async function PATCH(req: NextRequest, { params }: { params: { token: string } }) {
  const user = await requireActiveAuth(req);
  if (user instanceof NextResponse) return user;
  const ro = requireWrite(user); if (ro) return ro;

  const status = new URL(req.url).searchParams.get("status") || "";
  if (!TAG_STATUSES.has(status)) return NextResponse.json({ detail: "Invalid status" }, { status: 400 });
  if (status === "delivered" && user.role === "staff") {
    return NextResponse.json({ detail: "Only admin can mark delivered from QR scan" }, { status: 403 });
  }

  const row = await resolve(params.token, shopFilter(user, req).shop_id);
  if (!row) {
    await logScanAttempt(req, "not_found_or_cross_shop", params.token, user);
    return NextResponse.json({ detail: "Not found" }, { status: 404 });
  }
  const revoked = await prisma.$queryRawUnsafe<{ token: string }[]>(
    `SELECT token FROM qr_revoked_tokens WHERE token = $1 LIMIT 1`,
    params.token
  );
  if (revoked[0]) {
    await logScanAttempt(req, "revoked", params.token, user, row.shop_id);
    return NextResponse.json({ detail: "Not found" }, { status: 404 });
  }

  if (status === "delivered") {
    await withRetry(() => prisma.$executeRaw`
      UPDATE laundry_entries SET tag_status = 'delivered', delivery_status = 'delivered', delivered_at = now()
      WHERE id::text = ${row.entry_id}
    `);
    await withRetry(() => prisma.$executeRaw`
      UPDATE entry_items SET item_status = 'delivered', delivered_qty = quantity WHERE entry_id::text = ${row.entry_id}
    `);
  } else {
    // Was it delivered before? If so, revert the billing status + expiry stamp too.
    await withRetry(() => prisma.$executeRawUnsafe(
      `UPDATE laundry_entries
       SET tag_status = $1,
           delivery_status = CASE WHEN delivery_status = 'delivered' THEN 'pending' ELSE delivery_status END,
           delivered_at = CASE WHEN delivery_status = 'delivered' THEN NULL ELSE delivered_at END
       WHERE id::text = $2`,
      status, row.entry_id
    ));
    if (row.delivery_status === "delivered") {
      await withRetry(() => prisma.$executeRaw`
        UPDATE entry_items SET item_status = 'pending', delivered_qty = 0 WHERE entry_id::text = ${row.entry_id}
      `);
    }
  }
  await logTagEvent(req, user, row, "tag.status_update", `${row.tag_status} -> ${status}`, params.token, status);

  return NextResponse.json({ message: "Updated", tag_status: status });
}
