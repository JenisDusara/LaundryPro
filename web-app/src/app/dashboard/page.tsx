"use client";
import { useState, useEffect } from "react";
import { Users, ClipboardList, Truck, TrendingUp, PlusCircle, Hammer, Wrench, Wallet, BarChart3 } from "lucide-react";
import { useRouter } from "next/navigation";
import ProtectedLayout from "@/components/ProtectedLayout";
import { DEMO_CUSTOMERS, DEMO_ENTRIES, DEMO_PROFILE } from "@/lib/demo-data";

export default function DashboardPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => { setReady(true); }, []);

  const revenue  = DEMO_ENTRIES.reduce((s, e) => s + Number(e.total_amount), 0);
  const pending   = DEMO_ENTRIES.filter(e => e.delivery_status === "pending").length;
  const delivered = DEMO_ENTRIES.filter(e => e.delivery_status === "delivered").length;

  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });

  const statCards = [
    { label: "Total Customers", value: DEMO_CUSTOMERS.length,  icon: <Users size={20} />,         color: "#1d4ed8", bg: "linear-gradient(135deg,#eff6ff,#dbeafe)", border: "#93c5fd" },
    { label: "Total Entries",   value: DEMO_ENTRIES.length,    icon: <ClipboardList size={20} />, color: "#7c3aed", bg: "linear-gradient(135deg,#f5f3ff,#ede9fe)", border: "#c4b5fd" },
    { label: "Pending",         value: pending,                 icon: <Truck size={20} />,         color: "#d97706", bg: "linear-gradient(135deg,#fffbeb,#fef3c7)", border: "#fcd34d" },
    { label: "Delivered",       value: delivered,               icon: <TrendingUp size={20} />,    color: "#059669", bg: "linear-gradient(135deg,#f0fdf4,#dcfce7)", border: "#86efac" },
  ];

  const quickActions = [
    { label: "New Entry",   icon: <PlusCircle size={22} />,   path: "/new-entry",   color: "#1d4ed8", bg: "#eff6ff" },
    { label: "Customers",  icon: <Users size={22} />,         path: "/customers",   color: "#7c3aed", bg: "#f5f3ff" },
    { label: "Deliveries", icon: <Truck size={22} />,         path: "/deliveries",  color: "#d97706", bg: "#fffbeb" },
    { label: "Labour",     icon: <Hammer size={22} />,        path: "/labour",      color: "#059669", bg: "#f0fdf4" },
    { label: "Services",   icon: <Wrench size={22} />,        path: "/services",    color: "#0891b2", bg: "#f0f9ff" },
    { label: "Accounting", icon: <Wallet size={22} />,        path: "/accounting",  color: "#be185d", bg: "#fdf2f8" },
    { label: "Reports",    icon: <BarChart3 size={22} />,     path: "/reports",     color: "#7c3aed", bg: "#f5f3ff" },
    { label: "Entries",    icon: <ClipboardList size={22} />, path: "/entries",     color: "#475569", bg: "#f8fafc" },
  ];

  return (
    <ProtectedLayout>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Header */}
      <div style={{ animation: "fadeUp 0.3s ease both", background: "linear-gradient(135deg,#0f172a 0%,#1e3a8a 60%,#1d4ed8 100%)", borderRadius: 20, padding: "24px 28px", marginBottom: 24, color: "#fff", boxShadow: "0 8px 32px rgba(29,78,216,0.25)" }}>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>{today}</div>
        <div style={{ fontWeight: 900, fontSize: 26, letterSpacing: -0.5 }}>Welcome back, {DEMO_PROFILE.name} 👋</div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginTop: 4 }}>{DEMO_PROFILE.shop_name}</div>
        <div style={{ marginTop: 16, padding: "12px 16px", background: "rgba(255,255,255,0.1)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.15)", display: "inline-block" }}>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>Monthly Revenue</span>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", marginTop: 2 }}>₹{revenue.toLocaleString("en-IN")}</div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
        {statCards.map((s, i) => (
          <div key={i} style={{ animation: `fadeUp 0.3s ease ${i * 0.07}s both`, background: s.bg, border: `1.5px solid ${s.border}`, borderRadius: 16, padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>{s.label}</span>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", justifyContent: "center", color: s.color }}>{s.icon}</div>
            </div>
            <div style={{ fontSize: 30, fontWeight: 900, color: s.color, letterSpacing: -0.5 }}>{ready ? s.value : "—"}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ background: "#fff", borderRadius: 18, padding: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.06)", border: "1.5px solid #e2e8f0" }}>
        <div style={{ fontWeight: 800, fontSize: 16, color: "#0f172a", marginBottom: 18 }}>Quick Actions</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
          {quickActions.map((a, i) => (
            <div key={i} onClick={() => router.push(a.path)}
              style={{ animation: `fadeUp 0.3s ease ${i * 0.05}s both`, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "20px 12px", borderRadius: 14, cursor: "pointer", background: a.bg, border: "1.5px solid transparent", transition: "all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.1)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}>
              <div style={{ color: a.color }}>{a.icon}</div>
              <span style={{ fontSize: 12, fontWeight: 700, color: a.color, textAlign: "center" }}>{a.label}</span>
            </div>
          ))}
        </div>
      </div>
    </ProtectedLayout>
  );
}
