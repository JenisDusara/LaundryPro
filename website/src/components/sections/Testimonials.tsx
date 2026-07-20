"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { Container, Eyebrow, SectionHeading } from "@/components/ui/primitives";
import { testimonials } from "@/lib/site";

type Review = { quote: string; name: string; city: string; rating?: number };

export function Testimonials() {
  // Start with the built-in reviews; swap in admin-managed ones if any exist.
  const [items, setItems] = useState<Review[]>(testimonials);

  useEffect(() => {
    fetch("/api/reviews")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.reviews?.length) setItems(d.reviews as Review[]);
      })
      .catch(() => {});
  }, []);

  return (
    <section id="reviews" className="section-band relative py-20 sm:py-28">
      <div className="bg-dots pointer-events-none absolute inset-0 opacity-50" aria-hidden />
      <Container className="relative">
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
          {items.map((t, i) => (
            <motion.figure
              key={`${t.name}-${i}`}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "0px 0px -60px 0px" }}
              transition={{ delay: (i % 3) * 0.12, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-card p-7 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-navy/30 hover:shadow-card-hover"
            >
              {/* oversized decorative quote mark */}
              <span
                aria-hidden
                className="pointer-events-none absolute -top-3 right-4 font-display text-[92px] font-extrabold leading-none text-navy/[0.07] dark:text-white/[0.06]"
              >
                &rdquo;
              </span>
              <div className="relative mb-4 flex gap-0.5">
                {Array.from({ length: t.rating ?? 5 }).map((_, s) => (
                  <Star key={s} size={16} className="fill-amber text-amber" />
                ))}
              </div>
              <blockquote className="relative flex-1 text-[15px] leading-relaxed text-text">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="relative mt-6 flex items-center gap-3 border-t border-line pt-5">
                <div className="btn-gradient grid h-11 w-11 place-items-center rounded-full text-[15px] font-bold text-white shadow-navy">
                  {t.name[0]}
                </div>
                <div>
                  <div className="text-[14px] font-bold text-text">{t.name}</div>
                  <div className="text-[12.5px] text-muted">
                    Laundry owner · {t.city}
                  </div>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </Container>
    </section>
  );
}
