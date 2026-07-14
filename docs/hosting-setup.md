# Hosting & Deployment Setup

Where each part of LaundryPro runs in production, and how they're wired together.

> **Secrets are NOT stored in this file / repo.** Values like `WA_SHARED_SECRET`
> and `DATABASE_URL` live only in the Vercel / Railway dashboards (and local
> `.env`, which is git-ignored). This doc only records *where* they are set.

## Overview

```
┌─────────────────────┐        ┌──────────────────────────┐
│  LaundryPro app      │  HTTP  │  WA-Service (Baileys)     │        WhatsApp
│  Next.js on VERCEL   │──────► │  Node on RAILWAY          │───────► customers
│  (serverless)        │  /send │  (always-on, per-shop     │
│                      │        │   WhatsApp sessions)      │
└──────────┬───────────┘        └──────────────────────────┘
           │
           │  Prisma
           ▼
   ┌────────────────┐
   │  Neon Postgres │  (database)
   └────────────────┘
```

## Components — what runs where

| Part | Host | Notes |
|------|------|-------|
| **Web app** (`node-backend`, Next.js 14) | **Vercel** | Serverless. Auto-deploys from GitHub `main`. |
| **Database** | **Neon** (PostgreSQL) | Connection via `DATABASE_URL`. |
| **WhatsApp sender** (`wa-service`, Baileys) | **Railway** | Always-on Node service, one WhatsApp session per shop. |
| **Source code** | **GitHub** (`JenisDusara/LaundryPro`) | Both Vercel and Railway deploy from here. |

## WhatsApp feature (Baileys via Railway)

The WhatsApp auto-send can't run on Vercel (serverless has no persistent
process), so the WhatsApp connection lives in a separate always-on service on
Railway. The Vercel app calls it over HTTP to send messages.

**Railway service config**
- **Root Directory:** `wa-service`
- **Public URL:** `https://laundrypro-production-8d3c.up.railway.app`
  - Health check (public): `…/health` → `{"ok":true,"sessions":N}`
- **Target port:** `8080`
- **Volume:** mounted at `/data` (holds WhatsApp login sessions so they survive
  redeploys)
- **Variables (Railway):**
  - `WA_SHARED_SECRET` — shared secret (same value as in Vercel)
  - `SESSIONS_DIR = /data/sessions`
  - `PORT = 8080`
- **Plan:** Hobby (paid) — free trial credit runs out for a 24/7 service.

**App side (Vercel) variables**
- `WA_SERVICE_URL = https://laundrypro-production-8d3c.up.railway.app`
- `WA_SHARED_SECRET` — **must exactly match** the Railway value (else calls 401)

**Code involved**
- `wa-service/` — the Railway service (`server.js`, `RAILWAY.md` deploy guide).
- `node-backend/src/lib/waAuto.ts` — HTTP client to the WA-Service.
- `node-backend/src/app/api/whatsapp/{status,connect,disconnect}/route.ts`
- `node-backend/src/app/settings/page.tsx` — "Connect WhatsApp" (QR) + auto-send toggle.
- `node-backend/src/app/api/entries/route.ts` — auto-sends the bill on new entry.
- DB column `shop_profiles.wa_auto_enabled` — per-shop on/off for auto-send.
- Full design: `docs/whatsapp-auto-send.md`.

## Per-shop WhatsApp onboarding (one-time)

Each shop links its **own** number: **Settings → WhatsApp → Connect** → scan the
QR with that shop's dedicated WhatsApp (Linked Devices) → **Connected** → turn on
**Auto-send** → Save. Sessions are isolated per shop under `/data/sessions/<shop_id>/`.

## Environment variables — where set

| Variable | Vercel | Railway | Local `.env` |
|----------|:------:|:-------:|:------------:|
| `DATABASE_URL` | ✅ | — | ✅ |
| `SECRET_KEY` (JWT) | ✅ | — | ✅ |
| `WA_SERVICE_URL` | ✅ | — | ✅ (dev) |
| `WA_SHARED_SECRET` | ✅ | ✅ | ✅ (dev) |
| `SESSIONS_DIR` | — | ✅ (`/data/sessions`) | — |
| `PORT` | — | ✅ (`8080`) | optional |
| (email/SMS keys, etc.) | ✅ | — | ✅ |

## Operations

- **Deploy app:** push to GitHub `main` → Vercel auto-builds. Env changes →
  Redeploy from the Vercel dashboard.
- **Deploy WA-Service:** push to `main` → Railway auto-builds the `wa-service`
  folder. Logs: Railway → service → Deployments → Logs.
- **WA-Service update after code change:** just push; Railway redeploys. Sessions
  survive (they're on the `/data` volume).
- **DB schema change:** update `prisma/schema.prisma`, then `npm run db:push`
  (or a scoped `ALTER TABLE`).

## Setup status

- [x] App on Vercel + Neon DB
- [x] WA-Service deployed on Railway (public URL + volume + variables)
- [ ] Vercel env `WA_SERVICE_URL` + `WA_SHARED_SECRET` set + redeploy
- [ ] DB column `shop_profiles.wa_auto_enabled` added
- [ ] At least one shop connected (QR) and auto-send verified
