"use client";

import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { Container, Eyebrow, SectionHeading } from "@/components/ui/primitives";
import { pricing, waLink } from "@/lib/site";

const ease = [0.16, 1, 0.3, 1] as const;

export function Pricing() {
  return (
    <section id="pricing" className="section-band relative py-20 sm:py-28">
      <div className="bg-dots pointer-events-none absolute inset-0 opacity-50" aria-hidden />
      <Container className="relative">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-14 max-w-2xl text-center"
        >
          <Eyebrow>Simple pricing</Eyebrow>
          <SectionHeading>One plan for every size of shop</SectionHeading>
          <p className="mt-4 text-[15px] leading-relaxed text-muted">
            No setup fees. No hidden charges. Cancel anytime. Every plan starts
            with a free demo.
          </p>
        </motion.div>

        <div className="grid items-stretch gap-6 md:grid-cols-3">
          {pricing.map((plan, i) => {
            const featured = plan.featured;
            const href =
              plan.cta === "Talk to us"
                ? waLink(
                    `Hi, I'd like to know more about the ${plan.name} plan for my laundry shop.`
                  )
                : "#demo";
            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "0px 0px -50px 0px" }}
                transition={{ delay: i * 0.1, duration: 0.55, ease }}
                className={`relative flex flex-col rounded-2xl p-7 transition-all duration-300 hover:-translate-y-1.5 ${
                  featured
                    ? "bg-gradient-to-br from-ink via-[#12244d] to-ink text-white shadow-navy-lg ring-1 ring-white/10 md:-my-2 md:py-9"
                    : "border border-line bg-card shadow-card hover:shadow-card-hover hover:border-navy/40"
                }`}
              >
                {featured && (
                  <>
                    <span className="animate-drift pointer-events-none absolute -right-12 -top-10 h-44 w-44 rounded-full bg-amber/25 blur-[80px]" aria-hidden />
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-amber px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-white shadow-amber">
                        <Sparkles size={12} /> Most popular
                      </div>
                    </div>
                  </>
                )}

                <div className="relative">
                  <h3
                    className={`text-[15px] font-bold uppercase tracking-[0.08em] ${
                      featured ? "text-white/80" : "text-navy dark:text-sky-400"
                    }`}
                  >
                    {plan.name}
                  </h3>
                  <div className="mt-4 flex items-end gap-1">
                    <span
                      className={`font-display text-[40px] font-extrabold leading-none ${
                        featured ? "text-white" : "text-text"
                      }`}
                    >
                      {plan.price}
                    </span>
                    <span
                      className={`pb-1 text-[14px] font-medium ${
                        featured ? "text-white/60" : "text-muted"
                      }`}
                    >
                      {plan.period}
                    </span>
                  </div>
                  <p
                    className={`mt-3 text-[13.5px] leading-relaxed ${
                      featured ? "text-white/70" : "text-muted"
                    }`}
                  >
                    {plan.tagline}
                  </p>
                </div>

                <ul className="relative mt-6 flex-1 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <span
                        className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full ${
                          featured
                            ? "bg-white/15 text-white ring-1 ring-white/20"
                            : "bg-navy/10 text-navy ring-1 ring-navy/20 dark:bg-white/10 dark:text-sky-400 dark:ring-white/15"
                        }`}
                      >
                        <Check size={12} strokeWidth={3} />
                      </span>
                      <span
                        className={`text-[14px] leading-snug ${
                          featured ? "text-white/90" : "text-text"
                        }`}
                      >
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>

                <a
                  href={href}
                  target={plan.cta === "Talk to us" ? "_blank" : undefined}
                  rel={plan.cta === "Talk to us" ? "noreferrer" : undefined}
                  className={`relative mt-8 inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-bold transition-all duration-200 hover:-translate-y-0.5 ${
                    featured
                      ? "bg-white text-navy hover:bg-white/90"
                      : "btn-gradient text-white shadow-navy hover:shadow-navy-lg"
                  }`}
                >
                  {plan.cta}
                </a>
              </motion.div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
