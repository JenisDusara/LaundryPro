# QR Tag System Plan

Scope: `LaundryPro/node-backend`

Date: 2026-07-23

## Goal

When an order is collected, print a QR-coded tag for the garments. When staff
scan the tag (phone camera or barcode/QR scanner), a page opens showing the
customer + order details — customer name, address/flat, item list (e.g.
"Saree x5"), entry date, and pickup/delivery date — so garments belonging to
similar customers do not get mixed up. Admin can also add custom info to the
tag.

## Decisions (confirmed)

- **Tag level is admin-selectable.** All three modes are built; the collector
  chooses per order:
  1. Per order — one tag (lists all items).
  2. Per order — N identical stickers (one QR per garment, all point to the
     same order). Best for the "5 sarees" mix-up case, DB stays simple.
  3. Per item — each garment gets its own unique QR + per-item status
     (garment-level tracking).
- **Phone/address privacy:** scan page masks phone and address by default.
  Admin can enable full phone/full address from Settings only if that shop wants
  staff scans to show full PII.
- **Printer:** flexible print view that works on both thermal label printers
  and normal A4/inkjet, using the browser print dialog for sizing.

## What the QR encodes

A URL, not raw customer data:

```
https://<app-domain>/t/<token>
```

- Scanning opens that page in a browser → details render there.
- Raw PII in the QR is avoided (anyone could photograph the tag and extract it).
- Each order gets a random, unguessable `qr_token`. For per-item mode, each item
  gets its own `qr_token` too.

## Schema changes

`prisma/schema.prisma` + a migration (`prisma migrate` / `db push`):

- `LaundryEntry.qr_token String? @unique` — random token for the order scan URL.
- `LaundryEntry.tag_notes String @default("")` — admin's custom tag text.
- `LaundryEntry.tag_mode`, `tag_status`, `delivered_at` — QR print mode,
  garment workflow state, and expiry anchor after delivery.
- `EntryItemTag` — one row per physical garment sticker in per-item mode.
- `QrTagEvent` — audit trail for tag print/generate/status/update actions.
- `QrRevokedToken` — stores old tokens after regeneration so old stickers stop
  working.
- `QrScanAttempt` — stores invalid/rate-limited scan attempts without saving the
  full token.
- `ShopProfile.qr_*` fields — privacy and expiry settings per shop.

Tokens are backfilled lazily: any entry/item without a token gets one the first
time a tag is generated, so existing orders keep working.

## New / changed code

### Library
- Add `qrcode` npm dependency (server-side PNG + SVG data URLs; reused for both
  the HTML print view and any future PDF).
- `src/lib/qr.ts` — helpers: `makeToken()`, `qrDataUrl(url)`, and a
  `tagUrl(token)` builder that reads the shop's public base URL from settings.

### API
- `POST /api/entries/[id]/tag` — ensure the order (and, for per-item mode, each
  item) has a `qr_token`; returns tokens + item data. Auth via
  `requireActiveAuth`, scoped by `shopFilter`.
- `GET /t/[token]` route/page — public scan view. Looks up the order (or item)
  by token across shops (token is globally unique), renders read-only details:
  customer name, flat/society/address, phone, items, entry date, pickup/delivery
  date, and current status. Phone/address/notes are filtered by shop privacy
  settings.

### Pages / UI
- **New-entry page** (`src/app/new-entry/page.tsx`): after save, show a "Print
  Tag" action with a mode selector (per-order / N stickers / per-item) and a
  "Tag note" input. For N-sticker mode, a quantity defaulting to the item count.
- **Print view** (`src/app/entries/[id]/tag/page.tsx` or a print-optimised
  modal): renders the QR + text label(s) with `@media print` CSS that lays out
  cleanly on both a small thermal label and A4 (multiple tags per sheet).
- **Scan view** (`src/app/t/[token]/page.tsx`): the page opened by the camera.

## Security / privacy notes (final — supersedes the draft above)

- **Login required to view a scan.** `GET /api/tags/[token]` is gated by the
  same `requireActiveAuth` as every other API route — a photographed tag or a
  search-engine hit is useless without an active staff session. The `/t/[token]`
  page itself has no server-side gate (a camera can't log in), but it calls the
  protected API immediately; if the browser has no/expired staff token it is
  bounced to `/login` (remembering the tag URL via
  `sessionStorage.post_login_redirect` so it returns there after sign-in).
  This makes the feature staff-only — customers can no longer self-check status
  by scanning their own tag.
- **2-hour post-delivery expiry.** `LaundryEntry.delivered_at` is stamped
  whenever `delivery_status` flips to `"delivered"` (entry-level and per-item
  status routes) and cleared when reverted. The scan API refuses to return
  details once `now > delivered_at + 2h`, returning `{ expired: true }` instead.
  A lost/discarded tag stops working shortly after handover.
- **No search-engine indexing.** `src/app/robots.ts` disallows `/t/`, and
  `src/app/t/[token]/layout.tsx` sets `robots: { index: false, follow: false }`
  as a second layer. This does not (and cannot) block someone from scanning the
  physical tag directly — that's the intended use — it only stops the page from
  being crawled/cached and turning up in search results.
- Read-only: the scan page never mutates anything.
- Soft-deleted orders/customers (`deleted_at`) are excluded from the scan
  lookup, and a cross-shop token hit returns 404 (never confirms the token
  exists in another shop).
- Tokens use a CSPRNG (`crypto.randomBytes(16)`) and are unique-indexed.
- Production QR URLs require `PUBLIC_APP_URL` and reject non-HTTPS values. The
  app no longer trusts the request `Host` header in production when building QR
  links.
- Regenerating a tag requires an admin/superadmin reason. Old tokens are written
  to `qr_revoked_tokens`; revoked tokens return 404 and are logged.
- Invalid scan attempts are rate-limited by IP and stored with a short token
  prefix only, not the full token.
- Staff sessions are shorter lived than admin sessions.
- QR privacy settings live in Settings: full phone, full address, notes,
  pending expiry days, and post-delivery active hours.

## Rollout

1. ✅ Schema + migration, backfill helper.
2. ✅ `qrcode` dep + `src/lib/qr.ts`.
3. ✅ Tag API (`POST /api/entries/[id]/tag`) + scan API (`GET /api/tags/[token]`)
   + scan page (`/t/[token]`).
4. ✅ New-entry UI (mode buttons in the post-save banner) + print view
   (`/entries/[id]/tag`) with an editable tag note and `@media print` layout.
5. ✅ Per-item mode (`EntryItem.qr_token`/`item_label`, one QR per garment).
6. ✅ 2h post-delivery expiry (`delivered_at`) + login gate + `noindex`.
7. ⬜ Deploy: set `PUBLIC_APP_URL` (already documented in `.env.example`) on
   the live deployment so QR links point to the live domain instead of being
   derived from the request host — see `migration-deploy-checklist.md`.
8. ⬜ Apply the migration (`prisma/migrations/20260723000000_add_qr_tag`)
   against the target database — not run yet in this session.

## Review fixes (2026-07-23, second pass)

Applied after a review found gaps in the first cut:

1. **Lockfile** — `npm install` run; `package-lock.json` now pins `qrcode`,
   `@types/qrcode` and their transitive deps. `npm ci` will succeed in CI.
2. **Build verified** — `prisma generate` + `next build` run clean (type-check
   passes) with the new columns/table in the schema.
3. **True garment-level tags** — item mode no longer means "one QR per line
   item". A new `entry_item_tags` table expands an item of quantity N into N
   rows (one physical sticker per garment, "Saree 1/5 … 5/5"), each with its own
   token. `EntryItem.qr_token`/`item_label` were dropped in favour of it.
4. **Old delivered orders expire** — the migration backfills
   `delivered_at = COALESCE(updated_at, created_at)` and `tag_status='delivered'`
   for rows already `delivery_status='delivered'` (a past time → already
   expired). The scan API is also defensive: `delivered` with a NULL
   `delivered_at` is treated as expired, so nothing historical stays live.
5. **Print Tag on existing orders** — a QR button is on every order row in the
   customer detail page (`/customer/[id]`), opening the print view; the print
   view has an order/stickers/garment mode switch, so any old order can be
   tagged without hand-editing a URL.
6. **Status updates from the scan page** — a 5-state workflow (collected /
   in_process / ready / delivered / issue) lives in `LaundryEntry.tag_status`
   and is editable straight from `/t/[token]` via `PATCH /api/tags/[token]`.
   It's a superset of the billing `delivery_status` (still pending/delivered so
   reports/accounting are untouched); the two are synced at one point —
   `tag_status='delivered' ⟺ delivery_status='delivered'` (+ `delivered_at`) —
   in the scan PATCH and both existing status routes.
7. **Open-redirect hardening** — the post-login redirect only honours internal
   paths (`startsWith("/") && !startsWith("//")`), else falls back to
   `/dashboard`.

## Security / privacy fixes (2026-07-23, third pass)

1. **Config-backed public URL** — production QR links must use
   `PUBLIC_APP_URL=https://...`; request-host fallback is dev-only.
2. **PII minimisation** — phone/address are masked by default on scan results.
   Admin can opt in from Settings for each shop.
3. **Tag revocation** — regenerate requires a reason, revokes old order/item
   tokens, and keeps an audit record.
4. **Scan abuse logging** — invalid/revoked/expired scans are logged with token
   prefix + IP and rate-limited.
5. **Audit visibility foundation** — QR generate/print/update/regenerate events
   are persisted in `qr_tag_events`.
6. **Shop-level expiry controls** — pending-tag expiry days and post-delivery
   expiry hours are configurable from Settings.

## Status

- Implemented + builds clean. Not yet migrated/deployed — see rollout steps
  7–8 (set `PUBLIC_APP_URL`, apply the migration on the target DB).
