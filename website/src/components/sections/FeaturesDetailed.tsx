"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ReceiptIndianRupee,
  Users,
  Truck,
  Tags,
  MessageCircle,
  Wallet,
  BookOpen,
  BarChart3,
  HardHat,
  Check,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { Container, Eyebrow } from "@/components/ui/primitives";
import { AnimatedBrowser } from "@/components/ui/AnimatedBrowser";
import { featureBlocks, waLink } from "@/lib/site";

const ease = [0.16, 1, 0.3, 1] as const;

const iconMap: Record<string, LucideIcon> = {
  receipt: ReceiptIndianRupee,
  users: Users,
  truck: Truck,
  tags: Tags,
  message: MessageCircle,
  wallet: Wallet,
  book: BookOpen,
  chart: BarChart3,
  labour: HardHat,
};

/** Decorative "screen" panel — a stylised UI so each block has a visual. */
function Visual({ Icon, name, i }: { Icon: LucideIcon; name: string; i: number }) {
  const amber = i % 3 === 1;
  const wa = i % 3 === 2;
  return (
    <div className="relative">
      <div
        className={`pointer-events-none absolute -inset-4 rounded-[32px] blur-2xl ${
          amber ? "bg-amber/10" : wa ? "bg-wa/10" : "bg-navy/10"
        }`}
        aria-hidden
      />
      <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-ink via-[#12244d] to-ink p-6 shadow-navy-lg ring-1 ring-white/10 sm:p-8">
        <div className="bg-dots pointer-events-none absolute inset-0 opacity-[0.15]" aria-hidden />
        <div className="relative">
          <div className="flex items-center gap-3">
            <span
              className={`grid h-12 w-12 place-items-center rounded-2xl text-white ring-1 ${
                amber
                  ? "bg-amber/25 ring-amber/30"
                  : wa
                  ? "bg-wa/25 ring-wa/30"
                  : "bg-navy/40 ring-white/15"
              }`}
            >
              <Icon size={24} />
            </span>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/50">
                LaundryMax
              </div>
              <div className="text-[15px] font-bold text-white">{name}</div>
            </div>
          </div>

          {/* faux rows */}
          <div className="mt-6 space-y-2.5">
            {[0, 1, 2].map((r) => (
              <div key={r} className="flex items-center gap-3 rounded-xl bg-white/[0.05] p-3">
                <span className="h-8 w-8 shrink-0 rounded-lg bg-white/10" />
                <span className="h-2 flex-1 rounded-full bg-white/10" />
                <span
                  className={`h-2 w-10 rounded-full ${
                    amber ? "bg-amber/50" : wa ? "bg-wa/50" : "bg-sky-400/50"
                  }`}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function FeaturesDetailed() {
  return (
    <>
      {/* hero */}
      <section className="hero-glow relative overflow-hidden">
        <div className="bg-dots bg-dots-fade pointer-events-none absolute inset-0" aria-hidden />
        <Container className="relative py-16 sm:py-20">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease }}
            >
              <Eyebrow align="left">Key features</Eyebrow>
              <h1 className="font-display text-[clamp(32px,5vw,54px)] font-extrabold leading-[1.06] tracking-[-0.02em] text-[#12315f] dark:text-white">
                Everything to run your laundry,{" "}
                <span className="text-gradient-blue">in one place</span>
              </h1>
              <p className="mt-5 max-w-md text-[16px] leading-relaxed text-muted">
                From the billing counter to accounts and reports — every tool a
                laundry or dry-cleaning shop needs, in one clean dashboard.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/#demo"
                  className="btn-gradient group inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold text-white shadow-navy hover:-translate-y-0.5 hover:shadow-navy-lg"
                >
                  Get free demo
                  <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
                <a
                  href={waLink()}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-line bg-card px-6 py-3.5 text-sm font-semibold text-text transition-all duration-200 hover:-translate-y-0.5 hover:border-wa/50 hover:shadow-card"
                >
                  <MessageCircle size={16} className="text-wa" /> WhatsApp us
                </a>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.7, ease, delay: 0.15 }}
              className="hidden justify-center lg:flex"
            >
              <AnimatedBrowser />
            </motion.div>
          </div>
        </Container>
      </section>

      {/* feature blocks */}
      <div className="space-y-4 py-8 sm:space-y-6 sm:py-12">
        {featureBlocks.map((b, i) => {
          const Icon = iconMap[b.icon];
          const reverse = i % 2 === 1;
          return (
            <section key={b.name} className={i % 2 === 1 ? "section-band" : ""}>
              <Container className="py-14 sm:py-20">
                <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
                  <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "0px 0px -60px 0px" }}
                    transition={{ duration: 0.6, ease }}
                    className={reverse ? "lg:order-2" : ""}
                  >
                    <div className="mb-3 text-[12px] font-bold uppercase tracking-[0.16em] text-cyan-600 dark:text-cyan-400">
                      {b.name}
                    </div>
                    <h2 className="font-display text-[clamp(24px,3.4vw,36px)] font-extrabold leading-[1.15] tracking-[-0.02em] text-text">
                      {b.heading}
                    </h2>
                    <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-muted">
                      {b.body}
                    </p>
                    <ul className="mt-6 space-y-3">
                      {b.points.map((p) => (
                        <li key={p} className="flex items-start gap-3">
                          <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-cyan-500 text-white">
                            <Check size={12} strokeWidth={3} />
                          </span>
                          <span className="text-[14.5px] leading-snug text-text">{p}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "0px 0px -60px 0px" }}
                    transition={{ duration: 0.7, ease, delay: 0.1 }}
                    className={reverse ? "lg:order-1" : ""}
                  >
                    <Visual Icon={Icon} name={b.name} i={i} />
                  </motion.div>
                </div>
              </Container>
            </section>
          );
        })}
      </div>

      {/* CTA */}
      <section className="py-16 sm:py-24">
        <Container>
          <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-ink via-[#12244d] to-ink px-6 py-16 text-center shadow-navy-lg ring-1 ring-white/10 sm:px-12">
            <div className="animate-drift pointer-events-none absolute -left-16 top-0 h-72 w-72 rounded-full bg-navy/40 blur-[100px]" aria-hidden />
            <div className="animate-drift pointer-events-none absolute -bottom-20 -right-10 h-64 w-64 rounded-full bg-amber/25 blur-[90px] [animation-delay:-4.5s]" aria-hidden />
            <div className="relative mx-auto max-w-2xl">
              <h2 className="font-display text-[clamp(26px,4vw,42px)] font-extrabold leading-[1.1] tracking-[-0.02em] text-white">
                Run your whole shop with LaundryMax
              </h2>
              <p className="mx-auto mt-4 max-w-md text-[15.5px] leading-relaxed text-white/60">
                Book a free demo and we&apos;ll set up your shop — live the same day.
              </p>
              <Link
                href="/#demo"
                className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-navy transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/90"
              >
                Get a free demo <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
