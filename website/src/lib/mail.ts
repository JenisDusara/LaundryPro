import nodemailer, { type Transporter } from "nodemailer";

let _t: Transporter | null = null;

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

/** Emails a new demo registration to the owner's inbox. Never throws. */
export async function sendLeadEmail(lead: {
  name: string;
  shop: string;
  phone: string;
}): Promise<void> {
  try {
    const t = transport();
    const to = process.env.LEAD_TO_EMAIL || process.env.EMAIL_USER;
    if (!t || !to) return;

    const rows = [
      ["Name", lead.name || "—"],
      ["Shop", lead.shop || "—"],
      ["Phone", lead.phone || "—"],
    ];
    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:auto">
        <h2 style="color:#12315f;margin:0 0 4px">New demo request</h2>
        <p style="color:#64748b;margin:0 0 16px">A visitor booked a free demo on the LaundryMax website.</p>
        <table style="width:100%;border-collapse:collapse">
          ${rows
            .map(
              ([k, v]) =>
                `<tr><td style="padding:8px 0;color:#64748b;width:90px">${k}</td><td style="padding:8px 0;color:#0f172a;font-weight:600">${v}</td></tr>`
            )
            .join("")}
        </table>
        <p style="color:#94a3b8;font-size:12px;margin-top:16px">Sent automatically by laundrymax.in</p>
      </div>`;
    const text = `New demo request\n\nName: ${lead.name || "—"}\nShop: ${lead.shop || "—"}\nPhone: ${lead.phone || "—"}\n\nSent from laundrymax.in`;

    await t.sendMail({
      from: `"LaundryMax Website" <${process.env.EMAIL_USER}>`,
      to,
      subject: `New demo request — ${lead.shop || lead.name || "LaundryMax"}`,
      html,
      text,
    });
  } catch {
    // never let email failure break the lead submission
  }
}
