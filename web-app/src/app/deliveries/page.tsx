"use client";
import { useState } from "react";
import { Truck } from "lucide-react";
import ProtectedLayout from "@/components/ProtectedLayout";
import { useAuth } from "@/context/AuthContext";
import { DEMO_ENTRIES } from "@/lib/demo-data";

export default function DeliveriesPage() {
  const { isAuth } = useAuth();
  const [entries, setEntries] = useState(
    DEMO_ENTRIES.filter(e => e.delivery_status === "pending" || e.delivery_status === "ready")
  );

  const markDelivered = (id: string) => {
    setEntries(es => es.filter(e => e.id !== id));
  };

  return (
    <ProtectedLayout>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}.del-row{transition:background 0.12s}.del-row:hover{background:#fffbeb!important}`}</style>

      <div style={{ animation: "fadeUp 0.3s ease both", background: "linear-gradient(135deg,#78350f,#d97706)", borderRadius: 20, padding: "22px 28px", marginBottom: 20, color: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}><Truck size={24} /></div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 20 }}>Pending Deliveries</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>{entries.length} items waiting</div>
          </div>
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: 18, border: "1.5px solid #e2e8f0", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", padding: "10px 20px", background: "#fffbeb", borderBottom: "1px solid #fef3c7" }}>
          {["Customer", "Phone", "Entry Date", "Amount", "Action"].map(h => (
            <div key={h} style={{ fontSize: 11, fontWeight: 800, color: "#92400e", textTransform: "uppercase", letterSpacing: "0.07em" }}>{h}</div>
          ))}
        </div>

        {entries.length === 0 ? (
          <div style={{ padding: "60px 20px", textAlign: "center" }}>
            <Truck size={48} style={{ margin: "0 auto 16px", display: "block", color: "#fcd34d" }} />
            <div style={{ fontWeight: 800, fontSize: 16, color: "#0f172a" }}>All Delivered! 🎉</div>
            <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>No pending deliveries</div>
          </div>
        ) : (
          entries.map((e, i) => (
            <div key={e.id} className="del-row" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", padding: "14px 20px", borderBottom: i < entries.length - 1 ? "1px solid #f1f5f9" : "none", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>{e.customer?.name}</div>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 5, background: e.delivery_status === "ready" ? "#f0fdf4" : "#fffbeb", color: e.delivery_status === "ready" ? "#059669" : "#d97706", border: `1px solid ${e.delivery_status === "ready" ? "#86efac" : "#fcd34d"}` }}>{e.delivery_status}</span>
              </div>
              <div style={{ fontSize: 13, color: "#64748b" }}>{e.customer?.phone}</div>
              <div style={{ fontSize: 13, color: "#64748b" }}>{e.entry_date}</div>
              <div style={{ fontWeight: 700, color: "#059669" }}>₹{Number(e.total_amount).toLocaleString("en-IN")}</div>
              {isAuth ? (
                <button onClick={() => markDelivered(e.id)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", border: "none", borderRadius: 9, background: "linear-gradient(135deg,#d97706,#f59e0b)", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                  <Truck size={13} /> Mark Delivered
                </button>
              ) : (
                <span style={{ fontSize: 11, color: "#94a3b8" }}>—</span>
              )}
            </div>
          ))
        )}
      </div>
    </ProtectedLayout>
  );
}
