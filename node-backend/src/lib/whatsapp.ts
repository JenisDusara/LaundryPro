// WhatsApp deep-link helpers. Opens wa.me with a pre-filled message so the shop owner
// can review and hit send — works without a paid WhatsApp Business API. (Fully automated
// server-side sending would need the Business API + a provider key.)

function normalize(phone: string): string {
  const d = phone.replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) return d;
  return "91" + d.slice(-10);
}

export function openWhatsApp(phone: string, message = ""): void {
  const base = `https://wa.me/${normalize(phone)}`;
  const href = message ? `${base}?text=${encodeURIComponent(message)}` : base;
  const a = document.createElement("a");
  a.href = href;
  a.target = "_blank";
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

const rupee = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

// Payment reminder for an outstanding (udhaar) balance.
export function paymentReminderMsg(o: { customer: string; amount: number; shop: string; upi?: string }): string {
  const lines = [
    `Namaste ${o.customer},`,
    ``,
    `Aapka ${o.shop} me ${rupee(o.amount)} ka payment pending hai.`,
    `Kripya jaldi payment kar dein. Dhanyavaad!`,
  ];
  if (o.upi) lines.push(``, `UPI: ${o.upi}`);
  return lines.join("\n");
}

// Order ready-for-delivery message.
export function readyMsg(o: { customer: string; shop: string }): string {
  return [
    `Namaste ${o.customer},`,
    ``,
    `Aapke kapde taiyaar hain aur delivery ke liye ready hain. — ${o.shop}`,
  ].join("\n");
}
