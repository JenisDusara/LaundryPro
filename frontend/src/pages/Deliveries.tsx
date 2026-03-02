import { useState, useEffect } from "react";
import { Truck, CheckCircle, Clock } from "lucide-react";
import api from "../api/client";
import type { LaundryEntry } from "../types";

export default function Deliveries() {
  const [entries, setEntries] = useState<LaundryEntry[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const today = new Date().toISOString().split("T")[0];
    const res = await api.get("/entries", { params: { entry_date: today } });
    setEntries(res.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: string) => {
    await api.patch(`/entries/${id}/delivery`, { delivery_status: status });
    load();
  };

  const filtered = filter === "all" ? entries : entries.filter(e => e.delivery_status === filter);
  const statusColor = (s: string) => s === "Delivered" ? "#059669" : s === "In Delivery" ? "#d97706" : "#64748b";
  const statusIcon = (s: string) => s === "Delivered" ? <CheckCircle size={16} /> : s === "In Delivery" ? <Truck size={16} /> : <Clock size={16} />;

  if (loading) return <p style={{ color: "#94a3b8", textAlign: "center", marginTop: 40 }}>Loading...</p>;

  return (
    <div>
      <h2 style={{ color: "#1e3a8a", marginBottom: 16 }}>Today's Deliveries</h2>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {["all", "Pending", "In Delivery", "Delivered"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: "6px 14px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
            background: filter === f ? "#1e40af" : "#e2e8f0",
            color: filter === f ? "#fff" : "#475569",
          }}>{f === "all" ? "All" : f}</button>
        ))}
      </div>
      {filtered.length === 0 && <p style={{ color: "#94a3b8", textAlign: "center", marginTop: 40 }}>No entries found</p>}
      {filtered.map(entry => (
        <div key={entry.id} style={{ background: "#fff", borderRadius: 10, padding: 16, marginBottom: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{entry.customer?.name}</div>
              <div style={{ fontSize: 13, color: "#64748b" }}>{entry.customer?.society_name} • Flat {entry.customer?.flat_number}</div>
              <div style={{ fontSize: 13, color: "#64748b" }}>📞 {entry.customer?.phone}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontWeight: 700, color: "#1e3a8a" }}>₹{entry.total_amount}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, color: statusColor(entry.delivery_status), fontSize: 13, fontWeight: 600 }}>
                {statusIcon(entry.delivery_status)} {entry.delivery_status}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            {["Pending", "In Delivery", "Delivered"].map(s => (
              <button key={s} onClick={() => updateStatus(entry.id, s)} style={{
                padding: "5px 12px", borderRadius: 6, border: "1px solid #e2e8f0", cursor: "pointer", fontSize: 12,
                background: entry.delivery_status === s ? statusColor(s) : "#f8fafc",
                color: entry.delivery_status === s ? "#fff" : "#475569",
              }}>{s}</button>
            ))}
          </div>
          <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
            {entry.items?.map((item, i) => (
              <span key={i} style={{ background: "#eff6ff", color: "#1e40af", fontSize: 11, padding: "2px 8px", borderRadius: 10 }}>
                {item.service_name} × {item.quantity}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}