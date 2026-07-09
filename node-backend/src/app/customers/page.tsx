"use client";
import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Plus, Edit2, Trash2, X, Mail, Phone, Home, Building2, MapPin, User, ChevronDown, ChevronUp, FileText, Search, MessageCircle, IndianRupee, Wallet, Banknote, CreditCard, Smartphone } from "lucide-react";
import api from "@/lib/api";
import { openAuthedFile } from "@/lib/download";
import { openWhatsApp, paymentReminderMsg } from "@/lib/whatsapp";
import ProtectedLayout from "@/components/ProtectedLayout";
import { todayIST } from "@/lib/dates";
import type { Customer, LaundryEntry, CustomerBalance } from "@/types";

const PAY_METHODS = [
  { key: "cash", label: "Cash",  icon: Banknote },
  { key: "upi",  label: "UPI",   icon: Smartphone },
  { key: "card", label: "Card",  icon: CreditCard },
] as const;

const empty = { name: "", phone: "", flat_number: "", society_name: "", address: "", email: "" };
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const AVATAR_COLORS = ["#6366f1","#8b5cf6","#ec4899","#f59e0b","#10b981","#3b82f6","#ef4444","#14b8a6"];
const getColor = (name: string) => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
const getInitials = (name: string) => name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px", border: "1.5px solid var(--border)",
  borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box",
  background: "var(--bg-input)", color: "var(--text-primary)",
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

  // Payments / balance (udhaar) tracking
  const [balances,   setBalances]   = useState<Record<string, CustomerBalance>>({});
  const [payFor,     setPayFor]     = useState<Customer | null>(null);
  const [payForm,    setPayForm]    = useState({ amount: "", method: "cash" as string, date: "", note: "" });
  const [paySaving,  setPaySaving]  = useState(false);
  const [shopInfo,   setShopInfo]   = useState<{ shop_name: string; upi_id: string }>({ shop_name: "", upi_id: "" });

  const loadCustomers = useCallback(async () => {
    const res = await api.get("/customers");
    setCustomers(res.data);
  }, []);

  const loadBalances = useCallback(async () => {
    try {
      const res = await api.get("/customers/balances");
      const map: Record<string, CustomerBalance> = {};
      for (const b of res.data as CustomerBalance[]) map[b.customer_id] = b;
      setBalances(map);
    } catch { /* balances are best-effort; page still works without them */ }
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
  useEffect(() => { loadBalances(); }, [loadBalances]);

  // Shop name + UPI for personalising WhatsApp payment reminders (best-effort)
  useEffect(() => {
    api.get("/admin/settings")
      .then(r => setShopInfo({ shop_name: r.data.shop_name || "", upi_id: r.data.upi_id || "" }))
      .catch(() => {});
  }, []);

  const waCustomer = (c: Customer) => {
    const owed = balances[c.id]?.outstanding ?? 0;
    if (owed > 0.5) {
      openWhatsApp(c.phone, paymentReminderMsg({ customer: c.name, amount: owed, shop: shopInfo.shop_name || "our laundry", upi: shopInfo.upi_id || undefined }));
    } else {
      openWhatsApp(c.phone);
    }
  };

  const openPay = (c: Customer) => {
    setPayFor(c);
    setPayForm({ amount: "", method: "cash", date: todayIST(), note: "" });
  };

  const savePayment = async () => {
    if (!payFor) return;
    const amt = Number(payForm.amount);
    if (!amt || amt <= 0) return;
    setPaySaving(true);
    try {
      await api.post("/payments", { customer_id: payFor.id, amount: amt, method: payForm.method, date: payForm.date, note: payForm.note });
      setPayFor(null);
      loadBalances();
    } catch (e: any) { alert(e.response?.data?.detail || "Payment failed"); }
    finally { setPaySaving(false); }
  };

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
      <style>{`.cust-row:hover { background: var(--bg-elevated) !important; } .item-chip { transition: opacity 0.15s; } .item-chip:hover { opacity: 0.8; }`}</style>

      {/* ── Header ── */}
      <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", gap:16, marginBottom:20 }}>
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:"var(--text-secondary)", textTransform:"uppercase", letterSpacing:"0.12em" }}>Directory</div>
          <h2 style={{ margin:"4px 0 0", fontSize:26, fontWeight:800, color:"var(--text-primary)", letterSpacing:"-.01em" }}>Customers</h2>
          <div style={{ fontSize:13, color:"var(--text-secondary)", marginTop:4 }}>
            {customers.length} total · {MONTHS[month-1]} {year}
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {/* Month nav — subtle */}
          <div style={{ display:"flex", alignItems:"center", gap:2, background:"var(--bg-input)", border:"1px solid var(--border-hard)", borderRadius:10, padding:"3px" }}>
            <button onClick={prevMonth} style={{ background:"none", border:"none", borderRadius:7, width:30, height:30, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--text-primary)" }}>
              <ChevronLeft size={15}/>
            </button>
            <span style={{ fontSize:12, fontWeight:600, color:"var(--text-secondary)", padding:"0 8px", whiteSpace:"nowrap" }}>
              {MONTHS[month-1].slice(0,3)} {year}
            </span>
            <button onClick={nextMonth} disabled={isCurrentMonth} style={{ background:"none", border:"none", borderRadius:7, width:30, height:30, cursor:isCurrentMonth?"default":"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:isCurrentMonth?"var(--text-muted)":"var(--text-primary)", opacity:isCurrentMonth?0.4:1 }}>
              <ChevronRight size={15}/>
            </button>
          </div>
          <button onClick={() => { setForm(empty); setEditId(null); setPhoneError(""); setShowForm(true); }}
            style={{ display:"flex", alignItems:"center", gap:6, background:"var(--accent-primary)", color:"#0b1830", border:"none", borderRadius:10, padding:"10px 18px", fontSize:13, fontWeight:700, cursor:"pointer", boxShadow:"var(--shadow-glow-blue)" }}>
            <Plus size={15}/> Add customer
          </button>
        </div>
      </div>

      {/* ── Search ── */}
      <div style={{ display:"flex", alignItems:"center", gap:8, background:"var(--bg-input)", border:"1.5px solid var(--border)", borderRadius:10, padding:"9px 14px", marginBottom:14 }}>
        <Search size={15} color="var(--text-muted)"/>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, phone or flat..."
          style={{ flex:1, border:"none", outline:"none", fontSize:13, background:"transparent", color:"var(--text-primary)" }}/>
        {search && <button onClick={() => setSearch("")} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text-muted)", fontSize:16, lineHeight:1 }}>×</button>}
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
            const bal = balances[c.id];
            const due = bal ? bal.outstanding : 0;

            return (
              <div key={c.id} style={{ background: "var(--bg-card-solid)", borderRadius: 14, overflow: "hidden", boxShadow: "var(--shadow-web-lift)", border: `1px solid ${hasActivity ? "var(--border)" : "var(--border-hard)"}`, opacity: hasActivity ? 1 : 0.75 }}>
                {/* Customer row */}
                <div className="cust-row" style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", cursor: hasActivity ? "pointer" : "default", transition: "background 0.15s" }}
                  onClick={() => hasActivity && setExpanded(isOpen ? null : c.id)}>
                  {/* Avatar */}
                  <div style={{ width: 42, height: 42, borderRadius: 11, background: hasActivity ? color : "#e2e8f0", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: hasActivity ? "#fff" : "#94a3b8", fontWeight: 700, fontSize: 15 }}>
                    {getInitials(c.name)}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</div>
                      {/* Running balance (udhaar / advance) — auto-nets payments against all bills */}
                      {bal && (bal.billed > 0 || bal.paid > 0) && (
                        due > 0.5 ? (
                          <span title={`Billed ₹${bal.billed.toLocaleString("en-IN")} · Paid ₹${bal.paid.toLocaleString("en-IN")}`}
                            style={{ fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "var(--grade-f-bg)", color: "var(--grade-f-text)", border: "1px solid var(--grade-f-border)", whiteSpace: "nowrap" }}>
                            ₹{due.toLocaleString("en-IN")} due
                          </span>
                        ) : due < -0.5 ? (
                          <span title={`Billed ₹${bal.billed.toLocaleString("en-IN")} · Paid ₹${bal.paid.toLocaleString("en-IN")} — advance adjusts against next bills`}
                            style={{ fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "var(--grade-b-bg)", color: "var(--grade-b-text)", border: "1px solid var(--grade-b-border)", whiteSpace: "nowrap" }}>
                            ₹{Math.abs(due).toLocaleString("en-IN")} advance
                          </span>
                        ) : (
                          <span style={{ fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "var(--grade-a-bg)", color: "var(--grade-a-text)", border: "1px solid var(--grade-a-border)", whiteSpace: "nowrap" }}>
                            ✓ Settled
                          </span>
                        )
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2, display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <span>📞 {c.phone}</span>
                      {c.flat_number && <span>🏠 {c.flat_number}{c.society_name && `, ${c.society_name}`}</span>}
                    </div>
                  </div>

                  {/* Right side */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                    {hasActivity ? (
                      <div style={{ textAlign: "right", marginRight: 4 }}>
                        <div style={{ fontWeight: 800, fontSize: 16, color: "var(--accent-primary)" }}>₹{custTotal.toLocaleString("en-IN")}</div>
                        <div style={{ fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 20, background: allDone ? "var(--grade-a-bg)" : "var(--grade-c-bg)", color: allDone ? "var(--grade-a-text)" : "var(--grade-c-text)", border: `1px solid ${allDone ? "var(--grade-a-border)" : "var(--grade-c-border)"}`, marginTop: 2 }}>
                          {allDone ? "✓ Done" : `${pendingCnt} pending`}
                        </div>
                      </div>
                    ) : (
                      <span style={{ fontSize: 11, color: "var(--text-muted)", marginRight: 4 }}>No activity</span>
                    )}

                    {/* Record payment button */}
                    <button onClick={e => { e.stopPropagation(); openPay(c); }}
                      style={{ width: 30, height: 30, borderRadius: 8, background: "var(--grade-c-bg)", border: "1px solid var(--grade-c-border)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                      title="Record payment">
                      <IndianRupee size={13} color="var(--grade-c-text)" />
                    </button>

                    {/* WhatsApp button — sends a payment reminder if money is due */}
                    <button onClick={e => { e.stopPropagation(); waCustomer(c); }}
                      style={{ width: 30, height: 30, borderRadius: 8, background: "var(--grade-a-bg)", border: "1px solid var(--grade-a-border)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                      title={due > 0.5 ? "Send payment reminder on WhatsApp" : "Open WhatsApp chat"}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--grade-a-text)"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                    </button>
                    {/* Invoice button */}
                    {hasActivity && (
                      <button onClick={e => { e.stopPropagation(); openAuthedFile(`/invoices/${c.id}`, { month, year }).catch(() => alert("Failed to open invoice")); }}
                        style={{ width: 30, height: 30, borderRadius: 8, background: "var(--grade-b-bg)", border: "1px solid var(--grade-b-border)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <FileText size={13} color="var(--grade-b-text)" />
                      </button>
                    )}
                    <button onClick={e => { e.stopPropagation(); setForm({ name: c.name, phone: c.phone, flat_number: c.flat_number || "", society_name: c.society_name || "", address: c.address || "", email: c.email || "" }); setEditId(c.id); setPhoneError(""); setShowForm(true); }}
                      style={{ width: 30, height: 30, borderRadius: 8, background: "var(--grade-b-bg)", border: "1px solid var(--grade-b-border)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Edit2 size={13} color="var(--grade-b-text)" />
                    </button>
                    <button onClick={e => { e.stopPropagation(); del(c.id); }}
                      style={{ width: 30, height: 30, borderRadius: 8, background: "var(--grade-f-bg)", border: "1px solid var(--grade-f-border)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Trash2 size={13} color="var(--grade-f-text)" />
                    </button>
                    {hasActivity && (isOpen ? <ChevronUp size={14} color="var(--text-muted)" /> : <ChevronDown size={14} color="var(--text-muted)" />)}
                  </div>
                </div>

                {/* Expanded: entries for this month */}
                {isOpen && hasActivity && (
                  <div style={{ borderTop: "1px solid var(--border-hard)" }}>
                    {custEntries.map(entry => {
                      const dateItems = entry.items;
                      const entryDone = dateItems.every(i => i.item_status === "delivered");
                      return (
                        <div key={entry.id} style={{ padding: "10px 14px", borderBottom: "1px solid var(--border-hard)" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                            <div>
                              <span style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>
                                {new Date(entry.entry_date + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                              </span>
                              {entry.notes && <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 8 }}>📝 {entry.notes}</span>}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ fontWeight: 700, fontSize: 14, color: "var(--accent-primary)" }}>₹{Number(entry.total_amount).toLocaleString("en-IN")}</span>
                              <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20, background: entryDone ? "var(--grade-a-bg)" : "var(--grade-c-bg)", color: entryDone ? "var(--grade-a-text)" : "var(--grade-c-text)", border: `1px solid ${entryDone ? "var(--grade-a-border)" : "var(--grade-c-border)"}` }}>
                                {entryDone ? "Done" : `${dateItems.filter(i => i.item_status !== "delivered").length} left`}
                              </span>
                            </div>
                          </div>
                          {/* Items as chips */}
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                            {dateItems.map(item => {
                              const isDel = item.item_status === "delivered";
                              return (
                                <span key={item.id} className="item-chip" style={{ fontSize: 11, padding: "3px 9px", borderRadius: 20, fontWeight: 600, background: isDel ? "var(--grade-a-bg)" : "var(--grade-c-bg)", color: isDel ? "var(--grade-a-text)" : "var(--grade-c-text)", border: `1px solid ${isDel ? "var(--grade-a-border)" : "var(--grade-c-border)"}` }}>
                                  {isDel ? "✓" : "⏳"} {item.service_name} ×{item.quantity}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                    {/* Monthly summary row */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "var(--web-bg-band)", borderTop: "1px solid var(--border-hard)" }}>
                      <span style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 600 }}>{custEntries.length} {custEntries.length === 1 ? "entry" : "entries"} this month</span>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <button onClick={() => openAuthedFile(`/invoices/${c.id}`, { month, year }).catch(() => alert("Failed to open invoice"))}
                          style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 12px", background: "var(--accent-primary)", color: "#0b1830", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                          <FileText size={12} /> View Invoice
                        </button>
                        <span style={{ fontWeight: 800, fontSize: 16, color: "var(--accent-primary)" }}>₹{custTotal.toLocaleString("en-IN")}</span>
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
              const renderField = (f: typeof fields[number]) => {
                const val            = (form as any)[f.key] as string;
                const isSuggestField = f.key === "society_name";
                const filteredSugg   = societySuggestions.filter(s => s.toLowerCase().includes(val.toLowerCase()) && s.toLowerCase() !== val.toLowerCase());
                const showDrop       = showSuggestion === f.key && filteredSugg.length > 0;
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
              };

              const isFormValid = !!form.name && !!form.phone;

              return (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {/* Name + Phone in 2-column grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {fields.filter(f => f.key === "name" || f.key === "phone").map(renderField)}
                  </div>
                  {/* Remaining fields stacked */}
                  {fields.filter(f => f.key !== "name" && f.key !== "phone").map(renderField)}
                </div>
              );
            })()}

            {/* Action buttons — right-aligned row */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
              <button
                onClick={() => setShowForm(false)}
                style={{ padding: "10px 22px", background: "#f1f5f9", color: "#64748b", border: "1.5px solid #e2e8f0", borderRadius: 9, fontSize: 14, fontWeight: 600, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={loading || !form.name || !form.phone}
                style={{
                  padding: "10px 28px", borderRadius: 9, fontSize: 14, fontWeight: 700,
                  cursor: !form.name || !form.phone ? "not-allowed" : "pointer",
                  transition: "all 0.15s",
                  ...(!form.name || !form.phone
                    ? { background: "var(--bg-input)", color: "var(--text-secondary)", border: "1.5px solid var(--border)", opacity: 0.55 }
                    : { background: "var(--accent-primary)", color: "#0b1830", border: "none", boxShadow: "var(--shadow-glow-blue)" }
                  ),
                }}
              >
                {loading ? "Saving..." : editId ? "Update Customer" : "Add Customer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Record Payment Modal ── */}
      {payFor && (() => {
        const b = balances[payFor.id];
        const curDue = b ? b.outstanding : 0;
        const amt = Number(payForm.amount) || 0;
        const newDue = curDue - amt;
        return (
          <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 16, backdropFilter: "blur(4px)" }}
            onClick={() => setPayFor(null)}>
            <div style={{ background: "var(--bg-card)", borderRadius: 16, padding: 24, width: "100%", maxWidth: 400, boxShadow: "0 20px 60px rgba(0,0,0,0.28)", border: "1px solid var(--border-hard)" }}
              onClick={e => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "var(--text-primary)" }}>Record Payment</h3>
                  <p style={{ margin: "3px 0 0", fontSize: 13, color: "var(--text-muted)" }}>{payFor.name} · 📞 {payFor.phone}</p>
                </div>
                <button onClick={() => setPayFor(null)} style={{ background: "var(--bg-input)", border: "none", borderRadius: 8, padding: 8, cursor: "pointer", display: "flex" }}>
                  <X size={18} color="var(--text-secondary)" />
                </button>
              </div>

              {/* Current balance */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderRadius: 10, marginBottom: 16, background: "var(--bg-elevated)", border: "1px solid var(--border-hard)" }}>
                <span style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 600 }}>Current balance</span>
                <span style={{ fontSize: 15, fontWeight: 800, color: curDue > 0.5 ? "var(--grade-f-text)" : curDue < -0.5 ? "var(--grade-b-text)" : "var(--grade-a-text)" }}>
                  {curDue > 0.5 ? `₹${curDue.toLocaleString("en-IN")} due` : curDue < -0.5 ? `₹${Math.abs(curDue).toLocaleString("en-IN")} advance` : "Settled"}
                </span>
              </div>

              {/* Amount */}
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Amount (₹) *</label>
              <input autoFocus type="number" inputMode="numeric" placeholder="0" value={payForm.amount}
                onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))}
                style={{ width: "100%", padding: "11px 14px", border: "1.5px solid var(--border-hard)", borderRadius: 10, fontSize: 18, fontWeight: 700, outline: "none", boxSizing: "border-box", background: "var(--bg-input)", color: "var(--text-primary)", marginBottom: 14 }} />

              {/* Method */}
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Payment method</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
                {PAY_METHODS.map(m => {
                  const active = payForm.method === m.key;
                  const Icon = m.icon;
                  return (
                    <button key={m.key} onClick={() => setPayForm(f => ({ ...f, method: m.key }))}
                      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, padding: "11px 4px", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 12.5,
                        border: `1.5px solid ${active ? "var(--accent-primary)" : "var(--border-hard)"}`,
                        background: active ? "var(--grade-b-bg)" : "var(--bg-input)",
                        color: active ? "var(--grade-b-text)" : "var(--text-secondary)" }}>
                      <Icon size={17} /> {m.label}
                    </button>
                  );
                })}
              </div>

              {/* Date + note */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Date</label>
                  <input type="date" value={payForm.date} onChange={e => setPayForm(f => ({ ...f, date: e.target.value }))}
                    style={{ width: "100%", padding: "10px 12px", border: "1.5px solid var(--border-hard)", borderRadius: 10, fontSize: 13, outline: "none", boxSizing: "border-box", background: "var(--bg-input)", color: "var(--text-primary)" }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Note</label>
                  <input type="text" placeholder="Optional" value={payForm.note} onChange={e => setPayForm(f => ({ ...f, note: e.target.value }))}
                    style={{ width: "100%", padding: "10px 12px", border: "1.5px solid var(--border-hard)", borderRadius: 10, fontSize: 13, outline: "none", boxSizing: "border-box", background: "var(--bg-input)", color: "var(--text-primary)" }} />
                </div>
              </div>

              {/* Live preview of resulting balance */}
              {amt > 0 && (
                <div style={{ padding: "9px 13px", borderRadius: 9, marginBottom: 16, fontSize: 13, fontWeight: 600, textAlign: "center",
                  background: newDue > 0.5 ? "var(--grade-c-bg)" : "var(--grade-a-bg)",
                  color: newDue > 0.5 ? "var(--grade-c-text)" : "var(--grade-a-text)",
                  border: `1px solid ${newDue > 0.5 ? "var(--grade-c-border)" : "var(--grade-a-border)"}` }}>
                  {newDue > 0.5 ? `After payment: ₹${newDue.toLocaleString("en-IN")} still due`
                    : newDue < -0.5 ? `After payment: ₹${Math.abs(newDue).toLocaleString("en-IN")} advance (adjusts against next bills)`
                    : "After payment: fully settled ✓"}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button onClick={() => setPayFor(null)}
                  style={{ padding: "10px 22px", background: "var(--bg-input)", color: "var(--text-secondary)", border: "1.5px solid var(--border-hard)", borderRadius: 9, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                  Cancel
                </button>
                <button onClick={savePayment} disabled={paySaving || amt <= 0}
                  style={{ padding: "10px 28px", borderRadius: 9, fontSize: 14, fontWeight: 700, border: "none",
                    cursor: amt <= 0 || paySaving ? "not-allowed" : "pointer",
                    background: amt <= 0 ? "var(--bg-input)" : "var(--accent-primary)",
                    color: amt <= 0 ? "var(--text-secondary)" : "#0b1830",
                    opacity: amt <= 0 ? 0.55 : 1 }}>
                  {paySaving ? "Saving…" : "Record Payment"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </ProtectedLayout>
  );
}
