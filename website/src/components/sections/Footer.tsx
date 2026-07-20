import Link from "next/link";
import { MessageCircle, Mail, Play } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Container } from "@/components/ui/primitives";
import { DEMO_URL, waLink, EMAIL, WHATSAPP_DISPLAY, nav } from "@/lib/site";

export function Footer() {
  return (
    <footer className="section-band">
      <Container>
        <div className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
          {/* brand */}
          <div className="lg:col-span-2">
            <Logo />
            <p className="mt-4 max-w-xs text-[13.5px] leading-relaxed text-muted">
              Customers, billing, deliveries, labour and accounts — your whole
              laundry business in one clean dashboard.
            </p>
            <div className="mt-5 flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.14em] text-faint">
              <span className="animate-pulse-dot h-1.5 w-1.5 rounded-full bg-wa" />
              Made for Indian laundry shops
            </div>
          </div>

          {/* explore */}
          <div>
            <div className="mb-4 text-[12px] font-bold uppercase tracking-[0.16em] text-faint">
              Explore
            </div>
            <ul className="space-y-2.5 text-[14px] font-medium">
              {nav.map((n) => (
                <li key={n.href}>
                  <a href={n.href} className="text-muted transition-colors hover:text-text">
                    {n.label}
                  </a>
                </li>
              ))}
              <li>
                <Link
                  href={DEMO_URL}
                  className="inline-flex items-center gap-1.5 font-semibold text-navy transition-colors hover:text-navy-deep dark:text-sky-400"
                >
                  <Play size={13} className="fill-current" /> Try live demo
                </Link>
              </li>
            </ul>
          </div>

          {/* contact */}
          <div>
            <div className="mb-4 text-[12px] font-bold uppercase tracking-[0.16em] text-faint">
              Contact
            </div>
            <ul className="space-y-2.5 text-[14px] font-medium">
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
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-line py-6 text-[12.5px] text-faint sm:flex-row">
          <span>© 2026 LaundryMax · All rights reserved</span>
          <span>
            Billing in 10 seconds ·{" "}
            <Link href={DEMO_URL} className="font-semibold text-muted transition-colors hover:text-text">
              Start with the demo
            </Link>
          </span>
        </div>
      </Container>
    </footer>
  );
}
