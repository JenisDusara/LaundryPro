"use client";

import { motion } from "framer-motion";
import { Store, ClipboardList, TrendingUp } from "lucide-react";
import { Container, Eyebrow, SectionHeading } from "@/components/ui/primitives";
import { workSteps } from "@/lib/site";

const icons = [Store, ClipboardList, TrendingUp];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-20 sm:py-28">
      <Container className="relative">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-14 max-w-2xl text-center"
        >
          <Eyebrow>How it works</Eyebrow>
          <SectionHeading>From setup to growth in 3 steps</SectionHeading>
        </motion.div>

        <div className="relative grid gap-6 md:grid-cols-3">
          <span
            aria-hidden
            className="pointer-events-none absolute left-[16%] right-[16%] top-[52px] hidden border-t-2 border-dashed border-cyan-400/30 md:block"
          />
          {workSteps.map((s, i) => {
            const Icon = icons[i];
            return (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "0px 0px -60px 0px" }}
                transition={{ delay: i * 0.12, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                className="group relative overflow-hidden rounded-2xl border border-line bg-card p-7 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/40 hover:shadow-card-hover"
              >
                <span className="pointer-events-none absolute -right-1 top-2 font-display text-[72px] font-extrabold leading-none text-cyan-500/[0.08] dark:text-white/[0.05]">
                  {i + 1}
                </span>
                <div className="relative mb-5 grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-cyan-500 to-navy text-white shadow-navy ring-4 ring-bg transition-transform duration-300 group-hover:scale-110">
                  <Icon size={22} />
                </div>
                <div className="relative mb-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-cyan-600 dark:text-cyan-400">
                  Step {i + 1}
                </div>
                <h3 className="relative mb-2 text-[17px] font-bold text-text">{s.title}</h3>
                <p className="relative text-[13.5px] leading-relaxed text-muted">{s.body}</p>
              </motion.div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
