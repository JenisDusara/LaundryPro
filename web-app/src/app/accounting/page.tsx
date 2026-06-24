"use client";
import { useState } from "react";
import { Wallet, Plus, Trash2, X, Check } from "lucide-react";
import ProtectedLayout from "@/components/ProtectedLayout";
import { useAuth } from "@/context/AuthContext";
import { DEMO_EXPENSES } from "@/lib/demo-data";

const CATEGORIES = ["Rent", "Electricity", "Salaries", "Raw Material", "Maintenance", "Transport", "Other"];

type Expense = { id: string; date: string; category: string; description: string; amount: string };

export default function AccountingPage() {
  const { isAuth } = useAuth();
  const [allExpenses, setAllExpenses] = useState<Expense[]>(DEMO_EXPENSES);
  const [month,    setMonth]    = useState(new Date().getMonth() + 1);
  const [year,     setYear]     = useState(new Date().getFullYear());
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState({ date: new Date().toISOString().slice(0, 10), category: "Rent", description: "", amount: "" });
  const [saving,   setSaving]   = useState(false);
  const [msg,      setMsg]      = useState<{ text: string; ok: boolean } | null>(null);

  const expenses = allExpenses.filter(e => {
    const [y, m] = e.date.split("-");
    return parseInt(m) === month && parseInt(y) === year;
  });

  const flash = (text: string, ok: boolean) => { setMsg({ text, ok }); setTimeout(() => setMsg(null), 3000); };

  const save = () => {
    if (!form.amount || !form.date) { flash("Fill all fields", false); return; }
    setSaving(true);
    const newE: Expense = { id: "ex_" + Date.now(), ...form };
    setAllExpenses(es => [newE, ...es]);
    flash("Expense added!", true); setShowForm(false); setForm(f => ({ ...f, amount: "", description: "" }));
    setSaving(false);
  };

  const del = (id: string) => {
    setAllExpenses(es => es.filter(e => e.id !== id));
    flash("Deleted", true);
  };

  const total = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const byCategory: Record<string, number> = {};
  expenses.forEach(e => { byCategory[e.category] = (byCategory[e.category] || 0) + Number(e.amount); });

  const inp: React.CSSProperties = { width: "100%", padding: "10px 12px", border: "1.5px solid #e2e8f0", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box", background: "#f8fafc" };
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  return (
    <ProtectedLayout>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>

      <div style={{ animation: "fadeUp 0.3s ease both", background: "linear-gradient(135deg,#831843,#be185d)", borderRadius: 20, padding: "22px 28px", marginBottom: 20, color: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}><Wallet size={24} /></div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 20 }}>Accounting</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>Total: ₹{total.toLocaleString("en-IN")}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select value={month} onChange={e => setMonth(Number(e.target.value))} style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.15)", color: "#fff", fontSize: 13, outline: "none" }}>
            {months.map((m, i) => <option key={i} value={i + 1} style={{ color: "#0f172a" }}>{m}</option>)}
          </select>
          <select value={year} onChange={e => setYear(Number(e.target.value))} style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.15)", color: "#fff", fontSize: 13, outline: "none" }}>
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y} style={{ color: "#0f172a" }}>{y}</option>)}
          </select>
          {isAuth && (
            <button onClick={() => setShowForm(v => !v)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 10, border: "none", background: "#be185d", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              <Plus size={15} /> Add
            </button>
          )}
        </div>
      </div>

      {msg && <div style={{ padding: "11px 16px", borderRadius: 12, marginBottom: 16, fontSize: 13, fontWeight: 600, background: msg.ok ? "#f0fdf4" : "#fef2f2", color: msg.ok ? "#16a34a" : "#dc2626" }}>{msg.text}</div>}

      {isAuth && showForm && (
        <div style={{ background: "#fff", borderRadius: 16, padding: 20, marginBottom: 20, border: "1.5px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontWeight: 800 }}>Add Expense</div>
            <button onClick={() => setShowForm(false)} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, padding: 6, cursor: "pointer" }}><X size={15} color="#64748b" /></button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div><div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 5 }}>Date</div><input type="date" style={inp} value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
            <div><div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 5 }}>Category</div>
              <select style={inp} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div><div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 5 }}>Amount (₹)</div><input type="number" style={inp} value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" /></div>
            <div style={{ gridColumn: "1 / -1" }}><div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 5 }}>Description</div><input style={inp} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional note" /></div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: 10, border: "1.5px solid #e2e8f0", borderRadius: 10, background: "#f8fafc", fontWeight: 600, fontSize: 13, cursor: "pointer", color: "#64748b" }}>Cancel</button>
            <button onClick={save} disabled={saving} style={{ flex: 2, padding: 10, border: "none", borderRadius: 10, background: "linear-gradient(135deg,#831843,#be185d)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              <Check size={14} style={{ display: "inline", marginRight: 6 }} />{saving ? "Saving…" : "Add Expense"}
            </button>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
        {/* Expense list */}
        <div style={{ background: "#fff", borderRadius: 18, border: "1.5px solid #e2e8f0", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #f1f5f9", fontWeight: 800, fontSize: 14 }}>Expenses ({expenses.length})</div>
          {expenses.length === 0 ? (
            <div style={{ padding: "40px 20px", textAlign: "center", color: "#94a3b8" }}>
              <Wallet size={36} style={{ margin: "0 auto 12px", display: "block", opacity: 0.2 }} />
              <div style={{ fontWeight: 700 }}>No expenses this month</div>
            </div>
          ) : (
            expenses.map((e, i) => (
              <div key={e.id} style={{ display: "flex", alignItems: "center", padding: "12px 20px", borderBottom: i < expenses.length - 1 ? "1px solid #f8fafc" : "none", gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{e.category}</div>
                  {e.description && <div style={{ fontSize: 12, color: "#94a3b8" }}>{e.description}</div>}
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>{e.date}</div>
                </div>
                <div style={{ fontWeight: 800, fontSize: 15, color: "#dc2626" }}>₹{Number(e.amount).toLocaleString("en-IN")}</div>
                {isAuth && <button onClick={() => del(e.id)} style={{ width: 28, height: 28, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 7, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Trash2 size={12} color="#dc2626" /></button>}
              </div>
            ))
          )}
        </div>

        {/* Category breakdown */}
        <div style={{ background: "#fff", borderRadius: 18, border: "1.5px solid #e2e8f0", padding: 20, boxShadow: "0 4px 20px rgba(0,0,0,0.06)", alignSelf: "start" }}>
          <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 16 }}>By Category</div>
          {Object.entries(byCategory).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
            <div key={cat} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{cat}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: "#dc2626" }}>₹{amt.toLocaleString("en-IN")}</span>
              </div>
              <div style={{ height: 6, background: "#f1f5f9", borderRadius: 3 }}>
                <div style={{ height: 6, background: "linear-gradient(135deg,#be185d,#ec4899)", borderRadius: 3, width: `${Math.round((amt / total) * 100)}%` }} />
              </div>
            </div>
          ))}
          {Object.keys(byCategory).length === 0 && <div style={{ color: "#94a3b8", fontSize: 13 }}>No data for this month</div>}
          {total > 0 && (
            <div style={{ marginTop: 16, padding: "12px 14px", background: "#fdf2f8", borderRadius: 12, border: "1px solid #fbcfe8" }}>
              <div style={{ fontSize: 11, color: "#be185d", fontWeight: 700 }}>TOTAL EXPENSES</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#be185d" }}>₹{total.toLocaleString("en-IN")}</div>
            </div>
          )}
        </div>
      </div>
    </ProtectedLayout>
  );
}
