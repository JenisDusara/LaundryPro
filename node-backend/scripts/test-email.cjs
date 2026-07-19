// Quick SMTP sanity check — verifies your EMAIL_* settings in .env actually work,
// without deploying the app.
//
// Usage:
//   cd node-backend
//   node scripts/test-email.cjs your-inbox@example.com
//
// It reads EMAIL_USER / EMAIL_PASS / EMAIL_HOST / EMAIL_PORT from node-backend/.env,
// connects to the SMTP server, and sends one test email to the address you pass
// (defaults to EMAIL_USER itself if you don't pass one).

const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");

// Minimal .env loader (no dependency on dotenv).
const envPath = path.join(__dirname, "..", ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const { EMAIL_USER, EMAIL_PASS, EMAIL_HOST, EMAIL_PORT } = process.env;
const to = process.argv[2] || EMAIL_USER;
const portOverride = process.argv[3]; // optional: `node scripts/test-email.cjs to@x.com 587`

if (!EMAIL_USER || !EMAIL_PASS) {
  console.error("❌ EMAIL_USER / EMAIL_PASS missing in .env");
  process.exit(1);
}

// Masked diagnostic so we can see the loaded creds without printing the secret.
console.log(`USER: ${EMAIL_USER}`);
console.log(`PASS: length=${EMAIL_PASS.length}, starts="${EMAIL_PASS.slice(0, 2)}", ends="${EMAIL_PASS.slice(-2)}"`);

const port = Number(portOverride) || Number(EMAIL_PORT) || 587;
const transporter = EMAIL_HOST
  ? nodemailer.createTransport({ host: EMAIL_HOST, port, secure: port === 465, auth: { user: EMAIL_USER, pass: EMAIL_PASS } })
  : nodemailer.createTransport({ service: "gmail", auth: { user: EMAIL_USER, pass: EMAIL_PASS } });

(async () => {
  console.log(`Connecting to ${EMAIL_HOST || "gmail"}:${port} as ${EMAIL_USER} ...`);
  try {
    await transporter.verify();
    console.log("✅ SMTP connection + login OK");
    const info = await transporter.sendMail({
      from: `"LaundryMax test" <${EMAIL_USER}>`,
      to,
      subject: "LaundryMax SMTP test ✔",
      text: "If you can read this, your email setup works.",
    });
    console.log(`✅ Test email sent to ${to} (messageId: ${info.messageId})`);
  } catch (err) {
    console.error("❌ Failed:", err.message);
    process.exit(1);
  }
})();
