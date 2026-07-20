"use client";

import { motion } from "framer-motion";
import { WashingMachine, Droplets, Wind, Truck, type LucideIcon } from "lucide-react";
import { Container } from "@/components/ui/primitives";
import { serviceTypes } from "@/lib/site";

const iconMap: Record<string, LucideIcon> = {
  wash: WashingMachine,
  dryclean: Droplets,
  iron: Wind,
  premium: Truck,
};

const ease = [0.16, 1, 0.3, 1] as const;

/** Slim band of the actual laundry services a shop runs — pure theme signal. */
export function Services() {
  return (
    <section id="services" className="relative py-12 sm:py-16">
      <Container>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {serviceTypes.map((s, i) => {
            const Icon = iconMap[s.icon];
            return (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "0px 0px -40px 0px" }}
                transition={{ delay: i * 0.08, duration: 0.5, ease }}
                className="group flex items-center gap-3.5 rounded-2xl border border-line bg-card p-4 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-navy/40 hover:shadow-card-hover"
              >
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-navy/10 to-navy/[0.03] text-navy ring-1 ring-navy/15 transition-transform duration-300 group-hover:scale-110 dark:from-white/10 dark:to-white/[0.03] dark:text-sky-400 dark:ring-white/15">
                  <Icon size={22} strokeWidth={1.8} />
                </span>
                <div>
                  <div className="text-[15px] font-bold text-text">{s.title}</div>
                  <div className="text-[12.5px] leading-snug text-muted">{s.body}</div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
