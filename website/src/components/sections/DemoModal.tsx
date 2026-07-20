"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, MessageCircle, ArrowRight, Check } from "lucide-react";
import { waLink, WHATSAPP_DISPLAY, demo } from "@/lib/site";

const ease = [0.16, 1, 0.3, 1] as const;

/**
 * Global "Book a free demo" popup. Opens whenever the user clicks any link
 * pointing to #demo (navbar CTA, hero button, pricing buttons, etc.) — mounted
 * once in the root layout, so every "Get free demo" button triggers it.
 */
export function DemoModal() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [shop, setShop] = useState("");
  const [phone, setPhone] = useState("");

  // Intercept clicks on any <a href="...#demo"> and open the popup instead.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement)?.closest?.('a[href$="#demo"]');
      if (a) {
        e.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener("click", onClick);
    const onOpen = () => setOpen(true);
    window.addEventListener("open-demo", onOpen);
    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("open-demo", onOpen);
    };
  }, []);

  // Esc to close + lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
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
    setOpen(false);
  };

  const field =
    "w-full rounded-xl border border-line bg-bg px-4 py-3 text-[14.5px] text-text placeholder:text-faint outline-none transition-colors focus:border-navy/60 focus:ring-2 focus:ring-navy/15";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-ink/70 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 10 }}
            transition={{ duration: 0.35, ease }}
            onClick={(e) => e.stopPropagation()}
            className="relative my-8 w-full max-w-md rounded-[26px] border border-line bg-card p-7 shadow-card-hover sm:p-8"
          >
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full text-muted transition-colors hover:bg-navy/[0.06] hover:text-text dark:hover:bg-white/[0.06]"
            >
              <X size={18} />
            </button>

            <div className="mb-1 text-[11.5px] font-bold uppercase tracking-[0.16em] text-wa-deep">
              {demo.eyebrow}
            </div>
            <h3 className="text-[21px] font-extrabold text-text">Book your free demo</h3>
            <p className="mt-1 text-[13.5px] text-muted">
              Fill this in — we&apos;ll reach out on WhatsApp.
            </p>

            <ul className="mt-4 space-y-2">
              {demo.points.map((p) => (
                <li key={p} className="flex items-start gap-2 text-[13px] text-muted">
                  <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-wa/15 text-wa-deep">
                    <Check size={10} strokeWidth={3} />
                  </span>
                  {p}
                </li>
              ))}
            </ul>

            <form onSubmit={submit} className="mt-5 space-y-3.5">
              <div>
                <label className="mb-1.5 block text-[12.5px] font-semibold text-muted">Your name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Rajesh Sharma" className={field} />
              </div>
              <div>
                <label className="mb-1.5 block text-[12.5px] font-semibold text-muted">Shop name</label>
                <input value={shop} onChange={(e) => setShop(e.target.value)} placeholder="Shree Chamunda Laundry" className={field} />
              </div>
              <div>
                <label className="mb-1.5 block text-[12.5px] font-semibold text-muted">Phone number</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder={WHATSAPP_DISPLAY} className={field} />
              </div>

              <button
                type="submit"
                className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-wa px-5 py-3.5 text-sm font-bold text-white shadow-[0_12px_30px_-8px_rgba(37,211,102,0.5)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-wa-deep"
              >
                <MessageCircle size={17} />
                Get free demo on WhatsApp
                <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-0.5" />
              </button>
            </form>

            <p className="mt-3 text-center text-[12px] text-faint">
              No card needed · Set up the same day · Or call{" "}
              <a href={waLink()} target="_blank" rel="noreferrer" className="font-semibold text-wa-deep">
                {WHATSAPP_DISPLAY}
              </a>
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
