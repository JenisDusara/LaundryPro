"use client";

import { motion } from "framer-motion";
import {
  LayoutDashboard,
  PlusCircle,
  ListChecks,
  Truck,
  BarChart3,
} from "lucide-react";
import { mockup } from "@/lib/site";

const railIcons = [LayoutDashboard, PlusCircle, ListChecks, Truck, BarChart3];

/** Dark-slate product dashboard shown in the hero (constant across themes). */
export function AppMockup() {
  return (
    <div className="overflow-hidden rounded-2xl bg-ink text-white shadow-[0_30px_70px_-20px_rgba(15,23,42,0.7)] ring-1 ring-white/10">
      {/* window bar */}
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        </div>
        <div className="ml-2 flex h-5 flex-1 items-center rounded-md bg-white/5 px-2.5 text-[10px] text-white/35">
          app.laundrypro.in/dashboard
        </div>
      </div>

      <div className="grid grid-cols-[52px_1fr]">
        {/* icon rail */}
        <div className="flex flex-col items-center gap-2 border-r border-white/10 py-4">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-white/10 text-[11px] font-extrabold">
            LP
          </div>
          <div className="mt-1 flex flex-col gap-2">
            {railIcons.map((Icon, i) => (
              <div
                key={i}
                className={`grid h-8 w-8 place-items-center rounded-lg ${
                  i === 0 ? "bg-navy text-white" : "text-white/35"
                }`}
              >
                <Icon size={15} />
              </div>
            ))}
          </div>
        </div>

        {/* main */}
        <div className="p-4 sm:p-5">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-amber">
                {mockup.date}
              </div>
              <div className="mt-1 text-[16px] font-bold">{mockup.greeting}</div>
            </div>
            <span className="flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-[10px] font-medium text-white/60">
              <span className="h-1.5 w-1.5 rounded-full bg-[#28c840]" />
              Synced now
            </span>
          </div>

          {/* stat tiles */}
          <div className="mb-4 grid grid-cols-2 gap-3">
            {[
              { label: "Today's revenue", ...mockup.today },
              { label: "This month", ...mockup.month },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
                <div className="text-[10px] font-medium text-white/45">{s.label}</div>
                <div className="mt-1 font-display text-[26px] font-extrabold leading-none text-amber">
                  {s.revenue}
                </div>
                <div className="mt-1.5 text-[10px] text-white/40">{s.note}</div>
              </div>
            ))}
          </div>

          <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.1em] text-white/40">
            Recent entries
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.02]">
            {mockup.entries.map((e, i) => (
              <motion.div
                key={e.name}
                initial={{ opacity: 0, x: 12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 + i * 0.14, duration: 0.5 }}
                className="flex items-center justify-between px-3.5 py-3 [&:not(:last-child)]:border-b [&:not(:last-child)]:border-white/[0.06]"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-white/10 text-[12px] font-bold">
                    {e.name[0]}
                  </div>
                  <div>
                    <div className="text-[12.5px] font-semibold">{e.name}</div>
                    <div className="text-[10.5px] text-white/40">{e.detail}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                      e.status === "Done"
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-amber/15 text-amber"
                    }`}
                  >
                    {e.status}
                  </span>
                  <span className="w-9 text-right text-[12px] font-bold">{e.amount}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
