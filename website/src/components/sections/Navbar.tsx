"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { nav, DEMO_URL } from "@/lib/site";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 bg-bg/90 backdrop-blur-md transition-shadow duration-300 ${
        scrolled ? "border-b border-line shadow-[0_2px_20px_-8px_rgba(37,99,235,0.15)]" : "border-b border-transparent"
      }`}
    >
      <nav className="mx-auto flex h-[68px] max-w-content items-center justify-between px-5 sm:px-8">
        <Link href="#top" aria-label="LaundryMax home">
          <Logo />
        </Link>

        <div className="hidden items-center gap-2 md:flex">
          {nav.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className="rounded-lg px-3.5 py-2 text-[14px] font-medium text-muted transition-colors hover:text-text"
            >
              {n.label}
            </a>
          ))}
          <span className="mx-2 h-5 w-px bg-line" />
          <ThemeToggle />
          <Link
            href={DEMO_URL}
            className="ml-1 rounded-xl bg-navy px-5 py-2.5 text-[14px] font-semibold text-white shadow-navy transition-all duration-200 hover:-translate-y-0.5 hover:bg-navy-deep"
          >
            Try demo
          </Link>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            className="grid h-9 w-9 place-items-center rounded-lg border border-line bg-card text-text"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-line bg-bg md:hidden"
          >
            <div className="flex flex-col gap-1 px-5 py-4">
              {nav.map((n) => (
                <a
                  key={n.href}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted hover:text-text"
                >
                  {n.label}
                </a>
              ))}
              <Link
                href={DEMO_URL}
                onClick={() => setOpen(false)}
                className="mt-2 rounded-xl bg-navy px-4 py-3 text-center text-sm font-semibold text-white"
              >
                Try demo
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
