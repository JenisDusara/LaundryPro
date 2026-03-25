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

export function deliveryEmailHtml(customerName: string, shopName: string) {
  return `<div style="font-family:sans-serif;max-width:500px;margin:0 auto">
    <h2 style="color:#1e3a8a">👔 ${shopName}</h2>
    <p>Dear <strong>${customerName}</strong>,</p>
    <p style="color:#059669;font-weight:600">✅ Your laundry is ready and out for delivery!</p>
    <p style="color:#64748b;font-size:13px">Thank you for choosing ${shopName}.</p>
  </div>`;
}
