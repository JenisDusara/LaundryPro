"use client";

import { motion } from "framer-motion";
import { Search, Shirt, ReceiptText, Truck } from "lucide-react";
import { Container, Eyebrow, SectionHeading } from "@/components/ui/primitives";
import { steps } from "@/lib/site";

const icons = [Search, Shirt, ReceiptText, Truck];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 sm:py-28">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-14 max-w-2xl text-center"
        >
          <Eyebrow>How it works</Eyebrow>
          <SectionHeading>A full entry in under a minute</SectionHeading>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => {
            const Icon = icons[i];
            return (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "0px 0px -60px 0px" }}
                transition={{ delay: i * 0.1, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                className="relative overflow-hidden rounded-2xl border border-line bg-card p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
              >
                <span className="pointer-events-none absolute -right-1 top-2 font-display text-[68px] font-extrabold leading-none text-navy/[0.06] dark:text-white/[0.05]">
                  {i + 1}
                </span>
                <div className="relative mb-5 grid h-12 w-12 place-items-center rounded-full bg-navy text-white shadow-navy">
                  <Icon size={20} />
                </div>
                <div className="relative mb-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-amber-deep">
                  Step {i + 1}
                </div>
                <h3 className="relative mb-2 text-[16px] font-bold text-text">{s.title}</h3>
                <p className="relative text-[13.5px] leading-relaxed text-muted">{s.body}</p>
              </motion.div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
