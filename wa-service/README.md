# LaundryPro WA-Service

Always-on WhatsApp sender (Baileys) for LaundryPro. Holds **one WhatsApp session
per shop** and exposes a tiny HTTP API the LaundryPro app calls to send messages.
It must run on an **always-on machine** (VPS / a shop PC that stays on / Raspberry
Pi) — it cannot run on Netlify (serverless).

## Setup

```bash
cd wa-service
cp .env.example .env          # then edit .env, set a long WA_SHARED_SECRET
npm install
npm start
```

Set the **same** `WA_SHARED_SECRET` in the LaundryPro app's env, and point the
app at this service with `WA_SERVICE_URL` (e.g. `http://localhost:8088` if same
machine, or `https://your-host:8088`).

## How a shop links its number (one-time)

Done from the LaundryPro app: **Settings → WhatsApp → Connect** shows a QR.
The shop opens WhatsApp on its **dedicated number** → Linked Devices → scan.
Once connected, enable "Auto-send bills". The session is saved under
`sessions/<shop_id>/`, so it survives restarts (no re-scan) until the number is
unlinked.

## API (all require header `x-wa-secret: <WA_SHARED_SECRET>`)

| Method | Path | Body / Query | Purpose |
|--------|------|--------------|---------|
| POST | `/connect` | `{ shop_id }` | Start/resume a session (QR comes via /status) |
| GET  | `/status` | `?shop_id=` | `{ state, qr, number }` — state: qr/connecting/open/logged_out/disconnected |
| POST | `/send` | `{ shop_id, phone, text }` | Send a message (409 if not connected) |
| POST | `/disconnect` | `{ shop_id }` | Unlink + clear the session |
| GET  | `/health` | — | `{ ok, sessions }` |

## Notes

- Baileys is an **unofficial** WhatsApp library — use a dedicated number, send
  only to existing customers, keep volume low. Each shop's session is isolated.
- `sessions/` holds login credentials — keep it private, back it up, never commit
  it (already in `.gitignore`).
- For a large multi-shop deployment, prefer the Meta WhatsApp Cloud API — see
  `docs/whatsapp-auto-send.md`.
