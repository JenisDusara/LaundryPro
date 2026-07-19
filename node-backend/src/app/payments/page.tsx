"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Wallet, Banknote, Smartphone, CreditCard, Coins, Pencil, Trash2, X } from "lucide-react";
import api from "@/lib/api";
import ProtectedLayout from "@/components/ProtectedLayout";
import EmptyState from "@/components/EmptyState";
import CollectionsChart from "@/components/CollectionsChart";
import type { Payment } from "@/types";

interface Summary { total: number; cash: number; upi: number; card: number; other: number; count: number; }

const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const monthStartStr = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`; };
const daysAgoStr = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const fmtDate = (d?: string | null) => { if (!d) return "—"; try { return new Date(d + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }); } catch { return d; } };
const inr = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

export default function PaymentsHistory() {
  const router = useRouter();
  const [from, setFrom] = useState(todayStr);
  const [to, setTo] = useState(todayStr);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<Summary>({ total: 0, cash: 0, upi: 0, card: 0, other: 0, count: 0 });
  const [loading, setLoading] = useState(false);
  const [editPay, setEditPay] = useState<Payment | null>(null);
  const [eAmt, setEAmt] = useState("");
  const [eMethod, setEMethod] = useState("cash");
  const [eDate, setEDate] = useState("");
  const [eNote, setENote] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!from || !to) return;
    setLoading(true);
    try {
      const r = await api.get("/payments", { params: { from, to } });
      setPayments(r.data.payments || []);
      setSummary(r.data.summary || { total: 0, cash: 0, upi: 0, card: 0, other: 0, count: 0 });
    } catch { setPayments([]); }
    finally { setLoading(false); }
  }, [from, to]);
  useEffect(() => { load(); }, [load]);

  const openEdit = (p: Payment) => { setEditPay(p); setEAmt(String(p.amount)); setEMethod(["cash", "upi", "card"].includes(p.method) ? p.method : "cash"); setEDate(p.date); setENote(p.note || ""); };
  const saveEdit = async () => {
    if (!editPay) return; const amt = Number(eAmt); if (!amt || amt <= 0) return;
    setSaving(true);
    try { await api.put(`/payments/${editPay.id}`, { amount: amt, method: eMethod, date: eDate, note: eNote }); setEditPay(null); await load(); }
    catch (e: any) { alert(e?.response?.data?.detail || "Update failed"); }
    finally { setSaving(false); }
  };
  const delPay = async (p: Payment) => {
    if (!confirm(`Delete this ₹${Number(p.amount).toLocaleString("en-IN")} payment from ${p.customer_name}?`)) return;
    try { await api.delete(`/payments/${p.id}`); await load(); }
    catch (e: any) { alert(e?.response?.data?.detail || "Delete failed"); }
  };

  const preset = (f: string, t: string) => { setFrom(f); setTo(t); };
  const isPreset = (f: string, t: string) => from === f && to === t;
  const rangeLabel = from === to ? fmtDate(from) : `${fmtDate(from)} – ${fmtDate(to)}`;

  const card: React.CSSProperties = { background: "var(--bg-card-solid)", border: "1px solid var(--border-hard)", borderRadius: 14, padding: "16px 18px", boxShadow: "var(--shadow-web-lift)" };
  const tile = (icon: React.ReactNode, label: string, value: string, accent?: boolean) => (
    <div style={{ ...card, padding: "14px 16px", flex: "1 1 130px", minWidth: 130 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6, color: "var(--text-muted)" }}>{icon}<span style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</span></div>
      <div style={{ fontSize: accent ? 26 : 20, fontWeight: 900, color: accent ? "var(--accent-primary)" : "var(--text-primary)" }}>{value}</div>
    </div>
  );

  const presets: { k: string; f: string; t: string }[] = [
    { k: "Today", f: todayStr(), t: todayStr() },
    { k: "Last 7 days", f: daysAgoStr(6), t: todayStr() },
    { k: "This month", f: monthStartStr(), t: todayStr() },
  ];

  return (
    <ProtectedLayout>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
        <div>
          <h2 style={{ color: "var(--text-primary)", margin: "0 0 2px", fontSize: 22, fontWeight: 800 }}>Payments</h2>
          <p style={{ color: "var(--text-muted)", fontSize: 12, margin: 0 }}>{rangeLabel} · {summary.count} payment{summary.count !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Range presets + custom dates */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        {presets.map(p => (
          <button key={p.k} onClick={() => preset(p.f, p.t)} style={{ padding: "8px 14px", borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: "pointer", border: `1px solid ${isPreset(p.f, p.t) ? "var(--accent-primary)" : "var(--border-hard)"}`, background: isPreset(p.f, p.t) ? "var(--accent-primary)" : "var(--bg-input)", color: isPreset(p.f, p.t) ? "#0b1830" : "var(--text-secondary)" }}>{p.k}</button>
        ))}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto", flexWrap: "wrap" }}>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={{ padding: "8px 10px", borderRadius: 9, border: "1px solid var(--border-hard)", background: "var(--bg-input)", color: "var(--text-primary)", fontSize: 13, outline: "none" }} />
          <span style={{ color: "var(--text-muted)", fontSize: 12 }}>to</span>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} style={{ padding: "8px 10px", borderRadius: 9, border: "1px solid var(--border-hard)", background: "var(--bg-input)", color: "var(--text-primary)", fontSize: 13, outline: "none" }} />
        </div>
      </div>

      {/* Summary tiles */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        {tile(<Wallet size={14} />, "Total collected", inr(summary.total), true)}
        {tile(<Banknote size={14} />, "Cash", inr(summary.cash))}
        {tile(<Smartphone size={14} />, "UPI", inr(summary.upi))}
        {tile(<CreditCard size={14} />, "Card", inr(summary.card))}
        {summary.other > 0 && tile(<Coins size={14} />, "Other", inr(summary.other))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16, alignItems: "start" }} className="pay-grid">
        <style>{`@media(max-width:820px){.pay-grid{grid-template-columns:1fr!important}}`}</style>

        {/* Payments list */}
        <div style={{ ...card, padding: 0, overflow: "hidden" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em", padding: "14px 18px 4px" }}>Payments received</div>
          {loading ? <div style={{ textAlign: "center", padding: 30, color: "var(--text-muted)" }}>Loading…</div>
            : payments.length === 0 ? <div style={{ padding: "10px 0 24px" }}><EmptyState title="No payments in this range" subtitle="Try another date range, or record a payment from a customer's page." compact /></div>
              : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 480 }}>
                    <thead>
                      <tr>{["Date", "Customer", "Method", "Note", "Amount", ""].map((h, i) => (
                        <th key={i} style={{ textAlign: i === 4 ? "right" : i === 5 ? "center" : "left", padding: "10px 18px", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: "1px solid var(--border-hard)", whiteSpace: "nowrap" }}>{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody>
                      {payments.map((p, idx) => {
                        const last = idx === payments.length - 1;
                        const bb = last ? "none" : "1px solid var(--border-subtle)";
                        return (
                          <tr key={p.id} className="pay-row" style={{ cursor: "pointer" }} onClick={() => router.push(`/customer/${p.customer_id}`)}>
                            <td style={{ padding: "11px 18px", fontSize: 13, color: "var(--text-secondary)", borderBottom: bb, whiteSpace: "nowrap" }}>{fmtDate(p.date)}</td>
                            <td style={{ padding: "11px 18px", fontSize: 13, fontWeight: 700, color: "var(--text-primary)", borderBottom: bb }}>{p.customer_name}</td>
                            <td style={{ padding: "11px 18px", borderBottom: bb }}><span style={{ fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 20, textTransform: "capitalize", background: "var(--grade-b-bg)", color: "var(--grade-b-text)", border: "1px solid var(--grade-b-border)" }}>{p.method}</span></td>
                            <td style={{ padding: "11px 18px", fontSize: 12, color: "var(--text-muted)", borderBottom: bb, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.note || "—"}</td>
                            <td style={{ padding: "11px 18px", fontSize: 14, fontWeight: 800, color: "var(--grade-a-text)", textAlign: "right", borderBottom: bb, whiteSpace: "nowrap" }}>{inr(Number(p.amount))}</td>
                            <td style={{ padding: "8px 14px", borderBottom: bb }} onClick={ev => ev.stopPropagation()}>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                                <button onClick={() => openEdit(p)} title="Edit" style={{ width: 30, height: 30, borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "1px solid var(--border-hard)" }}><Pencil size={13} color="var(--text-secondary)" /></button>
                                <button onClick={() => delPay(p)} title="Delete" style={{ width: 30, height: 30, borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "1px solid var(--border-hard)" }}><Trash2 size={13} color="#ef4444" /></button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
          <style>{`.pay-row:hover{background:var(--pressed)}`}</style>
        </div>

        {/* Method breakdown chart */}
        <aside style={{ ...card }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: "var(--text-primary)", marginBottom: 4 }}>Collections by method</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12 }}>{rangeLabel}</div>
          {summary.total > 0 ? <CollectionsChart cash={summary.cash} upi={summary.upi} card={summary.card} size={150} />
            : <div style={{ fontSize: 13, color: "var(--text-muted)", textAlign: "center", padding: "20px 0" }}>No collections yet</div>}
        </aside>
      </div>

      {/* Edit payment modal */}
      {editPay && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, padding: 16 }} onClick={() => setEditPay(null)}>
          <div style={{ ...card, width: "100%", maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: "var(--text-primary)" }}>Edit Payment</div>
              <button onClick={() => setEditPay(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}><X size={18} /></button>
            </div>
            <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginBottom: 14 }}>{editPay.customer_name}</div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>Amount</label>
            <input type="number" min={0} value={eAmt} onChange={e => setEAmt(e.target.value)} style={{ width: "100%", boxSizing: "border-box", padding: "11px 13px", border: "1.5px solid var(--border)", borderRadius: 9, fontSize: 15, fontWeight: 700, outline: "none", background: "var(--bg-input)", color: "var(--text-primary)", marginBottom: 12 }} />
            <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>Date</label>
            <input type="date" value={eDate} onChange={e => setEDate(e.target.value)} style={{ width: "100%", boxSizing: "border-box", padding: "10px 13px", border: "1.5px solid var(--border)", borderRadius: 9, fontSize: 14, outline: "none", background: "var(--bg-input)", color: "var(--text-primary)", marginBottom: 12 }} />
            <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>Method</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6, marginBottom: 12 }}>
              {["cash", "upi", "card"].map(m => (
                <button key={m} onClick={() => setEMethod(m)} style={{ padding: "9px 4px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", textTransform: "capitalize", border: `1px solid ${eMethod === m ? "var(--accent-primary)" : "var(--border-hard)"}`, background: eMethod === m ? "var(--accent-primary)" : "var(--bg-input)", color: eMethod === m ? "#0b1830" : "var(--text-secondary)" }}>{m}</button>
              ))}
            </div>
            <input value={eNote} onChange={e => setENote(e.target.value)} placeholder="Remarks (optional)" style={{ width: "100%", boxSizing: "border-box", padding: "10px 13px", border: "1.5px solid var(--border)", borderRadius: 9, fontSize: 13, outline: "none", background: "var(--bg-input)", color: "var(--text-primary)", marginBottom: 16 }} />
            <button onClick={saveEdit} disabled={saving || !(Number(eAmt) > 0)} style={{ width: "100%", padding: "13px", borderRadius: 10, border: "none", cursor: saving ? "not-allowed" : "pointer", fontSize: 15, fontWeight: 800, background: Number(eAmt) > 0 ? "var(--accent-primary)" : "var(--bg-input)", color: Number(eAmt) > 0 ? "#0b1830" : "var(--text-secondary)", opacity: saving ? 0.7 : 1 }}>{saving ? "Saving…" : "Save changes"}</button>
          </div>
        </div>
      )}
    </ProtectedLayout>
  );
}
