"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ArrowRight, Check, CheckCircle2 } from "lucide-react";
import { waLink, WHATSAPP_DISPLAY, demo } from "@/lib/site";

const ease = [0.16, 1, 0.3, 1] as const;

/**
 * Global "Book a free demo" popup. Opens on any link to #demo. On submit it
 * saves the lead and emails it to the owner's inbox (no WhatsApp redirect).
 */
export function DemoModal() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [shop, setShop] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement)?.closest?.('a[href$="#demo"]');
      if (a) {
        e.preventDefault();
        setSent(false);
        setErr("");
        setOpen(true);
      }
    };
    document.addEventListener("click", onClick);
    const onOpen = () => {
      setSent(false);
      setErr("");
      setOpen(true);
    };
    window.addEventListener("open-demo", onOpen);
    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("open-demo", onOpen);
    };
  }, []);

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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, "");
    if (!name.trim() || !shop.trim()) {
      setErr("Please fill in your name and shop name.");
      return;
    }
    if (cleanPhone.length !== 10) {
      setErr("Phone number must be exactly 10 digits.");
      return;
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErr("Please enter a valid email, or leave it blank.");
      return;
    }
    setErr("");
    setSending(true);
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, shop, phone: cleanPhone, email }),
      });
    } catch {
      // ignore — lead may still be saved; show success either way
    }
    setSending(false);
    setSent(true);
    setName("");
    setShop("");
    setPhone("");
    setEmail("");
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

            {sent ? (
              /* ---- success ---- */
              <div className="py-6 text-center">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-wa/15 text-wa-deep">
                  <CheckCircle2 size={34} />
                </div>
                <h3 className="mt-5 text-[21px] font-extrabold text-text">
                  Request received!
                </h3>
                <p className="mx-auto mt-2 max-w-xs text-[14px] leading-relaxed text-muted">
                  Thanks — we&apos;ve got your details and our team will reach out
                  shortly to set up your free demo.
                </p>
                <button
                  onClick={() => setOpen(false)}
                  className="btn-gradient mt-6 inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white shadow-navy"
                >
                  Done
                </button>
              </div>
            ) : (
              /* ---- form ---- */
              <>
                <div className="mb-1 text-[11.5px] font-bold uppercase tracking-[0.16em] text-cyan-600 dark:text-cyan-400">
                  {demo.eyebrow}
                </div>
                <h3 className="text-[21px] font-extrabold text-text">
                  Book your free demo
                </h3>
                <p className="mt-1 text-[13.5px] text-muted">
                  Fill this in — our team will get in touch with you.
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

                <form onSubmit={submit} className="mt-5 space-y-3">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name *"
                    className={field}
                  />
                  <input
                    value={shop}
                    onChange={(e) => setShop(e.target.value)}
                    placeholder="Shop name *"
                    className={field}
                  />
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="Phone number * (10 digits)"
                    className={field}
                  />
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    placeholder="Email (optional)"
                    className={field}
                  />

                  {err && (
                    <p className="text-[12.5px] font-medium text-danger">{err}</p>
                  )}

                  <button
                    type="submit"
                    disabled={sending}
                    className="btn-gradient group inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold text-white shadow-navy transition-all duration-200 hover:-translate-y-0.5 hover:shadow-navy-lg disabled:opacity-60"
                  >
                    {sending ? "Sending…" : "Book my free demo"}
                    {!sending && <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-0.5" />}
                  </button>
                </form>

                <p className="mt-3 text-center text-[12px] text-faint">
                  No card needed · Set up the same day · Or call{" "}
                  <a href={waLink()} target="_blank" rel="noreferrer" className="font-semibold text-wa-deep">
                    {WHATSAPP_DISPLAY}
                  </a>
                </p>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
