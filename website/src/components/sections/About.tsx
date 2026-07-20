"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Container } from "@/components/ui/primitives";
import { Counter } from "@/components/ui/Counter";
import { about } from "@/lib/site";

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

export function About() {
  return (
    <section id="about" className="relative overflow-hidden py-20 sm:py-28">
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-sky-400/10 blur-[100px]" aria-hidden />
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* trust / highlights card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 24 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -60px 0px" }}
            transition={{ duration: 0.7, ease }}
            className="relative order-1"
          >
            <Bubble size={26} className="left-2 -top-2" delay={0} />
            <Bubble size={16} className="left-16 -top-4" delay={1.2} />
            <Bubble size={30} className="-right-1 top-6" delay={0.6} />

            <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-ink via-[#12244d] to-ink p-8 shadow-navy-lg ring-1 ring-white/10 sm:p-10">
              <div className="animate-drift pointer-events-none absolute -right-14 -top-10 h-56 w-56 rounded-full bg-navy/40 blur-[90px]" aria-hidden />
              <div className="animate-drift pointer-events-none absolute -bottom-16 -left-8 h-52 w-52 rounded-full bg-amber/25 blur-[80px] [animation-delay:-4.5s]" aria-hidden />

              <div className="relative">
                <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 py-1.5 text-[11.5px] font-bold uppercase tracking-[0.14em] text-white/70">
                  <span className="animate-pulse-dot h-1.5 w-1.5 rounded-full bg-wa" />
                  Trusted across India
                </div>

                <div className="grid gap-7 sm:grid-cols-3">
                  {about.highlights.map((h) => (
                    <div key={h.label}>
                      <div className="font-display text-[clamp(30px,4vw,42px)] font-extrabold leading-none text-white">
                        <Counter value={h.value} decimals={h.value % 1 !== 0 ? 1 : 0} />
                        <span className="text-gradient-amber">{h.suffix}</span>
                      </div>
                      <div className="mt-2 text-[12.5px] leading-snug text-white/60">{h.label}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 space-y-2.5 border-t border-white/10 pt-6">
                  {about.cardPoints.map((p) => (
                    <div key={p} className="flex items-center gap-2.5 text-[13.5px] text-white/80">
                      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-cyan-500 text-white">
                        <Check size={12} strokeWidth={3} />
                      </span>
                      {p}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* copy */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -60px 0px" }}
            transition={{ duration: 0.6, ease, delay: 0.1 }}
            className="order-2"
          >
            <div className="mb-4 text-[12px] font-bold uppercase tracking-[0.18em] text-cyan-500">
              {about.eyebrow}
            </div>
            <h2 className="font-display text-[clamp(28px,4.4vw,46px)] font-extrabold leading-[1.12] tracking-[-0.02em] text-[#12315f] dark:text-white">
              Smart, Scalable &amp; Simplified Laundry Business Management Software
            </h2>
            <p className="mt-5 max-w-lg text-[15.5px] leading-relaxed text-muted">{about.body}</p>

            <ul className="mt-7 grid gap-3 sm:grid-cols-2">
              {about.points.map((p) => (
                <li key={p} className="flex items-start gap-2.5">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-cyan-500 text-white">
                    <Check size={12} strokeWidth={3} />
                  </span>
                  <span className="text-[14px] font-medium leading-snug text-text">{p}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
