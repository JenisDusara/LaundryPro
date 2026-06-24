"use client";
import { useState } from "react";
import { Hammer, Plus, Trash2, X, Check } from "lucide-react";
import ProtectedLayout from "@/components/ProtectedLayout";
import { useAuth } from "@/context/AuthContext";
import { DEMO_LABOUR } from "@/lib/demo-data";

type Worker = { id: string; name: string; created_at: string };

export default function LabourPage() {
  const { isAuth } = useAuth();
  const [labours,   setLabours]  = useState<Worker[]>(DEMO_LABOUR);
  const [showForm,  setShowForm] = useState(false);
  const [name,      setName]     = useState("");
  const [saving,    setSaving]   = useState(false);
  const [msg,       setMsg]      = useState<{ text: string; ok: boolean } | null>(null);

  const flash = (text: string, ok: boolean) => { setMsg({ text, ok }); setTimeout(() => setMsg(null), 3000); };

  const save = () => {
    if (!name) { flash("Name required", false); return; }
    setSaving(true);
    const newW: Worker = { id: "l_" + Date.now(), name, created_at: new Date().toISOString() };
    setLabours(ls => [newW, ...ls]);
    flash("Added!", true); setName(""); setShowForm(false);
    setSaving(false);
  };

  const del = (id: string) => {
    setLabours(ls => ls.filter(l => l.id !== id));
    flash("Removed", true);
  };

  return (
    <ProtectedLayout>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>

      <div style={{ animation: "fadeUp 0.3s ease both", background: "linear-gradient(135deg,#064e3b,#059669)", borderRadius: 20, padding: "22px 28px", marginBottom: 20, color: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}><Hammer size={24} /></div>
          <div><div style={{ fontWeight: 800, fontSize: 20 }}>Labour</div><div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>{labours.length} active workers</div></div>
        </div>
        {isAuth && (
          <button onClick={() => setShowForm(v => !v)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 11, border: "none", background: "#059669", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            <Plus size={15} /> Add Worker
          </button>
        )}
      </div>

      {msg && <div style={{ padding: "11px 16px", borderRadius: 12, marginBottom: 16, fontSize: 13, fontWeight: 600, background: msg.ok ? "#f0fdf4" : "#fef2f2", color: msg.ok ? "#16a34a" : "#dc2626" }}>{msg.text}</div>}

      {isAuth && showForm && (
        <div style={{ background: "#fff", borderRadius: 16, padding: 20, marginBottom: 20, border: "1.5px solid #e2e8f0", display: "flex", gap: 10, alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 5 }}>Worker Name</div>
            <input style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #e2e8f0", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box", background: "#f8fafc" }}
              value={name} onChange={e => setName(e.target.value)} placeholder="Enter name" autoFocus />
          </div>
          <button onClick={save} disabled={saving} style={{ padding: "10px 20px", border: "none", borderRadius: 10, background: "linear-gradient(135deg,#064e3b,#059669)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <Check size={14} />{saving ? "…" : "Add"}
          </button>
          <button onClick={() => setShowForm(false)} style={{ padding: "10px 14px", border: "1.5px solid #e2e8f0", borderRadius: 10, background: "#f8fafc", cursor: "pointer" }}><X size={15} color="#64748b" /></button>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
        {labours.map((l, i) => (
          <div key={l.id} style={{ background: "#fff", borderRadius: 16, padding: 20, border: "1.5px solid #e2e8f0", boxShadow: "0 2px 12px rgba(0,0,0,0.05)", animation: `fadeUp 0.3s ease ${i * 0.06}s both` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 13, background: "linear-gradient(135deg,#059669,#34d399)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 18 }}>{l.name.charAt(0).toUpperCase()}</div>
              {isAuth && <button onClick={() => del(l.id)} style={{ width: 30, height: 30, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Trash2 size={13} color="#dc2626" /></button>}
            </div>
            <div style={{ fontWeight: 800, fontSize: 15, color: "#0f172a" }}>{l.name}</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Since {new Date(l.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</div>
          </div>
        ))}
      </div>
    </ProtectedLayout>
  );
}
