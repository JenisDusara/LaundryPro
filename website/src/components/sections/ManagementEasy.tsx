"use client";

import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Store,
  ShieldCheck,
  BarChart3,
  Users,
  Wallet,
  TrendingUp,
  Boxes,
  type LucideIcon,
} from "lucide-react";
import { Container, Eyebrow, SectionHeading } from "@/components/ui/primitives";
import { managementIntro, managementCards } from "@/lib/site";

const icons: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  store: Store,
  shield: ShieldCheck,
  chart: BarChart3,
  users: Users,
  wallet: Wallet,
  trending: TrendingUp,
  boxes: Boxes,
};

export function ManagementEasy() {
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
          <Eyebrow>All in one place</Eyebrow>
          <SectionHeading>{managementIntro.heading}</SectionHeading>
          <p className="mt-4 text-[15px] leading-relaxed text-muted">{managementIntro.body}</p>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {managementCards.map((c, i) => {
            const Icon = icons[c.icon];
            return (
              <motion.div
                key={c.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "0px 0px -50px 0px" }}
                transition={{ delay: (i % 4) * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="group rounded-2xl border border-line bg-card p-6 shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:border-cyan-400/50 hover:shadow-card-hover"
              >
                <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-cyan-500/15 to-navy/10 text-cyan-600 ring-1 ring-cyan-500/20 transition-transform duration-300 group-hover:scale-110 dark:text-cyan-400">
                  <Icon size={22} />
                </div>
                <h3 className="mb-2 text-[16px] font-bold text-text">{c.title}</h3>
                <p className="text-[13.5px] leading-relaxed text-muted">{c.body}</p>
              </motion.div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
