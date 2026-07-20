import { EMAIL, WHATSAPP_DISPLAY } from "./site";

export type LegalSection = { h: string; body?: string[]; list?: string[] };
export type LegalDoc = {
  slug: string;
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
};

const CONTACT = `${EMAIL} · ${WHATSAPP_DISPLAY}`;

export const terms: LegalDoc = {
  slug: "terms",
  title: "Terms & Conditions",
  updated: "July 2026",
  intro:
    "These Terms & Conditions govern your use of LaundryMax — a cloud-based laundry and dry-cleaning management software. By creating an account or using the service, you agree to these terms.",
  sections: [
    {
      h: "1. Definitions",
      body: [
        `"LaundryMax", "we", "us" or "our" refers to the LaundryMax software and its operators. "You" or "user" refers to the shop owner, staff or business that uses the service. "Service" means the LaundryMax web and mobile applications and related features.`,
      ],
    },
    {
      h: "2. Eligibility & account",
      body: [
        "You must provide accurate information when registering and keep your login credentials secure. You are responsible for all activity that happens under your account. You must be authorised to run the laundry business you register.",
      ],
    },
    {
      h: "3. Use of the service",
      body: [
        "LaundryMax grants you a limited, non-exclusive, non-transferable right to use the service for running your laundry business. You agree to use it lawfully and not to misuse, resell, copy, reverse-engineer or attempt to disrupt the service.",
      ],
    },
    {
      h: "4. Subscription & payments",
      body: [
        "Paid plans are billed on the cycle shown at purchase. Fees are payable in advance and, except as stated in our Refund & Cancellation Policy, are non-refundable. We may change plan pricing with prior notice; changes do not affect the current paid cycle.",
      ],
    },
    {
      h: "5. Your data",
      body: [
        "You own the business and customer data you enter into LaundryMax. We process it only to provide the service, as described in our Privacy Policy. You are responsible for ensuring you have the right to store your customers' details.",
      ],
    },
    {
      h: "6. Acceptable use",
      list: [
        "Do not use the service for any unlawful or fraudulent purpose.",
        "Do not upload content that infringes others' rights or contains malware.",
        "Do not attempt to gain unauthorised access to other accounts or our systems.",
      ],
    },
    {
      h: "7. Service availability",
      body: [
        "We work hard to keep LaundryMax available and backed up, but the service is provided “as is”. We do not guarantee uninterrupted or error-free operation and may perform maintenance from time to time.",
      ],
    },
    {
      h: "8. Limitation of liability",
      body: [
        "To the maximum extent permitted by law, LaundryMax is not liable for indirect or consequential losses. Our total liability for any claim is limited to the fees you paid for the service in the three months before the claim.",
      ],
    },
    {
      h: "9. Termination",
      body: [
        "You may stop using the service at any time. We may suspend or terminate access if these terms are breached. On termination you may request an export of your data for a reasonable period.",
      ],
    },
    {
      h: "10. Changes to these terms",
      body: [
        "We may update these terms as the service evolves. Material changes will be notified on this page with a new “last updated” date. Continued use after changes means you accept them.",
      ],
    },
    {
      h: "11. Governing law",
      body: [
        "These terms are governed by the laws of India, and any disputes are subject to the courts of India.",
      ],
    },
    {
      h: "12. Contact",
      body: [`Questions about these terms? Reach us at ${CONTACT}.`],
    },
  ],
};

export const privacy: LegalDoc = {
  slug: "privacy",
  title: "Privacy Policy",
  updated: "July 2026",
  intro:
    "This Privacy Policy explains what information LaundryMax collects, how we use it, and the choices you have. We keep it simple and we never sell your data.",
  sections: [
    {
      h: "1. Information we collect",
      list: [
        "Account details you provide — name, shop name, phone number and email.",
        "Business data you enter — customers, orders, invoices, payments, expenses and staff records.",
        "Usage information — basic logs and device/browser data used to keep the service secure and improve it.",
      ],
    },
    {
      h: "2. How we use your information",
      list: [
        "To provide and operate the LaundryMax service for your shop.",
        "To generate your bills, reports and WhatsApp messages that you choose to send.",
        "To provide support, prevent fraud and keep your account secure.",
        "To send important service updates.",
      ],
    },
    {
      h: "3. Your customers' data",
      body: [
        "The customer information you store in LaundryMax belongs to you. We act only as a processor of that data on your behalf and use it solely to run the features you use, such as billing and reminders.",
      ],
    },
    {
      h: "4. Data storage & security",
      body: [
        "Your data is stored securely in the cloud and backed up regularly. We use reasonable technical and organisational measures to protect it against unauthorised access.",
      ],
    },
    {
      h: "5. Sharing",
      body: [
        "We do not sell your data. We share it only with trusted service providers who help us run the platform (such as hosting and messaging), and only as needed to provide the service, or where required by law.",
      ],
    },
    {
      h: "6. Cookies",
      body: [
        "We use only essential cookies needed to keep you logged in and to run core features. We do not use them for advertising.",
      ],
    },
    {
      h: "7. Your rights",
      body: [
        "You can access, correct or export your data, and request deletion of your account, at any time by contacting us.",
      ],
    },
    {
      h: "8. Data retention",
      body: [
        "We keep your data while your account is active. After closure, data may be retained for a short period for backups and legal compliance, then deleted.",
      ],
    },
    {
      h: "9. Changes",
      body: [
        "We may update this policy; the latest version will always be on this page with its “last updated” date.",
      ],
    },
    {
      h: "10. Contact",
      body: [`For any privacy question, contact us at ${CONTACT}.`],
    },
  ],
};

export const refund: LegalDoc = {
  slug: "refund",
  title: "Refund & Cancellation",
  updated: "July 2026",
  intro:
    "This policy explains how subscriptions, cancellations and refunds work for LaundryMax.",
  sections: [
    {
      h: "1. Free demo & trial",
      body: [
        "You can book a free demo and, where offered, a free trial before paying. This lets you evaluate LaundryMax with no charge and no card required.",
      ],
    },
    {
      h: "2. Subscription billing",
      body: [
        "Paid plans are billed in advance for the chosen period (for example monthly). Your subscription gives you access to the plan's features for that period.",
      ],
    },
    {
      h: "3. Cancellation",
      body: [
        "You can cancel your subscription at any time. Cancellation stops the next renewal — you keep access until the end of the period you have already paid for. There are no cancellation charges.",
      ],
    },
    {
      h: "4. Refunds",
      body: [
        "Subscription fees are generally non-refundable once a billing period has started, since the service is available to you for that period. If you believe you were charged in error, or faced a genuine issue, contact us within 7 days and we will review it fairly.",
      ],
    },
    {
      h: "5. How to request",
      body: [
        `To cancel or request a refund, message us at ${CONTACT} with your shop name and registered number. We usually respond within 1–2 business days.`,
      ],
    },
  ],
};

export const legalDocs: Record<string, LegalDoc> = {
  terms,
  privacy,
  refund,
};
