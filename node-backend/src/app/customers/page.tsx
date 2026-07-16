"use client";
import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Plus, Edit2, Trash2, X, Mail, Phone, Home, Building2, MapPin, User, ChevronDown, ChevronUp, FileText, Search, MessageCircle, IndianRupee, Wallet, Banknote, CreditCard, Smartphone, MoreVertical, Send } from "lucide-react";
import api from "@/lib/api";
import { openWhatsApp, paymentReminderMsg } from "@/lib/whatsapp";
import ProtectedLayout from "@/components/ProtectedLayout";
import EmptyState from "@/components/EmptyState";
import { FilterPanel } from "@/components/Filters";
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
  const [fName,        setFName]        = useState("");
  const [fPhone,       setFPhone]       = useState("");
  const [societyFilter, setSocietyFilter] = useState("all");
  const [balanceFilter, setBalanceFilter] = useState("all");
  const applyFilters = (v: Record<string,string>) => {
    setFName(v.name || ""); setFPhone(v.phone || "");
    setSocietyFilter(v.society || "all"); setBalanceFilter(v.balance || "all");
  };
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
  // Mobile 3-dot action menu: which customer's menu is open + where to anchor it (fixed).
  const [menu,       setMenu]       = useState<{ c: Customer; top: number; right: number } | null>(null);
  // Invoice preview: rendered inline in an iframe (srcDoc) so it opens reliably on phones —
  // the old "open blob in a new tab" approach was blocked by mobile popup blockers.
  const [invoice,    setInvoice]    = useState<{ html: string; name: string } | null>(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  // Customer statement: full bill + payment ledger with a running balance.
  type StmtRow = { date: string; type: "bill" | "payment"; label: string; amount: number; balance: number };
  const [statement, setStatement] = useState<{ c: Customer; rows: StmtRow[]; billed: number; paid: number; outstanding: number } | null>(null);
  const [statementLoading, setStatementLoading] = useState(false);

  // Bulk monthly billing — send every customer with activity this month their invoice at once.
  const [showBulk,     setShowBulk]     = useState(false);
  const [bulkChannel,  setBulkChannel]  = useState<"both" | "whatsapp" | "email">("both");
  const [bulkSending,  setBulkSending]  = useState(false);
  const [bulkResult,   setBulkResult]   = useState<{ customers: number; waSent: number; emailSent: number; skipped: number; failed: number; monthName: string } | null>(null);

  const bulkSend = async () => {
    setBulkSending(true); setBulkResult(null);
    try {
      const res = await api.post("/invoices/bulk-send", null, { params: { month, year, channel: bulkChannel } });
      setBulkResult(res.data);
    } catch (e: any) {
      alert(e.response?.data?.detail || "Bulk send failed");
    } finally { setBulkSending(false); }
  };

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

  // The ⋮ action menu is fixed-positioned at the button's spot; once the page scrolls that
  // spot is wrong, so close it on any scroll/resize (also fixes "menu won't dismiss on scroll").
  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => { window.removeEventListener("scroll", close, true); window.removeEventListener("resize", close); };
  }, [menu]);

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

  // Fetch the invoice HTML and show it in an in-app iframe modal (works on mobile, unlike
  // opening a blob URL in a new tab).
  const openInvoice = async (c: Customer) => {
    setInvoiceLoading(true);
    try {
      const res = await api.get(`/invoices/${c.id}`, { params: { month, year }, responseType: "text" });
      const html = typeof res.data === "string" ? res.data : String(res.data ?? "");
      setInvoice({ html, name: `${c.name} — ${MONTHS[month - 1]} ${year}` });
    } catch {
      alert("Failed to open invoice");
    } finally {
      setInvoiceLoading(false);
    }
  };

  // Build a full ledger (all bills + all payments, chronological, with running balance).
  const openStatement = async (c: Customer) => {
    setStatementLoading(true);
    try {
      const [entRes, payRes] = await Promise.all([
        api.get("/entries", { params: { customer_id: c.id } }),
        api.get("/payments", { params: { customer_id: c.id } }),
      ]);
      const bills = (entRes.data || []).map((e: any) => ({
        date: e.entry_date, ts: e.created_at || e.entry_date, type: "bill" as const,
        label: (e.items || []).map((i: any) => `${i.service_name}×${i.quantity}`).join(", ") || "Laundry",
        amount: Number(e.total_amount),
      }));
      const pays = ((payRes.data && payRes.data.payments) || []).map((p: any) => ({
        date: p.date, ts: p.created_at || p.date, type: "payment" as const,
        label: `Payment · ${p.method}${p.note ? " · " + p.note : ""}`,
        amount: -Number(p.amount),
      }));
      const all = [...bills, ...pays].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : (a.ts < b.ts ? -1 : 1)));
      const r2 = (n: number) => Math.round(n * 100) / 100;
      let bal = 0;
      const rows: StmtRow[] = all.map(r => { bal += r.amount; return { date: r.date, type: r.type, label: r.label, amount: r2(r.amount), balance: r2(bal) }; });
      const billed = r2(bills.reduce((s: number, r: { amount: number }) => s + r.amount, 0));
      const paid = r2(-pays.reduce((s: number, r: { amount: number }) => s + r.amount, 0));
      setStatement({ c, rows, billed, paid, outstanding: r2(billed - paid) });
    } catch {
      alert("Failed to load statement");
    } finally {
      setStatementLoading(false);
    }
  };

  const sendStatementWA = () => {
    if (!statement) return;
    const { c, billed, paid, outstanding } = statement;
    const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
    const lines = [
      `*${shopInfo.shop_name || "Laundry"}* — Statement`,
      `Customer: ${c.name}`,
      ``,
      `Total billed: ${inr(billed)}`,
      `Total paid: ${inr(paid)}`,
      outstanding > 0.5 ? `*Balance due: ${inr(outstanding)}*`
        : outstanding < -0.5 ? `Advance: ${inr(Math.abs(outstanding))}`
        : `Fully settled ✓`,
    ];
    if (shopInfo.upi_id && outstanding > 0.5) lines.push(``, `Pay via UPI: ${shopInfo.upi_id}`);
    openWhatsApp(c.phone, lines.join("\n"));
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

  const societyOptions = Array.from(new Set(customers.map(c => c.society_name).filter(Boolean))).sort();
  const filteredCustomers = customers.filter(c => {
    if (fName  && !c.name.toLowerCase().includes(fName.toLowerCase())) return false;
    if (fPhone && !c.phone.includes(fPhone)) return false;
    if (societyFilter !== "all" && c.society_name !== societyFilter) return false;
    if (balanceFilter === "udhaar" && !((balances[c.id]?.outstanding ?? 0) > 0)) return false;
    return true;
  });

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
      <style>{`.cust-row:hover { background: var(--bg-elevated) !important; } .item-chip { transition: opacity 0.15s; } .item-chip:hover { opacity: 0.8; }
        @media (max-width: 768px) {
          /* Phone: replace the row of action buttons with a single ⋮ menu. The right side is
             now tiny (amount + ⋮), so the info no longer gets squeezed to zero / overlaps. */
          .cust-btns { display: none !important; }
          .cust-kebab { display: flex !important; }
        }`}</style>

      {/* ── Header ── */}
      <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", flexWrap:"wrap", gap:16, marginBottom:20 }}>
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
          <button onClick={() => { setBulkResult(null); setBulkChannel("both"); setShowBulk(true); }}
            title="Send this month's invoice to all active customers"
            style={{ display:"flex", alignItems:"center", gap:6, background:"var(--grade-a-bg)", color:"var(--grade-a-text)", border:"1px solid var(--grade-a-border)", borderRadius:10, padding:"10px 16px", fontSize:13, fontWeight:700, cursor:"pointer" }}>
            <Send size={14}/> Send bills
          </button>
          <button onClick={() => { setForm(empty); setEditId(null); setPhoneError(""); setShowForm(true); }}
            style={{ display:"flex", alignItems:"center", gap:6, background:"var(--accent-primary)", color:"#0b1830", border:"none", borderRadius:10, padding:"10px 18px", fontSize:13, fontWeight:700, cursor:"pointer", boxShadow:"var(--shadow-glow-blue)" }}>
            <Plus size={15}/> Add customer
          </button>
        </div>
      </div>

      {/* ── Filters (MyUniclean-style) ── */}
      <FilterPanel
        initial={{ society: societyFilter, balance: balanceFilter, name: fName, phone: fPhone }}
        onApply={applyFilters}
        selects={[
          { key:"society", label:"Society", options:[{value:"all",label:"All societies"}, ...societyOptions.map(s=>({value:s,label:s}))] },
          { key:"balance", label:"Balance", options:[{value:"all",label:"All"},{value:"udhaar",label:"Udhaar wale (due)"}] },
        ]}
        texts={[
          { key:"name",  label:"Search by name",  placeholder:"Customer name" },
          { key:"phone", label:"Search by phone", placeholder:"Phone number" },
        ]}
      />

      {/* ── Customer List ── */}
      {sorted.length === 0 ? (
        <EmptyState title="No customers found" subtitle="Add your first customer to start billing." />
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
                <div className="cust-row" style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 12, padding: "12px 14px", cursor: "pointer", transition: "background 0.15s" }}
                  onClick={() => setExpanded(isOpen ? null : c.id)}>
                  {/* Avatar */}
                  <div style={{ width: 42, height: 42, borderRadius: 11, background: hasActivity ? color : "#e2e8f0", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: hasActivity ? "#fff" : "#94a3b8", fontWeight: 700, fontSize: 15 }}>
                    {getInitials(c.name)}
                  </div>

                  {/* Info */}
                  <div className="cust-info" style={{ flex: 1, minWidth: 0 }}>
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
                    {/* Phone & address are hidden here and revealed in the expanded view on tap. */}
                  </div>

                  {/* Right side */}
                  <div className="cust-right" style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
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

                    {/* Desktop: all actions inline. Hidden on phone — replaced by the ⋮ menu. */}
                    <div className="cust-btns" style={{ display: "flex", alignItems: "center", gap: 6 }}>
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
                      <button onClick={e => { e.stopPropagation(); openInvoice(c); }}
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
                    </div>

                    {/* Phone: single 3-dot menu instead of the row of buttons above. */}
                    <button className="cust-kebab" onClick={e => { e.stopPropagation(); const r = e.currentTarget.getBoundingClientRect(); setMenu(menu?.c.id === c.id ? null : { c, top: r.bottom + 6, right: Math.max(8, window.innerWidth - r.right) }); }}
                      style={{ display: "none", width: 32, height: 32, borderRadius: 8, background: "var(--bg-input)", border: "1px solid var(--border-hard)", cursor: "pointer", alignItems: "center", justifyContent: "center" }}
                      title="Actions">
                      <MoreVertical size={16} color="var(--text-secondary)" />
                    </button>
                    {isOpen ? <ChevronUp size={14} color="var(--text-muted)" /> : <ChevronDown size={14} color="var(--text-muted)" />}
                  </div>
                </div>

                {/* Expanded: contact details (revealed on tap) + this month's entries */}
                {isOpen && (
                  <div style={{ borderTop: "1px solid var(--border-hard)" }}>
                    <div style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: 4, fontSize: 12.5, color: "var(--text-secondary)", borderBottom: hasActivity ? "1px solid var(--border-hard)" : "none" }}>
                      <span>📞 {c.phone}</span>
                      {(c.flat_number || c.society_name) && <span>🏠 {c.flat_number}{c.flat_number && c.society_name ? ", " : ""}{c.society_name}</span>}
                      {c.address && <span>📍 {c.address}</span>}
                      {c.email && <span>✉️ {c.email}</span>}
                      <button onClick={(e) => { e.stopPropagation(); openStatement(c); }}
                        style={{ marginTop: 6, alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, background: "var(--grade-b-bg)", color: "var(--grade-b-text)", border: "1px solid var(--grade-b-border)", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
                        <Wallet size={13} /> View statement
                      </button>
                    </div>
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
                              const dq = item.delivered_qty ?? (item.item_status === "delivered" ? item.quantity : 0);
                              const isDel = dq >= item.quantity;
                              const partial = dq > 0 && !isDel;
                              return (
                                <span key={item.id} className="item-chip" style={{ fontSize: 11, padding: "3px 9px", borderRadius: 20, fontWeight: 600, background: isDel ? "var(--grade-a-bg)" : "var(--grade-c-bg)", color: isDel ? "var(--grade-a-text)" : "var(--grade-c-text)", border: `1px solid ${isDel ? "var(--grade-a-border)" : "var(--grade-c-border)"}` }}>
                                  {isDel ? "✓" : "⏳"} {item.service_name} {partial ? `${dq}/${item.quantity}` : `×${item.quantity}`}
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
                        <button onClick={() => openInvoice(c)}
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
          <div style={{ background: "var(--bg-card-solid)", border: "1px solid var(--border-hard)", borderRadius: 16, padding: 28, width: "100%", maxWidth: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.28)" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>{editId ? "Edit" : "New"} Customer</h3>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--text-muted)" }}>{editId ? "Update customer details" : "Add a new customer"}</p>
              </div>
              <button onClick={() => setShowForm(false)} style={{ background: "var(--bg-input)", border: "none", borderRadius: 8, padding: 8, cursor: "pointer", display: "flex" }}>
                <X size={18} color="var(--text-secondary)" />
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
                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 5, marginBottom: 5 }}>
                      {f.icon} {f.label} {f.required && <span style={{ color: "#ef4444" }}>*</span>}
                    </label>
                    <input
                      style={{ ...inputStyle, borderColor: f.key === "phone" && phoneError ? "#ef4444" : focusField === f.key ? "var(--accent-primary)" : "var(--border)" }}
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
                      <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "var(--bg-card-solid)", border: "1.5px solid var(--border-active)", borderRadius: 10, zIndex: 300, boxShadow: "0 8px 24px rgba(0,0,0,0.18)", overflow: "hidden" }}>
                        {filteredSugg.map(s => (
                          <div key={s} onMouseDown={() => { setForm({ ...form, [f.key]: s }); setShowSuggestion(null); }}
                            style={{ padding: "10px 14px", fontSize: 13, cursor: "pointer", color: "var(--text-primary)", borderBottom: "1px solid var(--border-hard)" }}
                            onMouseEnter={e => e.currentTarget.style.background = "var(--bg-elevated)"}
                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                            <Building2 size={13} color="var(--accent-primary)" style={{ marginRight: 6 }} />{s}
                          </div>
                        ))}
                      </div>
                    )}
                    {f.key === "phone" && (
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                        {phoneError ? <span style={{ fontSize: 11, color: "#ef4444" }}>{phoneError}</span> : <span />}
                        <span style={{ fontSize: 11, color: form.phone.length === 10 ? "#16a34a" : "var(--text-muted)" }}>{form.phone.length}/10</span>
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
                style={{ padding: "10px 22px", background: "var(--bg-input)", color: "var(--text-secondary)", border: "1.5px solid var(--border-hard)", borderRadius: 9, fontSize: 14, fontWeight: 600, cursor: "pointer" }}
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

      {/* ── Bulk monthly billing modal ── */}
      {showBulk && (() => {
        const activeCount = entryMap.size;
        const CH = [
          { key: "both",     label: "WhatsApp + Email" },
          { key: "whatsapp", label: "WhatsApp only" },
          { key: "email",    label: "Email only" },
        ] as const;
        return (
          <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 16, backdropFilter: "blur(4px)" }}
            onClick={() => !bulkSending && setShowBulk(false)}>
            <div style={{ background: "var(--bg-card-solid)", border: "1px solid var(--border-hard)", borderRadius: 16, padding: 24, width: "100%", maxWidth: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.28)" }}
              onClick={e => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "var(--text-primary)" }}>Send monthly bills</h3>
                  <p style={{ margin: "3px 0 0", fontSize: 13, color: "var(--text-muted)" }}>{MONTHS[month - 1]} {year}</p>
                </div>
                <button onClick={() => !bulkSending && setShowBulk(false)} style={{ background: "var(--bg-input)", border: "none", borderRadius: 8, padding: 8, cursor: "pointer", display: "flex" }}>
                  <X size={18} color="var(--text-secondary)" />
                </button>
              </div>

              {!bulkResult ? (
                <>
                  <div style={{ padding: "12px 14px", borderRadius: 10, marginBottom: 16, background: "var(--bg-elevated)", border: "1px solid var(--border-hard)", fontSize: 13.5, color: "var(--text-primary)", fontWeight: 600 }}>
                    <b style={{ color: "var(--accent-primary)" }}>{activeCount}</b> customer{activeCount === 1 ? "" : "s"} ki is mahine entries hain — sabko unka {MONTHS[month - 1]} ka bill jayega.
                  </div>

                  <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Kaha bhejein?</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 18 }}>
                    {CH.map(c => {
                      const active = bulkChannel === c.key;
                      return (
                        <button key={c.key} onClick={() => setBulkChannel(c.key)}
                          style={{ padding: "10px 4px", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 12,
                            border: `1.5px solid ${active ? "var(--accent-primary)" : "var(--border-hard)"}`,
                            background: active ? "var(--grade-b-bg)" : "var(--bg-input)",
                            color: active ? "var(--grade-b-text)" : "var(--text-secondary)" }}>
                          {c.label}
                        </button>
                      );
                    })}
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                    <button onClick={() => setShowBulk(false)} disabled={bulkSending}
                      style={{ padding: "10px 22px", background: "var(--bg-input)", color: "var(--text-secondary)", border: "1.5px solid var(--border-hard)", borderRadius: 9, fontSize: 14, fontWeight: 600, cursor: bulkSending ? "not-allowed" : "pointer" }}>
                      Cancel
                    </button>
                    <button onClick={bulkSend} disabled={bulkSending || activeCount === 0}
                      style={{ padding: "10px 24px", borderRadius: 9, fontSize: 14, fontWeight: 700, border: "none", display: "flex", alignItems: "center", gap: 7,
                        cursor: (bulkSending || activeCount === 0) ? "not-allowed" : "pointer",
                        background: activeCount === 0 ? "var(--bg-input)" : "var(--accent-primary)",
                        color: activeCount === 0 ? "var(--text-secondary)" : "#0b1830",
                        opacity: (bulkSending || activeCount === 0) ? 0.6 : 1 }}>
                      <Send size={14} /> {bulkSending ? "Bhej rahe hain…" : `Send to ${activeCount}`}
                    </button>
                  </div>
                  {bulkSending && <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 10, textAlign: "center" }}>WhatsApp ek-ek karke ja rahe hain, thoda ruko — band mat karo.</div>}
                </>
              ) : (
                <>
                  <div style={{ padding: "14px", borderRadius: 10, marginBottom: 16, background: "var(--grade-a-bg)", border: "1px solid var(--grade-a-border)" }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "var(--grade-a-text)", marginBottom: 8 }}>✅ {bulkResult.monthName} ke bill bhej diye</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13, color: "var(--text-primary)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}><span>WhatsApp sent</span><b>{bulkResult.waSent}</b></div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}><span>Email sent</span><b>{bulkResult.emailSent}</b></div>
                      {bulkResult.failed > 0 && <div style={{ display: "flex", justifyContent: "space-between", color: "var(--grade-f-text)" }}><span>Failed</span><b>{bulkResult.failed}</b></div>}
                      {bulkResult.skipped > 0 && <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)" }}><span>No contact (skipped)</span><b>{bulkResult.skipped}</b></div>}
                    </div>
                  </div>
                  {bulkResult.waSent === 0 && (bulkChannel === "both" || bulkChannel === "whatsapp") && (
                    <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginBottom: 14 }}>WhatsApp 0 gaye — shayad WhatsApp connect nahi hai (Settings me connect karo).</div>
                  )}
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button onClick={() => setShowBulk(false)}
                      style={{ padding: "10px 24px", borderRadius: 9, fontSize: 14, fontWeight: 700, border: "none", background: "var(--accent-primary)", color: "#0b1830", cursor: "pointer" }}>
                      Done
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })()}

      {/* ── Mobile action menu (⋮) ── */}
      {menu && (() => {
        const c = menu.c;
        const mAct = (entryMap.get(c.id) || []).length > 0;
        const row = (label: string, icon: React.ReactNode, onClick: () => void, danger?: boolean) => (
          <button onClick={() => { setMenu(null); onClick(); }}
            style={{ display: "flex", alignItems: "center", gap: 11, width: "100%", padding: "13px 16px", background: "none", border: "none", borderBottom: "1px solid var(--border-hard)", cursor: "pointer", fontSize: 14, fontWeight: 600, color: danger ? "var(--grade-f-text)" : "var(--text-primary)", textAlign: "left" }}>
            {icon}{label}
          </button>
        );
        return (
          <>
            <div onClick={() => setMenu(null)} style={{ position: "fixed", inset: 0, zIndex: 300 }} />
            <div style={{ position: "fixed", top: menu.top, right: menu.right, zIndex: 301, background: "var(--bg-card-solid)", border: "1px solid var(--border)", borderRadius: 12, boxShadow: "var(--shadow-web-lift)", minWidth: 210, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              {row("Record payment", <IndianRupee size={16} color="var(--grade-c-text)" />, () => openPay(c))}
              {row("WhatsApp", <MessageCircle size={16} color="var(--grade-a-text)" />, () => waCustomer(c))}
              {mAct && row("Invoice", <FileText size={16} color="var(--grade-b-text)" />, () => openInvoice(c))}
              {row("Statement", <Wallet size={16} color="var(--grade-b-text)" />, () => openStatement(c))}
              {row("Edit customer", <Edit2 size={16} color="var(--grade-b-text)" />, () => { setForm({ name: c.name, phone: c.phone, flat_number: c.flat_number || "", society_name: c.society_name || "", address: c.address || "", email: c.email || "" }); setEditId(c.id); setPhoneError(""); setShowForm(true); })}
              {row("Delete", <Trash2 size={16} color="var(--grade-f-text)" />, () => del(c.id), true)}
            </div>
          </>
        );
      })()}

      {/* ── Invoice loading + preview ── */}
      {invoiceLoading && !invoice && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.4)", zIndex: 399, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "var(--bg-card-solid)", padding: "14px 22px", borderRadius: 12, fontSize: 14, fontWeight: 600, color: "var(--text-primary)", border: "1px solid var(--border-hard)" }}>Opening invoice…</div>
        </div>
      )}
      {invoice && (
        <div onClick={() => setInvoice(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", zIndex: 400, display: "flex", padding: 12 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: "var(--bg-card-solid)", borderRadius: 12, margin: "auto", width: "100%", maxWidth: 820, height: "90vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "12px 14px", borderBottom: "1px solid var(--border-hard)" }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{invoice.name}</span>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <button onClick={() => { const f = document.getElementById("cust-invoice-frame") as HTMLIFrameElement | null; f?.contentWindow?.focus(); f?.contentWindow?.print(); }}
                  style={{ padding: "7px 14px", background: "var(--grade-b-bg)", color: "var(--grade-b-text)", border: "1px solid var(--grade-b-border)", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  Print
                </button>
                <button onClick={() => setInvoice(null)}
                  style={{ width: 34, height: 34, borderRadius: 8, background: "var(--bg-input)", border: "1px solid var(--border-hard)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <X size={17} color="var(--text-secondary)" />
                </button>
              </div>
            </div>
            <iframe id="cust-invoice-frame" srcDoc={invoice.html} title="Invoice" style={{ flex: 1, border: "none", width: "100%", background: "#fff" }} />
          </div>
        </div>
      )}

      {/* ── Statement loading + ledger modal ── */}
      {statementLoading && !statement && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.4)", zIndex: 399, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "var(--bg-card-solid)", padding: "14px 22px", borderRadius: 12, fontSize: 14, fontWeight: 600, color: "var(--text-primary)", border: "1px solid var(--border-hard)" }}>Loading statement…</div>
        </div>
      )}
      {statement && (() => {
        const s = statement;
        const inr = (n: number) => `₹${Math.abs(n).toLocaleString("en-IN")}`;
        return (
          <div onClick={() => setStatement(null)} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", zIndex: 400, display: "flex", padding: 12 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: "var(--bg-card-solid)", borderRadius: 14, margin: "auto", width: "100%", maxWidth: 560, maxHeight: "88vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "14px 16px", borderBottom: "1px solid var(--border-hard)" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 15, color: "var(--text-primary)" }}>Statement</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.c.name} · 📞 {s.c.phone}</div>
                </div>
                <button onClick={() => setStatement(null)} style={{ width: 34, height: 34, borderRadius: 8, background: "var(--bg-input)", border: "1px solid var(--border-hard)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><X size={17} color="var(--text-secondary)" /></button>
              </div>
              <div style={{ display: "flex", gap: 8, padding: "12px 16px", borderBottom: "1px solid var(--border-hard)" }}>
                <div style={{ flex: 1, textAlign: "center" }}><div style={{ fontSize: 11, color: "var(--text-muted)" }}>Billed</div><div style={{ fontWeight: 800, fontSize: 15, color: "var(--text-primary)" }}>{inr(s.billed)}</div></div>
                <div style={{ flex: 1, textAlign: "center" }}><div style={{ fontSize: 11, color: "var(--text-muted)" }}>Paid</div><div style={{ fontWeight: 800, fontSize: 15, color: "var(--grade-a-text)" }}>{inr(s.paid)}</div></div>
                <div style={{ flex: 1, textAlign: "center" }}><div style={{ fontSize: 11, color: "var(--text-muted)" }}>{s.outstanding < -0.5 ? "Advance" : "Due"}</div><div style={{ fontWeight: 800, fontSize: 15, color: s.outstanding > 0.5 ? "var(--grade-f-text)" : "var(--grade-a-text)" }}>{inr(s.outstanding)}</div></div>
              </div>
              <div style={{ flex: 1, overflowY: "auto" }}>
                {s.rows.length === 0 ? (
                  <div style={{ padding: "28px 16px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>No transactions yet</div>
                ) : s.rows.map((r, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderBottom: "1px solid var(--border-hard)" }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.label}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{new Date(r.date + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: r.type === "payment" ? "var(--grade-a-text)" : "var(--text-primary)" }}>{r.type === "payment" ? "−" : "+"}{inr(r.amount)}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Bal {inr(r.balance)}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border-hard)" }}>
                <button onClick={sendStatementWA} style={{ width: "100%", padding: "11px", borderRadius: 10, background: "var(--grade-a-bg)", color: "var(--grade-a-text)", border: "1px solid var(--grade-a-border)", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Send on WhatsApp</button>
              </div>
            </div>
          </div>
        );
      })()}

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
