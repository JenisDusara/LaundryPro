import { useState, useEffect } from "react";
import { Calendar, Filter, Trash2, ChevronDown, ChevronUp, Truck } from "lucide-react";
import api from "../api/client";
import type { LaundryEntry } from "../types";

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  pending: { bg: "#fef3c7", color: "#d97706" },
  in_delivery: { bg: "#dbeafe", color: "#2563eb" },
  delivered: { bg: "#dcfce7", color: "#16a34a" },
};
const STATUS_LABELS: Record<string, string> = {
  pending: "Pending", in_delivery: "In Delivery", delivered: "Delivered",
};

export default function Entries() {
  const [entries, setEntries] = useState<LaundryEntry[]>([]);
  const [filterType, setFilterType] = useState<"date" | "month">("month");
  const [dateVal, setDateVal] = useState(new Date().toISOString().slice(0, 10));
  const [monthVal, setMonthVal] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {};
      if (filterType === "date") {
        params.entry_date = dateVal;
      } else {
        const [y, m] = monthVal.split("-");
        params.year = parseInt(y);
        params.month = parseInt(m);
      }
      const res = await api.get("/entries", { params });
      setEntries(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filterType, dateVal, monthVal]);

  const del = async (id: string) => {
    if (!confirm("Delete this entry?")) return;
    await api.delete(`/entries/${id}`);
    load();
  };

  const updateStatus = async (id: string, status: string) => {
    await api.patch(`/entries/${id}/status`, null, { params: { status } });
    load();
  };

  // Group entries by customer
  const customerMap = new Map<string, { name: string; phone: string; flat: string; society: string; entries: LaundryEntry[] }>();
  entries.forEach(e => {
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
  const totalAmount = entries.reduce((s, e) => s + Number(e.total_amount), 0);

  return (
    <div>
      <h2 style={s.title}>Entries</h2>

      {/* Filters */}
      <div style={s.filterRow}>
        <div style={s.toggleGroup}>
          <div style={{ ...s.toggleBtn, ...(filterType === "date" ? s.toggleActive : {}) }} onClick={() => setFilterType("date")}>
            <Calendar size={14} /> Date
          </div>
          <div style={{ ...s.toggleBtn, ...(filterType === "month" ? s.toggleActive : {}) }} onClick={() => setFilterType("month")}>
            <Filter size={14} /> Month
          </div>
        </div>
        {filterType === "date" ? (
          <input type="date" style={s.dateInput} value={dateVal} onChange={e => setDateVal(e.target.value)} />
        ) : (
          <input type="month" style={s.dateInput} value={monthVal} onChange={e => setMonthVal(e.target.value)} />
        )}
      </div>

      {/* Summary */}
      <div style={s.summary}>
        <span>{customers.length} customers • {entries.length} entries</span>
        <span style={s.summaryTotal}>Total: ₹{totalAmount}</span>
      </div>

      {loading && <p style={{ textAlign: "center", color: "#94a3b8" }}>Loading...</p>}

      {/* Customer Cards */}
      <div style={s.list}>
        {customers.length === 0 && !loading && (
          <p style={{ textAlign: "center", color: "#94a3b8", padding: 32 }}>No entries found</p>
        )}
        {customers.map(([cid, cust]) => {
          const custOpen = expandedCustomer === cid;
          const custTotal = cust.entries.reduce((s, e) => s + Number(e.total_amount), 0);
          const allDelivered = cust.entries.every(e => e.delivery_status === "delivered");
          const anyPending = cust.entries.some(e => e.delivery_status === "pending");
          const badgeColor = allDelivered ? STATUS_COLORS.delivered : anyPending ? STATUS_COLORS.pending : STATUS_COLORS.in_delivery;
          const badgeLabel = allDelivered ? "All Delivered" : anyPending ? "Pending" : "In Delivery";

          return (
            <div key={cid} style={s.customerCard}>
              {/* Customer Header */}
              <div style={s.customerHeader} onClick={() => {
                setExpandedCustomer(custOpen ? null : cid);
                setExpandedEntry(null);
              }}>
                <div style={s.avatarBox}>
                  <div style={s.avatar}>{cust.name[0].toUpperCase()}</div>
                </div>
                <div style={s.custInfo}>
                  <div style={s.custName}>{cust.name}</div>
                  <div style={s.custMeta}>
                    {cust.flat && `🏠 ${cust.flat}`}{cust.society && ` • ${cust.society}`}
                  </div>
                  <div style={s.custMeta}>📞 {cust.phone}</div>
                </div>
                <div style={s.custRight}>
                  <div style={s.custTotal}>₹{custTotal}</div>
                  <div style={{ ...s.badge, background: badgeColor.bg, color: badgeColor.color }}>{badgeLabel}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={s.custCount}>{cust.entries.length} {cust.entries.length === 1 ? "entry" : "entries"}</div>
                    <button style={s.invoiceBtn} onClick={e => {
                      e.stopPropagation();
                      const now = new Date();
                      const y = now.getFullYear();
                      const m = now.getMonth() + 1;
                      window.open(`${api.defaults.baseURL}/invoices/${cid}?month=${m}&year=${y}&token=${localStorage.getItem("token")}`, "_blank");
                    }}>📄 Invoice</button>
                  </div>
                  {custOpen ? <ChevronUp size={18} color="#94a3b8" /> : <ChevronDown size={18} color="#94a3b8" />}
                </div>
              </div>

              {/* Entries for this customer */}
              {custOpen && (
                <div style={s.entriesList}>
                  {cust.entries.map(entry => {
                    const entOpen = expandedEntry === entry.id;
                    const st = STATUS_COLORS[entry.delivery_status] || STATUS_COLORS.pending;
                    return (
                      <div key={entry.id} style={s.entryItem}>
                        <div style={s.entryHeader} onClick={() => setExpandedEntry(entOpen ? null : entry.id)}>
                          <div>
                            <div style={s.entryDate}>
                              📅 {new Date(entry.entry_date + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                            </div>
                            <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                              {entry.items.map(i => i.service_name).join(", ")}
                            </div>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                            <div style={s.entryAmount}>₹{entry.total_amount}</div>
                            <div style={{ ...s.badge, background: st.bg, color: st.color, fontSize: 10 }}>
                              {STATUS_LABELS[entry.delivery_status]}
                            </div>
                            {entOpen ? <ChevronUp size={14} color="#94a3b8" /> : <ChevronDown size={14} color="#94a3b8" />}
                          </div>
                        </div>

                        {entOpen && (
                          <div style={s.entryDetails}>
                            <div style={s.itemsTable}>
                              {entry.items.map(item => (
                                <div key={item.id} style={s.itemRow}>
                                  <span style={{ fontWeight: 500 }}>{item.service_name}</span>
                                  <span style={{ color: "#64748b", fontSize: 12 }}>
                                    ₹{item.price_per_unit} × {item.quantity} = <strong>₹{item.subtotal}</strong>
                                  </span>
                                </div>
                              ))}
                            </div>
                            {entry.notes && <div style={s.notes}>📝 {entry.notes}</div>}
                            <div style={s.detailActions}>
                              <div style={s.statusGroup}>
                                <Truck size={14} color="#64748b" />
                                <select style={s.statusSelect} value={entry.delivery_status}
                                  onChange={e => updateStatus(entry.id, e.target.value)}>
                                  <option value="pending">Pending</option>
                                  <option value="in_delivery">In Delivery</option>
                                  <option value="delivered">Delivered</option>
                                </select>
                              </div>
                              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                <button style={s.invoiceBtn} onClick={() => {
                                  const [y, m] = filterType === "month" ? monthVal.split("-") : entry.entry_date.split("-");
                                  window.open(`${api.defaults.baseURL}/invoices/${entry.customer_id}?month=${m}&year=${y}&token=${localStorage.getItem("token")}`, "_blank");
                                }}>📄 Invoice</button>
                                <Trash2 size={16} color="#ef4444" style={{ cursor: "pointer" }} onClick={() => del(entry.id)} />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  title: { color: "#1e3a8a", margin: "0 0 16px" },
  filterRow: { display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap", alignItems: "center" },
  toggleGroup: { display: "flex", background: "#fff", borderRadius: 8, border: "1px solid #e2e8f0", overflow: "hidden" },
  toggleBtn: { display: "flex", alignItems: "center", gap: 4, padding: "8px 14px", cursor: "pointer", fontSize: 13, color: "#64748b" },
  toggleActive: { background: "#1e40af", color: "#fff" },
  dateInput: { padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, outline: "none" },
  summary: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#fff", borderRadius: 8, marginBottom: 12, fontSize: 14, color: "#475569" },
  summaryTotal: { fontWeight: 700, color: "#1e3a8a", fontSize: 16 },
  list: { display: "flex", flexDirection: "column", gap: 10 },
  customerCard: { background: "#fff", borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
  customerHeader: { display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", cursor: "pointer" },
  avatarBox: { flexShrink: 0 },
  avatar: { width: 42, height: 42, borderRadius: "50%", background: "#eff6ff", color: "#1e40af", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 18 },
  custInfo: { flex: 1, minWidth: 0 },
  custName: { fontWeight: 700, fontSize: 15, color: "#1e293b" },
  custMeta: { fontSize: 12, color: "#64748b", marginTop: 2 },
  custRight: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3, flexShrink: 0 },
  custTotal: { fontWeight: 800, fontSize: 16, color: "#1e3a8a" },
  custCount: { fontSize: 11, color: "#94a3b8" },
  badge: { padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 600 },
  entriesList: { borderTop: "1px solid #f1f5f9" },
  entryItem: { borderBottom: "1px solid #f8fafc" },
  entryHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px 10px 24px", cursor: "pointer", background: "#fafafa" },
  entryDate: { fontWeight: 600, fontSize: 13, color: "#334155" },
  entryAmount: { fontWeight: 700, fontSize: 14, color: "#1e40af" },
  entryDetails: { padding: "10px 16px 14px 24px", background: "#f8fafc" },
  itemsTable: { marginBottom: 8 },
  itemRow: { display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #f1f5f9", fontSize: 13 },
  notes: { fontSize: 12, color: "#64748b", padding: "6px 0" },
  detailActions: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  statusGroup: { display: "flex", alignItems: "center", gap: 6 },
  statusSelect: { padding: "5px 8px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12, outline: "none" },
  invoiceBtn: { padding: "5px 10px", background: "#eff6ff", color: "#1e40af", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600 },
};