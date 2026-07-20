"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { Check, ArrowRight } from "lucide-react";
import { Container, Eyebrow, SectionHeading } from "@/components/ui/primitives";
import { DeviceShot } from "@/components/ui/DeviceShot";

const ease = [0.16, 1, 0.3, 1] as const;

type Item = { title: string; body: string };

export function FeatureShowcase({
  id,
  eyebrow,
  heading,
  intro,
  items,
  footer,
  shot,
  custom,
  reverse = false,
  band = false,
}: {
  id?: string;
  eyebrow: string;
  heading: string;
  intro: string;
  items: Item[];
  footer?: string;
  shot?: { src: string; alt: string; frame: "browser" | "laptop" | "phone"; url?: string };
  custom?: ReactNode;
  reverse?: boolean;
  band?: boolean;
}) {
  return (
    <section
      id={id}
      className={`relative py-20 sm:py-28 ${band ? "section-band" : ""}`}
    >
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* image */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -60px 0px" }}
            transition={{ duration: 0.7, ease }}
            className={`flex justify-center ${reverse ? "lg:order-2" : "lg:order-1"}`}
          >
            {custom ? (
              custom
            ) : shot ? (
              shot.frame === "phone" ? (
                <DeviceShot src={shot.src} alt={shot.alt} frame="phone" />
              ) : (
                <DeviceShot src={shot.src} alt={shot.alt} frame={shot.frame} url={shot.url} className="w-full max-w-[520px]" />
              )
            ) : null}
          </motion.div>

          {/* copy */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -60px 0px" }}
            transition={{ duration: 0.6, ease, delay: 0.1 }}
            className={reverse ? "lg:order-1" : "lg:order-2"}
          >
            <Eyebrow align="left">Key features</Eyebrow>
            <SectionHeading align="left">{heading}</SectionHeading>
            <div className="mt-1 text-[13px] font-bold uppercase tracking-[0.16em] text-cyan-600 dark:text-cyan-400">
              {eyebrow}
            </div>
            <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-muted">{intro}</p>

            <ul className="mt-6 grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {items.map((it) => (
                <li key={it.title} className="flex items-start gap-2.5">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-cyan-500 text-white">
                    <Check size={12} strokeWidth={3} />
                  </span>
                  <span className="text-[13.5px] leading-snug text-muted">
                    <span className="font-semibold text-text">{it.title}</span>
                    {" — "}
                    {it.body}
                  </span>
                </li>
              ))}
            </ul>

            {footer && <p className="mt-6 text-[14px] font-semibold text-text">{footer}</p>}

            <a
              href="#demo"
              className="group mt-6 inline-flex items-center gap-1.5 text-[14px] font-bold text-navy transition-colors hover:text-navy-deep dark:text-cyan-400"
            >
              View more
              <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-0.5" />
            </a>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
