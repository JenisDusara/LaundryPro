"use client";
import { useState, useEffect } from "react";
import { ClipboardList, Search, Truck } from "lucide-react";
import ProtectedLayout from "@/components/ProtectedLayout";
import { useAuth } from "@/context/AuthContext";
import { DEMO_ENTRIES } from "@/lib/demo-data";

const STATUS_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  pending:   { bg: "#fffbeb", color: "#d97706", border: "#fcd34d" },
  ready:     { bg: "#f0fdf4", color: "#059669", border: "#86efac" },
  delivered: { bg: "#eff6ff", color: "#1d4ed8", border: "#93c5fd" },
};

export default function EntriesPage() {
  const { isAuth } = useAuth();
  const [entries,  setEntries]  = useState(DEMO_ENTRIES);
  const [search,   setSearch]   = useState("");
  const [statusF,  setStatusF]  = useState("all");

  const displayed = entries.filter(e => {
    if (statusF !== "all" && e.delivery_status !== statusF) return false;
    if (!search) return true;
    return e.customer?.name?.toLowerCase().includes(search.toLowerCase()) || e.customer?.phone?.includes(search);
  });

  const updateStatus = (id: string, status: string) => {
    setEntries(es => es.map(e => e.id === id ? { ...e, delivery_status: status } : e));
  };

  return (
    <ProtectedLayout>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}.ent-row{transition:background 0.12s}.ent-row:hover{background:#f8fafc!important}`}</style>

      <div style={{ animation: "fadeUp 0.3s ease both", background: "linear-gradient(135deg,#0f172a,#1e3a8a)", borderRadius: 20, padding: "22px 28px", marginBottom: 20, color: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}><ClipboardList size={24} /></div>
          <div><div style={{ fontWeight: 800, fontSize: 20 }}>Entries</div><div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{entries.length} total</div></div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
          <input placeholder="Search by customer name or phone…" value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: "100%", padding: "10px 14px 10px 36px", border: "1.5px solid #e2e8f0", borderRadius: 12, fontSize: 13, outline: "none", background: "#fff", boxSizing: "border-box" }} />
        </div>
        <div style={{ display: "flex", background: "#e2e8f0", borderRadius: 12, padding: 4, gap: 4 }}>
          {["all", "pending", "ready", "delivered"].map(s => (
            <button key={s} onClick={() => setStatusF(s)}
              style={{ padding: "8px 14px", borderRadius: 9, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 12, background: statusF === s ? "#fff" : "transparent", color: statusF === s ? "#0f172a" : "#64748b", boxShadow: statusF === s ? "0 2px 8px rgba(0,0,0,0.08)" : "none" }}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: 18, border: "1.5px solid #e2e8f0", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1.2fr", padding: "10px 20px", background: "#f8fafc", borderBottom: "1px solid #f1f5f9" }}>
          {["Customer", "Date", "Amount", "Status", "Action"].map(h => (
            <div key={h} style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em" }}>{h}</div>
          ))}
        </div>

        {displayed.length === 0 ? (
          <div style={{ padding: "50px 20px", textAlign: "center", color: "#94a3b8" }}>
            <ClipboardList size={40} style={{ margin: "0 auto 14px", display: "block", opacity: 0.2 }} />
            <div style={{ fontWeight: 700 }}>No entries found</div>
          </div>
        ) : (
          displayed.map((e, i) => {
            const sc = STATUS_COLORS[e.delivery_status] || STATUS_COLORS.pending;
            return (
              <div key={e.id} className="ent-row" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1.2fr", padding: "13px 20px", borderBottom: i < displayed.length - 1 ? "1px solid #f1f5f9" : "none", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}>{e.customer?.name}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>{e.customer?.phone}</div>
                </div>
                <div style={{ fontSize: 13, color: "#475569" }}>{e.entry_date}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#059669" }}>₹{Number(e.total_amount).toLocaleString("en-IN")}</div>
                <div><span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 6, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>{e.delivery_status}</span></div>
                <div style={{ display: "flex", gap: 5 }}>
                  {isAuth && e.delivery_status === "pending" && (
                    <button onClick={() => updateStatus(e.id, "ready")} style={{ padding: "5px 10px", border: "1px solid #86efac", borderRadius: 7, background: "#f0fdf4", color: "#059669", fontWeight: 600, fontSize: 11, cursor: "pointer" }}>Mark Ready</button>
                  )}
                  {isAuth && e.delivery_status === "ready" && (
                    <button onClick={() => updateStatus(e.id, "delivered")} style={{ padding: "5px 10px", border: "1px solid #93c5fd", borderRadius: 7, background: "#eff6ff", color: "#1d4ed8", fontWeight: 600, fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}><Truck size={11} /> Delivered</button>
                  )}
                  {e.delivery_status === "delivered" && <span style={{ fontSize: 11, color: "#94a3b8" }}>Done ✓</span>}
                </div>
              </div>
            );
          })
        )}
      </div>
    </ProtectedLayout>
  );
}
