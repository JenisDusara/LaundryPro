// LaundryPro WA-Service — always-on, multi-session WhatsApp sender (Baileys).
// One WhatsApp session per shop. The Next.js app (Netlify) calls this over HTTP.
//
// Run:  npm install && npm start   (on an always-on machine — VPS / shop PC / Pi)
// Env:  PORT (default 8088), WA_SHARED_SECRET (shared with the LaundryPro app)

const express = require("express");
const pino = require("pino");
const qrcode = require("qrcode");
const fs = require("fs");
const path = require("path");
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
} = require("@whiskeysockets/baileys");

const PORT = process.env.PORT || 8088;
const SECRET = process.env.WA_SHARED_SECRET || "";
// On Railway/containers point SESSIONS_DIR at a mounted persistent volume (e.g. /data/sessions)
// so WhatsApp logins survive redeploys/restarts. Locally it defaults to ./sessions.
const SESSIONS_DIR = process.env.SESSIONS_DIR || path.join(__dirname, "sessions");

const app = express();
app.use(express.json());

// shop_id -> { sock, state, qr, number, starting }
// state: "connecting" | "qr" | "open" | "logged_out"
const sessions = new Map();

async function startSession(shopId) {
  const existing = sessions.get(shopId);
  if (existing && (existing.state === "open" || existing.starting)) return existing;

  const dir = path.join(SESSIONS_DIR, shopId);
  const { state, saveCreds } = await useMultiFileAuthState(dir);
  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: "silent" }),
    browser: ["LaundryPro", "Chrome", "1.0.0"],
    syncFullHistory: false,
  });

  const entry = { sock, state: "connecting", qr: null, number: null, starting: true };
  sessions.set(shopId, entry);
  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (u) => {
    const { connection, lastDisconnect, qr } = u;
    const cur = sessions.get(shopId);
    if (!cur) return;

    if (qr) {
      cur.state = "qr";
      cur.qr = await qrcode.toDataURL(qr).catch(() => null);
    }
    if (connection === "open") {
      cur.state = "open";
      cur.qr = null;
      cur.starting = false;
      cur.number = sock.user && sock.user.id ? sock.user.id.split(":")[0].split("@")[0] : null;
      console.log(`[${shopId}] connected as ${cur.number}`);
    }
    if (connection === "close") {
      cur.starting = false;
      const code = lastDisconnect && lastDisconnect.error && lastDisconnect.error.output
        ? lastDisconnect.error.output.statusCode : undefined;
      if (code === DisconnectReason.loggedOut) {
        // Number unlinked — wipe session so the next /connect shows a fresh QR.
        cur.state = "logged_out";
        cur.qr = null; cur.number = null;
        sessions.delete(shopId);
        try { fs.rmSync(dir, { recursive: true, force: true }); } catch {}
        console.log(`[${shopId}] logged out`);
      } else {
        // Transient drop — reconnect.
        cur.state = "connecting";
        setTimeout(() => startSession(shopId).catch(() => {}), 2000);
      }
    }
  });

  return entry;
}

// Public health check (no secret) — safe for Railway/uptime probes.
app.get("/health", (_req, res) => res.json({ ok: true, sessions: sessions.size }));

// Shared-secret guard for everything else (skip only if no secret configured — dev).
app.use((req, res, next) => {
  if (!SECRET) return next();
  if (req.headers["x-wa-secret"] !== SECRET) return res.status(401).json({ error: "unauthorized" });
  next();
});

// Begin/resume linking a shop's number; QR arrives async — poll /status for it.
app.post("/connect", async (req, res) => {
  const shopId = req.body && req.body.shop_id;
  if (!shopId) return res.status(400).json({ error: "shop_id required" });
  try {
    await startSession(shopId);
    const s = sessions.get(shopId);
    res.json({ state: s ? s.state : "connecting", qr: s ? s.qr : null });
  } catch (e) {
    res.status(500).json({ error: "connect_failed", detail: String((e && e.message) || e) });
  }
});

app.get("/status", (req, res) => {
  const shopId = req.query.shop_id;
  const s = sessions.get(shopId);
  if (!s) return res.json({ state: "disconnected", qr: null, number: null });
  res.json({ state: s.state, qr: s.qr || null, number: s.number || null });
});

app.post("/send", async (req, res) => {
  const { shop_id, phone, text } = req.body || {};
  if (!shop_id || !phone || !text) return res.status(400).json({ error: "shop_id, phone, text required" });
  const s = sessions.get(shop_id);
  if (!s || s.state !== "open") {
    return res.status(409).json({ error: "not_connected", state: s ? s.state : "disconnected" });
  }
  const digits = String(phone).replace(/\D/g, "");
  const num = digits.length === 10 ? "91" + digits : digits; // default India country code
  const jid = num + "@s.whatsapp.net";
  try {
    await s.sock.sendMessage(jid, { text: String(text) });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "send_failed", detail: String((e && e.message) || e) });
  }
});

app.post("/disconnect", async (req, res) => {
  const shopId = req.body && req.body.shop_id;
  const s = sessions.get(shopId);
  if (s) { try { await s.sock.logout(); } catch {} sessions.delete(shopId); }
  try { fs.rmSync(path.join(SESSIONS_DIR, shopId), { recursive: true, force: true }); } catch {}
  res.json({ ok: true });
});

// Resume already-linked shops on startup (no re-scan needed).
function resumeExisting() {
  try {
    if (!fs.existsSync(SESSIONS_DIR)) return;
    for (const shopId of fs.readdirSync(SESSIONS_DIR)) {
      if (fs.existsSync(path.join(SESSIONS_DIR, shopId, "creds.json"))) {
        startSession(shopId).catch(() => {});
      }
    }
  } catch {}
}

app.listen(PORT, () => {
  console.log(`LaundryPro WA-Service listening on :${PORT}`);
  if (!SECRET) console.warn("⚠️  WA_SHARED_SECRET not set — endpoints are UNPROTECTED (dev only).");
  resumeExisting();
});
