"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Users, Clock, PlusCircle, ClipboardList, Truck, BarChart3, Bell, BellOff, AlertTriangle, CalendarClock, CheckCircle2, ChevronRight } from "lucide-react";
import api from "@/lib/api";
import ProtectedLayout from "@/components/ProtectedLayout";
import type { LaundryEntry, Customer } from "@/types";

const statusColor: Record<string,string> = { pending:"#f59e0b", in_delivery:"#3b82f6", delivered:"#10b981", ready:"#8b5cf6" };
const statusLabel: Record<string,string> = { pending:"Pending", in_delivery:"On the way", delivered:"Delivered", ready:"Ready" };

function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function Dashboard() {
  const router = useRouter();
  const [todayEntries,    setTodayEntries]    = useState<LaundryEntry[]>([]);
  const [monthEntries,    setMonthEntries]    = useState<LaundryEntry[]>([]);
  const [customers,       setCustomers]       = useState<Customer[]>([]);
  const [allPending,      setAllPending]      = useState<LaundryEntry[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [notifPerm,       setNotifPerm]       = useState<NotificationPermission>("default");
  const [notifSent,       setNotifSent]       = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  const loadData = useCallback(() => {
    const month = new Date().getMonth() + 1;
    const year  = new Date().getFullYear();
    Promise.all([
      api.get("/entries", { params: { entry_date: today } }),
      api.get("/entries", { params: { month, year } }),
      api.get("/customers"),
      api.get("/entries"), // all entries for delivery tracking
    ]).then(([t, m, c, all]) => {
      setTodayEntries(t.data);
      setMonthEntries(m.data);
      setCustomers(c.data);
      // Filter: not delivered + has delivery_date
      setAllPending(all.data.filter((e: LaundryEntry) => e.delivery_status !== "delivered" && e.delivery_date));
    }).finally(() => setLoading(false));
  }, [today]);

  useEffect(() => {
    loadData();
    if (typeof Notification !== "undefined") {
      setNotifPerm(Notification.permission);
    }
  }, [loadData]);

  // Categorise by delivery date
  const overdueEntries  = allPending.filter(e => e.delivery_date! < today);
  const dueTodayEntries = allPending.filter(e => e.delivery_date === today);
  const upcomingEntries = allPending.filter(e => e.delivery_date! > today);

  // Fire browser notifications once
  useEffect(() => {
    if (notifSent || notifPerm !== "granted" || loading) return;
    const total = overdueEntries.length + dueTodayEntries.length;
    if (total === 0) return;
    if (overdueEntries.length > 0) {
      new Notification("⚠️ Overdue Deliveries — LaundryPro", {
        body: `${overdueEntries.length} order${overdueEntries.length > 1 ? "s are" : " is"} overdue for delivery!`,
        icon: "/favicon.ico",
      });
    }
    if (dueTodayEntries.length > 0) {
      new Notification("🚚 Today's Deliveries — LaundryPro", {
        body: `${dueTodayEntries.length} order${dueTodayEntries.length > 1 ? "s" : ""} to deliver today.`,
        icon: "/favicon.ico",
      });
    }
    setNotifSent(true);
  }, [notifPerm, overdueEntries.length, dueTodayEntries.length, notifSent, loading]);

  const requestNotif = async () => {
    if (typeof Notification === "undefined") return;
    const perm = await Notification.requestPermission();
    setNotifPerm(perm);
  };

  const todayTotal   = todayEntries.reduce((s, e) => s + Number(e.total_amount), 0);
  const monthTotal   = monthEntries.reduce((s, e) => s + Number(e.total_amount), 0);
  const pendingCount = monthEntries.filter(e => e.delivery_status !== "delivered").length;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";
  const dateStr = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

  if (loading) return (
    <ProtectedLayout>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "70vh", flexDirection: "column", gap: 12 }}>
        <div style={{ fontSize: 40 }}>👔</div>
        <p style={{ color: "#94a3b8", fontSize: 14, margin: 0 }}>Loading...</p>
      </div>
    </ProtectedLayout>
  );

  return (
    <ProtectedLayout>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:.55} }
        .dash-card  { animation: fadeUp 0.4s ease both; }
        .action-btn:active { transform: scale(0.95); }
        .entry-card:hover  { box-shadow:0 6px 20px rgba(0,0,0,0.1)!important; transform:translateY(-1px); }
        .del-card:hover    { opacity:.92; }
      `}</style>

      {/* ── Hero Header ── */}
      <div className="dash-card" style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #1d4ed8 100%)",
        borderRadius: 20, padding: "24px 20px 28px", marginBottom: 20, position: "relative", overflow: "hidden"
      }}>
        <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
        <div style={{ position: "absolute", bottom: -20, right: 40, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <p style={{ margin: "0 0 4px", fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>{dateStr}</p>
            <h1 style={{ margin: "0 0 20px", fontSize: 24, fontWeight: 800, color: "#fff" }}>{greeting} 👋</h1>
          </div>
          {/* Notification bell */}
          <button
            onClick={notifPerm === "granted" ? undefined : requestNotif}
            title={notifPerm === "granted" ? "Notifications active" : "Enable notifications"}
            style={{ background: "rgba(255,255,255,0.12)", border: "none", borderRadius: 10, padding: "9px 11px", cursor: notifPerm === "granted" ? "default" : "pointer", display: "flex", alignItems: "center", gap: 6, color: "#fff", position: "relative" }}>
            {notifPerm === "granted" ? <Bell size={18} /> : <BellOff size={18} />}
            {notifPerm !== "granted" && <span style={{ fontSize: 10, fontWeight: 700 }}>Enable</span>}
            {(overdueEntries.length + dueTodayEntries.length) > 0 && (
              <span style={{ position: "absolute", top: -4, right: -4, width: 16, height: 16, borderRadius: "50%", background: "#ef4444", fontSize: 9, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", animation: "pulse 1.5s infinite" }}>
                {overdueEntries.length + dueTodayEntries.length}
              </span>
            )}
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div style={{ background: "rgba(255,255,255,0.12)", borderRadius: 14, padding: "14px 16px", backdropFilter: "blur(8px)" }}>
            <p style={{ margin: "0 0 6px", fontSize: 11, color: "rgba(255,255,255,0.6)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Today</p>
            <p style={{ margin: "0 0 2px", fontSize: 22, fontWeight: 800, color: "#fff" }}>₹{todayTotal.toLocaleString("en-IN")}</p>
            <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{todayEntries.length} entries</p>
          </div>
          <div style={{ background: "rgba(255,255,255,0.12)", borderRadius: 14, padding: "14px 16px", backdropFilter: "blur(8px)" }}>
            <p style={{ margin: "0 0 6px", fontSize: 11, color: "rgba(255,255,255,0.6)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>This Month</p>
            <p style={{ margin: "0 0 2px", fontSize: 22, fontWeight: 800, color: "#fff" }}>₹{monthTotal.toLocaleString("en-IN")}</p>
            <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{monthEntries.length} entries</p>
          </div>
        </div>
      </div>

      {/* ── Delivery Alert Banner (overdue) ── */}
      {overdueEntries.length > 0 && (
        <div className="dash-card" style={{ animationDelay: "0.03s", background: "linear-gradient(135deg,#7f1d1d,#dc2626)", borderRadius: 14, padding: "14px 18px", marginBottom: 14, display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
          onClick={() => router.push("/deliveries")}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, animation: "pulse 1.5s infinite" }}>
            <AlertTriangle size={20} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: "#fff", fontWeight: 800, fontSize: 14 }}>{overdueEntries.length} Overdue Deliver{overdueEntries.length > 1 ? "ies" : "y"}</div>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 1 }}>These orders passed their delivery date — action needed</div>
          </div>
          <ChevronRight size={18} color="rgba(255,255,255,0.6)" />
        </div>
      )}

      {/* ── Stats Row ── */}
      <div className="dash-card" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16, animationDelay: "0.05s" }}>
        <div style={{ background: "#fff", borderRadius: 14, padding: "14px 12px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9" }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "#f5f3ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Users size={18} color="#7c3aed" />
          </div>
          <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#0f172a" }}>{customers.length}</p>
          <p style={{ margin: 0, fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>Customers</p>
        </div>
        <div style={{ background: overdueEntries.length > 0 ? "#fef2f2" : "#fff", borderRadius: 14, padding: "14px 12px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: overdueEntries.length > 0 ? "1px solid #fecaca" : "1px solid #f1f5f9" }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: overdueEntries.length > 0 ? "#fee2e2" : "#fffbeb", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <AlertTriangle size={18} color={overdueEntries.length > 0 ? "#dc2626" : "#d97706"} />
          </div>
          <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: overdueEntries.length > 0 ? "#dc2626" : "#0f172a" }}>{overdueEntries.length}</p>
          <p style={{ margin: 0, fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>Overdue</p>
        </div>
        <div style={{ background: "#fff", borderRadius: 14, padding: "14px 12px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9" }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "#fffbeb", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Clock size={18} color="#d97706" />
          </div>
          <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#0f172a" }}>{pendingCount}</p>
          <p style={{ margin: 0, fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>Pending</p>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="dash-card" style={{ marginBottom: 20, animationDelay: "0.08s" }}>
        <p style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>Quick Actions</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
          {[
            { icon: <PlusCircle size={20} />, label: "New",      path: "/new-entry",  color: "#1d4ed8", bg: "#eff6ff" },
            { icon: <Truck size={20} />,      label: "Deliver",  path: "/deliveries", color: "#d97706", bg: "#fffbeb" },
            { icon: <ClipboardList size={20} />, label: "Entries", path: "/entries",  color: "#059669", bg: "#f0fdf4" },
            { icon: <BarChart3 size={20} />,  label: "Reports",  path: "/reports",    color: "#7c3aed", bg: "#f5f3ff" },
          ].map((a, i) => (
            <div key={i} className="action-btn" onClick={() => router.push(a.path)} style={{
              background: "#fff", border: "1.5px solid #f1f5f9", borderRadius: 14,
              padding: "14px 6px", display: "flex", flexDirection: "column",
              alignItems: "center", gap: 7, cursor: "pointer", transition: "all 0.15s",
              boxShadow: "0 1px 4px rgba(0,0,0,0.05)"
            }}
              onMouseEnter={e => { e.currentTarget.style.background = a.bg; e.currentTarget.style.borderColor = a.color + "55"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#f1f5f9"; }}
            >
              <div style={{ width: 38, height: 38, borderRadius: 10, background: a.bg, display: "flex", alignItems: "center", justifyContent: "center", color: a.color }}>
                {a.icon}
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#475569" }}>{a.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Today's Deliveries ── */}
      {dueTodayEntries.length > 0 && (
        <DeliverySection
          title="🚚 Deliver Today"
          entries={dueTodayEntries}
          accentColor="#d97706"
          bgColor="#fffbeb"
          borderColor="#fde68a"
          badgeColor="#d97706"
          animDelay="0.1s"
          router={router}
        />
      )}

      {/* ── Overdue Deliveries ── */}
      {overdueEntries.length > 0 && (
        <DeliverySection
          title="⚠️ Overdue"
          entries={overdueEntries}
          accentColor="#dc2626"
          bgColor="#fef2f2"
          borderColor="#fecaca"
          badgeColor="#dc2626"
          animDelay="0.12s"
          router={router}
          showDaysOverdue
          today={today}
        />
      )}

      {/* ── Upcoming Deliveries ── */}
      {upcomingEntries.length > 0 && (
        <DeliverySection
          title="📅 Upcoming"
          entries={upcomingEntries.slice(0, 5)}
          accentColor="#2563eb"
          bgColor="#eff6ff"
          borderColor="#bfdbfe"
          badgeColor="#2563eb"
          animDelay="0.14s"
          router={router}
        />
      )}

      {/* ── Today's Pickups ── */}
      <div className="dash-card" style={{ animationDelay: "0.16s" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Today&apos;s Pickups
            {todayEntries.length > 0 && (
              <span style={{ marginLeft: 8, background: "#1d4ed8", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20 }}>
                {todayEntries.length}
              </span>
            )}
          </p>
          {todayEntries.length > 4 && (
            <button onClick={() => router.push("/entries")} style={{ background: "none", border: "none", color: "#3b82f6", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              See all →
            </button>
          )}
        </div>

        {todayEntries.length === 0 ? (
          <div style={{ background: "#fff", borderRadius: 16, padding: "36px 16px", textAlign: "center", border: "1.5px dashed #e2e8f0" }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
            <p style={{ color: "#94a3b8", fontSize: 14, margin: "0 0 14px", fontWeight: 500 }}>No pickups today</p>
            <button onClick={() => router.push("/new-entry")} style={{ background: "#1d4ed8", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              + Add Entry
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {todayEntries.slice(0, 4).map((entry, i) => (
              <div key={entry.id} className="entry-card" style={{
                background: "#fff", borderRadius: 14, padding: "14px 16px",
                display: "flex", justifyContent: "space-between", alignItems: "center",
                border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                cursor: "pointer", transition: "all 0.15s",
              }}
                onClick={() => router.push("/new-entry")}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                    background: `linear-gradient(135deg, ${["#1d4ed8","#7c3aed","#059669","#d97706"][i%4]}, ${["#3b82f6","#a855f7","#10b981","#f59e0b"][i%4]})`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff", fontWeight: 800, fontSize: 16
                  }}>
                    {entry.customer?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#0f172a" }}>{entry.customer?.name}</p>
                    <p style={{ margin: "3px 0 0", fontSize: 11, color: "#94a3b8" }}>
                      {entry.items?.slice(0, 2).map(i => i.service_name).join(" • ")}
                      {(entry.items?.length || 0) > 2 && ` +${(entry.items?.length || 0) - 2}`}
                    </p>
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ margin: 0, fontWeight: 800, fontSize: 15, color: "#0f172a" }}>₹{Number(entry.total_amount).toLocaleString("en-IN")}</p>
                  <p style={{ margin: "3px 0 0", fontSize: 11, fontWeight: 600, color: statusColor[entry.delivery_status] }}>
                    ● {statusLabel[entry.delivery_status] ?? entry.delivery_status}
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

// ── Delivery Section Component ──────────────────────────────────────
function DeliverySection({ title, entries, accentColor, bgColor, borderColor, badgeColor, animDelay, router, showDaysOverdue, today }: {
  title: string; entries: LaundryEntry[]; accentColor: string; bgColor: string;
  borderColor: string; badgeColor: string; animDelay: string; router: ReturnType<typeof useRouter>;
  showDaysOverdue?: boolean; today?: string;
}) {
  const daysOverdue = (date: string) => {
    const diff = new Date(today!).getTime() - new Date(date + "T00:00:00").getTime();
    return Math.floor(diff / 86400000);
  };

  return (
    <div className="dash-card" style={{ marginBottom: 16, animationDelay: animDelay }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {title}
          <span style={{ marginLeft: 8, background: badgeColor, color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20 }}>
            {entries.length}
          </span>
        </p>
        <button onClick={() => router.push("/deliveries")} style={{ background: "none", border: "none", color: accentColor, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
          Manage →
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {entries.map(entry => (
          <div key={entry.id} className="del-card" onClick={() => router.push("/new-entry")} style={{
            background: bgColor, borderRadius: 14, padding: "12px 16px",
            border: `1.5px solid ${borderColor}`, cursor: "pointer", transition: "opacity 0.15s",
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: accentColor + "22", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Truck size={18} color={accentColor} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>{entry.customer?.name}</div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2, display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span>{entry.items?.slice(0, 2).map(i => i.service_name).join(" • ")}{(entry.items?.length || 0) > 2 && ` +${(entry.items?.length || 0) - 2}`}</span>
              </div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 13, color: accentColor }}>
                {showDaysOverdue ? `${daysOverdue(entry.delivery_date!)}d late` : fmtDate(entry.delivery_date!)}
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>₹{Number(entry.total_amount)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
