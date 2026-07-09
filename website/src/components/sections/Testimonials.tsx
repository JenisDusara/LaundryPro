"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { Container, Eyebrow, SectionHeading } from "@/components/ui/primitives";
import { testimonials } from "@/lib/site";

export function Testimonials() {
  return (
    <section id="reviews" className="py-20 sm:py-28">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-14 max-w-2xl text-center"
        >
          <Eyebrow tone="amber">Loved by owners</Eyebrow>
          <SectionHeading>Shops that made the switch</SectionHeading>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.figure
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "0px 0px -60px 0px" }}
              transition={{ delay: i * 0.12, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col rounded-2xl border border-line bg-card p-7 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
            >
              <div className="mb-4 flex gap-0.5">
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star key={s} size={16} className="fill-amber text-amber" />
                ))}
              </div>
              <blockquote className="flex-1 text-[15px] leading-relaxed text-text">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3 border-t border-line pt-5">
                <div className="grid h-11 w-11 place-items-center rounded-full bg-navy text-[15px] font-bold text-white shadow-navy">
                  {t.name[0]}
                </div>
                <div>
                  <div className="text-[14px] font-bold text-text">{t.name}</div>
                  <div className="text-[12.5px] text-muted">{t.city}</div>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </Container>
    </section>
  );
}
