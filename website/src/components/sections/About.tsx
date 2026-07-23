"use client";

import { motion } from "framer-motion";
import { Check, Store, Star, MapPin, type LucideIcon } from "lucide-react";
import { Container } from "@/components/ui/primitives";
import { Counter } from "@/components/ui/Counter";
import { about } from "@/lib/site";

const ease = [0.16, 1, 0.3, 1] as const;

const statIcons: LucideIcon[] = [Store, Star, MapPin];
const statAccents = ["#2563eb", "#ea580c", "#06b6d4"];

function Bubble({ size, className, delay = 0 }: { size: number; className: string; delay?: number }) {
  return (
    <span
      className={`pointer-events-none absolute animate-floaty rounded-full ${className}`}
      style={{
        width: size,
        height: size,
        animationDelay: `${delay}s`,
        background:
          "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.9) 0 8%, rgba(186,230,253,0.5) 30%, rgba(56,189,248,0.25) 62%, rgba(37,99,235,0.12) 100%)",
        boxShadow: "inset -3px -4px 8px rgba(37,99,235,0.15), inset 3px 3px 6px rgba(255,255,255,0.6)",
      }}
      aria-hidden
    />
  );
}

export function About() {
  return (
    <section id="about" className="relative overflow-hidden py-20 sm:py-28">
      <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-cyan-400/10 blur-[110px]" aria-hidden />
      <Bubble size={22} className="left-[8%] top-16" delay={0} />
      <Bubble size={14} className="right-[12%] top-24" delay={1.1} />
      <Bubble size={30} className="right-[6%] bottom-24" delay={0.6} />

      <Container className="relative">
        {/* heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease }}
          className="mx-auto max-w-2xl text-center"
        >
          <div className="mb-4 text-[12px] font-bold uppercase tracking-[0.18em] text-cyan-500">
            {about.eyebrow}
          </div>
          <h2 className="font-display text-[clamp(28px,4.4vw,46px)] font-extrabold leading-[1.12] tracking-[-0.02em] text-[#12315f] dark:text-white">
            Made for how your laundry shop actually runs
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-[15.5px] leading-relaxed text-muted">
            {about.body}
          </p>
        </motion.div>

        {/* combined panel: stats row + "What you get" checklist in one card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "0px 0px -50px 0px" }}
          transition={{ duration: 0.6, ease, delay: 0.1 }}
          className="mx-auto mt-12 max-w-4xl overflow-hidden rounded-2xl border border-line bg-card shadow-card"
        >
          {/* stats row */}
          <div className="grid divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {about.highlights.map((h, i) => {
              const Icon = statIcons[i];
              const c = statAccents[i];
              return (
                <div key={h.label} className="group px-6 py-8 text-center">
                  <span
                    className="mx-auto mb-4 grid h-11 w-11 place-items-center rounded-xl ring-1 transition-transform duration-300 group-hover:scale-110"
                    style={{ background: `${c}1a`, color: c, boxShadow: `inset 0 0 0 1px ${c}33` }}
                  >
                    <Icon size={20} />
                  </span>
                  <div className="font-display text-[clamp(28px,4vw,38px)] font-extrabold leading-none text-text">
                    <Counter value={h.value} decimals={h.value % 1 !== 0 ? 1 : 0} />
                    <span style={{ color: c }}>{h.suffix}</span>
                  </div>
                  <div className="mt-2 text-[12.5px] leading-snug text-muted">{h.label}</div>
                </div>
              );
            })}
          </div>

          {/* "What you get" checklist */}
          <div className="border-t border-line bg-bg/40 p-6 sm:p-8">
            <div className="mb-5 flex items-center gap-2 text-[11.5px] font-bold uppercase tracking-[0.16em] text-cyan-600 dark:text-cyan-400">
              <span className="h-px flex-1 bg-line" />
              What you get
              <span className="h-px flex-1 bg-line" />
            </div>
            <ul className="grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
              {about.points.map((p) => (
                <li key={p} className="flex items-start gap-2.5">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-cyan-500 text-white">
                    <Check size={12} strokeWidth={3} />
                  </span>
                  <span className="text-[14px] font-medium leading-snug text-text">{p}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
