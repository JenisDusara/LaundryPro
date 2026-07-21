"use client";

import { useEffect, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  PlusCircle,
  Users,
  ClipboardList,
  Wallet,
  IndianRupee,
  BarChart3,
  Wrench,
  Hammer,
  UserCog,
  Settings,
  Bell,
  Package,
  CheckCircle2,
  TrendingUp,
  Search,
  Pencil,
  Trash2,
  Tag,
  type LucideIcon,
} from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as const;

const NAV: { icon: LucideIcon; label: string }[] = [
  { icon: LayoutDashboard, label: "Dashboard" },
  { icon: PlusCircle, label: "New Entry" },
  { icon: Users, label: "Customers" },
  { icon: ClipboardList, label: "Orders" },
  { icon: Wallet, label: "Accounting" },
  { icon: IndianRupee, label: "Payments" },
  { icon: BarChart3, label: "Reports" },
  { icon: Wrench, label: "Services" },
  { icon: Hammer, label: "Labour" },
  { icon: UserCog, label: "Staff" },
  { icon: Settings, label: "Settings" },
];

const card = "rounded-lg border border-white/[0.07] bg-white/[0.03]";

/* ---------- panels (dark, real UI) ---------- */

function DashboardPanel() {
  const stats = [
    { icon: Users, v: "58", l: "Customers", c: "#60a5fa" },
    { icon: Package, v: "8", l: "Pending", c: "#fbbf24" },
    { icon: CheckCircle2, v: "8", l: "Delivered", c: "#34d399" },
    { icon: TrendingUp, v: "50%", l: "Rate", c: "#60a5fa" },
  ];
  const qa = ["New Entry", "Orders", "Pending", "Customers", "Accounting", "Labour"];
  return (
    <div className="space-y-2.5">
      <div className="grid grid-cols-4 gap-2">
        {stats.map((s) => (
          <div key={s.l} className={`${card} p-2.5`}>
            <s.icon size={13} style={{ color: s.c }} />
            <div className="mt-1.5 text-[16px] font-extrabold" style={{ color: s.c }}>{s.v}</div>
            <div className="text-[7.5px] text-slate-400">{s.l}</div>
          </div>
        ))}
      </div>
      <div className={`${card} p-2.5`}>
        <div className="mb-2 text-[8.5px] font-bold text-white">Quick Actions</div>
        <div className="grid grid-cols-6 gap-1.5">
          {qa.map((q) => (
            <div key={q} className="flex flex-col items-center gap-1 rounded-md bg-white/[0.03] py-2">
              <PlusCircle size={12} className="text-[#60a5fa]" />
              <span className="text-[6px] text-slate-300">{q}</span>
            </div>
          ))}
        </div>
      </div>
      <div className={`${card} flex items-center justify-between p-2.5`}>
        <span className="text-[8.5px] font-bold text-white">Collections</span>
        <span className="rounded-md border border-white/10 px-2 py-0.5 text-[7px] text-slate-300">Show</span>
      </div>
    </div>
  );
}

function NewEntryPanel() {
  const svc = ["Washing", "Iron", "Dry Clean", "Steam iron", "Petrol Wash", "Roll polish"];
  return (
    <div className="grid grid-cols-[1fr_120px] gap-2.5">
      <div className="space-y-2.5">
        <div className={`${card} flex items-center gap-1.5 p-2`}>
          <Search size={10} className="text-slate-500" />
          <span className="text-[7.5px] text-slate-500">Search by Name, Phone, Flat…</span>
        </div>
        <div className={`${card} p-2.5`}>
          <div className="mb-2 text-[7px] font-bold uppercase tracking-wide text-slate-400">Add Services</div>
          <div className="grid grid-cols-2 gap-1.5">
            {svc.map((s) => (
              <div key={s} className="flex items-center justify-between rounded-md bg-white/[0.03] px-2 py-1.5">
                <span className="text-[8px] font-semibold text-white">{s}</span>
                <span className="text-[7px] text-slate-500">Choose</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className={`${card} p-2.5`}>
        <div className="text-[7px] font-bold uppercase tracking-wide text-slate-400">Order Summary</div>
        <div className="mt-4 flex justify-between text-[8px] text-slate-300"><span>Subtotal</span><span>₹0</span></div>
        <div className="mt-1 flex justify-between text-[8px] text-slate-300"><span>Discount</span><span>0</span></div>
        <div className="mt-2 flex justify-between border-t border-white/10 pt-2 text-[10px] font-extrabold text-white"><span>Grand total</span><span className="text-[#34d399]">₹0</span></div>
        <div className="mt-2 grid grid-cols-2 gap-1">
          {["Cash", "UPI", "Online", "Later"].map((p, i) => (
            <span key={p} className={`rounded px-1 py-1 text-center text-[7px] font-bold ${i === 3 ? "bg-[#3b82f6] text-white" : "bg-white/[0.05] text-slate-300"}`}>{p}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function CustomersPanel() {
  const rows = [
    { n: "Ankitbhai", tag: "₹416 due", due: true, c: "#8b5cf6" },
    { n: "Harsh Chudasama", tag: "₹816 due", due: true, c: "#3b82f6" },
    { n: "jenis", tag: "₹3,900 due", due: true, c: "#ec4899" },
    { n: "Akshar9(5)", tag: "₹194 advance", due: false, c: "#8b5cf6" },
    { n: "Aries 701", tag: "", due: false, c: "#6366f1" },
  ];
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-bold text-white">Customers <span className="text-slate-500">· 58 total</span></span>
        <span className="rounded-md bg-[#3b82f6] px-2 py-1 text-[7px] font-bold text-white">+ Add customer</span>
      </div>
      {rows.map((r) => (
        <div key={r.n} className={`${card} flex items-center gap-2 p-2`}>
          <span className="grid h-6 w-6 place-items-center rounded-md text-[8px] font-bold text-white" style={{ background: r.c }}>{r.n[0]}</span>
          <span className="text-[8.5px] font-bold text-white">{r.n}</span>
          {r.tag && (
            <span className={`rounded px-1.5 py-0.5 text-[6.5px] font-bold ${r.due ? "bg-red-500/15 text-red-400" : "bg-blue-500/15 text-blue-300"}`}>{r.tag}</span>
          )}
          <span className="ml-auto flex gap-1">
            <span className="grid h-5 w-5 place-items-center rounded bg-amber-500/15 text-amber-400"><IndianRupee size={9} /></span>
            <span className="grid h-5 w-5 place-items-center rounded bg-blue-500/15 text-blue-400"><Pencil size={9} /></span>
            <span className="grid h-5 w-5 place-items-center rounded bg-red-500/15 text-red-400"><Trash2 size={9} /></span>
          </span>
        </div>
      ))}
    </div>
  );
}

function CustomerDetailPanel() {
  const orders = [
    { d: "Fri, 17 Jul", inv: "INV-0002", it: "Iron×1", a: "₹8", st: "1 pending", c: "#fbbf24" },
    { d: "Thu, 16 Jul", inv: "INV-0001", it: "Iron×1", a: "₹8", st: "Delivered", c: "#34d399" },
    { d: "Tue, 14 Jul", inv: "Order", it: "Shirt×1, Sari×6", a: "₹2,120", st: "2 pending", c: "#fbbf24" },
  ];
  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#3b82f6] text-[9px] font-bold text-white">J</span>
        <div className="flex-1">
          <div className="text-[10px] font-extrabold text-white">jenis</div>
          <div className="text-[7px] text-slate-400">A-501, Parijat · 8 orders · 5 pending</div>
        </div>
        <span className="rounded-md bg-[#22c55e] px-2 py-1 text-[7px] font-bold text-white">Remind</span>
        <span className="rounded-md border border-white/10 px-2 py-1 text-[7px] font-semibold text-slate-300">Monthly bill</span>
      </div>
      <div className={`${card} p-2.5`}>
        <div className="text-[7px] font-bold uppercase tracking-wide text-slate-400">Account Summary</div>
        <div className="mt-2 flex items-center justify-between text-[8px] text-slate-300"><span>Total billed</span><span className="font-bold text-white">₹6,036</span></div>
        <div className="mt-1 flex items-center justify-between text-[8px] text-slate-300"><span>Total paid</span><span className="font-bold text-white">₹2,700</span></div>
        <div className="mt-1.5 flex items-center justify-between border-t border-white/10 pt-1.5 text-[9px]"><span className="text-slate-300">Balance due</span><span className="font-extrabold text-amber-400">₹3,336</span></div>
        <div className="mt-2 rounded-md bg-[#3b82f6] py-1.5 text-center text-[8px] font-bold text-white">Collect Payment</div>
      </div>
      <div className={`${card} p-2`}>
        <div className="mb-1 grid grid-cols-[1fr_1fr_0.7fr_0.8fr] gap-1 text-[6.5px] font-bold uppercase text-slate-500">
          <span>Date</span><span>Items</span><span>Amount</span><span>Status</span>
        </div>
        {orders.map((o) => (
          <div key={o.inv + o.d} className="grid grid-cols-[1fr_1fr_0.7fr_0.8fr] items-center gap-1 border-t border-white/[0.05] py-1 text-[7px]">
            <span className="text-slate-300">{o.d}</span>
            <span className="truncate text-slate-400">{o.it}</span>
            <span className="font-bold text-white">{o.a}</span>
            <span className="rounded px-1 py-0.5 text-center text-[6px] font-bold" style={{ background: `${o.c}22`, color: o.c }}>{o.st}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AccountingPanel() {
  const cards = [
    { l: "Total income", v: "₹7,072", c: "#34d399", b: "#34d399" },
    { l: "Total expense", v: "₹0", c: "#f87171", b: "#f87171" },
    { l: "Net profit", v: "₹7,072", c: "#60a5fa", b: "#60a5fa" },
  ];
  return (
    <div className="space-y-2.5">
      <div className="grid grid-cols-3 gap-2">
        {cards.map((c) => (
          <div key={c.l} className={`${card} p-2.5`} style={{ borderLeft: `2px solid ${c.b}` }}>
            <div className="text-[7px] text-slate-400">{c.l}</div>
            <div className="mt-1 text-[15px] font-extrabold" style={{ color: c.c }}>{c.v}</div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <span className="rounded-md bg-[#3b82f6] px-2.5 py-1 text-[7.5px] font-bold text-white">Expenses</span>
        <span className="text-[7.5px] text-slate-400">Collections</span>
        <span className="text-[7.5px] text-slate-400">Day-wise report</span>
        <span className="ml-auto rounded-md bg-[#3b82f6] px-2 py-1 text-[7px] font-bold text-white">+ Add Expense</span>
      </div>
      <div className={`${card} grid place-items-center py-6 text-[8px] text-slate-500`}>No expenses this month</div>
    </div>
  );
}

function ReportsPanel() {
  const cards = [
    { l: "Total revenue", v: "₹7,072", c: "#34d399" },
    { l: "Total entries", v: "16", c: "#60a5fa" },
    { l: "Avg per entry", v: "₹442", c: "#60a5fa" },
    { l: "Customers", v: "3", c: "#fbbf24" },
  ];
  const bars = [30, 78, 100, 20, 44, 62, 36, 88, 50];
  return (
    <div className="space-y-2.5">
      <div className="grid grid-cols-4 gap-2">
        {cards.map((c) => (
          <div key={c.l} className={`${card} p-2.5`}>
            <div className="text-[7px] text-slate-400">{c.l}</div>
            <div className="mt-1 text-[14px] font-extrabold" style={{ color: c.c }}>{c.v}</div>
          </div>
        ))}
      </div>
      <div className={`${card} p-2.5`}>
        <div className="mb-2 text-[8px] font-bold text-white">Daily Earnings — Jul 2026</div>
        <div className="flex h-16 items-end gap-1.5">
          {bars.map((h, i) => (
            <div key={i} className="flex-1 rounded-t bg-[#3b82f6]" style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ServicesPanel() {
  const svc = [
    { n: "Washing", s: "3 sub-items", c: "#3b82f6" },
    { n: "Iron", s: "₹8 flat rate", c: "#34d399" },
    { n: "Dry Clean", s: "2 sub-items", c: "#a855f7" },
    { n: "Steam iron", s: "1 sub-item", c: "#f59e0b" },
    { n: "Petrol Wash", s: "2 sub-items", c: "#f87171" },
    { n: "Roll polish", s: "1 sub-item", c: "#2dd4bf" },
  ];
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-bold text-white">Services &amp; pricing <span className="text-slate-500">· 6 services</span></span>
        <span className="rounded-md bg-[#3b82f6] px-2 py-1 text-[7px] font-bold text-white">+ Add service</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {svc.map((s) => (
          <div key={s.n} className={`${card} overflow-hidden p-2.5`} style={{ borderTop: `2px solid ${s.c}` }}>
            <div className="flex items-center gap-1.5">
              <span className="grid h-5 w-5 place-items-center rounded bg-white/[0.06]" style={{ color: s.c }}><Tag size={10} /></span>
              <span className="text-[8.5px] font-bold text-white">{s.n}</span>
            </div>
            <div className="mt-1 text-[7px] text-slate-400">{s.s}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const SCREENS = [
  { nav: 0, title: "Dashboard", panel: <DashboardPanel /> },
  { nav: 1, title: "New Entry", panel: <NewEntryPanel /> },
  { nav: 2, title: "Customers", panel: <CustomersPanel /> },
  { nav: 2, title: "Customer", panel: <CustomerDetailPanel /> },
  { nav: 4, title: "Accounting", panel: <AccountingPanel /> },
  { nav: 6, title: "Reports", panel: <ReportsPanel /> },
  { nav: 7, title: "Services", panel: <ServicesPanel /> },
];
const N = SCREENS.length;

/** Dark LaundryMax browser window chrome + sidebar; `active` highlights nav. */
function BrowserFrame({
  active,
  className = "",
  children,
}: {
  active: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`w-full max-w-[560px] ${className}`}>
      <div className="overflow-hidden rounded-xl border border-black/60 bg-[#0b0b0d] shadow-[0_30px_70px_-25px_rgba(0,0,0,0.7)]">
        {/* window bar */}
        <div className="flex items-center gap-2 border-b border-white/[0.06] bg-[#141416] px-3 py-2">
          <span className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          </span>
          <span className="ml-2 flex h-5 flex-1 items-center rounded-md bg-black/40 px-2.5 text-[10px] text-slate-500">
            app.laundrymax.in
          </span>
        </div>

        {/* app */}
        <div className="grid grid-cols-[122px_1fr] text-white">
          {/* sidebar */}
          <div className="flex flex-col border-r border-white/[0.06] bg-[#0b0b0d] p-2">
            <div className="mb-2 flex items-center gap-1.5 px-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-mark.png" alt="" className="h-5 w-5 rounded-full" />
              <span className="text-[9px] font-extrabold">LaundryMax</span>
            </div>
            {NAV.map((n, i) => {
              const on = i === active;
              return (
                <div
                  key={n.label}
                  className={`mb-0.5 flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[7.5px] font-semibold transition-colors ${
                    on ? "bg-[#12203a] text-[#60a5fa]" : "text-slate-400"
                  }`}
                >
                  <n.icon size={10} /> {n.label}
                </div>
              );
            })}
            <div className="mt-auto flex items-center gap-1.5 border-t border-white/[0.06] pt-2">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-[#3b82f6] text-[7px] font-bold">H</span>
              <span className="text-[7px] text-slate-300">Harsh</span>
            </div>
          </div>

          {/* main */}
          <div className="flex h-[318px] flex-col">
            <div className="flex items-center justify-end border-b border-white/[0.06] px-3 py-1.5">
              <span className="relative">
                <Bell size={13} className="text-slate-400" />
                <span className="absolute -right-1 -top-1 grid h-3 w-3 place-items-center rounded-full bg-red-500 text-[5px] font-bold">32</span>
              </span>
            </div>
            <div className="relative flex-1 overflow-hidden p-3">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Self-playing dark LaundryMax dashboard — cycles through the real screens. */
export function AnimatedBrowser({ className = "", start = 0 }: { className?: string; start?: number }) {
  const [view, setView] = useState(start % N);

  useEffect(() => {
    const id = setInterval(() => setView((v) => (v + 1) % N), 2600);
    return () => clearInterval(id);
  }, []);

  return (
    <BrowserFrame active={SCREENS[view].nav} className={className}>
      <motion.div
        key={view}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }}
      >
        {SCREENS[view].panel}
      </motion.div>
    </BrowserFrame>
  );
}

/** A single static product screen in the browser frame (for feature blocks). */
export function ProductScreen({ screen = 0, className = "" }: { screen?: number; className?: string }) {
  const s = SCREENS[((screen % N) + N) % N];
  return (
    <BrowserFrame active={s.nav} className={className}>
      {s.panel}
    </BrowserFrame>
  );
}
