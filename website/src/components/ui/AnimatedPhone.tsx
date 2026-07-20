"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Home,
  ClipboardList,
  Plus,
  BarChart3,
  User,
  Bell,
  TrendingUp,
  Truck,
  ArrowLeft,
  MessageCircle,
} from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as const;

function ScreenHeader({ title, back = true }: { title: string; back?: boolean }) {
  return (
    <div className="flex items-center gap-3 px-5 pb-3 pt-9">
      {back && (
        <div className="grid h-8 w-8 place-items-center rounded-full bg-white/[0.06]">
          <ArrowLeft size={15} className="text-slate-300" />
        </div>
      )}
      <div className="text-[15px] font-bold">{title}</div>
    </div>
  );
}

function DashboardScreen() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 pb-3 pt-9">
        <div>
          <div className="text-[10px] font-medium text-slate-400">Good evening</div>
          <div className="text-[15px] font-bold">Rajesh</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-white/[0.06]">
            <Bell size={15} className="text-slate-300" />
          </div>
          <div className="grid h-8 w-8 place-items-center rounded-full bg-[#6EA8FF] text-[11px] font-bold text-[#0b1830]">R</div>
        </div>
      </div>
      <div className="flex-1 px-4">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#3f7fe0] to-[#6EA8FF] p-4 shadow-lg shadow-[#3f7fe0]/30">
          <div className="absolute -right-6 -top-8 h-24 w-24 rounded-full bg-white/15 blur-xl" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-white/80">Today&apos;s revenue</span>
              <span className="flex items-center gap-0.5 rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-bold text-white">
                <TrendingUp size={10} /> +12%
              </span>
            </div>
            <div className="mt-1 text-[30px] font-extrabold leading-none tracking-tight">₹8,420</div>
            <div className="mt-2 flex gap-3 text-[10px] text-white/85"><span>14 orders</span><span>·</span><span>3 pending</span></div>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[["₹18,400", "Month"], ["142", "Orders"], ["₹37k", "Profit"]].map(([v, l]) => (
            <div key={l} className="rounded-xl bg-white/[0.04] p-2.5">
              <div className="text-[13px] font-bold text-[#6EA8FF]">{v}</div>
              <div className="mt-0.5 text-[8.5px] text-slate-400">{l}</div>
            </div>
          ))}
        </div>
        <div className="mb-2 mt-4 text-[11px] font-bold uppercase tracking-wide text-slate-400">Recent orders</div>
        <div className="space-y-2">
          {[["Ankitbhai", "Iron × 4", "₹80"], ["Bhaveshbhai", "Steam × 4", "₹40"], ["Kiran Shah", "Bedsheet × 1", "₹60"]].map(([n, d, a]) => (
            <div key={n} className="flex items-center justify-between rounded-xl bg-white/[0.04] p-2.5">
              <div className="flex items-center gap-2.5">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#6EA8FF]/15 text-[11px] font-bold text-[#6EA8FF]">{n[0]}</div>
                <div><div className="text-[11.5px] font-semibold">{n}</div><div className="text-[9.5px] text-slate-400">{d}</div></div>
              </div>
              <span className="text-[11px] font-bold">{a}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function NewEntryScreen() {
  const items = [["Shirt", 3, 90], ["Pant", 2, 70], ["Saree", 1, 60]] as const;
  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title="New entry" />
      <div className="flex-1 px-4">
        <div className="mb-3 flex items-center gap-2.5 rounded-xl bg-white/[0.05] p-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-[#6EA8FF] text-[12px] font-bold text-[#0b1830]">R</div>
          <div><div className="text-[12px] font-semibold">Ramesh Patel</div><div className="text-[9.5px] text-slate-400">98765 43210</div></div>
        </div>
        <div className="rounded-2xl bg-white/[0.04] p-3">
          {items.map(([n, q, amt]) => (
            <div key={n} className="flex items-center justify-between border-b border-white/[0.05] py-2 text-[12px] last:border-0">
              <span className="text-slate-200">{n}</span>
              <span className="text-slate-400">× {q}</span>
              <span className="font-bold text-white">₹{amt}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between rounded-2xl bg-[#6EA8FF]/10 px-4 py-3">
          <span className="text-[12px] text-slate-300">Total</span>
          <span className="text-[26px] font-extrabold text-[#6EA8FF]">₹220</span>
        </div>
        <button className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#30d158] py-3 text-[13px] font-bold text-[#052e16]">
          <MessageCircle size={16} /> Share bill on WhatsApp
        </button>
        <button className="mt-2 w-full rounded-2xl bg-white/[0.06] py-3 text-[13px] font-semibold text-white">Print receipt</button>
      </div>
    </div>
  );
}

function DeliveriesScreen() {
  const d = [
    ["Priya Shah", "Ready · pickup by 7 PM", "₹140", true],
    ["Imran Sheikh", "Out for delivery", "₹220", false],
    ["Suresh Kumar", "Ready · washed & pressed", "₹150", true],
    ["Anita Verma", "Ready · pickup today", "₹95", true],
  ] as const;
  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title="Deliveries · 4 pending" />
      <div className="flex-1 space-y-2 px-4">
        {d.map(([n, t, a, ready]) => (
          <div key={n} className="rounded-xl bg-white/[0.04] p-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#30d158]/12 text-[#30d158]"><Truck size={15} /></div>
                <div><div className="text-[11.5px] font-semibold">{n}</div><div className="text-[9.5px] text-slate-400">{t}</div></div>
              </div>
              <span className="text-[11px] font-bold">{a}</span>
            </div>
            <button className={`mt-2 w-full rounded-lg py-1.5 text-[10px] font-bold ${ready ? "bg-[#6EA8FF] text-[#0b1830]" : "bg-white/[0.06] text-slate-400"}`}>
              {ready ? "Mark delivered" : "In progress"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReportsScreen() {
  const bars = [55, 70, 45, 90, 65, 82, 100, 60, 78, 88, 50, 92];
  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title="Reports · June" />
      <div className="flex-1 px-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-white/[0.04] p-3"><div className="text-[18px] font-bold text-[#6EA8FF]">₹48,200</div><div className="text-[9px] text-slate-400">Revenue</div></div>
          <div className="rounded-xl bg-white/[0.04] p-3"><div className="text-[18px] font-bold text-[#30d158]">₹37,000</div><div className="text-[9px] text-slate-400">Net profit</div></div>
        </div>
        <div className="mt-3 rounded-2xl bg-white/[0.04] p-3.5">
          <div className="mb-3 text-[10px] font-bold uppercase tracking-wide text-slate-400">Daily revenue</div>
          <div className="flex h-24 items-end gap-1">
            {bars.map((h, i) => (
              <div key={i} className={`flex-1 rounded-t ${h >= 90 ? "bg-[#6EA8FF]" : "bg-white/15"}`} style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const SCREENS = [
  { tab: 0, render: <DashboardScreen /> },
  { tab: 2, render: <NewEntryScreen /> },
  { tab: 1, render: <DeliveriesScreen /> },
  { tab: 3, render: <ReportsScreen /> },
];
const N = SCREENS.length;
const tabs = [Home, ClipboardList, Plus, BarChart3, User];

/** Self-playing phone that cycles through app screens — the "live demo" look. */
export function AnimatedPhone({ start = 0 }: { start?: number }) {
  const [active, setActive] = useState(start % N);

  useEffect(() => {
    const id = setInterval(() => setActive((a) => (a + 1) % N), 1800);
    return () => clearInterval(id);
  }, []);

  const activeTab = SCREENS[active].tab;

  return (
    <div className="relative mx-auto flex w-full max-w-sm justify-center">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[380px] w-[380px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-navy/20 blur-[90px]" />
      <div className="pointer-events-none absolute right-8 top-10 h-36 w-36 rounded-full bg-amber/20 blur-[70px]" />

      {/* progress dots */}
      <div className="absolute right-0 top-1/2 z-30 hidden -translate-y-1/2 flex-col gap-2 sm:flex">
        {SCREENS.map((_, i) => (
          <span key={i} className={`h-2 w-2 rounded-full transition-all duration-300 ${i === active ? "scale-125 bg-navy" : "bg-line"}`} />
        ))}
      </div>

      <div className="relative z-10 h-[560px] w-[278px] rounded-[3rem] bg-[#161618] p-[9px] shadow-[0_40px_80px_-20px_rgba(11,24,48,0.55),inset_0_0_0_2px_#3a3a3e] ring-1 ring-black/40 animate-floaty">
        <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[2.4rem] bg-[#0b1830] text-white">
          <div className="absolute left-1/2 top-2 z-40 h-[24px] w-[88px] -translate-x-1/2 rounded-full bg-black" />

          <div className="relative flex-1 overflow-hidden">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 34 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease }}
              className="absolute inset-0"
            >
              {SCREENS[active].render}
            </motion.div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 h-6 bg-gradient-to-t from-[#0b1830] to-transparent" />
          </div>

          <div className="relative z-30 flex items-center justify-around border-t border-white/[0.06] bg-[#0a1326] px-4 pb-5 pt-3">
            {tabs.map((Icon, i) =>
              i === 2 ? (
                <div key={i} className="relative -mt-8">
                  <div className={`grid h-12 w-12 place-items-center rounded-full shadow-lg transition-colors ${activeTab === 2 ? "bg-[#6EA8FF] text-[#0b1830] shadow-[#6EA8FF]/40" : "bg-[#6EA8FF]/80 text-[#0b1830]"}`}>
                    <Plus size={22} strokeWidth={2.5} />
                  </div>
                </div>
              ) : (
                <Icon key={i} size={20} className={activeTab === i ? "text-[#6EA8FF]" : "text-slate-500"} />
              )
            )}
          </div>

          <div className="pointer-events-none absolute inset-0 z-40 bg-gradient-to-tr from-transparent via-transparent to-white/[0.05]" />
        </div>
      </div>
    </div>
  );
}
