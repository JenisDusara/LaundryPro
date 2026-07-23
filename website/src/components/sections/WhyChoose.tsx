"use client";

import { motion } from "framer-motion";
import {
  Zap,
  Cloud,
  MessageCircle,
  TrendingUp,
  Users,
  MonitorSmartphone,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { Container, Eyebrow, SectionHeading } from "@/components/ui/primitives";
import { AnimatedPhone } from "@/components/ui/AnimatedPhone";
import { whyChoose } from "@/lib/site";

const ease = [0.16, 1, 0.3, 1] as const;

// One icon + accent per feature (matches the order of `whyChoose`).
const featureIcons: LucideIcon[] = [
  Zap,
  Cloud,
  MessageCircle,
  TrendingUp,
  Users,
  MonitorSmartphone,
];
const featureAccents = ["#2563eb", "#06b6d4", "#25d366", "#ea580c", "#2563eb", "#06b6d4"];

export function WhyChoose() {
  return (
    <section className="section-band relative overflow-hidden py-20 sm:py-28">
      <div className="bg-dots pointer-events-none absolute inset-0 opacity-50" aria-hidden />
      <Container className="relative">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* phone */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "0px 0px -60px 0px" }}
            transition={{ duration: 0.7, ease }}
            className="order-2 flex justify-center lg:order-1"
          >
            <AnimatedPhone start={3} />
          </motion.div>

          {/* copy + feature cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -60px 0px" }}
            transition={{ duration: 0.6, ease, delay: 0.1 }}
            className="order-1 lg:order-2"
          >
            <Eyebrow align="left">Smart, simple, for every laundry shop</Eyebrow>
            <SectionHeading align="left">Why choose LaundryMax?</SectionHeading>

            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              {whyChoose.map((w, i) => {
                const Icon = featureIcons[i];
                const c = featureAccents[i];
                return (
                  <motion.div
                    key={w.title}
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "0px 0px -40px 0px" }}
                    transition={{ delay: 0.05 * i, duration: 0.5, ease }}
                    className="group rounded-2xl border border-line bg-card p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
                  >
                    <span
                      className="mb-3 grid h-10 w-10 place-items-center rounded-xl transition-transform duration-300 group-hover:scale-110"
                      style={{
                        background: `${c}1a`,
                        color: c,
                        boxShadow: `inset 0 0 0 1px ${c}33`,
                      }}
                    >
                      <Icon size={19} />
                    </span>
                    <h3 className="font-display text-[15px] font-bold leading-snug text-text">
                      {w.title}
                    </h3>
                    <p className="mt-1.5 text-[13px] leading-snug text-muted">{w.body}</p>
                  </motion.div>
                );
              })}
            </div>

            <a
              href="#demo"
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
