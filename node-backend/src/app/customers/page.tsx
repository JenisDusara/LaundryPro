"use client";
import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Plus, Edit2, Trash2, X, Mail, Phone, Home, Building2, MapPin, User, ChevronDown, ChevronUp, FileText, Search, MessageCircle } from "lucide-react";
import api from "@/lib/api";
import ProtectedLayout from "@/components/ProtectedLayout";
import type { Customer, LaundryEntry } from "@/types";

const empty = { name: "", phone: "", flat_number: "", society_name: "", address: "", email: "" };
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const AVATAR_COLORS = ["#6366f1","#8b5cf6","#ec4899","#f59e0b","#10b981","#3b82f6","#ef4444","#14b8a6"];
const getColor = (name: string) => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
const getInitials = (name: string) => name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
const openWA = (phone: string) => {
  const a = document.createElement("a");
  a.href = `whatsapp://send?phone=91${phone.replace(/\D/g,"").slice(-10)}`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px", border: "1.5px solid #e2e8f0",
  borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box",
  background: "#f8fafc",
};

export default function Customers() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year,  setYear]  = useState(now.getFullYear());

  const [customers,    setCustomers]    = useState<Customer[]>([]);
  const [entries,      setEntries]      = useState<LaundryEntry[]>([]);
  const [search,       setSearch]       = useState("");
  const [showForm,     setShowForm]     = useState(false);
  const [form,         setForm]         = useState(empty);
  const [editId,       setEditId]       = useState<string | null>(null);
  const [loading,      setLoading]      = useState(false);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [expanded,     setExpanded]     = useState<string | null>(null);
  const [focusField,   setFocusField]   = useState("");
  const [phoneError,   setPhoneError]   = useState("");
  const [showSuggestion, setShowSuggestion] = useState<"society_name" | null>(null);

  const loadCustomers = useCallback(async () => {
    const res = await api.get("/customers");
    setCustomers(res.data);
  }, []);

  const loadEntries = useCallback(async () => {
    setEntriesLoading(true);
    try {
      const res = await api.get("/entries", { params: { month, year } });
      setEntries(res.data);
    } catch { setEntries([]); }
    finally { setEntriesLoading(false); }
  }, [month, year]);

  useEffect(() => { loadCustomers(); }, [loadCustomers]);
  useEffect(() => { loadEntries(); }, [loadEntries]);

  const prevMonth = () => { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1); };
  const isCurrentMonth = month === now.getMonth() + 1 && year === now.getFullYear();

  const save = async () => {
    if (form.phone.length !== 10) { setPhoneError("Phone number must be exactly 10 digits"); return; }
    setLoading(true);
    try {
      if (editId) await api.put(`/customers/${editId}`, form);
      else await api.post("/customers", form);
      setShowForm(false); setForm(empty); setEditId(null); loadCustomers();
    } catch (e: any) { alert(e.response?.data?.detail || "Error"); }
    finally { setLoading(false); }
  };

  const del = async (id: string) => {
    if (!confirm("Delete this customer?")) return;
    await api.delete(`/customers/${id}`);
    loadCustomers();
  };

  // Build per-customer monthly stats
  const entryMap = new Map<string, LaundryEntry[]>();
  entries.forEach(e => {
    if (!entryMap.has(e.customer_id)) entryMap.set(e.customer_id, []);
    entryMap.get(e.customer_id)!.push(e);
  });

  const monthTotal = entries.reduce((s, e) => s + Number(e.total_amount), 0);

  const filteredCustomers = customers.filter(c =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search) ||
    (c.flat_number || "").toLowerCase().includes(search.toLowerCase())
  );

  // Sort: customers with activity this month first
  const sorted = [...filteredCustomers].sort((a, b) => {
    const aHas = entryMap.has(a.id) ? 1 : 0;
    const bHas = entryMap.has(b.id) ? 1 : 0;
    return bHas - aHas;
  });

  const fields = [
    { key: "name",         label: "Full Name",     icon: <User size={15} />,     required: true },
    { key: "phone",        label: "Phone Number",  icon: <Phone size={15} />,    required: true },
    { key: "flat_number",  label: "Flat Number",   icon: <Home size={15} /> },
    { key: "society_name", label: "Society Name",  icon: <Building2 size={15} /> },
    { key: "address",      label: "Address",       icon: <MapPin size={15} /> },
    { key: "email",        label: "Email",         icon: <Mail size={15} /> },
  ];

  return (
    <ProtectedLayout>
      <style>{`.cust-row:hover { background: #f8fafc !important; } .item-chip { transition: opacity 0.15s; } .item-chip:hover { opacity: 0.8; }`}</style>

      {/* ── Month Navigation Header ── */}
      <div style={{ background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)", borderRadius: 16, padding: "18px 20px", marginBottom: 16, boxShadow: "0 4px 20px rgba(59,130,246,0.3)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h2 style={{ margin: 0, color: "#fff", fontSize: 20, fontWeight: 700 }}>Customers</h2>
          <button
            onClick={() => { setForm(empty); setEditId(null); setPhoneError(""); setShowForm(true); }}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.2)", color: "#fff", border: "1.5px solid rgba(255,255,255,0.4)", borderRadius: 10, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
          >
            <Plus size={16} /> Add Customer
          </button>
        </div>

        {/* Month switcher */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.15)", borderRadius: 12, padding: "10px 14px" }}>
          <button onClick={prevMonth} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
            <ChevronLeft size={18} />
          </button>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>{MONTHS[month - 1]} {year}</div>
            {entriesLoading
              ? <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, marginTop: 2 }}>Loading...</div>
              : <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, marginTop: 2 }}>
                  {entries.length} entries · ₹{monthTotal.toLocaleString("en-IN")} total
                </div>
            }
          </div>
          <button onClick={nextMonth} disabled={isCurrentMonth} style={{ background: isCurrentMonth ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.2)", border: "none", borderRadius: 8, width: 32, height: 32, cursor: isCurrentMonth ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: isCurrentMonth ? "rgba(255,255,255,0.3)" : "#fff" }}>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* ── Search ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "9px 14px", marginBottom: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
        <Search size={15} color="#94a3b8" />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, phone or flat..."
          style={{ flex: 1, border: "none", outline: "none", fontSize: 13, background: "transparent", color: "#1e293b" }}
        />
        {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 16, lineHeight: 1 }}>×</button>}
      </div>

      {/* ── Customer List ── */}
      {sorted.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>👥</div>
          <p style={{ color: "#94a3b8", fontSize: 15 }}>No customers found</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {sorted.map(c => {
            const color = getColor(c.name);
            const custEntries = entryMap.get(c.id) || [];
            const hasActivity = custEntries.length > 0;
            const custTotal = custEntries.reduce((s, e) => s + Number(e.total_amount), 0);
            const allItems = custEntries.flatMap(e => e.items);
            const pendingCnt = allItems.filter(i => i.item_status !== "delivered").length;
            const allDone = allItems.length > 0 && pendingCnt === 0;
            const isOpen = expanded === c.id;

            return (
              <div key={c.id} style={{ background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: `1px solid ${hasActivity ? "#e0e7ff" : "#f1f5f9"}`, opacity: hasActivity ? 1 : 0.75 }}>
                {/* Customer row */}
                <div className="cust-row" style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", cursor: hasActivity ? "pointer" : "default", transition: "background 0.15s" }}
                  onClick={() => hasActivity && setExpanded(isOpen ? null : c.id)}>
                  {/* Avatar */}
                  <div style={{ width: 42, height: 42, borderRadius: 11, background: hasActivity ? color : "#e2e8f0", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: hasActivity ? "#fff" : "#94a3b8", fontWeight: 700, fontSize: 15 }}>
                    {getInitials(c.name)}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2, display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <span>📞 {c.phone}</span>
                      {c.flat_number && <span>🏠 {c.flat_number}{c.society_name && `, ${c.society_name}`}</span>}
                    </div>
                  </div>

                  {/* Right side */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                    {hasActivity ? (
                      <div style={{ textAlign: "right", marginRight: 4 }}>
                        <div style={{ fontWeight: 800, fontSize: 16, color: "#1e40af" }}>₹{custTotal.toLocaleString("en-IN")}</div>
                        <div style={{ fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 20, background: allDone ? "#dcfce7" : "#fef3c7", color: allDone ? "#16a34a" : "#d97706", marginTop: 2 }}>
                          {allDone ? "✓ Done" : `${pendingCnt} pending`}
                        </div>
                      </div>
                    ) : (
                      <span style={{ fontSize: 11, color: "#cbd5e1", marginRight: 4 }}>No activity</span>
                    )}

                    {/* WhatsApp button */}
                    <button onClick={e => { e.stopPropagation(); openWA(c.phone); }}
                      style={{ width: 30, height: 30, borderRadius: 8, background: "#f0fdf4", border: "1px solid #86efac", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                      title="Open WhatsApp chat">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="#16a34a"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                    </button>
                    {/* Invoice button */}
                    {hasActivity && (
                      <button onClick={e => { e.stopPropagation(); window.open(`/api/invoices/${c.id}?month=${month}&year=${year}&token=${localStorage.getItem("token")}`, "_blank"); }}
                        style={{ width: 30, height: 30, borderRadius: 8, background: "#eff6ff", border: "1px solid #bfdbfe", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <FileText size={13} color="#2563eb" />
                      </button>
                    )}
                    <button onClick={e => { e.stopPropagation(); setForm({ name: c.name, phone: c.phone, flat_number: c.flat_number || "", society_name: c.society_name || "", address: c.address || "", email: c.email || "" }); setEditId(c.id); setPhoneError(""); setShowForm(true); }}
                      style={{ width: 30, height: 30, borderRadius: 8, background: "#eff6ff", border: "1px solid #bfdbfe", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Edit2 size={13} color="#2563eb" />
                    </button>
                    <button onClick={e => { e.stopPropagation(); del(c.id); }}
                      style={{ width: 30, height: 30, borderRadius: 8, background: "#fff5f5", border: "1px solid #fecaca", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Trash2 size={13} color="#dc2626" />
                    </button>
                    {hasActivity && (isOpen ? <ChevronUp size={14} color="#cbd5e1" /> : <ChevronDown size={14} color="#cbd5e1" />)}
                  </div>
                </div>

                {/* Expanded: entries for this month */}
                {isOpen && hasActivity && (
                  <div style={{ borderTop: "1px solid #f1f5f9" }}>
                    {custEntries.map(entry => {
                      const dateItems = entry.items;
                      const entryDone = dateItems.every(i => i.item_status === "delivered");
                      return (
                        <div key={entry.id} style={{ padding: "10px 14px", borderBottom: "1px solid #f8fafc" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                            <div>
                              <span style={{ fontWeight: 600, fontSize: 13, color: "#334155" }}>
                                {new Date(entry.entry_date + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                              </span>
                              {entry.notes && <span style={{ fontSize: 11, color: "#94a3b8", marginLeft: 8 }}>📝 {entry.notes}</span>}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ fontWeight: 700, fontSize: 14, color: "#1e40af" }}>₹{Number(entry.total_amount).toLocaleString("en-IN")}</span>
                              <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20, background: entryDone ? "#dcfce7" : "#fef3c7", color: entryDone ? "#16a34a" : "#d97706" }}>
                                {entryDone ? "Done" : `${dateItems.filter(i => i.item_status !== "delivered").length} left`}
                              </span>
                            </div>
                          </div>
                          {/* Items as chips */}
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                            {dateItems.map(item => {
                              const isDel = item.item_status === "delivered";
                              return (
                                <span key={item.id} className="item-chip" style={{ fontSize: 11, padding: "3px 9px", borderRadius: 20, fontWeight: 600, background: isDel ? "#dcfce7" : "#fef3c7", color: isDel ? "#16a34a" : "#d97706", border: `1px solid ${isDel ? "#bbf7d0" : "#fde68a"}` }}>
                                  {isDel ? "✓" : "⏳"} {item.service_name} ×{item.quantity}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                    {/* Monthly summary row */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#f8fafc" }}>
                      <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>{custEntries.length} {custEntries.length === 1 ? "entry" : "entries"} this month</span>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <button onClick={() => window.open(`/api/invoices/${c.id}?month=${month}&year=${year}&token=${localStorage.getItem("token")}`, "_blank")}
                          style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 12px", background: "#1e40af", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                          <FileText size={12} /> View Invoice
                        </button>
                        <span style={{ fontWeight: 800, fontSize: 16, color: "#1e40af" }}>₹{custTotal.toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Add/Edit Form Modal ── */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 16, backdropFilter: "blur(4px)" }}
          onClick={() => setShowForm(false)}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#1e293b" }}>{editId ? "Edit" : "New"} Customer</h3>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "#94a3b8" }}>{editId ? "Update customer details" : "Add a new customer"}</p>
              </div>
              <button onClick={() => setShowForm(false)} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, padding: 8, cursor: "pointer", display: "flex" }}>
                <X size={18} color="#64748b" />
              </button>
            </div>

            {(() => {
              const societySuggestions = Array.from(new Set(customers.map(c => c.society_name).filter(Boolean)));
              return (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {fields.map(f => {
                    const val = (form as any)[f.key] as string;
                    const isSuggestField = f.key === "society_name";
                    const filteredSugg = societySuggestions.filter(s => s.toLowerCase().includes(val.toLowerCase()) && s.toLowerCase() !== val.toLowerCase());
                    const showDrop = showSuggestion === f.key && filteredSugg.length > 0;
                    return (
                      <div key={f.key} style={{ position: "relative" }}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "flex", alignItems: "center", gap: 5, marginBottom: 5 }}>
                          {f.icon} {f.label} {f.required && <span style={{ color: "#ef4444" }}>*</span>}
                        </label>
                        <input
                          style={{ ...inputStyle, borderColor: f.key === "phone" && phoneError ? "#ef4444" : focusField === f.key ? "#3b82f6" : "#e2e8f0" }}
                          placeholder={f.key === "phone" ? "10-digit number" : `Enter ${f.label.toLowerCase()}`}
                          value={val}
                          inputMode={f.key === "phone" ? "numeric" : "text"}
                          maxLength={f.key === "phone" ? 10 : undefined}
                          autoComplete="off"
                          onChange={e => {
                            if (f.key === "phone") {
                              const v = e.target.value.replace(/\D/g, "").slice(0, 10);
                              setForm({ ...form, phone: v });
                              setPhoneError(v.length > 0 && v.length < 10 ? "Must be 10 digits" : "");
                            } else {
                              setForm({ ...form, [f.key]: e.target.value });
                            }
                          }}
                          onFocus={() => { setFocusField(f.key); if (isSuggestField) setShowSuggestion("society_name"); }}
                          onBlur={() => { setFocusField(""); setTimeout(() => setShowSuggestion(null), 150); }}
                        />
                        {showDrop && (
                          <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#fff", border: "1.5px solid #bfdbfe", borderRadius: 10, zIndex: 300, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", overflow: "hidden" }}>
                            {filteredSugg.map(s => (
                              <div key={s} onMouseDown={() => { setForm({ ...form, [f.key]: s }); setShowSuggestion(null); }}
                                style={{ padding: "10px 14px", fontSize: 13, cursor: "pointer", color: "#1e293b", borderBottom: "1px solid #f1f5f9" }}
                                onMouseEnter={e => e.currentTarget.style.background = "#eff6ff"}
                                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                <Building2 size={13} color="#3b82f6" style={{ marginRight: 6 }} />{s}
                              </div>
                            ))}
                          </div>
                        )}
                        {f.key === "phone" && (
                          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                            {phoneError ? <span style={{ fontSize: 11, color: "#ef4444" }}>{phoneError}</span> : <span />}
                            <span style={{ fontSize: 11, color: form.phone.length === 10 ? "#16a34a" : "#94a3b8" }}>{form.phone.length}/10</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            <button
              style={{ width: "100%", padding: "13px 0", marginTop: 20, background: !form.name || !form.phone ? "#e2e8f0" : "linear-gradient(135deg, #1e40af, #3b82f6)", color: !form.name || !form.phone ? "#94a3b8" : "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: !form.name || !form.phone ? "not-allowed" : "pointer" }}
              onClick={save} disabled={loading || !form.name || !form.phone}
            >
              {loading ? "Saving..." : editId ? "Update Customer" : "Add Customer"}
            </button>
          </div>
        </div>
      )}
    </ProtectedLayout>
  );
}
