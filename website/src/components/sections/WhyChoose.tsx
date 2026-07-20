"use client";

import { motion } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import { Container, Eyebrow, SectionHeading } from "@/components/ui/primitives";
import { AnimatedPhone } from "@/components/ui/AnimatedPhone";
import { whyChoose } from "@/lib/site";

const ease = [0.16, 1, 0.3, 1] as const;

export function WhyChoose() {
  return (
    <section className="section-band relative overflow-hidden py-20 sm:py-28">
      <div className="bg-dots pointer-events-none absolute inset-0 opacity-50" aria-hidden />
      <Container className="relative">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* image */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "0px 0px -60px 0px" }}
            transition={{ duration: 0.7, ease }}
            className="order-2 lg:order-1"
          >
            <AnimatedPhone start={3} />
          </motion.div>

          {/* copy */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -60px 0px" }}
            transition={{ duration: 0.6, ease, delay: 0.1 }}
            className="order-1 lg:order-2"
          >
            <Eyebrow align="left">Smart, simple, for every laundry business</Eyebrow>
            <SectionHeading align="left">Why choose LaundryMax?</SectionHeading>

            <ul className="mt-6 space-y-4">
              {whyChoose.map((w) => (
                <li key={w.title} className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-cyan-500 text-white">
                    <Check size={13} strokeWidth={3} />
                  </span>
                  <span className="text-[14.5px] leading-snug text-muted">
                    <span className="font-bold text-text">{w.title}:</span> {w.body}
                  </span>
                </li>
              ))}
            </ul>

            <a
              href="#pricing"
              className="btn-gradient group mt-8 inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold text-white shadow-navy hover:-translate-y-0.5 hover:shadow-navy-lg"
            >
              Start your 1-month free trial
              <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-0.5" />
            </a>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
