"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Users, PlusCircle, ClipboardList, Truck,
  AlertTriangle, Wallet, Hammer,
  TrendingUp, CheckCircle2, ChevronRight, Package, Eye, EyeOff
} from "lucide-react";
import api from "@/lib/api";
import { isEntryDelivered, isEntryPending } from "@/lib/entry-status";
import { todayIST } from "@/lib/dates";
import ProtectedLayout from "@/components/ProtectedLayout";
import EmptyState from "@/components/EmptyState";
import CollectionsChart from "@/components/CollectionsChart";
import type { LaundryEntry, Customer, Payment } from "@/types";

const statusColor: Record<string, string> = {
  pending: "var(--grade-c-text)", in_delivery: "var(--accent-primary)",
  delivered: "var(--accent-success)", ready: "var(--grade-b-text)"
};
const statusLabel: Record<string, string> = {
  pending: "Pending", in_delivery: "On the way", delivered: "Delivered", ready: "Ready"
};

function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function Dashboard() {
  const router = useRouter();
  const [todayEntries,  setTodayEntries]  = useState<LaundryEntry[]>([]);
  const [monthEntries,  setMonthEntries]  = useState<LaundryEntry[]>([]);
  const [customers,     setCustomers]     = useState<Customer[]>([]);
  const [allPending,    setAllPending]    = useState<LaundryEntry[]>([]);
  const [payments,      setPayments]      = useState<Payment[]>([]);
  const [showCollections, setShowCollections] = useState(false);
  const [loading,       setLoading]       = useState(true);
  const [profile,       setProfile]       = useState<{ name: string; shop_name: string } | null>(null);

  const today = todayIST();

  const loadData = useCallback(() => {
    const month = new Date().getMonth() + 1;
    const year  = new Date().getFullYear();
    Promise.all([
      api.get("/entries", { params: { entry_date: today } }),
      api.get("/entries", { params: { month, year } }),
      api.get("/customers"),
      api.get("/entries"),
      api.get("/auth/me"),
      api.get("/payments", { params: { month, year } }),
    ]).then(([t, m, c, all, me, pay]) => {
      setTodayEntries(t.data);
      setMonthEntries(m.data);
      setCustomers(c.data);
      setProfile(me.data);
      setAllPending(all.data.filter((e: LaundryEntry) => isEntryPending(e) && e.delivery_date));
      setPayments(pay.data.payments);
    }).finally(() => setLoading(false));
  }, [today]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const overdueEntries  = allPending.filter(e => e.delivery_date! < today);
  const dueTodayEntries = allPending.filter(e => e.delivery_date === today);
  const upcomingEntries = allPending.filter(e => e.delivery_date! > today);

  const todayTotal     = todayEntries.reduce((s, e) => s + Number(e.total_amount), 0);
  const monthTotal     = monthEntries.reduce((s, e) => s + Number(e.total_amount), 0);

  // Collections split by method — so the owner can reconcile cash vs UPI vs card at a glance.
  const payBreakdown = (list: Payment[]) => {
    const b = { total: 0, cash: 0, upi: 0, card: 0 };
    for (const p of list) {
      const amt = Number(p.amount);
      b.total += amt;
      if (p.method === "cash" || p.method === "upi" || p.method === "card") b[p.method] += amt;
    }
    return b;
  };
  const monthPay = payBreakdown(payments);
  const todayPay = payBreakdown(payments.filter(p => p.date === today));

  const deliveredCount = monthEntries.filter(isEntryDelivered).length;
  const pendingCount   = monthEntries.filter(isEntryPending).length;
  const deliveryRate   = monthEntries.length > 0 ? Math.round((deliveredCount / monthEntries.length) * 100) : 0;

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";
  const dateStr  = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

  if (loading) return (
    <ProtectedLayout>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "70vh", flexDirection: "column", gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--grade-b-bg)", border: "1px solid var(--grade-b-border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>👔</div>
        <p style={{ color: "var(--text-muted)", fontSize: 14, margin: 0 }}>Loading…</p>
      </div>
    </ProtectedLayout>
  );

  return (
    <ProtectedLayout>
      <style>{`
        .act-btn { transition: background .15s, border-color .15s; cursor: pointer; }
        .act-btn:hover { background: var(--grade-b-bg) !important; border-color: var(--grade-b-border) !important; }
        .entry-row { transition: background .12s; cursor: pointer; }
        .entry-row:hover { background: var(--pressed) !important; }
        .deliv-row { transition: background .12s; cursor: pointer; }
        .deliv-row:hover { border-color: var(--border-hard-hover) !important; }
      `}</style>

      {/* ── Header ── */}
      <div className="dash-header" style={{ marginBottom: 20 }}>
        <p style={{ margin: "0 0 2px", fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.12em" }}>{dateStr}</p>
        <h1 className="dash-greeting-h1" style={{ margin: 0, fontSize: 28, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-.01em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {greeting}{profile?.name ? `, ${profile.name.split(" ")[0]}` : ""}
        </h1>
        {profile?.shop_name && <p style={{ margin: "4px 0 0", fontSize: 13.75, color: "var(--text-secondary)" }}>{profile.shop_name}</p>}
      </div>

      {/* ── Revenue Cards ── */}
      <div className="dash-rev-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        <div className="web-card dash-rev-card">
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)", fontWeight: 500 }}>Today&apos;s Revenue</p>
            <span style={{ width: 32, height: 32, borderRadius: 8, background: "var(--grade-b-bg)", border: "1px solid var(--grade-b-border)", color: "var(--grade-b-text)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <TrendingUp size={14} />
            </span>
          </div>
          <p className="dash-rev-amount" style={{ margin: "14px 0 0", fontSize: 34, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1 }}>₹{todayTotal.toLocaleString("en-IN")}</p>
          <p className="dash-rev-sub" style={{ margin: "8px 0 0", fontSize: 12, color: "var(--text-muted)" }}>{todayEntries.length} pickup{todayEntries.length !== 1 ? "s" : ""} today</p>
        </div>
        <div className="web-card dash-rev-card">
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)", fontWeight: 500 }}>Monthly Revenue</p>
            <span style={{ width: 32, height: 32, borderRadius: 8, background: "var(--grade-a-bg)", border: "1px solid var(--grade-a-border)", color: "var(--grade-a-text)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <TrendingUp size={14} />
            </span>
          </div>
          <p className="dash-rev-amount" style={{ margin: "14px 0 0", fontSize: 34, fontWeight: 700, color: "var(--accent-success)", lineHeight: 1 }}>₹{monthTotal.toLocaleString("en-IN")}</p>
          <p className="dash-rev-sub" style={{ margin: "8px 0 0", fontSize: 12, color: "var(--text-muted)" }}>{monthEntries.length} entries this month</p>
        </div>
      </div>

      {/* ── Overdue Alert ── */}
      {overdueEntries.length > 0 && (
        <div onClick={() => router.push("/deliveries")}
          className="lp-row"
          style={{ background: "var(--grade-f-bg)", border: "1px solid var(--grade-f-border)", borderRadius: 12, padding: "13px 18px", marginBottom: 16, display: "flex", alignItems: "center", gap: 14, cursor: "pointer", transition: "border-color .15s" }}>
          <AlertTriangle size={18} color="var(--grade-f-text)" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: "var(--grade-f-text)" }}>{overdueEntries.length} Overdue Deliver{overdueEntries.length > 1 ? "ies" : "y"}</span>
            <span style={{ fontSize: 12, color: "var(--grade-f-text)", opacity: 0.7, marginLeft: 8 }}>— action required</span>
          </div>
          <ChevronRight size={16} color="var(--grade-f-text)" />
        </div>
      )}

      {/* ── Stat Cards ── */}
      <div className="dash-stat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 14 }}>
        {[
          { icon: <Users size={16} />,       label: "Customers",  value: customers.length,   bg: "var(--grade-b-bg)", border: "var(--grade-b-border)", color: "var(--grade-b-text)", path: "/customers" },
          { icon: <Package size={16} />,      label: "Pending",    value: pendingCount,        bg: "var(--grade-c-bg)", border: "var(--grade-c-border)", color: "var(--grade-c-text)", path: "/deliveries?filter=pending" },
          { icon: <CheckCircle2 size={16} />, label: "Delivered",  value: deliveredCount,      bg: "var(--grade-a-bg)", border: "var(--grade-a-border)", color: "var(--grade-a-text)", path: "/deliveries?filter=delivered" },
          { icon: <TrendingUp size={16} />,   label: "Rate",       value: `${deliveryRate}%`,  bg: "var(--grade-b-bg)", border: "var(--grade-b-border)", color: "var(--grade-b-text)", path: "/reports" },
        ].map((s, i) => (
          <div key={i} className="web-card dash-stat-card act-btn" onClick={() => router.push(s.path)} style={{ textAlign: "center", padding: "22px 16px", cursor: "pointer" }}>
            <span style={{ width: 38, height: 38, borderRadius: 10, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", background: s.bg, border: `1px solid ${s.border}`, color: s.color }}>
              {s.icon}
            </span>
            <p className="dash-stat-val" style={{ margin: "12px 0 0", fontSize: 30, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</p>
            <p className="dash-stat-lbl" style={{ margin: "6px 0 0", fontSize: 12, color: "var(--text-secondary)", fontWeight: 500 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Quick Actions ── */}
      <div className="web-card" style={{ marginBottom: 16 }}>
        <p style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>Quick Actions</p>
        <div className="dash-action-grid" style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 12 }}>
          {[
            { icon: <PlusCircle size={18} />,   label: "New Entry",  path: "/new-entry" },
            { icon: <Truck size={18} />,         label: "Deliveries", path: "/deliveries" },
            { icon: <ClipboardList size={18} />, label: "Entries",    path: "/entries" },
            { icon: <Users size={18} />,         label: "Customers",  path: "/customers" },
            { icon: <Wallet size={18} />,        label: "Accounting", path: "/accounting" },
            { icon: <Hammer size={18} />,        label: "Labour",     path: "/labour" },
          ].map((a, i) => (
            <div key={i} className="act-btn lp-qa"
              onClick={() => router.push(a.path)}
              style={{ background: "var(--web-bg-band)", border: "1px solid var(--border-hard)", borderRadius: 12, padding: "18px 10px", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, transition: "border-color .15s, transform .15s" }}>
              <span style={{ width: 40, height: 40, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--grade-b-bg)", color: "var(--grade-b-text)" }}>
                {a.icon}
              </span>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-secondary)", textAlign: "center" }}>{a.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Collections (cash / UPI / card) — hidden until revealed ── */}
      <div className="web-card" style={{ padding: 18, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: showCollections ? 14 : 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Wallet size={16} color="var(--accent-primary)" />
            <span style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>Collections</span>
          </div>
          <button onClick={() => setShowCollections(v => !v)}
            style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", cursor: "pointer", border: "1px solid var(--border-default)", background: "var(--bg-input)", borderRadius: 20, padding: "6px 12px" }}>
            {showCollections ? <><EyeOff size={14} /> Hide</> : <><Eye size={14} /> Show</>}
          </button>
        </div>

        {showCollections ? (
          <>
            <CollectionsChart cash={monthPay.cash} upi={monthPay.upi} card={monthPay.card} />
            {/* Today's split at a glance */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--border-hard)", fontSize: 12, color: "var(--text-muted)" }}>
              <span style={{ fontWeight: 700, color: "var(--text-secondary)" }}>Aaj:</span>
              <span>Cash ₹{todayPay.cash.toLocaleString("en-IN")}</span><span>·</span>
              <span>UPI ₹{todayPay.upi.toLocaleString("en-IN")}</span><span>·</span>
              <span>Card ₹{todayPay.card.toLocaleString("en-IN")}</span>
              <span style={{ marginLeft: "auto", fontWeight: 700, color: "var(--text-primary)" }}>Total ₹{todayPay.total.toLocaleString("en-IN")}</span>
              <span onClick={() => router.push("/accounting")} style={{ cursor: "pointer", color: "var(--accent-primary)", fontWeight: 700, display: "inline-flex", alignItems: "center" }}>Details <ChevronRight size={12} /></span>
            </div>
          </>
        ) : (
          <div onClick={() => setShowCollections(true)}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "22px 12px", marginTop: 10, borderRadius: 12, border: "1px dashed var(--border-hard)", cursor: "pointer", color: "var(--text-muted)", fontSize: 13 }}>
            <Eye size={16} /> Collections dekhne ke liye click karein
          </div>
        )}
      </div>

      {/* ── Due Today ── */}
      {dueTodayEntries.length > 0 && (
        <DeliverySection title="Deliver Today" entries={dueTodayEntries} accentBg="var(--grade-c-bg)" accentBorder="var(--grade-c-border)" accentColor="var(--grade-c-text)" router={router} />
      )}

      {/* ── Overdue ── */}
      {overdueEntries.length > 0 && (
        <DeliverySection title="Overdue" entries={overdueEntries} accentBg="var(--grade-f-bg)" accentBorder="var(--grade-f-border)" accentColor="var(--grade-f-text)" router={router} showDaysOverdue today={today} />
      )}

      {/* ── Upcoming ── */}
      {upcomingEntries.length > 0 && (
        <DeliverySection title="Upcoming" entries={upcomingEntries.slice(0, 4)} accentBg="var(--grade-b-bg)" accentBorder="var(--grade-b-border)" accentColor="var(--grade-b-text)" router={router} />
      )}

      {/* ── Today's Pickups ── */}
      <div className="web-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", borderBottom: "1px solid var(--border-hard)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>Today&apos;s Pickups</span>
            {todayEntries.length > 0 && (
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--grade-b-text)", background: "var(--grade-b-bg)", border: "1px solid var(--grade-b-border)", borderRadius: "9999px", padding: "2px 9px" }}>
                {todayEntries.length}
              </span>
            )}
          </div>
          {todayEntries.length > 4 && (
            <span onClick={() => router.push("/entries")} style={{ fontSize: 13, fontWeight: 600, color: "var(--grade-f-text)", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}>
              See all <ChevronRight size={13} />
            </span>
          )}
        </div>

        {todayEntries.length === 0 ? (
          <EmptyState compact title="No pickups today" subtitle="Start a new entry to track laundry."
            action={
              <button onClick={() => router.push("/new-entry")}
                style={{ background: "var(--accent-primary)", color: "#0b1830", border: "none", borderRadius: 8, padding: "11px 24px", fontSize: 13.5, fontWeight: 700, cursor: "pointer", boxShadow: "var(--shadow-glow-blue)" }}>
                + New Entry
              </button>
            }/>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {todayEntries.slice(0, 5).map((entry, i) => (
              <div key={entry.id} className="entry-row"
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid var(--border-hard)", transition: "background .12s" }}
                onClick={() => router.push(`/entries?date=${today}&customer=${entry.customer_id}`)}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: "linear-gradient(135deg,#6EA8FF,#3f7fe0)", display: "flex", alignItems: "center", justifyContent: "center", color: "#0b1830", fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
                    {entry.customer?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 14.5, color: "var(--text-primary)" }}>{entry.customer?.name}</p>
                    <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "var(--text-secondary)" }}>
                      {entry.items?.slice(0, 2).map(it => it.service_name).join(" · ")}
                      {(entry.items?.length || 0) > 2 && ` +${(entry.items?.length || 0) - 2}`}
                    </p>
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 18, color: "var(--text-primary)" }}>₹{Number(entry.total_amount).toLocaleString("en-IN")}</p>
                  <p style={{ margin: "3px 0 0", fontSize: 11, fontWeight: 600, color: statusColor[entry.delivery_status] }}>
                    {statusLabel[entry.delivery_status] ?? entry.delivery_status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </ProtectedLayout>
  );
}

function DeliverySection({ title, entries, accentBg, accentBorder, accentColor, router, showDaysOverdue, today }: {
  title: string; entries: LaundryEntry[];
  accentBg: string; accentBorder: string; accentColor: string;
  router: ReturnType<typeof useRouter>; showDaysOverdue?: boolean; today?: string;
}) {
  const daysOverdue = (date: string) => {
    const diff = new Date(today!).getTime() - new Date(date + "T00:00:00").getTime();
    return Math.floor(diff / 86400000);
  };

  return (
    <div className="web-card" style={{ marginBottom: 16, padding: 0, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", borderBottom: "1px solid var(--border-hard)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>{title}</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: accentColor, background: accentBg, border: `1px solid ${accentBorder}`, borderRadius: "9999px", padding: "2px 9px" }}>
            {entries.length}
          </span>
        </div>
        <span onClick={() => router.push("/deliveries")}
          style={{ fontSize: 13, fontWeight: 600, color: accentColor, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}>
          Manage <ChevronRight size={13} />
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {entries.map(entry => (
          <div key={entry.id} className="deliv-row" onClick={() => router.push("/deliveries")}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid var(--border-hard)", border: "none", transition: "border-color .15s" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 34, height: 34, borderRadius: 8, background: accentBg, border: `1px solid ${accentBorder}`, color: accentColor, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Truck size={14} />
              </span>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13.75, color: "var(--text-primary)" }}>{entry.customer?.name}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                  {entry.items?.slice(0, 2).map(it => it.service_name).join(" · ")}
                  {(entry.items?.length || 0) > 2 && ` +${(entry.items?.length || 0) - 2}`}
                </div>
              </div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: accentColor }}>
                {showDaysOverdue ? `${daysOverdue(entry.delivery_date!)}d late` : fmtDate(entry.delivery_date!)}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>₹{Number(entry.total_amount).toLocaleString("en-IN")}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
