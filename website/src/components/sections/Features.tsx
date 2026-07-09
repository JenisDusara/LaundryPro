"use client";

import { motion } from "framer-motion";
import {
  Users,
  ReceiptIndianRupee,
  Truck,
  BarChart3,
  HardHat,
  Wallet,
  Tags,
  type LucideIcon,
} from "lucide-react";
import { Container, Eyebrow, SectionHeading } from "@/components/ui/primitives";
import { features } from "@/lib/site";

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
                className="group relative overflow-hidden rounded-2xl border border-line bg-card p-7 shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-card-hover"
              >
                {/* top accent bar */}
                <span
                  className={`absolute inset-x-0 top-0 h-1 ${amber ? "bg-amber" : "bg-navy"}`}
                />
                <div
                  className={`mb-5 grid h-12 w-12 place-items-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${
                    amber ? "bg-amber-soft text-amber-deep" : "bg-navy/10 text-navy dark:bg-white/10 dark:text-white"
                  }`}
                >
                  <Icon size={22} />
                </div>
                <h3 className="mb-2 text-[17px] font-bold text-text">{f.title}</h3>
                <p className="text-[14px] leading-relaxed text-muted">{f.body}</p>
              </motion.div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
