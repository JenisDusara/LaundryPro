"use client";

import { motion } from "framer-motion";
import { Check, CheckCheck, MessageCircle } from "lucide-react";
import { Container } from "@/components/ui/primitives";
import { whatsappPoints, whatsappChat } from "@/lib/site";

export function WhatsApp() {
  return (
    <section className="py-20 sm:py-28">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "0px 0px -60px 0px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden rounded-[28px] border border-wa/20 bg-wa-soft p-8 dark:bg-wa/10 sm:p-12"
        >
          {/* soft green glow */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-wa/20 blur-[90px]" aria-hidden />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-wa/10 blur-[80px]" aria-hidden />

          <div className="relative grid items-center gap-10 lg:grid-cols-2">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.16em] text-wa-deep">
                <MessageCircle size={15} /> WhatsApp built in
              </div>
              <h2 className="font-display text-[clamp(26px,4vw,42px)] font-extrabold leading-[1.1] tracking-[-0.02em] text-text">
                Your customers get updates, automatically
              </h2>
              <p className="mt-4 max-w-md text-[15.5px] leading-relaxed text-muted">
                The bill goes out the moment you create it, and a reminder the
                moment it&apos;s ready. No typing, no follow-up calls — just a
                professional touch that keeps customers coming back.
              </p>
              <ul className="mt-6 space-y-3">
                {whatsappPoints.map((p) => (
                  <li key={p} className="flex items-center gap-3 text-[14px] font-semibold text-text">
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-wa text-white">
                      <Check size={14} strokeWidth={3} />
                    </span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>

            {/* WhatsApp-style chat window */}
            <div className="overflow-hidden rounded-2xl border border-wa/25 bg-card shadow-card">
              {/* chat header */}
              <div className="flex items-center gap-3 bg-[#075e54] px-4 py-3 text-white">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-white/20 text-[13px] font-bold">
                  S
                </div>
                <div className="flex-1">
                  <div className="text-[13.5px] font-bold leading-tight">
                    Shree Chamunda Laundry
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-white/75">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#25D366]" />
                    online
                  </div>
                </div>
                <MessageCircle size={17} className="text-white/70" />
              </div>

              {/* messages */}
              <div className="space-y-3 bg-[#efeae2] p-4 dark:bg-[#0b141a] sm:p-5">
                {whatsappChat.map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 12, scale: 0.97 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + i * 0.3, duration: 0.4 }}
                    className="ml-auto max-w-[86%] rounded-2xl rounded-tr-md bg-[#dcf8c6] px-4 py-3 shadow-sm dark:bg-[#075e54]"
                  >
                    <p className="text-[13.5px] leading-snug text-[#0b3d2e] dark:text-white/90">
                      {m.text}
                    </p>
                    <div className="mt-1 flex items-center justify-end gap-1">
                      <span className="text-[10px] text-[#0b3d2e]/50 dark:text-white/50">
                        {m.time}
                      </span>
                      <CheckCheck size={13} className="text-[#34b7f1]" />
                    </div>
                  </motion.div>
                ))}
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.9, duration: 0.4 }}
                  className="pt-1 text-center text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted"
                >
                  Sent automatically by LaundryMax
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
