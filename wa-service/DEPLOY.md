# WA-Service — VPS Deployment Guide

Run the WhatsApp (Baileys) service on an always-on VPS with a public HTTPS URL,
so the Vercel app can reach it. ~15 minutes.

## What you need

- A small **Ubuntu 22.04+ VPS** (Hetzner CX11 / DigitalOcean $5 / etc.) with SSH.
- (Recommended) a **domain or subdomain** you can point at the VPS, e.g.
  `wa.yourdomain.com` — needed for automatic HTTPS. (No domain? See Option B.)
- The `WA_SHARED_SECRET` value (same one you'll put in Vercel).

---

## 1. Install Node.js 20 + pm2

SSH into the VPS, then:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git
sudo npm install -g pm2
```

## 2. Get the code

```bash
cd ~
git clone https://github.com/JenisDusara/LaundryPro.git
cd LaundryPro/wa-service
cp .env.example .env
nano .env          # set WA_SHARED_SECRET (a long random string), keep PORT=8088
npm install
```

## 3. Start it (auto-restart + start on reboot)

```bash
pm2 start server.js --name wa-service
pm2 save
pm2 startup        # run the command it prints (sets up boot autostart)
```

Check it's up locally:

```bash
curl -s -H "x-wa-secret: YOUR_SECRET" http://localhost:8088/health
# → {"ok":true,"sessions":0}
```

## 4. Expose it publicly over HTTPS

### Option A — with a domain (recommended): Caddy (auto-HTTPS)

Point a DNS **A record** `wa.yourdomain.com → <VPS IP>` first, then:

```bash
sudo apt-get install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt-get update && sudo apt-get install -y caddy
```

Put this in `/etc/caddy/Caddyfile` (replace the domain):

```
wa.yourdomain.com {
    reverse_proxy localhost:8088
}
```

```bash
sudo systemctl restart caddy
```

Caddy auto-issues a Let's Encrypt certificate. Your public URL is now
**`https://wa.yourdomain.com`**.

### Option B — no domain (quick, less secure): open the port

```bash
sudo ufw allow 8088/tcp
```

Public URL = `http://<VPS_IP>:8088`. Works (calls are server-to-server and the
shared secret guards it), but the secret travels unencrypted — move to Option A
with a domain when you can.

## 5. Point the Vercel app at it

Vercel → your project → **Settings → Environment Variables** (Production):

```
WA_SERVICE_URL   = https://wa.yourdomain.com      (or http://<VPS_IP>:8088)
WA_SHARED_SECRET = <the same secret as wa-service/.env>
```

Then **Redeploy** the app.

## 6. Verify end-to-end

- App → Settings → WhatsApp → should now show **Connect** (not "not configured").
- Click Connect → a **QR** appears → scan with the shop's dedicated number →
  **Connected** → turn on **Auto-send** → Save.

---

## Operating notes

- **Updating the service:** `cd ~/LaundryPro && git pull && cd wa-service && npm install && pm2 restart wa-service`
- **Logs:** `pm2 logs wa-service`
- **Sessions/backups:** `wa-service/sessions/` holds each shop's WhatsApp login —
  keep it safe, back it up; deleting it forces every shop to re-scan.
- **Multiple shops:** no extra work per shop on the server — each shop just scans
  its QR from the app; sessions are created automatically under `sessions/<shop_id>/`.
- **Resources:** each connected shop ≈ 30–80 MB RAM. A 1-2 GB VPS comfortably
  handles a handful of shops.
