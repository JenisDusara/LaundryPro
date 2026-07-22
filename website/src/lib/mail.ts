import nodemailer, { type Transporter } from "nodemailer";

let _t: Transporter | null = null;

function esc(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function transport(): Transporter | null {
  const host = process.env.EMAIL_HOST;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  if (!host || !user || !pass) return null;
  if (!_t) {
    const port = Number(process.env.EMAIL_PORT) || 465;
    _t = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }
  return _t;
}

function build(lead: { name: string; shop: string; phone: string; email?: string }) {
  const rows = [
    ["Name", lead.name || "—"],
    ["Shop", lead.shop || "—"],
    ["Phone", lead.phone || "—"],
    ["Email", lead.email || "—"],
  ];
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:auto">
      <h2 style="color:#12315f;margin:0 0 4px">New demo request</h2>
      <p style="color:#64748b;margin:0 0 16px">A visitor booked a free demo on the LaundryMax website.</p>
      <table style="width:100%;border-collapse:collapse">
        ${rows
          .map(
            ([k, v]) =>
              `<tr><td style="padding:8px 0;color:#64748b;width:90px">${esc(k)}</td><td style="padding:8px 0;color:#0f172a;font-weight:600">${esc(v)}</td></tr>`
          )
          .join("")}
      </table>
      <p style="color:#94a3b8;font-size:12px;margin-top:16px">Sent automatically by laundrymax.in</p>
    </div>`;
  const text = `New demo request\n\nName: ${lead.name || "—"}\nShop: ${lead.shop || "—"}\nPhone: ${lead.phone || "—"}\nEmail: ${lead.email || "—"}\n\nSent from laundrymax.in`;
  const subject = `New demo request — ${lead.shop || lead.name || "LaundryMax"}`;
  return { html, text, subject };
}

/**
 * Emails a new demo registration to the owner's inbox. Never throws.
 *
 * Prefers Resend (HTTPS API — no SMTP/IP-block issues) when RESEND_API_KEY is
 * set; otherwise falls back to Titan SMTP via nodemailer.
 */
export async function sendLeadEmail(lead: {
  name: string;
  shop: string;
  phone: string;
  email?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const to = process.env.LEAD_TO_EMAIL || process.env.EMAIL_USER;
  if (!to) return { ok: false, error: "Lead recipient email is not configured" };
  const { html, text, subject } = build(lead);

  // 1) Resend (recommended — reliable from anywhere)
  if (process.env.RESEND_API_KEY) {
    try {
      const from = process.env.RESEND_FROM || "LaundryMax <onboarding@resend.dev>";
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from, to, subject, html, text }),
      });
      if (!res.ok) {
        const err = `Resend send failed: ${res.status} ${await res.text().catch(() => "")}`.slice(0, 300);
        console.error(err);
        return { ok: false, error: err };
      }
      return { ok: true };
    } catch (e) {
      console.error("Resend error:", e);
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  }

  // 2) Fallback — Titan SMTP
  try {
    const t = transport();
    if (!t) return { ok: false, error: "SMTP email is not configured" };
    await t.sendMail({
      from: `"LaundryMax Website" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      text,
    });
    return { ok: true };
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    console.error("SMTP send failed:", err);
    return { ok: false, error: err };
  }
}
