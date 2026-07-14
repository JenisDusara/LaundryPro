# WhatsApp Auto-Send (Baileys) — Plan & Implementation

Automatically send a WhatsApp message to the customer when a bill/entry (and
optionally a payment) is created — no manual "open WhatsApp → tap send" step.
Multi-tenant: **each shop connects its own WhatsApp number.**

## Goal

Today the app uses a `whatsapp://send?text=...` deep link: the user taps a
button, WhatsApp opens with a pre-filled message, and they must tap send.
WhatsApp does **not** allow auto-send from a deep link (anti-spam), so true
"create bill → message auto-delivered" needs a WhatsApp connection on the
server side.

We use **Baileys** (unofficial WhatsApp Web library) because at this scale
(a few shops, ~10-15 messages/day each, all to existing customers who have the
shop saved) it is effectively free and the ban risk is low. Each shop links its
own number once via QR.

> **Scale note:** Baileys means one live WhatsApp session per shop, held by an
> always-on process. This is fine for a handful of shops. For a large SaaS
> (dozens+ of shops) the **Meta WhatsApp Cloud API** is the maintainable path
> (no sessions, no re-scans, no ban risk) — see the trade-off table at the end.

## Why it can't live in the Next.js app

The app is deployed on **Vercel (serverless)** — functions spin up per request
and die. Baileys needs a **persistent** process that holds the WhatsApp socket
and the auth session. So Baileys runs as a **separate always-on service**, and
the Vercel app talks to it over HTTP.

> On Vercel, the app's env vars (`WA_SERVICE_URL`, `WA_SHARED_SECRET`) are set in
> the Vercel dashboard (Settings → Environment Variables), and `WA_SERVICE_URL`
> must be **publicly reachable** (a VPS URL, or a Cloudflare Tunnel / ngrok URL
> for a self-hosted service) — the cloud can't reach a `localhost` service.

```
LaundryPro (Vercel)                          WA-Service (always-on: VPS / shop PC / Pi)
  entry/payment save                            multi-session Baileys
        │                                        ├─ shop1 socket (auth/shop1)
        │  POST /send                            ├─ shop2 socket (auth/shop2)
        │  { shop_id, phone, text }  ─────────►  ├─ shop3 socket ...
        │  x-wa-secret: <shared>                 │
        │                                        └─► customer's WhatsApp (auto)
        │
  Settings → "Connect WhatsApp"
        │  GET /qr, GET /status  ─────────────►  per-shop QR + connection state
```

## Components

### 1. WA-Service (new, standalone — `wa-service/`)
A small Node + Express + Baileys app, run always-on (not on Vercel).

- **Multi-session:** a `Map<shop_id, socket>`; each shop has its own auth state
  via `useMultiFileAuthState("sessions/<shop_id>")` so it stays logged in across
  restarts (no re-scan).
- **Endpoints** (all guarded by an `x-wa-secret` shared-secret header):
  - `POST /connect { shop_id }` — start/resume a session; QR is produced async.
  - `GET /status?shop_id=` — `{ state: "qr" | "connecting" | "open" | "logged_out", qr?: dataURL, number? }`.
  - `POST /send { shop_id, phone, text }` — send via that shop's socket; 409 if not connected.
  - `POST /disconnect { shop_id }` — log out + clear session.
- **Reliability:** per-session auto-reconnect; on `loggedOut` mark the shop as
  needing a fresh QR (so the UI can prompt a re-scan).
- On startup, re-initialise any shop that already has saved creds.

### 2. LaundryPro integration
- **Env:** `WA_SERVICE_URL`, `WA_SHARED_SECRET`.
- **`src/lib/waAuto.ts`** (server-side): `waSend(shopId, phone, text)`,
  `waStatus(shopId)`, `waConnect(shopId)`, `waDisconnect(shopId)` — thin HTTP
  wrappers around the WA-Service (send the shared secret).
- **Next.js API routes** (shop-scoped via `requireAuth` + `shop_id`):
  - `GET  /api/whatsapp/status`   → connection state + QR for the caller's shop
  - `POST /api/whatsapp/connect`  → begin linking (returns QR to display)
  - `POST /api/whatsapp/disconnect`
- **Settings page → WhatsApp section:**
  - "Connect WhatsApp" → shows the QR, polls status until `open`, then shows
    "Connected".
  - Toggle: **Auto-send bills on WhatsApp** (`wa_auto_enabled`).
- **DB (`ShopProfile`):** `wa_auto_enabled Boolean @default(false)` (and
  optionally `wa_number String` just for display). The session itself lives in
  the WA-Service, not the DB.
- **Trigger:** in `POST /api/entries` (and optionally `/api/payments`), after
  the record is created, if the shop has `wa_auto_enabled`, call
  `waSend(shop_id, customer.phone, message)` — best-effort (a failure never
  blocks the save), exactly like the existing email/SMS hooks.

## Onboarding flow (per shop, one-time)

1. Shop owner → **Settings → WhatsApp → Connect**.
2. App → `POST /api/whatsapp/connect` → WA-Service starts the session and
   returns a QR.
3. UI shows the QR; owner opens WhatsApp on the **dedicated number** →
   Linked Devices → scan.
4. App polls `GET /api/whatsapp/status` until `open` → shows "Connected".
5. Owner enables **Auto-send**. Done — every new bill now messages the
   customer automatically from that shop's number.

## Security & safety

- The app ↔ WA-Service link is protected by a **shared secret** header; the
  WA-Service is not otherwise public.
- Each shop's session is **isolated** — one shop's ban/disconnect never affects
  another.
- Use a **dedicated WhatsApp number** per shop (not the owner's primary), send
  only to existing customers, low volume, small random delay between sends —
  keeps the (already low) ban risk minimal.
- Auto-send is **opt-in** per shop and off by default.

## Baileys vs Meta Cloud API (for reference)

| | Baileys (this plan) | Meta Cloud API |
|---|---|---|
| Per-shop number | QR scan (occasional re-scan) | one-time onboarding |
| Server | always-on process holding all sessions | none (Meta hosts) |
| Scale (many shops) | heavy / babysit sessions | clean |
| Ban risk | low here, never zero | none |
| Cost | server only, no per-msg | small per-msg + free tier |

## Rollout / status

- [ ] `wa-service/` (multi-session Baileys + endpoints)
- [ ] `ShopProfile.wa_auto_enabled` (+ optional `wa_number`)
- [ ] `src/lib/waAuto.ts` + `/api/whatsapp/*` routes
- [ ] Settings → WhatsApp connect UI (QR + toggle)
- [ ] Auto-send hook in entries (+ payments)
- [ ] Deploy WA-Service to an always-on host; set `WA_SERVICE_URL` /
      `WA_SHARED_SECRET`
