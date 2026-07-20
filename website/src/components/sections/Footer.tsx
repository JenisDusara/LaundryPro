import Link from "next/link";
import {
  MessageCircle,
  Mail,
  Play,
  Instagram,
  Facebook,
  ArrowRight,
  MapPin,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Container } from "@/components/ui/primitives";
import { DEMO_URL, waLink, EMAIL, WHATSAPP_DISPLAY } from "@/lib/site";

const columns = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/features" },
      { label: "Pricing", href: "/#pricing" },
      { label: "Reviews", href: "/#reviews" },
      { label: "Try live demo", href: DEMO_URL },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/#about" },
      { label: "FAQ", href: "/#faq" },
      { label: "Get a demo", href: "/#demo" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms & Conditions", href: "/terms" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Refund & Cancellation", href: "/refund" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative border-t border-line bg-card/40">
      <Container>
        <div className="grid gap-10 py-14 md:grid-cols-12">
          {/* brand */}
          <div className="md:col-span-4">
            <Logo />
            <p className="mt-4 max-w-xs text-[13.5px] leading-relaxed text-muted">
              Customers, billing, deliveries, labour and accounts — your whole
              laundry business in one clean cloud dashboard.
            </p>

            {/* socials */}
            <div className="mt-5 flex items-center gap-2.5">
              <a
                href={waLink()}
                target="_blank"
                rel="noreferrer"
                aria-label="WhatsApp"
                className="grid h-9 w-9 place-items-center rounded-full border border-line bg-card text-muted transition-all duration-200 hover:-translate-y-0.5 hover:border-wa/40 hover:text-wa-deep"
              >
                <MessageCircle size={16} />
              </a>
              <a
                href="#"
                aria-label="Instagram"
                className="grid h-9 w-9 place-items-center rounded-full border border-line bg-card text-muted transition-all duration-200 hover:-translate-y-0.5 hover:border-navy/40 hover:text-navy dark:hover:text-sky-400"
              >
                <Instagram size={16} />
              </a>
              <a
                href="#"
                aria-label="Facebook"
                className="grid h-9 w-9 place-items-center rounded-full border border-line bg-card text-muted transition-all duration-200 hover:-translate-y-0.5 hover:border-navy/40 hover:text-navy dark:hover:text-sky-400"
              >
                <Facebook size={16} />
              </a>
            </div>

            <div className="mt-5 flex items-center gap-2 text-[11.5px] font-bold uppercase tracking-[0.14em] text-faint">
              <span className="animate-pulse-dot h-1.5 w-1.5 rounded-full bg-wa" />
              Made in India for laundry shops
            </div>
          </div>

          {/* link columns */}
          {columns.map((col) => (
            <div key={col.title} className="md:col-span-2">
              <div className="mb-4 text-[12px] font-bold uppercase tracking-[0.16em] text-faint">
                {col.title}
              </div>
              <ul className="space-y-2.5 text-[14px] font-medium">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-muted transition-colors hover:text-text"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* contact */}
          <div className="md:col-span-2">
            <div className="mb-4 text-[12px] font-bold uppercase tracking-[0.16em] text-faint">
              Contact
            </div>
            <ul className="space-y-3 text-[14px] font-medium">
              <li>
                <a
                  href={waLink()}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-muted transition-colors hover:text-wa-deep"
                >
                  <MessageCircle size={15} className="text-wa" />
                  {WHATSAPP_DISPLAY}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${EMAIL}`}
                  className="inline-flex items-center gap-2 break-all text-muted transition-colors hover:text-navy dark:hover:text-sky-400"
                >
                  <Mail size={15} className="shrink-0" />
                  {EMAIL}
                </a>
              </li>
              <li className="inline-flex items-center gap-2 text-muted">
                <MapPin size={15} className="shrink-0" />
                India
              </li>
            </ul>

            <a
              href="/#demo"
              className="btn-gradient group mt-5 inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-white shadow-navy hover:-translate-y-0.5"
            >
              Get free demo
              <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-0.5" />
            </a>
          </div>
        </div>

        {/* bottom bar */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-line py-6 text-[12.5px] text-faint sm:flex-row">
          <span>© 2026 LaundryMax · All rights reserved</span>
          <span className="inline-flex items-center gap-1.5">
            <Play size={11} className="fill-current" />
            <Link href={DEMO_URL} className="font-semibold text-muted transition-colors hover:text-text">
              Billing in 10 seconds — start with the demo
            </Link>
          </span>
        </div>
      </Container>
    </footer>
  );
}
