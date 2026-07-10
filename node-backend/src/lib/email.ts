import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

export async function sendEmail(to: string, subject: string, html: string, attachments?: any[]) {
  await transporter.sendMail({
    from: `"LaundryPro" <${process.env.EMAIL_USER}>`,
    to, subject, html,
    attachments,
  });
}

export function pickupEmailHtml(customerName: string, items: { service_name: string; quantity: number; subtotal: number }[], total: number, shopName: string) {
  const rows = items.map(i =>
    `<tr><td style="padding:6px 12px;border-bottom:1px solid #f1f5f9">${i.service_name}</td>
     <td style="padding:6px 12px;border-bottom:1px solid #f1f5f9;text-align:center">${i.quantity}</td>
     <td style="padding:6px 12px;border-bottom:1px solid #f1f5f9;text-align:right">₹${i.subtotal}</td></tr>`
  ).join("");
  return `<div style="font-family:sans-serif;max-width:500px;margin:0 auto">
    <h2 style="color:#1e3a8a">👔 ${shopName}</h2>
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
    <h2 style="color:#1e3a8a">👔 ${shopName} — Weekly Report</h2>
    <p style="color:#64748b;font-size:13px">${s.start} to ${s.end}</p>
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

export function deliveryEmailHtml(customerName: string, shopName: string) {
  return `<div style="font-family:sans-serif;max-width:500px;margin:0 auto">
    <h2 style="color:#1e3a8a">👔 ${shopName}</h2>
    <p>Dear <strong>${customerName}</strong>,</p>
    <p style="color:#059669;font-weight:600">✅ Your laundry is ready and out for delivery!</p>
    <p style="color:#64748b;font-size:13px">Thank you for choosing ${shopName}.</p>
  </div>`;
}
