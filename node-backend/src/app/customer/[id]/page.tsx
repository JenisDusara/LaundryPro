"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Phone, MapPin, FileText, Trash2, Wallet, X, Printer, Pencil, Plus, CheckCircle2, Package } from "lucide-react";
import api from "@/lib/api";
import ProtectedLayout from "@/components/ProtectedLayout";
import ItemDeliver from "@/components/ItemDeliver";
import EmptyState from "@/components/EmptyState";
import { isEntryDelivered } from "@/lib/entry-status";
import type { LaundryEntry, Service, Customer } from "@/types";

const WA_PATH = "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z";
const COLORS = [{ bg: "#eff6ff", border: "#bfdbfe", text: "#1e40af" }, { bg: "#f0fdf4", border: "#bbf7d0", text: "#166534" }, { bg: "#fdf4ff", border: "#e9d5ff", text: "#7e22ce" }, { bg: "#fff7ed", border: "#fed7aa", text: "#9a3412" }, { bg: "#f0fdfa", border: "#99f6e4", text: "#134e4a" }, { bg: "#fefce8", border: "#fef08a", text: "#854d0e" }];

const invFmt = (n?: number | null) => (n ? "INV-" + String(n).padStart(4, "0") : "Order");
const fmtDate = (d?: string | null) => { if (!d) return "—"; try { return new Date(d + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" }); } catch { return d; } };
const tel = (p?: string) => (p || "").replace(/\D/g, "").slice(-10);

interface EditItem { localId: string; service_id: string; service_name: string; price_per_unit: number; quantity: number; item_status: string; }
interface PayRow { amount: number; method: string; date: string; note?: string; }

export default function CustomerDetail({ params }: { params: { id: string } }) {
  const router = useRouter();
  const cid = params.id;
  const [entries, setEntries] = useState<LaundryEntry[]>([]);
  const [payments, setPayments] = useState<PayRow[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [shopName, setShopName] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // Collect payment (customer-level, nets against total balance)
  const [showCollect, setShowCollect] = useState(false);
  const [payAmt, setPayAmt] = useState("");
  const [payMethod, setPayMethod] = useState("cash");
  const [payNote, setPayNote] = useState("");

  // Edit order modal
  const [editEntry, setEditEntry] = useState<LaundryEntry | null>(null);
  const [editItems, setEditItems] = useState<EditItem[]>([]);
  const [editNotes, setEditNotes] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  // Invoice modal
  const [invoiceHtml, setInvoiceHtml] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [entRes, payRes] = await Promise.all([
        api.get("/entries", { params: { customer_id: cid } }),
        api.get("/payments", { params: { customer_id: cid } }),
      ]);
      const ents: LaundryEntry[] = entRes.data || [];
      ents.sort((a, b) => (a.entry_date < b.entry_date ? 1 : -1));
      setEntries(ents);
      setPayments(((payRes.data && payRes.data.payments) || []).map((p: any) => ({ amount: Number(p.amount), method: p.method, date: p.date, note: p.note })));
      // Customer info from the first entry; fall back to the customers list.
      if (ents[0]?.customer) setCustomer(ents[0].customer);
      else { try { const cs = await api.get("/customers"); setCustomer((cs.data || []).find((c: Customer) => c.id === cid) || null); } catch { /* best effort */ } }
    } catch { /* handled by empty state */ }
    finally { setLoading(false); }
  }, [cid]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    api.get("/services").then(r => setServices(r.data)).catch(() => {});
    api.get("/auth/me").then(r => setShopName(r.data.shop_name || "")).catch(() => {});
  }, []);

  const billed = entries.reduce((s, e) => s + Number(e.total_amount), 0);
  const paid = payments.reduce((s, p) => s + p.amount, 0);
  const balance = Math.round((billed - paid) * 100) / 100;
  const pendingOrders = entries.filter(e => !isEntryDelivered(e)).length;

  // ── Collect payment ──
  const openCollect = () => { setPayAmt(String(Math.max(0, balance))); setPayMethod("cash"); setPayNote(""); setShowCollect(true); };
  const collect = async () => {
    const amt = Number(payAmt) || 0; if (amt <= 0) return;
    setBusy(true);
    const today = new Date().toISOString().slice(0, 10);
    try { await api.post("/payments", { customer_id: cid, amount: amt, method: payMethod, date: today, note: payNote }); setShowCollect(false); await load(); }
    catch (e: any) { alert(e?.response?.data?.detail || "Payment failed"); }
    finally { setBusy(false); }
  };

  // ── Per-order actions ──
  const markDelivered = async (e: LaundryEntry) => {
    setBusy(true);
    try { await api.patch(`/entries/${e.id}/status`, null, { params: { status: isEntryDelivered(e) ? "pending" : "delivered" } }); await load(); }
    finally { setBusy(false); }
  };
  const delEntry = async (id: string) => { if (!confirm("Delete this order?")) return; await api.delete(`/entries/${id}`); await load(); };

  const openInvoice = async (p: Record<string, any>) => {
    try { const r = await api.get(`/invoices/${cid}`, { params: p, responseType: "text" }); setInvoiceHtml(typeof r.data === "string" ? r.data : String(r.data ?? "")); }
    catch { alert("Failed to load invoice"); }
  };
  const printInvoice = () => { const ifr = document.getElementById("cust-inv") as HTMLIFrameElement | null; ifr?.contentWindow?.focus(); ifr?.contentWindow?.print(); };

  const waReminder = () => {
    if (!customer?.phone) return;
    const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
    const lines = [`Hello ${customer.name},`, ``, `*${shopName || "Your Laundry"}*`, `Total billed: ${inr(billed)}`, `Total paid: ${inr(paid)}`, balance > 0.5 ? `*Balance due: ${inr(balance)}*` : `✅ Fully settled`, ``, `Thank you! 🙏`];
    const a = document.createElement("a"); a.href = `whatsapp://send?phone=91${tel(customer.phone)}&text=${encodeURIComponent(lines.join("\n"))}`; document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  // ── Edit order ──
  const openEdit = (e: LaundryEntry) => { setEditEntry(e); setEditNotes(e.notes || ""); setEditItems(e.items.map(i => ({ localId: i.id, service_id: (i as any).service_id || "", service_name: i.service_name, price_per_unit: Number(i.price_per_unit), quantity: i.quantity, item_status: i.item_status || "pending" }))); };
  const addEditItem = (svc: Service) => setEditItems(prev => [...prev, { localId: Math.random().toString(), service_id: svc.id, service_name: svc.name, price_per_unit: Number(svc.price) || 0, quantity: 1, item_status: "pending" }]);
  const updateEditItem = (id: string, f: keyof EditItem, v: string | number) => setEditItems(prev => prev.map(i => i.localId === id ? { ...i, [f]: v } : i));
  const removeEditItem = (id: string) => setEditItems(prev => prev.filter(i => i.localId !== id));
  const editTotal = editItems.reduce((s, i) => s + Number(i.price_per_unit) * Number(i.quantity), 0);
  const saveEdit = async () => {
    if (!editEntry || editItems.length === 0) return;
    setEditSaving(true);
    try { await api.put(`/entries/${editEntry.id}`, { notes: editNotes, items: editItems.map(i => ({ service_id: i.service_id, service_name: i.service_name, price_per_unit: Number(i.price_per_unit), quantity: Number(i.quantity), item_status: i.item_status })) }); setEditEntry(null); await load(); }
    finally { setEditSaving(false); }
  };

  const card: React.CSSProperties = { background: "var(--bg-card-solid)", border: "1px solid var(--border-hard)", borderRadius: 14, padding: "16px 18px", boxShadow: "var(--shadow-web-lift)" };
  const label: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em" };
  const row = (k: string, v: React.ReactNode, strong?: boolean) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", fontSize: strong ? 15 : 13.5 }}>
      <span style={{ color: "var(--text-secondary)", fontWeight: strong ? 700 : 500 }}>{k}</span>
      <span style={{ color: "var(--text-primary)", fontWeight: strong ? 800 : 700 }}>{v}</span>
    </div>
  );

  if (loading) return <ProtectedLayout><div style={{ textAlign: "center", padding: 60, color: "var(--text-muted)" }}>Loading…</div></ProtectedLayout>;

  const name = customer?.name || entries[0]?.customer?.name || "Customer";
  const addr = [customer?.flat_number, customer?.society_name].filter(Boolean).join(", ");
  const latest = entries[0]?.entry_date;

  return (
    <ProtectedLayout>
      <style>{`.cd-grid{display:grid;grid-template-columns:1fr 320px;gap:16px;align-items:start}@media(max-width:820px){.cd-grid{grid-template-columns:1fr}}`}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <button onClick={() => router.push("/entries")} style={{ width: 38, height: 38, borderRadius: 10, border: "1px solid var(--border-hard)", background: "var(--bg-input)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)", flexShrink: 0 }}><ArrowLeft size={17} /></button>
        <div style={{ width: 46, height: 46, borderRadius: 12, background: "linear-gradient(135deg,#6EA8FF,#3f7fe0)", display: "flex", alignItems: "center", justifyContent: "center", color: "#0b1830", fontWeight: 800, fontSize: 20, flexShrink: 0 }}>{name.charAt(0).toUpperCase()}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</h2>
          <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 2, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            {addr && <span style={{ display: "flex", alignItems: "center", gap: 3 }}><MapPin size={12} /> {addr}</span>}
            <span>· {entries.length} order{entries.length !== 1 ? "s" : ""}</span>
            {pendingOrders > 0 && <span style={{ color: "var(--grade-c-text)", fontWeight: 700 }}>· {pendingOrders} pending</span>}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {customer?.phone && <a href={`tel:${tel(customer.phone)}`} style={{ width: 38, height: 38, borderRadius: 9, border: "1px solid var(--grade-b-border)", background: "var(--grade-b-bg)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--grade-b-text)" }}><Phone size={15} /></a>}
          {customer?.phone && <button onClick={waReminder} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 9, border: "1px solid var(--grade-a-border)", background: "var(--grade-a-bg)", cursor: "pointer", fontSize: 13, fontWeight: 700, color: "var(--grade-a-text)" }}><svg width="13" height="13" viewBox="0 0 24 24" fill="var(--grade-a-text)"><path d={WA_PATH} /></svg> Remind</button>}
          {latest && <button onClick={() => { const [y, m] = latest.split("-"); openInvoice({ month: parseInt(m), year: parseInt(y) }); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 9, border: "1px solid var(--border-hard)", background: "var(--bg-input)", cursor: "pointer", fontSize: 13, fontWeight: 700, color: "var(--text-secondary)" }}><FileText size={14} /> Monthly bill</button>}
        </div>
      </div>

      <div className="cd-grid">
        {/* LEFT: all orders */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
          {entries.length === 0 && <EmptyState title="No orders yet" subtitle="This customer has no orders." />}
          {entries.map(e => {
            const delivered = isEntryDelivered(e);
            const itemTotal = e.items.reduce((s, i) => s + Number(i.subtotal), 0);
            return (
              <div key={e.id} style={{ ...card, padding: 0, overflow: "hidden" }}>
                {/* Order header */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: "1px solid var(--border-hard)", flexWrap: "wrap" }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "var(--grade-b-text)" }}>🧾 {invFmt(e.invoice_no)}</span>
                  <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>{fmtDate(e.entry_date)}</span>
                  <span style={{ fontSize: 10.5, fontWeight: 800, padding: "3px 10px", borderRadius: 20, background: delivered ? "var(--grade-a-bg)" : "var(--grade-c-bg)", color: delivered ? "var(--grade-a-text)" : "var(--grade-c-text)", border: `1px solid ${delivered ? "var(--grade-a-border)" : "var(--grade-c-border)"}` }}>{delivered ? "Delivered" : "Pending"}</span>
                  <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
                    <button onClick={() => markDelivered(e)} disabled={busy} title={delivered ? "Mark pending" : "Mark delivered"} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 10px", borderRadius: 8, border: delivered ? "1px solid var(--border-hard)" : "none", cursor: "pointer", fontSize: 12, fontWeight: 700, background: delivered ? "var(--bg-input)" : "var(--accent-success)", color: delivered ? "var(--text-secondary)" : "#0b1830" }}>{delivered ? <><Package size={12} /> Pending</> : <><CheckCircle2 size={12} /> Deliver</>}</button>
                    <button onClick={() => { const [y, m] = e.entry_date.split("-"); openInvoice({ month: parseInt(m), year: parseInt(y), entry_date: e.entry_date }); }} title="Invoice" style={{ width: 32, height: 32, borderRadius: 8, background: "var(--bg-input)", border: "1px solid var(--border-hard)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)" }}><FileText size={14} /></button>
                    <button onClick={() => openEdit(e)} title="Edit" style={{ width: 32, height: 32, borderRadius: 8, background: "var(--grade-b-bg)", border: "1px solid var(--grade-b-border)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--grade-b-text)" }}><Pencil size={13} /></button>
                    <button onClick={() => delEntry(e.id)} title="Delete" style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(239,68,68,0.12)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Trash2 size={13} color="#ef4444" /></button>
                  </div>
                </div>
                {/* Items */}
                <div style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                    {e.items.map(it => <ItemDeliver key={it.id} entryId={e.id} item={it} onChanged={load} />)}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {e.items.map(it => (
                      <div key={it.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12.5, color: "var(--text-secondary)" }}>
                        <span>{it.service_name} <span style={{ color: "var(--text-muted)" }}>×{it.quantity} · ₹{it.price_per_unit}</span></span>
                        <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>₹{it.subtotal}</span>
                      </div>
                    ))}
                  </div>
                  {e.notes && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8, display: "flex", gap: 4 }}>📝 <span>{e.notes}</span></div>}
                  <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12, marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border-subtle)", fontSize: 12.5, color: "var(--text-secondary)" }}>
                    {(e.discount ?? 0) > 0 && <span>Discount −₹{e.discount}</span>}
                    {(e.extra_charge ?? 0) > 0 && <span>Extra +₹{e.extra_charge}</span>}
                    {((e.discount ?? 0) > 0 || (e.extra_charge ?? 0) > 0) && <span style={{ color: "var(--text-muted)" }}>Items ₹{itemTotal}</span>}
                    <span style={{ fontWeight: 800, fontSize: 15, color: "var(--accent-primary)" }}>₹{Number(e.total_amount)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* RIGHT: account summary */}
        <aside style={{ ...card, position: "sticky", top: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Wallet size={16} color="var(--accent-primary)" />
            <span style={{ fontWeight: 800, fontSize: 15, color: "var(--text-primary)" }}>Account summary</span>
          </div>
          {row("Total billed", `₹${billed.toLocaleString("en-IN")}`)}
          {row("Total paid", `₹${paid.toLocaleString("en-IN")}`)}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", marginTop: 4, borderTop: "1px solid var(--border-hard)" }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: balance > 0.5 ? "var(--grade-c-text)" : balance < -0.5 ? "var(--grade-b-text)" : "var(--grade-a-text)" }}>{balance > 0.5 ? "Balance due" : balance < -0.5 ? "Advance" : "Settled"}</span>
            <span style={{ fontSize: 20, fontWeight: 900, color: balance > 0.5 ? "var(--grade-c-text)" : balance < -0.5 ? "var(--grade-b-text)" : "var(--grade-a-text)" }}>{balance > 0.5 ? `₹${balance.toLocaleString("en-IN")}` : balance < -0.5 ? `₹${Math.abs(balance).toLocaleString("en-IN")}` : "✓"}</span>
          </div>
          <button onClick={openCollect} style={{ width: "100%", marginTop: 12, padding: "13px", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 15, fontWeight: 800, background: "var(--accent-primary)", color: "#0b1830", boxShadow: "var(--shadow-glow-blue)" }}>Collect Payment</button>

          {payments.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ ...label, marginBottom: 8 }}>Recent payments</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {payments.slice().sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 6).map((p, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12.5 }}>
                    <span style={{ color: "var(--text-muted)" }}>{fmtDate(p.date)} · {p.method}</span>
                    <span style={{ fontWeight: 700, color: "var(--grade-a-text)" }}>₹{p.amount.toLocaleString("en-IN")}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Collect Payment modal */}
      {showCollect && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, padding: 16 }} onClick={() => setShowCollect(false)}>
          <div style={{ ...card, width: "100%", maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: "var(--text-primary)" }}>Collect Payment</div>
              <button onClick={() => setShowCollect(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}><X size={18} /></button>
            </div>
            <div style={{ background: "var(--grade-c-bg)", border: "1px solid var(--grade-c-border)", borderRadius: 10, padding: "10px 14px", marginBottom: 14 }}>
              <span style={{ fontSize: 12, color: "var(--grade-c-text)" }}>Balance due</span>
              <div style={{ fontSize: 22, fontWeight: 800, color: "var(--grade-c-text)" }}>₹{Math.max(0, balance).toLocaleString("en-IN")}</div>
            </div>
            <label style={{ ...label, display: "block", marginBottom: 6 }}>Amount received</label>
            <input type="number" min={0} value={payAmt} onChange={e => setPayAmt(e.target.value)} style={{ width: "100%", boxSizing: "border-box", padding: "11px 13px", border: "1.5px solid var(--border)", borderRadius: 9, fontSize: 15, fontWeight: 700, outline: "none", background: "var(--bg-input)", color: "var(--text-primary)", marginBottom: 12 }} />
            <label style={{ ...label, display: "block", marginBottom: 6 }}>Method</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6, marginBottom: 12 }}>
              {["cash", "upi", "online", "card"].map(m => (
                <button key={m} onClick={() => setPayMethod(m)} style={{ padding: "9px 4px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", textTransform: "capitalize", border: `1px solid ${payMethod === m ? "var(--accent-primary)" : "var(--border-hard)"}`, background: payMethod === m ? "var(--accent-primary)" : "var(--bg-input)", color: payMethod === m ? "#0b1830" : "var(--text-secondary)" }}>{m}</button>
              ))}
            </div>
            <input value={payNote} onChange={e => setPayNote(e.target.value)} placeholder="Remarks (optional)" style={{ width: "100%", boxSizing: "border-box", padding: "10px 13px", border: "1.5px solid var(--border)", borderRadius: 9, fontSize: 13, outline: "none", background: "var(--bg-input)", color: "var(--text-primary)", marginBottom: 16 }} />
            <button onClick={collect} disabled={busy || !(Number(payAmt) > 0)} style={{ width: "100%", padding: "13px", borderRadius: 10, border: "none", cursor: busy ? "not-allowed" : "pointer", fontSize: 15, fontWeight: 800, background: Number(payAmt) > 0 ? "var(--accent-success)" : "var(--bg-input)", color: Number(payAmt) > 0 ? "#0b1830" : "var(--text-secondary)", opacity: busy ? 0.7 : 1 }}>{busy ? "Saving…" : `Collect ₹${Number(payAmt) || 0}`}</button>
          </div>
        </div>
      )}

      {/* Edit order modal */}
      {editEntry && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 300 }} onClick={() => setEditEntry(null)}>
          <div style={{ background: "var(--bg-card)", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 600, maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 20px", borderBottom: "1px solid var(--border-hard)", flexShrink: 0 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16, color: "var(--text-primary)" }}>✏️ Edit order</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{fmtDate(editEntry.entry_date)}</div>
              </div>
              <button onClick={() => setEditEntry(null)} style={{ background: "var(--bg-input)", border: "none", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><X size={16} color="var(--text-secondary)" /></button>
            </div>
            <div style={{ overflowY: "auto", flex: 1, padding: "16px 20px" }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ ...label, marginBottom: 10 }}>Add service</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(130px,1fr))", gap: 8 }}>
                  {services.map((svc, idx) => {
                    const color = COLORS[idx % COLORS.length];
                    const children = svc.children || [];
                    if (children.length === 0) return (
                      <button key={svc.id} onClick={() => addEditItem(svc)} style={{ padding: "10px", background: color.bg, color: color.text, border: `2px solid ${color.border}`, borderRadius: 12, cursor: "pointer", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 4, justifyContent: "center" }}><Plus size={12} />{svc.name}</button>
                    );
                    return (
                      <div key={svc.id} style={{ background: color.bg, border: `2px solid ${color.border}`, borderRadius: 12, overflow: "hidden" }}>
                        <div style={{ padding: "6px 10px", fontWeight: 700, fontSize: 11, color: color.text, borderBottom: `1px solid ${color.border}` }}>{svc.name}</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 3, padding: "6px 8px" }}>
                          {children.map(child => (
                            <button key={child.id} onClick={() => addEditItem(child)} style={{ padding: "5px 8px", background: "#fff", color: color.text, border: `1px solid ${color.border}`, borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 600, display: "flex", justifyContent: "space-between" }}><span><Plus size={10} /> {child.name}</span><span style={{ opacity: 0.7 }}>₹{child.price}</span></button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ ...label, marginBottom: 10 }}>Items ({editItems.length})</div>
                {editItems.length === 0 && <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text-muted)", fontSize: 13 }}>No items — add from above</div>}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {editItems.map(item => (
                    <div key={item.localId} style={{ background: "var(--bg-elevated)", borderRadius: 10, padding: "10px 12px", border: "1px solid var(--border-hard)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: 13, color: "var(--grade-b-text)", background: "var(--grade-b-bg)", padding: "2px 8px", borderRadius: 10 }}>{item.service_name}</span>
                        <button onClick={() => removeEditItem(item.localId)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}><X size={14} color="#ef4444" /></button>
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, background: "var(--bg-card)", border: "1px solid var(--border-hard)", borderRadius: 8, padding: "4px 8px" }}>
                          <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>Qty</span>
                          <input type="number" min={1} value={item.quantity} onChange={e => updateEditItem(item.localId, "quantity", e.target.value)} style={{ width: 48, border: "none", outline: "none", fontSize: 14, fontWeight: 600, textAlign: "right", background: "transparent", color: "var(--text-primary)" }} />
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, background: "var(--bg-card)", border: "1px solid var(--border-hard)", borderRadius: 8, padding: "4px 8px" }}>
                          <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>₹</span>
                          <input type="number" min={0} value={item.price_per_unit} onChange={e => updateEditItem(item.localId, "price_per_unit", e.target.value)} style={{ width: 56, border: "none", outline: "none", fontSize: 14, fontWeight: 600, textAlign: "right", background: "transparent", color: "var(--text-primary)" }} />
                        </div>
                        <span style={{ fontWeight: 800, fontSize: 14, color: "var(--accent-success)" }}>= ₹{(Number(item.price_per_unit) * Number(item.quantity)).toFixed(0)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ ...label, marginBottom: 8 }}>Notes</div>
                <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} rows={2} placeholder="Any special instructions..." style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--border-hard)", borderRadius: 8, fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "inherit", background: "var(--bg-input)", color: "var(--text-primary)" }} />
              </div>
            </div>
            <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border-hard)", display: "flex", alignItems: "center", gap: 12, flexShrink: 0, background: "var(--bg-card)" }}>
              <div style={{ flex: 1 }}><span style={{ fontSize: 12, color: "var(--text-muted)" }}>Total: </span><span style={{ fontWeight: 800, fontSize: 18, color: "var(--accent-primary)" }}>₹{editTotal.toFixed(0)}</span></div>
              <button onClick={() => setEditEntry(null)} style={{ padding: "10px 20px", background: "var(--bg-input)", color: "var(--text-secondary)", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
              <button onClick={saveEdit} disabled={editSaving || editItems.length === 0} style={{ padding: "10px 24px", background: editItems.length === 0 ? "var(--border-hard)" : "var(--accent-primary)", color: editItems.length === 0 ? "var(--text-muted)" : "#0b1830", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: editItems.length === 0 ? "not-allowed" : "pointer" }}>{editSaving ? "Saving..." : "💾 Save"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice modal */}
      {invoiceHtml && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 400, padding: 16 }} onClick={() => setInvoiceHtml(null)}>
          <div style={{ background: "var(--bg-card)", borderRadius: 16, width: "100%", maxWidth: 720, height: "90vh", display: "flex", flexDirection: "column", overflow: "hidden", border: "1px solid var(--border-hard)" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid var(--border-hard)" }}>
              <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>Invoice · {name}</span>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={printInvoice} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 9, background: "var(--accent-primary)", color: "#0b1830", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700 }}><Printer size={14} /> Print / PDF</button>
                <button onClick={() => setInvoiceHtml(null)} style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--bg-input)", border: "1px solid var(--border-hard)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)" }}><X size={16} /></button>
              </div>
            </div>
            <iframe id="cust-inv" srcDoc={invoiceHtml} style={{ flex: 1, border: "none", width: "100%", background: "#fff" }} title="Invoice" />
          </div>
        </div>
      )}
    </ProtectedLayout>
  );
}
