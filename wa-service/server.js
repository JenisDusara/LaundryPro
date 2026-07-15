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
  fetchLatestBaileysVersion,
  Browsers,
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

// Start (or restart) a shop's session. Pass `pairPhone` to link via an 8-char pairing code
// (WhatsApp → Linked Devices → "Link with phone number") instead of a QR — works on a single
// phone. Omit it for the QR flow.
async function startSession(shopId, pairPhone) {
  const existing = sessions.get(shopId);
  if (existing && existing.state === "open") return existing;
  // Tear down any half-open socket before recreating (removed from map first so its close
  // handler doesn't touch the new session).
  if (existing && existing.sock) { sessions.delete(shopId); try { existing.sock.end(); } catch {} }

  const dir = path.join(SESSIONS_DIR, shopId);
  const { state, saveCreds } = await useMultiFileAuthState(dir);

  // Use the current WhatsApp Web version — without this the bundled version can be stale and
  // WhatsApp keeps closing the socket (stuck "connecting", no QR).
  let version;
  try {
    version = (await fetchLatestBaileysVersion()).version;
    console.log(`[${shopId}] using WA version ${version}`);
  } catch (e) {
    console.log(`[${shopId}] version fetch failed, using default:`, (e && e.message) || e);
  }

  // IMPORTANT: use a standard browser identifier. A custom name here (e.g.
  // ["LaundryPro","Chrome","1.0.0"]) is the #1 reason WhatsApp rejects the pairing code
  // as "incorrect". Browsers.ubuntu("Chrome") is the known-good value for pairing + QR.
  const browser = (Browsers && Browsers.ubuntu) ? Browsers.ubuntu("Chrome") : ["Ubuntu", "Chrome", "22.04.4"];
  const sock = makeWASocket({
    ...(version ? { version } : {}),
    auth: state,
    logger: pino({ level: "silent" }),
    browser,
    syncFullHistory: false,
  });

  // Remember the pairing phone so a mid-pairing reconnect stays in pairing mode
  // (instead of silently dropping to QR and invalidating the code the user is holding).
  const entry = { sock, state: "connecting", qr: null, pairingCode: null, number: null, pairPhone: pairPhone || null };
  sessions.set(shopId, entry);
  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (u) => {
    const { connection, lastDisconnect, qr } = u;
    const cur = sessions.get(shopId);
    if (!cur || cur.sock !== sock) return; // ignore events from a superseded socket
    if (connection) console.log(`[${shopId}] connection: ${connection}${qr ? " (+qr)" : ""}`);

    if (qr && !pairPhone) { // only surface a QR in QR mode
      cur.state = "qr";
      cur.qr = await qrcode.toDataURL(qr).catch(() => null);
      console.log(`[${shopId}] QR generated`);
    }
    if (connection === "open") {
      cur.state = "open";
      cur.qr = null; cur.pairingCode = null;
      cur.number = sock.user && sock.user.id ? sock.user.id.split(":")[0].split("@")[0] : null;
      console.log(`[${shopId}] connected as ${cur.number}`);
    }
    if (connection === "close") {
      const code = lastDisconnect && lastDisconnect.error && lastDisconnect.error.output
        ? lastDisconnect.error.output.statusCode : undefined;
      console.log(`[${shopId}] closed, code: ${code}, msg: ${lastDisconnect && lastDisconnect.error ? lastDisconnect.error.message : ""}`);
      if (code === DisconnectReason.loggedOut) {
        cur.state = "logged_out";
        cur.qr = null; cur.pairingCode = null; cur.number = null;
        sessions.delete(shopId);
        try { fs.rmSync(dir, { recursive: true, force: true }); } catch {}
        console.log(`[${shopId}] logged out`);
      } else {
        cur.state = "connecting";
        // Keep the pairing phone on reconnect so we don't lose pairing mode.
        setTimeout(() => startSession(shopId, cur.pairPhone).catch(() => {}), 2000);
      }
    }
  });

  // Pairing-code mode: request the code once the socket is up.
  if (pairPhone && !state.creds.registered) {
    const num = String(pairPhone).replace(/\D/g, "");
    const full = num.length === 10 ? "91" + num : num;
    try {
      await new Promise((r) => setTimeout(r, 2500)); // let the socket fully initialise before requesting
      const pcode = await sock.requestPairingCode(full);
      const cur = sessions.get(shopId);
      if (cur && cur.sock === sock) { cur.pairingCode = pcode; cur.state = "pairing"; }
      console.log(`[${shopId}] pairing code: ${pcode}`);
    } catch (e) {
      console.log(`[${shopId}] pairing code failed:`, (e && e.message) || e);
    }
  }

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

// Link with an 8-char pairing code instead of a QR (single-phone friendly).
app.post("/pair", async (req, res) => {
  const { shop_id, phone } = req.body || {};
  if (!shop_id || !phone) return res.status(400).json({ error: "shop_id and phone required" });
  try {
    await startSession(shop_id, phone);
    const s = sessions.get(shop_id);
    res.json({ state: s ? s.state : "connecting", pairingCode: s ? s.pairingCode : null });
  } catch (e) {
    res.status(500).json({ error: "pair_failed", detail: String((e && e.message) || e) });
  }
});

app.get("/status", (req, res) => {
  const shopId = req.query.shop_id;
  const s = sessions.get(shopId);
  if (!s) return res.json({ state: "disconnected", qr: null, pairingCode: null, number: null });
  res.json({ state: s.state, qr: s.qr || null, pairingCode: s.pairingCode || null, number: s.number || null });
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

// Send a document (e.g. an invoice PDF) from the shop's number. Body:
//   { shop_id, phone, file_base64, mimetype, filename, caption? }
app.post("/send-media", async (req, res) => {
  const { shop_id, phone, file_base64, mimetype, filename, caption } = req.body || {};
  if (!shop_id || !phone || !file_base64 || !filename) {
    return res.status(400).json({ error: "shop_id, phone, file_base64, filename required" });
  }
  const s = sessions.get(shop_id);
  if (!s || s.state !== "open") {
    return res.status(409).json({ error: "not_connected", state: s ? s.state : "disconnected" });
  }
  const digits = String(phone).replace(/\D/g, "");
  const num = digits.length === 10 ? "91" + digits : digits; // default India country code
  const jid = num + "@s.whatsapp.net";
  try {
    const buffer = Buffer.from(String(file_base64), "base64");
    await s.sock.sendMessage(jid, {
      document: buffer,
      mimetype: mimetype || "application/pdf",
      fileName: filename,
      caption: caption ? String(caption) : undefined,
    });
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
