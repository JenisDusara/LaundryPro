import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Container } from "@/components/ui/primitives";
import { DEMO_URL, waLink, EMAIL } from "@/lib/site";

export function Footer() {
  return (
    <footer className="border-t border-line py-8">
      <Container>
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="hidden text-[13px] text-faint sm:inline">
              · © 2026 · All rights reserved
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] font-semibold">
            <Link href={DEMO_URL} className="text-muted transition-colors hover:text-text">
              Try demo
            </Link>
            <a
              href={waLink()}
              target="_blank"
              rel="noreferrer"
              className="text-muted transition-colors hover:text-wa-deep"
            >
              WhatsApp
            </a>
            <a
              href={`mailto:${EMAIL}`}
              className="text-muted transition-colors hover:text-navy dark:hover:text-sky-400"
            >
              {EMAIL}
            </a>
          </div>
        </div>
        <div className="mt-4 text-center text-[12px] text-faint sm:hidden">
          © 2026 · All rights reserved
        </div>
      </Container>
    </footer>
  );
}
