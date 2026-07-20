"use client";

import { motion } from "framer-motion";
import { Play, MessageCircle, Shirt } from "lucide-react";
import Link from "next/link";
import { Container } from "@/components/ui/primitives";
import { DEMO_URL, waLink, WHATSAPP_DISPLAY } from "@/lib/site";

export function CTA() {
  return (
    <section className="py-16 sm:py-24">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "0px 0px -80px 0px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-ink via-[#12244d] to-ink px-6 py-16 text-center shadow-navy-lg ring-1 ring-white/10 sm:px-12 sm:py-20"
        >
          {/* drifting glow orbs */}
          <div className="animate-drift pointer-events-none absolute -left-16 top-0 h-72 w-72 rounded-full bg-navy/40 blur-[100px]" aria-hidden />
          <div className="animate-drift pointer-events-none absolute -bottom-20 -right-10 h-64 w-64 rounded-full bg-amber/25 blur-[90px] [animation-delay:-4.5s]" aria-hidden />

          {/* decorative faint garment marks */}
          <Shirt
            size={150}
            className="pointer-events-none absolute -left-6 -top-8 rotate-[-18deg] text-white/[0.05]"
          />
          <Shirt
            size={120}
            className="pointer-events-none absolute -bottom-8 right-4 rotate-[16deg] text-amber/25"
          />

          <div className="relative mx-auto max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 py-1.5 text-[11.5px] font-bold uppercase tracking-[0.14em] text-white/70">
              <span className="animate-pulse-dot h-1.5 w-1.5 rounded-full bg-wa" />
              Free demo · No card needed
            </div>
            <h2 className="font-display text-[clamp(28px,4.6vw,50px)] font-extrabold leading-[1.08] tracking-[-0.02em] text-white">
              Ready to run your shop{" "}
              <span className="text-gradient-amber">the right way?</span>
            </h2>
            <p className="mx-auto mt-4 max-w-md text-[15.5px] leading-relaxed text-white/60">
              Join 500+ owners who ditched the register. Set up in a day —
              billing, deliveries and reports from day one.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href={waLink()}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-navy transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/90"
              >
                <MessageCircle size={17} className="text-wa" /> WhatsApp us
              </a>
              <Link
                href={DEMO_URL}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3.5 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/10"
              >
                <Play size={15} className="fill-white" /> Try demo
              </Link>
            </div>

            <div className="mt-6 text-[14px] font-semibold text-white/70">
              {WHATSAPP_DISPLAY}
            </div>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
