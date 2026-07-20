"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Users,
  ReceiptIndianRupee,
  Truck,
  BarChart3,
  HardHat,
  Wallet,
  Tags,
  ArrowRight,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { Container, Eyebrow, SectionHeading } from "@/components/ui/primitives";
import { features, DEMO_URL } from "@/lib/site";

const iconMap: Record<string, LucideIcon> = {
  users: Users,
  receipt: ReceiptIndianRupee,
  truck: Truck,
  chart: BarChart3,
  labour: HardHat,
  wallet: Wallet,
  tags: Tags,
};

export function Features() {
  return (
    <section id="features" className="py-20 sm:py-28">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-14 max-w-2xl text-center"
        >
          <Eyebrow>Everything you need</Eyebrow>
          <SectionHeading>Seven tools, one dashboard</SectionHeading>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => {
            const Icon = iconMap[f.icon];
            const amber = f.accent === "amber";
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "0px 0px -50px 0px" }}
                transition={{ delay: (i % 3) * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className={`group relative overflow-hidden rounded-2xl border border-line bg-card p-7 shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-card-hover ${
                  amber ? "hover:border-amber/40" : "hover:border-navy/40"
                }`}
              >
                {/* corner glow on hover */}
                <span
                  className={`pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full blur-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${
                    amber ? "bg-amber/15" : "bg-navy/15"
                  }`}
                />
                <div
                  className={`relative mb-5 grid h-12 w-12 place-items-center rounded-xl ring-1 transition-transform duration-300 group-hover:scale-110 ${
                    amber
                      ? "bg-gradient-to-br from-amber-soft to-amber-soft/40 text-amber-deep ring-amber/20 dark:from-amber/20 dark:to-amber/5 dark:text-amber"
                      : "bg-gradient-to-br from-navy/10 to-navy/[0.03] text-navy ring-navy/20 dark:from-white/10 dark:to-white/[0.03] dark:text-sky-400 dark:ring-white/15"
                  }`}
                >
                  <Icon size={22} />
                </div>
                <h3 className="relative mb-2 text-[17px] font-bold text-text">{f.title}</h3>
                <p className="relative text-[14px] leading-relaxed text-muted">{f.body}</p>
              </motion.div>
            );
          })}

          {/* filler CTA card — completes the grid */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -50px 0px" }}
            transition={{ delay: 0.16, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <Link
              href={DEMO_URL}
              className="btn-gradient group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl p-7 text-white shadow-navy transition-all duration-300 hover:-translate-y-1.5 hover:shadow-navy-lg"
            >
              <span className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/15 blur-2xl" />
              <div>
                <div className="mb-5 grid h-12 w-12 place-items-center rounded-xl bg-white/15 ring-1 ring-white/25">
                  <Sparkles size={22} />
                </div>
                <h3 className="mb-2 text-[17px] font-bold">See it all in action</h3>
                <p className="text-[14px] leading-relaxed text-white/80">
                  Every tool, live with sample data. No signup, no card.
                </p>
              </div>
              <span className="mt-5 inline-flex items-center gap-1.5 text-[14px] font-bold">
                Try the live demo
                <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-1" />
              </span>
            </Link>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
