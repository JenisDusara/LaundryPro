"use client";

import { motion } from "framer-motion";
import { NotebookPen, TrendingDown, Users } from "lucide-react";
import { Container, Eyebrow, SectionHeading } from "@/components/ui/primitives";
import { problems } from "@/lib/site";

const icons = [NotebookPen, TrendingDown, Users];

export function Problem() {
  return (
    <section className="py-20 sm:py-28">
      <Container>
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
                className="rounded-2xl border border-line bg-card p-7 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
              >
                <div className="mb-5 grid h-12 w-12 place-items-center rounded-xl bg-danger-soft text-danger">
                  <Icon size={22} />
                </div>
                <h3 className="mb-2.5 text-lg font-bold text-text">{p.title}</h3>
                <p className="text-[14px] leading-relaxed text-muted">{p.body}</p>
              </motion.div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
