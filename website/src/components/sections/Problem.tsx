"use client";

import { motion } from "framer-motion";
import { NotebookPen, TrendingDown, Users } from "lucide-react";
import { Container, Eyebrow, SectionHeading } from "@/components/ui/primitives";
import { Bubbles } from "@/components/ui/LaundryDecor";
import { problems } from "@/lib/site";

const icons = [NotebookPen, TrendingDown, Users];

export function Problem() {
  return (
    <section className="relative py-20 sm:py-28">
      <Bubbles className="opacity-70" />
      <Container className="relative">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-14 max-w-2xl text-center"
        >
          <Eyebrow tone="amber">The daily struggle</Eyebrow>
          <SectionHeading>Running a shop on a notebook is costing you</SectionHeading>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3">
          {problems.map((p, i) => {
            const Icon = icons[i];
            return (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "0px 0px -60px 0px" }}
                transition={{ delay: i * 0.12, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                className="group relative overflow-hidden rounded-2xl border border-line bg-card p-7 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-danger/30 hover:shadow-card-hover"
              >
                {/* red wash that appears on hover */}
                <span className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-danger/10 blur-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="relative mb-5 grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-danger-soft to-danger-soft/40 text-danger ring-1 ring-danger/15 transition-transform duration-300 group-hover:scale-110 dark:from-danger/20 dark:to-danger/5">
                  <Icon size={22} />
                </div>
                <h3 className="relative mb-2.5 text-lg font-bold text-text">{p.title}</h3>
                <p className="relative text-[14px] leading-relaxed text-muted">{p.body}</p>
              </motion.div>
            );
          })}
        </div>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="mt-10 text-center text-[15px] font-semibold text-muted"
        >
          LaundryMax fixes all three —{" "}
          <span className="text-gradient-blue font-bold">in one dashboard.</span>
        </motion.p>
      </Container>
    </section>
  );
}
