import { useState, useEffect } from "react";
import { CheckCircle, Clock } from "lucide-react";
import api from "../api/client";
import type { LaundryEntry } from "../types";

const FILTERS = [
  { val: "all", label: "All" },
  { val: "pending", label: "Pending" },
  { val: "delivered", label: "Delivered" },
];

const STATUS_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  pending:   { bg: "#fef3c7", color: "#d97706", border: "#fde68a" },
  delivered: { bg: "#dcfce7", color: "#16a34a", border: "#bbf7d0" },
};

export default function Deliveries() {
const [entries, setEntries] = useState<LaundryEntry[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);
  const load = async () => {
    setLoading(true);
    const d = new Date();
    const res = await api.get("/entries", { params: { month: d.getMonth() + 1, year: d.getFullYear() } });
    setEntries(res.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: string) => {
    await api.patch(`/entries/${id}/status`, null, { params: { status } });
    load();
  };

  const filtered = filter === "all" ? entries : entries.filter(e => e.delivery_status === filter);

  // Group by customer
  const customerMap = new Map<string, { name: string; phone: string; flat: string; society: string; entries: LaundryEntry[] }>();
  filtered.forEach(e => {
    const cid = e.customer_id;
    if (!customerMap.has(cid)) {
      customerMap.set(cid, {
        name: e.customer?.name || "Unknown",
        phone: e.customer?.phone || "",
        flat: e.customer?.flat_number || "",
        society: e.customer?.society_name || "",
        entries: [],
      });
    }
    customerMap.get(cid)!.entries.push(e);
  });
  const customers = [...customerMap.entries()];

  const statusIcon = (st: string) =>
    st === "delivered" ? <CheckCircle size={14} /> : <Clock size={14} />;

  if (loading) return <p style={{ color: "#94a3b8", textAlign: "center", marginTop: 40 }}>Loading...</p>;

  return (
    <div>
      <h2 style={{ color: "#1e3a8a", marginBottom: 16, fontSize: 22, fontWeight: 800 }}>Deliveries</h2>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {FILTERS.map(f => (
          <button key={f.val} onClick={() => setFilter(f.val)} style={{
            padding: "6px 14px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
            background: filter === f.val ? "#1e40af" : "#e2e8f0",
            color: filter === f.val ? "#fff" : "#475569",
          }}>{f.label}</button>
        ))}
      </div>

      {customers.length === 0 && (
        <p style={{ color: "#94a3b8", textAlign: "center", marginTop: 40 }}>No entries found</p>
      )}

      {customers.map(([cid, cust]) => {
        const custTotal = cust.entries.reduce((s, e) => s + Number(e.total_amount), 0);
        const allDelivered = cust.entries.every(e => e.delivery_status === "delivered");
        const custSt = allDelivered ? STATUS_STYLES.delivered : STATUS_STYLES.pending;
        return (
          <div key={cid} style={{
            background: "#fff", borderRadius: 14, marginBottom: 12,
            boxShadow: "0 2px 10px rgba(0,0,0,0.07)", border: "1px solid #f1f5f9", overflow: "hidden",
          }}>
            {/* Customer Header */}
              <div onClick={() => setExpandedCustomer(expandedCustomer === cid ? null : cid)} style={{ padding: "12px 16px", background: "#fafafa", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>

              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b" }}>{cust.name}</div>
                {(cust.flat || cust.society) && (
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>🏠 {cust.flat}{cust.society && ` • ${cust.society}`}</div>
                )}
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>📞 {cust.phone}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 800, fontSize: 16, color: "#1e3a8a" }}>₹{custTotal}</div>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 4, marginTop: 4,
                  padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                  background: custSt.bg, color: custSt.color, border: `1px solid ${custSt.border}`,
                }}>
                  {allDelivered ? <CheckCircle size={12} /> : <Clock size={12} />}
                  {allDelivered ? "All Delivered" : "Pending"}
                </div>
              </div>
            </div>

            {/* Entries */}
            {expandedCustomer === cid && cust.entries.map(entry => {

              const st = STATUS_STYLES[entry.delivery_status] || STATUS_STYLES.pending;
              return (
                <div key={entry.id} style={{ padding: "12px 16px", borderBottom: "1px solid #f8fafc" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ fontSize: 12, color: "#64748b" }}>
                      📅 {new Date(entry.entry_date + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: "#1e40af" }}>₹{entry.total_amount}</span>
                      <div style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                        background: st.bg, color: st.color, border: `1px solid ${st.border}`,
                      }}>
                        {statusIcon(entry.delivery_status)}
                        {entry.delivery_status === "pending" ? "Pending" : "Delivered"}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                    {entry.items?.map((item, i) => (
                      <span key={i} style={{ background: "#eff6ff", color: "#1e40af", fontSize: 11, padding: "3px 10px", borderRadius: 20, fontWeight: 600 }}>
                        {item.service_name} × {item.quantity}
                      </span>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {[{ val: "pending", label: "Pending" }, { val: "delivered", label: "Delivered" }].map(({ val, label }) => {
                      const active = entry.delivery_status === val;
                      const btnSt = STATUS_STYLES[val];
                      return (
                        <button key={val} onClick={() => updateStatus(entry.id, val)} style={{
                          flex: 1, padding: "7px 4px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600,
                          border: `1px solid ${active ? btnSt.border : "#e2e8f0"}`,
                          background: active ? btnSt.bg : "#f8fafc",
                          color: active ? btnSt.color : "#94a3b8",
                        }}>{label}</button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}