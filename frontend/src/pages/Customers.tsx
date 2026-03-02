import { useState, useEffect } from "react";
import { Search, Plus, Edit2, Trash2, X } from "lucide-react";
import api from "../api/client";
import type { Customer } from "../types";

const empty = { name: "", phone: "", flat_number: "", society_name: "", address: "", email: "" };

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async (q = "") => {
    const res = await api.get("/customers", { params: q ? { search: q } : {} });
    setCustomers(res.data);
  };

  useEffect(() => { load(); }, []);

  const handleSearch = (v: string) => {
    setSearch(v);
    load(v);
  };

  const openNew = () => {
    setForm(empty);
    setEditId(null);
    setShowForm(true);
  };

  const openEdit = (c: Customer) => {
    setForm({ name: c.name, phone: c.phone, flat_number: c.flat_number, society_name: c.society_name, address: c.address, email: c.email || "" });
    setEditId(c.id);
    setShowForm(true);
  };

  const save = async () => {
    setLoading(true);
    try {
      if (editId) {
        await api.put(`/customers/${editId}`, form);
      } else {
        await api.post("/customers", form);
      }
      setShowForm(false);
      load(search);
    } catch (e: any) {
      alert(e.response?.data?.detail || "Error saving");
    } finally {
      setLoading(false);
    }
  };

  const del = async (id: string) => {
    if (!confirm("Delete this customer?")) return;
    await api.delete(`/customers/${id}`);
    load(search);
  };

  const set = (k: string, v: string) => setForm({ ...form, [k]: v });

  return (
    <div>
      <div style={s.header}>
        <h2 style={s.title}>Customers</h2>
        <button style={s.addBtn} onClick={openNew}><Plus size={18} /> Add</button>
      </div>

      {/* Search */}
      <div style={s.searchBox}>
        <Search size={18} color="#94a3b8" />
        <input style={s.searchInput} placeholder="Search by name or phone..." value={search} onChange={e => handleSearch(e.target.value)} />
      </div>

      {/* Customer List */}
      <div style={s.list}>
        {customers.length === 0 && <p style={{ color: "#94a3b8", textAlign: "center", padding: 32 }}>No customers found</p>}
        {customers.map(c => (
          <div key={c.id} style={s.card}>
            <div style={s.cardBody}>
              <div style={s.name}>{c.name}</div>
              <div style={s.info}>📱 {c.phone}</div>
              {c.flat_number && <div style={s.info}>🏠 Flat: {c.flat_number}</div>}
              {c.society_name && <div style={s.info}>🏘️ {c.society_name}</div>}
            </div>
            <div style={s.actions}>
              <Edit2 size={18} color="#3b82f6" style={{ cursor: "pointer" }} onClick={() => openEdit(c)} />
              <Trash2 size={18} color="#ef4444" style={{ cursor: "pointer" }} onClick={() => del(c.id)} />
            </div>
          </div>
        ))}
      </div>

      {/* Modal Form */}
      {showForm && (
        <div style={s.overlay} onClick={() => setShowForm(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <h3 style={{ margin: 0 }}>{editId ? "Edit" : "New"} Customer</h3>
              <X size={20} style={{ cursor: "pointer" }} onClick={() => setShowForm(false)} />
            </div>
            <input style={s.input} placeholder="Name *" value={form.name} onChange={e => set("name", e.target.value)} />
            <input style={s.input} placeholder="Phone *" value={form.phone} onChange={e => set("phone", e.target.value)} />
            <input style={s.input} placeholder="Flat Number" value={form.flat_number} onChange={e => set("flat_number", e.target.value)} />
            <input style={s.input} placeholder="Flat Name" value={form.society_name} onChange={e => set("society_name", e.target.value)} />
            <input style={s.input} placeholder="Address" value={form.address} onChange={e => set("address", e.target.value)} />
            <input style={s.input} placeholder="Email (optional)" value={form.email} onChange={e => set("email", e.target.value)} />
            <button style={s.saveBtn} onClick={save} disabled={loading || !form.name || !form.phone}>
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  title: { color: "#1e3a8a", margin: 0 },
  addBtn: { display: "flex", alignItems: "center", gap: 6, background: "#1e40af", color: "#fff", border: "none", borderRadius: 8, padding: "10px 16px", fontSize: 14, fontWeight: 600, cursor: "pointer" },
  searchBox: { display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 14px", marginBottom: 16 },
  searchInput: { border: "none", outline: "none", flex: 1, fontSize: 14 },
  list: { display: "flex", flexDirection: "column", gap: 10 },
  card: { background: "#fff", borderRadius: 10, padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" },
  cardBody: { flex: 1 },
  name: { fontWeight: 600, fontSize: 15, color: "#1e293b" },
  info: { fontSize: 13, color: "#64748b", marginTop: 2 },
  actions: { display: "flex", gap: 12 },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 16 },
  modal: { background: "#fff", borderRadius: 12, padding: 24, width: "100%", maxWidth: 400 },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  input: { width: "100%", padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 8, marginBottom: 10, fontSize: 14, outline: "none", boxSizing: "border-box" as const },
  saveBtn: { width: "100%", padding: 12, background: "#1e40af", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", marginTop: 4 },
};