"use client";
import { useState } from "react";
import { BarChart3, TrendingUp, ClipboardList, Users } from "lucide-react";
import ProtectedLayout from "@/components/ProtectedLayout";
import { DEMO_ENTRIES, DEMO_CUSTOMERS } from "@/lib/demo-data";

export default function ReportsPage() {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year,  setYear]  = useState(new Date().getFullYear());

  const filtered = DEMO_ENTRIES.filter(e => {
    const [y, m] = e.entry_date.split("-");
    return parseInt(m) === month && parseInt(y) === year;
  });

  const revenue   = filtered.reduce((s, e) => s + Number(e.total_amount), 0);
  const pending   = filtered.filter(e => e.delivery_status === "pending").length;
  const delivered = filtered.filter(e => e.delivery_status === "delivered").length;

  const dayMap: Record<string, number> = {};
  filtered.forEach(e => { dayMap[e.entry_date] = (dayMap[e.entry_date] || 0) + Number(e.total_amount); });
  const days = Object.entries(dayMap).sort(([a], [b]) => a.localeCompare(b));
  const maxDay = Math.max(...days.map(([, v]) => v), 1);

  // Top customers by revenue this month
  const custMap: Record<string, { name: string; count: number; revenue: number }> = {};
  filtered.forEach(e => {
    const k = e.customer.name;
    if (!custMap[k]) custMap[k] = { name: k, count: 0, revenue: 0 };
    custMap[k].count++;
    custMap[k].revenue += Number(e.total_amount);
  });
  const topCustomers = Object.values(custMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  return (
    <ProtectedLayout>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>

      <div style={{ animation: "fadeUp 0.3s ease both", background: "linear-gradient(135deg,#1e1b4b,#4c1d95,#7c3aed)", borderRadius: 20, padding: "22px 28px", marginBottom: 20, color: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}><BarChart3 size={24} /></div>
          <div><div style={{ fontWeight: 800, fontSize: 20 }}>Reports</div><div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{months[month - 1]} {year}</div></div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <select value={month} onChange={e => setMonth(Number(e.target.value))} style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.15)", color: "#fff", fontSize: 13, outline: "none" }}>
            {months.map((m, i) => <option key={i} value={i + 1} style={{ color: "#0f172a" }}>{m}</option>)}
          </select>
          <select value={year} onChange={e => setYear(Number(e.target.value))} style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.15)", color: "#fff", fontSize: 13, outline: "none" }}>
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y} style={{ color: "#0f172a" }}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14, marginBottom: 20 }}>
        {[
          { label: "Total Entries",    value: filtered.length,                       icon: <ClipboardList size={18} />, color: "#7c3aed", bg: "linear-gradient(135deg,#f5f3ff,#ede9fe)", border: "#c4b5fd" },
          { label: "Revenue",          value: `₹${revenue.toLocaleString("en-IN")}`, icon: <TrendingUp size={18} />,    color: "#059669", bg: "linear-gradient(135deg,#f0fdf4,#dcfce7)", border: "#86efac" },
          { label: "Pending",          value: pending,                                icon: <ClipboardList size={18} />, color: "#d97706", bg: "linear-gradient(135deg,#fffbeb,#fef3c7)", border: "#fcd34d" },
          { label: "Total Customers",  value: DEMO_CUSTOMERS.length,                 icon: <Users size={18} />,         color: "#1d4ed8", bg: "linear-gradient(135deg,#eff6ff,#dbeafe)", border: "#93c5fd" },
        ].map((s, i) => (
          <div key={i} style={{ animation: `fadeUp 0.3s ease ${i * 0.07}s both`, background: s.bg, border: `1.5px solid ${s.border}`, borderRadius: 16, padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>{s.label}</span>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", justifyContent: "center", color: s.color }}>{s.icon}</div>
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
        {/* Daily revenue bar chart */}
        <div style={{ background: "#fff", borderRadius: 18, padding: 24, border: "1.5px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 20 }}>Daily Revenue — {months[month - 1]} {year}</div>
          {days.length === 0 ? (
            <div style={{ textAlign: "center", color: "#94a3b8", padding: "30px 0" }}>No data for this month</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <div style={{ display: "flex", gap: 8, alignItems: "flex-end", minWidth: days.length * 50, height: 200 }}>
                {days.map(([date, amt]) => (
                  <div key={date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#7c3aed" }}>₹{(amt / 1000).toFixed(1)}k</div>
                    <div style={{ width: "100%", background: "linear-gradient(180deg,#7c3aed,#a78bfa)", borderRadius: "4px 4px 0 0", height: `${Math.round((amt / maxDay) * 140)}px`, minHeight: 4 }} />
                    <div style={{ fontSize: 9, color: "#64748b", fontWeight: 600 }}>{date.slice(8)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Top customers */}
        <div style={{ background: "#fff", borderRadius: 18, padding: 20, border: "1.5px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", alignSelf: "start" }}>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 16 }}>Top Customers</div>
          {topCustomers.length === 0 ? (
            <div style={{ color: "#94a3b8", fontSize: 13 }}>No data this month</div>
          ) : (
            topCustomers.map((c, i) => (
              <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: `linear-gradient(135deg,#7c3aed,#a78bfa)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 13, flexShrink: 0 }}>{i + 1}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>{c.count} order{c.count > 1 ? "s" : ""}</div>
                </div>
                <div style={{ fontWeight: 800, fontSize: 13, color: "#059669", flexShrink: 0 }}>₹{c.revenue.toLocaleString("en-IN")}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </ProtectedLayout>
  );
}
