import { useState, useEffect } from "react";
import { Calendar, Filter, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import api from "../api/client";
import type { LaundryEntry } from "../types";

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  pending: { bg: "#fef3c7", color: "#d97706" },
  delivered: { bg: "#dcfce7", color: "#16a34a" },
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
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
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

      <div style={s.summary}>
        <span>{customers.length} customers • {entries.length} entries</span>
        <span style={s.summaryTotal}>Total: ₹{totalAmount}</span>
      </div>

      {loading && <p style={{ textAlign: "center", color: "#94a3b8" }}>Loading...</p>}

      <div style={s.list}>
        {customers.length === 0 && !loading && (
          <p style={{ textAlign: "center", color: "#94a3b8", padding: 32 }}>No entries found</p>
        )}
        {customers.map(([cid, cust]) => {
          const custOpen = expandedCustomer === cid;
          const custTotal = cust.entries.reduce((s, e) => s + Number(e.total_amount), 0);
          const allItems = cust.entries.flatMap(e => e.items);
          const custAllDelivered = allItems.length > 0 && allItems.every(i => i.item_status === "delivered");
          const custBadge = custAllDelivered ? STATUS_COLORS.delivered : STATUS_COLORS.pending;

          const dateMap = new Map<string, LaundryEntry[]>();
          cust.entries.forEach(e => {
            if (!dateMap.has(e.entry_date)) dateMap.set(e.entry_date, []);
            dateMap.get(e.entry_date)!.push(e);
          });
          const dates = [...dateMap.entries()].sort((a, b) => b[0].localeCompare(a[0]));

          return (
            <div key={cid} style={s.customerCard}>
              {/* Customer Header */}
              <div style={s.customerHeader} onClick={() => {
                setExpandedCustomer(custOpen ? null : cid);
                setExpandedDate(null);
              }}>
                <div style={s.avatar}>{cust.name[0].toUpperCase()}</div>
                <div style={s.custInfo}>
                  <div style={s.custName}>{cust.name}</div>
                  {(cust.flat || cust.society) && (
                    <div style={s.custMeta}>🏠 {cust.flat}{cust.society && ` • ${cust.society}`}</div>
                  )}
                  <div style={s.custMeta}>📞 {cust.phone}</div>
                </div>
                <div style={s.custRight}>
                  <div style={s.custTotal}>₹{custTotal}</div>
                  <div style={{ ...s.badge, background: custBadge.bg, color: custBadge.color }}>
                    {custAllDelivered ? "All Delivered" : "Pending"}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2, flexWrap: "nowrap" }}>
                    <span style={s.custCount}>{dates.length} {dates.length === 1 ? "date" : "dates"}</span>
                    <button style={s.invoiceBtn} onClick={e => {  
                      e.stopPropagation();
                      const now = new Date();
                      window.open(`${api.defaults.baseURL}/invoices/${cid}?month=${now.getMonth() + 1}&year=${now.getFullYear()}&token=${localStorage.getItem("token")}`, "_blank");
                    }}>📄 Invoice</button>
                  </div>
                  {custOpen ? <ChevronUp size={16} color="#94a3b8" /> : <ChevronDown size={16} color="#94a3b8" />}
                </div>
              </div>

              {/* Date Groups */}
              {custOpen && (
                <div>
                  {dates.map(([dateStr, dateEntries]) => {
                    const dateKey = `${cid}-${dateStr}`;
                    const dateOpen = expandedDate === dateKey;
                    const dateTotal = dateEntries.reduce((s, e) => s + Number(e.total_amount), 0);
                    const allDateItems = dateEntries.flatMap(e => e.items);
                    const dateAllDelivered = allDateItems.length > 0 && allDateItems.every(i => i.item_status === "delivered");
                    const dateBadge = dateAllDelivered ? STATUS_COLORS.delivered : STATUS_COLORS.pending;
                    const formattedDate = new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
                    // Use first entry id for single-entry invoice; for multiple use month invoice

                    return (
                      <div key={dateStr} style={s.dateGroup}>
                        {/* Date Header */}
                        <div style={s.dateHeader} onClick={() => setExpandedDate(dateOpen ? null : dateKey)}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={s.dateLabel}>📅 {formattedDate}</div>
                            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{allDateItems.length} items</div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                            <span style={{ fontWeight: 700, fontSize: 14, color: "#1e40af" }}>₹{dateTotal}</span>
                            <div style={{ ...s.badge, background: dateBadge.bg, color: dateBadge.color, fontSize: 10 }}>
                              {dateAllDelivered ? "Delivered" : "Pending"}
                            </div>
                            <button style={s.invoiceBtn} onClick={e => {
                              e.stopPropagation();
                              const [y, m] = dateStr.split("-");
                              window.open(`${api.defaults.baseURL}/invoices/${cid}?month=${m}&year=${y}&entry_date=${dateStr}&token=${localStorage.getItem("token")}`, "_blank");
                            }}>📄</button>
                            <Trash2 size={15} color="#ef4444" style={{ cursor: "pointer", flexShrink: 0 }}
                              onClick={e => { e.stopPropagation(); dateEntries.forEach(en => del(en.id)); }} />
                            {dateOpen ? <ChevronUp size={14} color="#94a3b8" /> : <ChevronDown size={14} color="#94a3b8" />}
                          </div>
                        </div>

                        {/* Items */}
                        {dateOpen && (
                          <div style={{ padding: "8px 12px 12px 12px", background: "#f8fafc" }}>
                            {dateEntries.map(entry => (
                              <div key={entry.id}>
                                {entry.notes && (
                                  <div style={{ fontSize: 12, color: "#64748b", padding: "2px 0 6px" }}>📝 {entry.notes}</div>
                                )}
                                {entry.items.map(item => {
                                  const delivered = item.item_status === "delivered";
                                  return (
                                    <div key={item.id} style={{
                                      display: "flex", justifyContent: "space-between", alignItems: "center",
                                      padding: "8px 10px", marginBottom: 6, borderRadius: 10, gap: 8,
                                      background: delivered ? "#f0fdf4" : "#fff",
                                      border: `1px solid ${delivered ? "#bbf7d0" : "#e2e8f0"}`,
                                      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                                    }}>
                                      {/* Left: dot + name + price */}
                                      <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
                                        <div style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, background: delivered ? "#16a34a" : "#f59e0b" }} />
                                        <div style={{ minWidth: 0 }}>
                                          <div style={{ fontWeight: 600, fontSize: 13, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {item.service_name}
                                          </div>
                                          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>
                                            ₹{item.price_per_unit} × {item.quantity}
                                          </div>
                                        </div>
                                      </div>
                                      {/* Right: amount + status */}
                                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                                        <span style={{ fontWeight: 700, fontSize: 13, color: "#1e40af" }}>₹{item.subtotal}</span>
                                        <select
                                          style={{
                                            padding: "3px 6px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                                            outline: "none", cursor: "pointer",
                                            border: `1px solid ${delivered ? "#bbf7d0" : "#fde68a"}`,
                                            background: delivered ? "#dcfce7" : "#fef3c7",
                                            color: delivered ? "#16a34a" : "#d97706",
                                          }}
                                          value={item.item_status || "pending"}
                                          onChange={async e => {
                                            await api.patch(`/entries/${entry.id}/items/${item.id}/status`, null, { params: { status: e.target.value } });
                                            load();
                                          }}>
                                          <option value="pending">Pending</option>
                                          <option value="delivered">Delivered</option>
                                        </select>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ))}
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
  title: { color: "#1e3a8a", margin: "0 0 16px", fontSize: 22, fontWeight: 800 },
  filterRow: { display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap", alignItems: "center" },
  toggleGroup: { display: "flex", background: "#fff", borderRadius: 8, border: "1px solid #e2e8f0", overflow: "hidden" },
  toggleBtn: { display: "flex", alignItems: "center", gap: 4, padding: "8px 14px", cursor: "pointer", fontSize: 13, color: "#64748b" },
  toggleActive: { background: "#1e40af", color: "#fff" },
  dateInput: { padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, outline: "none" },
  summary: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#fff", borderRadius: 10, marginBottom: 12, fontSize: 14, color: "#475569", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" },
  summaryTotal: { fontWeight: 700, color: "#1e3a8a", fontSize: 16 },
  list: { display: "flex", flexDirection: "column", gap: 12 },
  customerCard: { background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.07)" },
  customerHeader: { display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", cursor: "pointer", borderBottom: "1px solid #f1f5f9" },
  avatar: { width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg,#1e40af,#3b82f6)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 18, flexShrink: 0 },
  custInfo: { flex: 1, minWidth: 0 },
  custName: { fontWeight: 700, fontSize: 15, color: "#1e293b" },
  custMeta: { fontSize: 12, color: "#64748b", marginTop: 2 },
  custRight: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0, minWidth: 100 },
  custTotal: { fontWeight: 800, fontSize: 17, color: "#1e3a8a" },
  custCount: { fontSize: 11, color: "#94a3b8" },
  badge: { padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 700 },
  dateGroup: { borderTop: "1px solid #f1f5f9" },
  dateHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", cursor: "pointer", background: "#fafafa" },
  dateLabel: { fontWeight: 600, fontSize: 13, color: "#334155" },
  invoiceBtn: { padding: "4px 8px", background: "#eff6ff", color: "#1e40af", border: "1px solid #bfdbfe", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600 },
};