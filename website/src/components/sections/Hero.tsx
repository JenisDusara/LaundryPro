"use client";

import { motion } from "framer-motion";
import { Play, MessageCircle, Plus, Home, BarChart3, User } from "lucide-react";
import Link from "next/link";
import { AppMockup } from "./AppMockup";
import { Counter } from "@/components/ui/Counter";
import { DEMO_URL, waLink, stats } from "@/lib/site";

const ease = [0.16, 1, 0.3, 1] as const;

/** Compact static phone that overlaps the desktop mockup in the hero. */
function HeroPhone() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, rotate: -3 }}
      animate={{ opacity: 1, y: 0, rotate: -6 }}
      transition={{ duration: 0.8, ease, delay: 0.5 }}
      className="absolute -bottom-10 -left-8 z-20 hidden sm:block"
    >
      <div className="animate-floaty">
        <div className="h-[300px] w-[150px] rounded-[26px] bg-[#161618] p-[5px] shadow-[0_30px_60px_-15px_rgba(11,24,48,0.55),inset_0_0_0_1.5px_#3a3a3e] ring-1 ring-black/40">
          <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[22px] bg-[#0b1830] text-white">
            {/* island */}
            <div className="absolute left-1/2 top-1.5 z-30 h-[16px] w-[54px] -translate-x-1/2 rounded-full bg-black" />
            {/* header */}
            <div className="flex items-center justify-between px-3 pb-2 pt-6">
              <div>
                <div className="text-[7px] font-medium text-slate-400">Good evening</div>
                <div className="text-[10px] font-bold">Rajesh</div>
              </div>
              <div className="grid h-5 w-5 place-items-center rounded-full bg-[#6EA8FF] text-[7px] font-bold text-[#0b1830]">R</div>
            </div>
            {/* body */}
            <div className="flex-1 px-3">
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#3f7fe0] to-[#6EA8FF] p-2.5">
                <div className="text-[7px] font-medium text-white/80">Today&apos;s revenue</div>
                <div className="mt-0.5 text-[17px] font-extrabold leading-none">₹8,420</div>
                <div className="mt-1 text-[6.5px] text-white/85">14 orders · 3 pending</div>
              </div>
              <div className="mt-2 space-y-1.5">
                {[["Ankitbhai", "₹80", "amber"], ["Bhaveshbhai", "₹40", "green"]].map(([n, a, t]) => (
                  <div key={n} className="flex items-center justify-between rounded-lg bg-white/[0.05] p-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className="grid h-5 w-5 place-items-center rounded-md bg-[#6EA8FF]/15 text-[7px] font-bold text-[#6EA8FF]">{(n as string)[0]}</div>
                      <span className="text-[8px] font-semibold">{n}</span>
                    </div>
                    <span className={`text-[8px] font-bold ${t === "green" ? "text-[#30d158]" : "text-[#fbbf24]"}`}>{a}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* tab bar */}
            <div className="flex items-center justify-around border-t border-white/[0.06] bg-[#0a1326] px-2 pb-3 pt-2">
              <Home size={11} className="text-[#6EA8FF]" />
              <BarChart3 size={11} className="text-slate-500" />
              <div className="relative -mt-5">
                <div className="grid h-7 w-7 place-items-center rounded-full bg-[#6EA8FF] text-[#0b1830] shadow-md shadow-[#6EA8FF]/40">
                  <Plus size={14} strokeWidth={2.5} />
                </div>
              </div>
              <MessageCircle size={11} className="text-slate-500" />
              <User size={11} className="text-slate-500" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function Hero() {
  return (
    <section id="top" className="hero-glow relative overflow-hidden">
      <div className="mx-auto grid max-w-content items-center gap-12 px-5 pb-16 pt-12 sm:px-8 sm:pb-24 sm:pt-16 lg:grid-cols-2 lg:gap-16">
        {/* ── copy ── */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
            className="mb-7 inline-flex items-center gap-2 rounded-full border border-line bg-card px-4 py-2 text-[12px] font-bold uppercase tracking-[0.1em] text-muted shadow-sm"
          >
            <span className="h-2 w-2 rounded-full bg-wa" />
            Trusted by 500+ Indian shops
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: 0.05 }}
            className="font-display text-[clamp(40px,6.6vw,68px)] font-extrabold leading-[1.02] tracking-[-0.03em] text-text"
          >
            Manage your shop.
            <br />
            <span className="relative inline-block text-amber-deep dark:text-amber">
              Grow profitably.
              <motion.svg
                aria-hidden
                className="pointer-events-none absolute -bottom-2 left-0 h-[0.16em] w-full text-amber"
                viewBox="0 0 300 8"
                fill="none"
                preserveAspectRatio="none"
              >
                <motion.path
                  d="M3 4C80 1 220 1 297 5"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.7, ease, delay: 0.5 }}
                />
              </motion.svg>
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-5 text-[18px] font-bold text-text"
          >
            Ditch the register.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: 0.25 }}
            className="mt-3 max-w-md text-[16px] leading-relaxed text-muted"
          >
            Customers, billing, deliveries, labour and accounts — your whole
            laundry business in one clean dashboard. Set up in a day.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: 0.35 }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <Link
              href={DEMO_URL}
              className="inline-flex items-center gap-2 rounded-xl bg-navy px-6 py-3.5 text-sm font-semibold text-white shadow-navy transition-all duration-200 hover:-translate-y-0.5 hover:bg-navy-deep"
            >
              <Play size={16} className="fill-white" /> Try live demo
            </Link>
            <a
              href={waLink()}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-line bg-card px-6 py-3.5 text-sm font-semibold text-text transition-all duration-200 hover:-translate-y-0.5 hover:border-navy/30"
            >
              <MessageCircle size={16} className="text-wa" /> WhatsApp us
            </a>
          </motion.div>

          {/* stats */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: 0.45 }}
            className="mt-11 flex gap-10"
          >
            {stats.map((s) => (
              <div key={s.label}>
                <div className="font-display text-[clamp(26px,3.4vw,34px)] font-extrabold leading-none text-text">
                  <Counter value={s.value} decimals={s.value % 1 !== 0 ? 1 : 0} />
                  {s.suffix}
                </div>
                <div className="mt-2 max-w-[110px] text-[12.5px] leading-snug text-muted">
                  {s.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* ── dashboard mockup ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease, delay: 0.2 }}
          className="relative mx-auto w-full max-w-xl"
        >
          <AppMockup />
          <HeroPhone />
        </motion.div>
      </div>
    </section>
  );
}
