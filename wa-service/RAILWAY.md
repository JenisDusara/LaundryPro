# WA-Service — Railway Deployment

Deploy the WhatsApp (Baileys) service on Railway. Railway runs a persistent
process (unlike Vercel), gives an automatic HTTPS URL, and deploys straight from
GitHub. ~10 minutes.

> **Plan:** use Railway's paid **Hobby (~$5/mo)** — the free trial credit runs
> out because this service runs 24/7. A persistent **Volume** is required so
> WhatsApp logins survive restarts.

## 1. Create the service

1. Go to **railway.com** → **New Project** → **Deploy from GitHub repo** →
   pick your **LaundryPro** repo (authorize Railway if asked).
2. After it creates the service, open **Settings** of that service.

## 2. Point it at the wa-service folder

- **Settings → Source → Root Directory:** set to **`wa-service`**
  (so Railway builds/runs only this folder — it auto-detects Node and runs
  `npm install` + `npm start`).

## 3. Add a persistent volume (for WhatsApp sessions)

- **Settings → Volumes → New Volume**
- **Mount path:** `/data`

## 4. Set variables

**Settings → Variables → add:**

```
WA_SHARED_SECRET = <your long random secret — SAME as in Vercel>
SESSIONS_DIR     = /data/sessions
```

Do **not** set `PORT` — Railway injects it automatically and the service reads it.

## 5. Get the public URL

- **Settings → Networking → Generate Domain**
- You'll get something like **`https://wa-service-production-xxxx.up.railway.app`**.
- Test it: open `https://<that-url>/health` → should show `{"ok":true,...}`.

## 6. Connect the Vercel app

Vercel → your project → **Settings → Environment Variables** (Production):

```
WA_SERVICE_URL   = https://<your-railway-domain>
WA_SHARED_SECRET = <the same secret as step 4>
```

Then **Redeploy** the Vercel app.

## 7. Per-shop: link the number

Each shop, once: **Settings → WhatsApp → Connect** → scan the QR with the shop's
dedicated WhatsApp number (Linked Devices) → **Connected** → turn on **Auto-send**
→ Save. Every new bill now messages the customer automatically from that number.

---

## Notes

- **Redeploys are safe** — sessions live on the `/data` volume, so shops don't
  re-scan after a redeploy.
- **Logs:** Railway service → Deployments → view logs (look for
  "WA-Service listening" and per-shop "connected as …").
- **Cost control:** one small service handles all shops; RAM ≈ 30–80 MB per
  connected shop.
- If a shop shows "logged out" later (number unlinked from phone), it just needs
  to Connect + scan again.
