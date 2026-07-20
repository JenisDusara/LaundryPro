"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { nav } from "@/lib/site";

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
      className={`sticky top-0 z-50 bg-bg/80 backdrop-blur-xl transition-shadow duration-300 ${
        scrolled
          ? "border-b border-line shadow-[0_4px_30px_-12px_rgba(37,99,235,0.25)]"
          : "border-b border-transparent"
      }`}
    >
      <nav className="mx-auto flex h-[68px] max-w-content items-center justify-between px-5 sm:px-8">
        <Link href="#top" aria-label="LaundryMax home">
          <Logo />
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {nav.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className="rounded-full px-4 py-2 text-[14px] font-medium text-muted transition-colors hover:bg-navy/[0.06] hover:text-text dark:hover:bg-white/[0.06]"
            >
              {n.label}
            </a>
          ))}
          <span className="mx-2.5 h-5 w-px bg-line" />
          <ThemeToggle />
          <a
            href="/#demo"
            className="btn-gradient group ml-2 inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-[14px] font-semibold text-white shadow-navy hover:-translate-y-0.5 hover:shadow-navy-lg"
          >
            Get free demo
            <ArrowRight
              size={15}
              className="transition-transform duration-200 group-hover:translate-x-0.5"
            />
          </a>
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
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted hover:bg-navy/[0.06] hover:text-text dark:hover:bg-white/[0.06]"
                >
                  {n.label}
                </a>
              ))}
              <a
                href="/#demo"
                onClick={() => setOpen(false)}
                className="btn-gradient mt-2 inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-3 text-center text-sm font-semibold text-white shadow-navy"
              >
                Get free demo <ArrowRight size={15} />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
