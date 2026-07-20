"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, MessageCircle, ArrowRight } from "lucide-react";
import { Container, Eyebrow, SectionHeading } from "@/components/ui/primitives";
import { demo, waLink, WHATSAPP_DISPLAY } from "@/lib/site";

const ease = [0.16, 1, 0.3, 1] as const;

export function Demo() {
  const [name, setName] = useState("");
  const [shop, setShop] = useState("");
  const [phone, setPhone] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    // Save the lead (fire-and-forget so it can't block the WhatsApp popup).
    fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, shop, phone }),
    }).catch(() => {});
    const message =
      `Hi, I'd like a free demo of LaundryMax.` +
      (name ? `\nName: ${name}` : "") +
      (shop ? `\nShop: ${shop}` : "") +
      (phone ? `\nPhone: ${phone}` : "");
    window.open(waLink(message), "_blank", "noopener,noreferrer");
  };

  const field =
    "w-full rounded-xl border border-line bg-bg px-4 py-3 text-[14.5px] text-text placeholder:text-faint outline-none transition-colors focus:border-navy/60 focus:ring-2 focus:ring-navy/15";

  return (
    <section id="demo" className="py-16 sm:py-24">
      <Container>
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          {/* ── copy ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -60px 0px" }}
            transition={{ duration: 0.6, ease }}
          >
            <Eyebrow align="left" tone="wa">
              {demo.eyebrow}
            </Eyebrow>
            <SectionHeading align="left">{demo.heading}</SectionHeading>
            <p className="mt-5 max-w-md text-[15.5px] leading-relaxed text-muted">
              {demo.body}
            </p>

            <ul className="mt-7 space-y-3">
              {demo.points.map((p) => (
                <li key={p} className="flex items-start gap-2.5">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-wa/15 text-wa-deep ring-1 ring-wa/25">
                    <Check size={12} strokeWidth={3} />
                  </span>
                  <span className="text-[14.5px] font-medium leading-snug text-text">
                    {p}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-7 text-[14px] font-semibold text-muted">
              Prefer to call?{" "}
              <a
                href={waLink()}
                target="_blank"
                rel="noreferrer"
                className="text-wa-deep transition-colors hover:underline"
              >
                {WHATSAPP_DISPLAY}
              </a>
            </div>
          </motion.div>

          {/* ── form card ── */}
          <motion.form
            onSubmit={submit}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -60px 0px" }}
            transition={{ duration: 0.7, ease, delay: 0.1 }}
            className="rounded-[26px] border border-line bg-card p-7 shadow-card-hover sm:p-8"
          >
            <div className="mb-6">
              <h3 className="text-[19px] font-bold text-text">
                Book your free demo
              </h3>
              <p className="mt-1 text-[13.5px] text-muted">
                Fill this in — we&apos;ll reach out on WhatsApp.
              </p>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="mb-1.5 block text-[12.5px] font-semibold text-muted">
                  Your name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Rajesh Sharma"
                  className={field}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[12.5px] font-semibold text-muted">
                  Shop name
                </label>
                <input
                  value={shop}
                  onChange={(e) => setShop(e.target.value)}
                  placeholder="Shree Chamunda Laundry"
                  className={field}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[12.5px] font-semibold text-muted">
                  Phone number
                </label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  inputMode="tel"
                  placeholder="+91 98244 36736"
                  className={field}
                />
              </div>
            </div>

            <button
              type="submit"
              className="group mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-wa px-5 py-3.5 text-sm font-bold text-white shadow-[0_12px_30px_-8px_rgba(37,211,102,0.5)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-wa-deep"
            >
              <MessageCircle size={17} />
              Get free demo on WhatsApp
              <ArrowRight
                size={16}
                className="transition-transform duration-200 group-hover:translate-x-0.5"
              />
            </button>
            <p className="mt-3 text-center text-[12px] text-faint">
              No card needed · Set up the same day
            </p>
          </motion.form>
        </div>
      </Container>
    </section>
  );
}
