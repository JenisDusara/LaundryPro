# Bulk Monthly Invoices (PDF on WhatsApp + Email) — Plan & Implementation

Send **every customer with activity in a given month** their invoice for that
month **in one click** — as a proper branded **PDF** delivered over WhatsApp
(from the shop's own number) and/or email. Replaces sending invoices one
customer at a time.

## Goal

Billing runs on a monthly cycle: entries pile up through the month, and at
month-end each customer needs their bill. Doing this per-customer (open invoice
→ print/share, repeat) is slow. This feature does the whole shop's month in one
action, and sends the **same designed invoice we print** — not a plain-text
summary — so it looks professional.

- Invoice goes as a **PDF document** on WhatsApp (with a short caption) and as a
  **PDF attachment** on email.
- One shop at a time — a bill blast never mixes two shops' customers.
- WhatsApp sends are **sequential + paced** so the shop's number isn't flagged.

## Why a PDF (not a browser screenshot)

The printable invoice is styled HTML (`/api/invoices/[customerId]`). Rendering
that to an image/PDF faithfully needs a headless browser (Puppeteer), which is
heavy and unreliable on **serverless** (Netlify/Vercel). Instead we generate the
PDF directly with **`pdfkit`** (already a dependency) — pure Node, no browser,
works in a serverless function.

> **Rupee glyph:** PDFKit's built-in Helvetica has no `₹` (U+20B9) glyph, so the
> PDF uses `Rs.` for amounts. Showing `₹` would require bundling a TTF font that
> includes it.

## Flow

```
Customers page → pick month → "Send bills"
        │
        │  POST /api/invoices/bulk-send?month=&year=&channel=
        ▼
Next.js route (shop-scoped)
   1. resolve ONE shop (reject superadmin with no shop selected)
   2. load all entries for the month, group by customer
   3. decode shop logo once
   4. for each customer:
        build PDF (pdfkit)  ─┬─► WhatsApp: POST /send-media (PDF as document)  ──► WA-Service ──► customer
                             └─► Email: sendEmail(..., [PDF attachment])
   5. return { customers, waSent, emailSent, skipped, failed }
```

## Components

### 1. PDF generator — `src/lib/invoicePdf.ts` (new)
`buildInvoicePdf(data) → Promise<Buffer>`. One-page branded invoice drawn with
`pdfkit`: header band (logo + shop name + tagline + contact + GSTIN), invoice #,
Bill-To block, items table (# / Service / Qty / Rate / Amount), Total, UPI, and
footer note. Returns the PDF as a `Buffer`.

### 2. WA-Service media endpoint — `wa-service/server.js`
New `POST /send-media` (shared-secret guarded, same as `/send`):
```
{ shop_id, phone, file_base64, mimetype, filename, caption? }
```
Decodes the base64 and sends via Baileys
`sock.sendMessage(jid, { document, mimetype, fileName, caption })`. Returns 409
if that shop's session isn't `open`.

### 3. WA client helper — `src/lib/waAuto.ts`
`waSendDocument(shopId, phone, { fileBase64, filename, mimetype?, caption? })`
— best-effort (never throws), wraps `POST /send-media`. Sits next to the
existing text `waSend`.

### 4. Bulk endpoint — `src/app/api/invoices/bulk-send/route.ts` (new)
`POST` with `?month=&year=&channel=whatsapp|email|both` (default `both`).
- Auth + `requireWrite`; **shop-scoped** via `shopFilter` — if no concrete
  `shop_id` (superadmin without a shop picked) → 400, so a blast can never mix
  shops.
- Loads the month's entries (shop-scoped), groups by customer, builds one PDF
  per customer, and sends over the chosen channel(s).
- WhatsApp: PDF as a document + caption (`shop · month · total · UPI`), with a
  **~500 ms pause** between sends.
- Email: same PDF attached, short HTML body.
- Returns counts: `{ customers, waSent, emailSent, skipped, failed }`
  (`skipped` = no phone/email; `failed` = had contact but send didn't go —
  e.g. WhatsApp not connected).

### 5. UI — `src/app/customers/page.tsx`
- **"Send bills"** button in the header (uses the month already selected on the
  page).
- Modal: shows how many customers have entries that month, a channel choice
  (WhatsApp + Email / WhatsApp only / Email only), a **Send to N** button, then
  a result summary (sent / failed / skipped). Warns if WhatsApp sent 0 (likely
  not connected).

## Security & safety

- Only sends for **one shop** at a time (regular admin = own shop; superadmin =
  the shop picked in the header, else blocked).
- App ↔ WA-Service still guarded by the `x-wa-secret` shared secret.
- Sequential, paced WhatsApp sends to keep the (already low) ban risk minimal —
  same discipline as the auto-send feature.
- WhatsApp only fires if that shop's session is connected; otherwise those
  customers count as `failed` and email (if chosen) still goes.

## Deploy note ⚠️

`POST /send-media` is **new in the WA-Service** (`wa-service/server.js`). That
service runs on a separate always-on host (VPS / Railway), so it must be
**redeployed / restarted** for WhatsApp PDF sending to work. Until then, email
still works; WhatsApp document sends return "not found"/fail.

## Rollout / status

- [x] `src/lib/invoicePdf.ts` — pdfkit invoice PDF
- [x] `wa-service/server.js` — `POST /send-media`
- [x] `src/lib/waAuto.ts` — `waSendDocument`
- [x] `src/app/api/invoices/bulk-send/route.ts` — bulk endpoint (shop-scoped, paced)
- [x] `src/app/customers/page.tsx` — "Send bills" button + modal + result
- [ ] **Redeploy WA-Service** so `/send-media` is live
- [ ] (optional) Bundle a ₹-capable font to show `₹` instead of `Rs.` in the PDF
- [ ] (optional) Include the customer's outstanding (lifetime) balance on the bill
```
