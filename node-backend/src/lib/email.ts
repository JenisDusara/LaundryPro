import nodemailer from "nodemailer";
import { LOGO_PNG_BASE64 } from "./logo";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

const LOGO_CID = "laundrypro-logo";

// Renders the LaundryPro logo — every template uses this instead of an emoji header.
// Gmail strips base64 data-URI images for security, so this has to be a cid:
// reference to a real MIME attachment (see sendEmail) — the only reliable way to
// get an inline logo to actually render in Gmail.
function logoHeader(title: string) {
  return `<div style="text-align:center;margin-bottom:8px">
    <img src="cid:${LOGO_CID}" alt="LaundryPro" style="height:56px;display:inline-block" />
  </div>
  <h2 style="color:#1e3a8a;text-align:center;margin-top:0">${title}</h2>`;
}

export async function sendEmail(to: string, subject: string, html: string, attachments?: any[]) {
  await transporter.sendMail({
    from: `"LaundryPro" <${process.env.EMAIL_USER}>`,
    to, subject, html,
    attachments: [
      { filename: "logo.png", content: Buffer.from(LOGO_PNG_BASE64, "base64"), cid: LOGO_CID, contentDisposition: "inline" },
      ...(attachments || []),
    ],
  });
}

export function pickupEmailHtml(customerName: string, items: { service_name: string; quantity: number; subtotal: number }[], total: number, shopName: string) {
  const rows = items.map(i =>
    `<tr><td style="padding:6px 12px;border-bottom:1px solid #f1f5f9">${i.service_name}</td>
     <td style="padding:6px 12px;border-bottom:1px solid #f1f5f9;text-align:center">${i.quantity}</td>
     <td style="padding:6px 12px;border-bottom:1px solid #f1f5f9;text-align:right">₹${i.subtotal}</td></tr>`
  ).join("");
  return `<div style="font-family:sans-serif;max-width:500px;margin:0 auto">
    ${logoHeader(shopName)}
    <p>Dear <strong>${customerName}</strong>, your laundry has been picked up.</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      <tr style="background:#f8fafc"><th style="padding:8px 12px;text-align:left">Item</th><th style="padding:8px 12px">Qty</th><th style="padding:8px 12px;text-align:right">Amount</th></tr>
      ${rows}
    </table>
    <p style="font-size:16px;font-weight:700;color:#1e3a8a">Total: ₹${total}</p>
    <p style="color:#64748b;font-size:13px">We'll notify you when your laundry is ready for delivery.</p>
  </div>`;
}

export interface WeeklyReportStats {
  start: string;
  end: string;
  totalRevenue: number;
  totalEntries: number;
  deliveredCount: number;
  pendingCount: number;
  newCustomers: number;
  totalExpenses: number;
  totalDue: number;
  topServices: { name: string; qty: number; revenue: number }[];
}

export function weeklyReportEmailHtml(shopName: string, s: WeeklyReportStats): string {
  const rows = s.topServices.map(t =>
    `<tr><td style="padding:6px 12px;border-bottom:1px solid #f1f5f9">${t.name}</td>
     <td style="padding:6px 12px;border-bottom:1px solid #f1f5f9;text-align:center">${t.qty}</td>
     <td style="padding:6px 12px;border-bottom:1px solid #f1f5f9;text-align:right">₹${t.revenue}</td></tr>`
  ).join("");
  const stat = (label: string, value: string | number, color = "#1e3a8a") =>
    `<tr><td style="padding:6px 12px;color:#475569;font-weight:600">${label}</td>
     <td style="padding:6px 12px;text-align:right;font-weight:700;color:${color}">${value}</td></tr>`;

  return `<div style="font-family:sans-serif;max-width:520px;margin:0 auto">
    ${logoHeader(`${shopName} — Weekly Report`)}
    <p style="color:#64748b;font-size:13px;text-align:center">${s.start} to ${s.end}</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      ${stat("Total Revenue", `₹${s.totalRevenue}`, "#16a34a")}
      ${stat("Total Entries", s.totalEntries)}
      ${stat("Delivered", s.deliveredCount)}
      ${stat("Pending", s.pendingCount)}
      ${stat("New Customers", s.newCustomers)}
      ${stat("Expenses", `₹${s.totalExpenses}`, "#dc2626")}
      ${stat("Outstanding Udhaar (Due)", `₹${s.totalDue}`, "#d97706")}
    </table>
    ${rows ? `<h3 style="color:#1e3a8a;font-size:14px">Top Services</h3>
    <table style="width:100%;border-collapse:collapse;margin:8px 0">
      <tr style="background:#f8fafc"><th style="padding:8px 12px;text-align:left">Service</th><th>Qty</th><th style="text-align:right">Revenue</th></tr>
      ${rows}
    </table>` : ""}
    <p style="color:#64748b;font-size:12px;margin-top:16px">Full detailed report attached as Excel file.</p>
  </div>`;
}

// Sent to the business's own inbox (ADMIN_NOTIFY_EMAIL, falling back to EMAIL_USER)
// the moment a "Start free trial" form is submitted — so a human knows to go
// review/approve it in the superadmin panel.
export function newSignupRequestEmailHtml(r: { shop_name: string; owner_name: string; phone: string; email: string; city: string }, reviewUrl: string): string {
  return `<div style="font-family:sans-serif;max-width:500px;margin:0 auto">
    ${logoHeader("🆕 New signup request")}
    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      <tr><td style="padding:6px 12px;color:#475569;font-weight:600">Shop name</td><td style="padding:6px 12px;font-weight:700">${r.shop_name}</td></tr>
      <tr><td style="padding:6px 12px;color:#475569;font-weight:600">Owner</td><td style="padding:6px 12px">${r.owner_name}</td></tr>
      <tr><td style="padding:6px 12px;color:#475569;font-weight:600">Phone</td><td style="padding:6px 12px">${r.phone}</td></tr>
      <tr><td style="padding:6px 12px;color:#475569;font-weight:600">Email</td><td style="padding:6px 12px">${r.email}</td></tr>
      <tr><td style="padding:6px 12px;color:#475569;font-weight:600">City</td><td style="padding:6px 12px">${r.city || "—"}</td></tr>
    </table>
    <div style="text-align:center">
      <a href="${reviewUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">Review in Superadmin panel</a>
    </div>
  </div>`;
}

// Sent to the lead's own email once superadmin approves their signup request. No
// username/password here — they choose both themselves via the setup link (more
// secure than emailing a plaintext password), then are logged straight in.
export function completeSignupEmailHtml(shopName: string, setupUrl: string): string {
  return `<div style="font-family:sans-serif;max-width:500px;margin:0 auto">
    ${logoHeader("Welcome to LaundryPro!")}
    <p>Hi <strong>${shopName}</strong>, your account request has been approved. Click below to choose your username and password and get started.</p>
    <div style="text-align:center;margin:20px 0">
      <a href="${setupUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px">Set up your account</a>
    </div>
    <p style="color:#64748b;font-size:12px">This link expires in 3 days. If it expires, contact us and we'll send a new one.</p>
  </div>`;
}

// Sent once to the business's own inbox (ADMIN_NOTIFY_EMAIL, falling back to
// EMAIL_USER) the moment a shop finishes account setup — a one-time "they're
// now active" signal, not a per-login notification (which would be spammy).
export function accountActivatedEmailHtml(shopName: string, username: string, d: {
  shopId: string; ownerName: string; phone: string; email: string;
  planType: string | null; expiresAt: Date | null;
}): string {
  const row = (label: string, value: string) =>
    `<tr><td style="padding:8px 14px;color:#475569;font-weight:600">${label}</td><td style="padding:8px 14px;font-weight:700">${value}</td></tr>`;
  return `<div style="font-family:sans-serif;max-width:500px;margin:0 auto">
    ${logoHeader("✅ Account activated")}
    <p><strong>${shopName}</strong> has finished setting up their account and logged in for the first time.</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;background:#f8fafc;border-radius:8px">
      ${row("Shop ID", d.shopId)}
      ${row("Owner", d.ownerName || "—")}
      ${row("Username", `<span style="font-family:monospace">${username}</span>`)}
      ${row("Phone", d.phone || "—")}
      ${row("Email", d.email || "—")}
      ${row("Plan", d.planType ? d.planType.charAt(0).toUpperCase() + d.planType.slice(1) : "Not set")}
      ${row("Expires", d.expiresAt ? new Date(d.expiresAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—")}
    </table>
  </div>`;
}

export function deliveryEmailHtml(customerName: string, shopName: string) {
  return `<div style="font-family:sans-serif;max-width:500px;margin:0 auto">
    ${logoHeader(shopName)}
    <p>Dear <strong>${customerName}</strong>,</p>
    <p style="color:#059669;font-weight:600">✅ Your laundry is ready and out for delivery!</p>
    <p style="color:#64748b;font-size:13px">Thank you for choosing ${shopName}.</p>
  </div>`;
}
