"use client";
import { useState, useEffect } from "react";
import { Users, Plus, Search, Phone, MapPin, X, Check, Trash2, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import ProtectedLayout from "@/components/ProtectedLayout";
import { useAuth } from "@/context/AuthContext";
import { DEMO_CUSTOMERS } from "@/lib/demo-data";

const emptyForm = { name: "", phone: "", flat_number: "", society_name: "", address: "", email: "" };

type Customer = typeof DEMO_CUSTOMERS[0];

export default function CustomersPage() {
  const router = useRouter();
  const { isAuth } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search,    setSearch]    = useState("");
  const [showForm,  setShowForm]  = useState(false);
  const [form,      setForm]      = useState(emptyForm);
  const [saving,    setSaving]    = useState(false);
  const [msg,       setMsg]       = useState<{ text: string; ok: boolean } | null>(null);
  const [deleteId,  setDeleteId]  = useState<string | null>(null);

  useEffect(() => { setCustomers(DEMO_CUSTOMERS); }, []);

  const displayed = customers.filter(c =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  const flash = (text: string, ok: boolean) => { setMsg({ text, ok }); setTimeout(() => setMsg(null), 3500); };

  const save = () => {
    if (!form.name || !form.phone) { flash("Name and phone required", false); return; }
    setSaving(true);
    const newC: Customer = { id: "new_" + Date.now(), ...form };
    setCustomers(cs => [newC, ...cs]);
    flash("Customer added!", true); setForm(emptyForm); setShowForm(false);
    setSaving(false);
  };

  const del = (id: string) => {
    setCustomers(cs => cs.filter(c => c.id !== id));
    flash("Deleted", true);
    setDeleteId(null);
  };

  const inp: React.CSSProperties = { width: "100%", padding: "10px 12px", border: "1.5px solid #e2e8f0", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box", background: "#f8fafc" };
  const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em", display: "block" };

  return (
    <ProtectedLayout>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}@keyframes slideIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}.cust-row{transition:background 0.12s}.cust-row:hover{background:#f8fafc!important}`}</style>

      {/* Header */}
      <div style={{ animation: "fadeUp 0.3s ease both", background: "linear-gradient(135deg,#0f172a,#1e3a8a)", borderRadius: 20, padding: "22px 28px", marginBottom: 20, color: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}><Users size={24} /></div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 20 }}>Customers</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{customers.length} registered</div>
          </div>
        </div>
        {isAuth && (
          <button onClick={() => setShowForm(v => !v)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 11, border: "none", background: "#1d4ed8", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            <Plus size={16} /> Add Customer
          </button>
        )}
      </div>

      {msg && <div style={{ animation: "slideIn 0.2s ease both", padding: "11px 16px", borderRadius: 12, marginBottom: 16, fontSize: 13, fontWeight: 600, background: msg.ok ? "#f0fdf4" : "#fef2f2", color: msg.ok ? "#16a34a" : "#dc2626", border: `1px solid ${msg.ok ? "#86efac" : "#fca5a5"}` }}>{msg.text}</div>}

      {/* Add Form */}
      {isAuth && showForm && (
        <div style={{ animation: "slideIn 0.2s ease both", background: "#fff", borderRadius: 16, padding: 22, marginBottom: 20, border: "1.5px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <div style={{ fontWeight: 800, fontSize: 15 }}>New Customer</div>
            <button onClick={() => setShowForm(false)} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, padding: 6, cursor: "pointer" }}><X size={16} color="#64748b" /></button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {([ ["Name *", "name"], ["Phone *", "phone"], ["Flat / House No", "flat_number"], ["Society / Area", "society_name"], ["Address", "address"] ] as [string,string][]).map(([label, key]) => (
              <div key={key} style={key === "address" ? { gridColumn: "1 / -1" } : {}}>
                <label style={lbl}>{label}</label>
                <input style={inp} value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={label.replace(" *", "")} />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: 10, border: "1.5px solid #e2e8f0", borderRadius: 10, background: "#f8fafc", fontWeight: 600, fontSize: 13, cursor: "pointer", color: "#64748b" }}>Cancel</button>
            <button onClick={save} disabled={saving} style={{ flex: 2, padding: 10, border: "none", borderRadius: 10, background: "linear-gradient(135deg,#1e3a8a,#1d4ed8)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Check size={15} /> {saving ? "Saving…" : "Add Customer"}
            </button>
          </div>
        </div>
      )}

      {/* Search + Table */}
      <div style={{ background: "#fff", borderRadius: 18, border: "1.5px solid #e2e8f0", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
            <input placeholder="Search by name or phone…" value={search} onChange={e => setSearch(e.target.value)}
              style={{ ...inp, paddingLeft: 36, marginBottom: 0 }} />
          </div>
        </div>

        {displayed.length === 0 ? (
          <div style={{ padding: "50px 20px", textAlign: "center", color: "#94a3b8" }}>
            <Users size={40} style={{ margin: "0 auto 14px", display: "block", opacity: 0.2 }} />
            <div style={{ fontWeight: 700 }}>{search ? "No results" : "No customers yet"}</div>
          </div>
        ) : (
          <div>
            {displayed.map((c, i) => (
              <div key={c.id} className="cust-row" style={{ display: "flex", alignItems: "center", padding: "14px 20px", borderBottom: i < displayed.length - 1 ? "1px solid #f1f5f9" : "none", gap: 14 }}>
                <div style={{ width: 42, height: 42, borderRadius: 13, background: "linear-gradient(135deg,#1d4ed8,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 17, flexShrink: 0 }}>{c.name.charAt(0).toUpperCase()}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>{c.name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 3, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 12, color: "#64748b", display: "flex", alignItems: "center", gap: 4 }}><Phone size={11} />{c.phone}</span>
                    {(c.society_name || c.address) && <span style={{ fontSize: 12, color: "#94a3b8", display: "flex", alignItems: "center", gap: 4 }}><MapPin size={11} />{c.society_name || c.address}</span>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => router.push(`/customers/${c.id}`)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", background: "#eff6ff", border: "1.5px solid #bfdbfe", borderRadius: 9, cursor: "pointer", color: "#1d4ed8", fontWeight: 600, fontSize: 12 }}><Eye size={13} /> View</button>
                  {isAuth && <button onClick={() => setDeleteId(c.id)} style={{ width: 32, height: 32, background: "#fef2f2", border: "1.5px solid #fecaca", borderRadius: 9, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#dc2626" }}><Trash2 size={13} /></button>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isAuth && deleteId && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={() => setDeleteId(null)}>
          <div style={{ background: "#fff", borderRadius: 20, padding: 28, maxWidth: 320, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}><Trash2 size={24} color="#dc2626" /></div>
              <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 6 }}>Delete Customer?</div>
              <div style={{ fontSize: 13, color: "#64748b" }}>This action cannot be undone.</div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setDeleteId(null)} style={{ flex: 1, padding: 10, border: "1.5px solid #e2e8f0", borderRadius: 10, background: "#f8fafc", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Cancel</button>
              <button onClick={() => del(deleteId)} style={{ flex: 1, padding: 10, border: "none", borderRadius: 10, background: "#dc2626", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </ProtectedLayout>
  );
}
