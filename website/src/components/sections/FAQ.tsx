"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import { Container, Eyebrow, SectionHeading } from "@/components/ui/primitives";
import { faqs, waLink } from "@/lib/site";

const ease = [0.16, 1, 0.3, 1] as const;

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="py-20 sm:py-28">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-14 max-w-2xl text-center"
        >
          <Eyebrow tone="amber">Questions & answers</Eyebrow>
          <SectionHeading>Everything you might be wondering</SectionHeading>
        </motion.div>

        <div className="mx-auto max-w-3xl">
          <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card shadow-card">
            {faqs.map((item, i) => {
              const isOpen = open === i;
              return (
                <div key={item.q}>
                  <button
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-navy/[0.03] dark:hover:bg-white/[0.03]"
                  >
                    <span className="text-[15.5px] font-bold text-text">
                      {item.q}
                    </span>
                    <span
                      className={`grid h-7 w-7 shrink-0 place-items-center rounded-full bg-navy/10 text-navy ring-1 ring-navy/15 transition-transform duration-300 dark:bg-white/10 dark:text-sky-400 dark:ring-white/15 ${
                        isOpen ? "rotate-45" : ""
                      }`}
                    >
                      <Plus size={15} strokeWidth={2.5} />
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease }}
                        className="overflow-hidden"
                      >
                        <p className="px-6 pb-5 pr-14 text-[14.5px] leading-relaxed text-muted">
                          {item.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          <p className="mt-8 text-center text-[14.5px] text-muted">
            Still have a question?{" "}
            <a
              href={waLink("Hi, I have a question about LaundryMax.")}
              target="_blank"
              rel="noreferrer"
              className="font-bold text-navy transition-colors hover:text-navy-deep dark:text-sky-400"
            >
              Message us on WhatsApp
            </a>
          </p>
        </div>
      </Container>
    </section>
  );
}
