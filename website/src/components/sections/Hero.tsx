"use client";

import { motion } from "framer-motion";
import { MessageCircle, ArrowRight } from "lucide-react";
import { AnimatedBrowser } from "@/components/ui/AnimatedBrowser";
import { AnimatedPhone } from "@/components/ui/AnimatedPhone";
import { waLink, heroCopy } from "@/lib/site";

const ease = [0.16, 1, 0.3, 1] as const;

function Bubble({ size, className, delay = 0 }: { size: number; className: string; delay?: number }) {
  return (
    <span
      className={`pointer-events-none absolute animate-floaty rounded-full ${className}`}
      style={{
        width: size,
        height: size,
        animationDelay: `${delay}s`,
        background:
          "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.95) 0 8%, rgba(186,230,253,0.55) 30%, rgba(56,189,248,0.28) 62%, rgba(37,99,235,0.14) 100%)",
        boxShadow: "inset -3px -4px 8px rgba(37,99,235,0.18), inset 3px 3px 6px rgba(255,255,255,0.7)",
      }}
      aria-hidden
    />
  );
}

export function Hero() {
  return (
    <section id="top" className="hero-glow relative overflow-hidden">
      <div className="bg-dots bg-dots-fade pointer-events-none absolute inset-0" aria-hidden />
      <div className="pointer-events-none absolute -left-32 top-10 h-72 w-72 rounded-full bg-navy/15 blur-[110px]" aria-hidden />
      <div className="pointer-events-none absolute -right-24 top-32 h-64 w-64 rounded-full bg-amber/15 blur-[100px]" aria-hidden />

      <div className="relative mx-auto grid max-w-content items-center gap-12 px-5 pb-16 pt-12 sm:px-8 sm:pb-24 sm:pt-16 lg:grid-cols-2 lg:gap-16">
        {/* copy */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
            className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-line bg-card px-4 py-2 text-[12px] font-bold uppercase tracking-[0.12em] text-cyan-600 shadow-sm dark:text-cyan-400"
          >
            <span className="animate-pulse-dot h-2 w-2 rounded-full bg-wa" />
            {heroCopy.brand}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: 0.05 }}
            className="font-display text-[clamp(40px,6vw,66px)] font-extrabold leading-[1.05] tracking-[-0.02em] text-[#12315f] dark:text-white"
          >
            {heroCopy.lines.map((l) => (
              <span key={l}>
                {l}
                <br />
              </span>
            ))}
            <span className="text-gradient-blue">{heroCopy.accent}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: 0.2 }}
            className="mt-5 max-w-md text-[16px] leading-relaxed text-muted"
          >
            {heroCopy.body}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: 0.32 }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <a
              href="#demo"
              className="btn-gradient group inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold text-white shadow-navy hover:-translate-y-0.5 hover:shadow-navy-lg"
            >
              {heroCopy.cta}
              <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-0.5" />
            </a>
            <a
              href={waLink()}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-line bg-card px-6 py-3.5 text-sm font-semibold text-text transition-all duration-200 hover:-translate-y-0.5 hover:border-wa/50 hover:shadow-card"
            >
              <MessageCircle size={16} className="text-wa" /> WhatsApp us
            </a>
          </motion.div>
        </div>

        {/* device scene */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease, delay: 0.2 }}
          className="relative mx-auto w-full max-w-[520px]"
        >
          <Bubble size={30} className="left-6 -top-2" delay={0} />
          <Bubble size={18} className="right-10 top-4" delay={1} />
          <Bubble size={22} className="right-0 bottom-10" delay={0.5} />

          <div className="relative px-2 pt-8">
            <AnimatedBrowser />
            <div className="pointer-events-none absolute -bottom-10 -left-5 z-20 origin-bottom-left scale-[0.46] sm:scale-[0.52]">
              <AnimatedPhone start={2} />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
