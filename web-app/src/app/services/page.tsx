"use client";
import { useState } from "react";
import { Wrench, Plus, Trash2, X, Check } from "lucide-react";
import ProtectedLayout from "@/components/ProtectedLayout";
import { useAuth } from "@/context/AuthContext";
import { DEMO_SERVICES } from "@/lib/demo-data";

type Child   = { id: string; name: string; parent_id: string | null; price: string | null; children: Child[] };
type Service = { id: string; name: string; parent_id: string | null; price: string | null; children: Child[] };

export default function ServicesPage() {
  const { isAuth } = useAuth();
  const [services, setServices] = useState<Service[]>(DEMO_SERVICES as Service[]);
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState({ name: "", parent_id: "", price: "" });
  const [saving,   setSaving]   = useState(false);
  const [msg,      setMsg]      = useState<{ text: string; ok: boolean } | null>(null);

  const flash = (text: string, ok: boolean) => { setMsg({ text, ok }); setTimeout(() => setMsg(null), 3000); };

  const save = () => {
    if (!form.name) { flash("Name required", false); return; }
    setSaving(true);
    if (form.parent_id) {
      const child: Child = { id: "sc_" + Date.now(), name: form.name, parent_id: form.parent_id, price: form.price || null, children: [] };
      setServices(ss => ss.map(s => s.id === form.parent_id ? { ...s, children: [...s.children, child] } : s));
    } else {
      const parent: Service = { id: "sp_" + Date.now(), name: form.name, parent_id: null, price: form.price || null, children: [] };
      setServices(ss => [...ss, parent]);
    }
    flash("Service added!", true); setForm({ name: "", parent_id: "", price: "" }); setShowForm(false);
    setSaving(false);
  };

  const delParent = (id: string) => { setServices(ss => ss.filter(s => s.id !== id)); flash("Deleted", true); };
  const delChild  = (parentId: string, childId: string) => {
    setServices(ss => ss.map(s => s.id === parentId ? { ...s, children: s.children.filter((c: Child) => c.id !== childId) } : s));
    flash("Deleted", true);
  };

  const inp: React.CSSProperties = { width: "100%", padding: "10px 12px", border: "1.5px solid #e2e8f0", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box", background: "#f8fafc" };
  const parentServices = services.filter(s => !s.parent_id);

  return (
    <ProtectedLayout>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>

      <div style={{ animation: "fadeUp 0.3s ease both", background: "linear-gradient(135deg,#0c4a6e,#0891b2)", borderRadius: 20, padding: "22px 28px", marginBottom: 20, color: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}><Wrench size={24} /></div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 20 }}>Services</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{services.flatMap(s => [s, ...s.children]).length} active</div>
          </div>
        </div>
        {isAuth && (
          <button onClick={() => setShowForm(v => !v)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 11, border: "none", background: "#0891b2", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            <Plus size={15} /> Add Service
          </button>
        )}
      </div>

      {msg && <div style={{ padding: "11px 16px", borderRadius: 12, marginBottom: 16, fontSize: 13, fontWeight: 600, background: msg.ok ? "#f0fdf4" : "#fef2f2", color: msg.ok ? "#16a34a" : "#dc2626" }}>{msg.text}</div>}

      {isAuth && showForm && (
        <div style={{ background: "#fff", borderRadius: 16, padding: 20, marginBottom: 20, border: "1.5px solid #e2e8f0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontWeight: 800 }}>New Service</div>
            <button onClick={() => setShowForm(false)} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, padding: 6, cursor: "pointer" }}><X size={15} color="#64748b" /></button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 5 }}>Name *</div>
              <input style={inp} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Shirt, Pant" />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 5 }}>Category (Parent)</div>
              <select style={inp} value={form.parent_id} onChange={e => setForm(f => ({ ...f, parent_id: e.target.value }))}>
                <option value="">None (Top Level)</option>
                {parentServices.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 5 }}>Price (₹)</div>
              <input style={inp} type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0.00" />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: 10, border: "1.5px solid #e2e8f0", borderRadius: 10, background: "#f8fafc", fontWeight: 600, fontSize: 13, cursor: "pointer", color: "#64748b" }}>Cancel</button>
            <button onClick={save} disabled={saving} style={{ flex: 2, padding: 10, border: "none", borderRadius: 10, background: "linear-gradient(135deg,#0c4a6e,#0891b2)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              <Check size={14} style={{ display: "inline", marginRight: 6 }} />{saving ? "Saving…" : "Add Service"}
            </button>
          </div>
        </div>
      )}

      <div style={{ background: "#fff", borderRadius: 18, border: "1.5px solid #e2e8f0", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
        {parentServices.map((parent, pi) => (
          <div key={parent.id}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 20px", background: "#f8fafc", borderBottom: "1px solid #f1f5f9", borderTop: pi > 0 ? "2px solid #e2e8f0" : "none" }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: "#0f172a" }}>{parent.name}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {parent.price && <span style={{ fontWeight: 700, color: "#059669" }}>₹{Number(parent.price).toFixed(2)}</span>}
                {isAuth && <button onClick={() => delParent(parent.id)} style={{ width: 28, height: 28, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 7, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Trash2 size={12} color="#dc2626" /></button>}
              </div>
            </div>
            {parent.children?.map((child: Child) => (
              <div key={child.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 20px 11px 36px", borderBottom: "1px solid #f8fafc" }}>
                <div style={{ fontSize: 13, color: "#475569" }}>↳ {child.name}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {child.price && <span style={{ fontWeight: 600, color: "#059669", fontSize: 13 }}>₹{Number(child.price).toFixed(2)}</span>}
                  {isAuth && <button onClick={() => delChild(parent.id, child.id)} style={{ width: 26, height: 26, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Trash2 size={11} color="#dc2626" /></button>}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </ProtectedLayout>
  );
}
