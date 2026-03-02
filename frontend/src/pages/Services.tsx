import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, X, ChevronDown, ChevronRight, Tag, IndianRupee } from "lucide-react";
import api from "../api/client";
import type { Service } from "../types";

const SERVICE_COLORS = [
  { bg: "#eff6ff", border: "#bfdbfe", icon: "#3b82f6" },
  { bg: "#f0fdf4", border: "#bbf7d0", icon: "#22c55e" },
  { bg: "#fdf4ff", border: "#e9d5ff", icon: "#a855f7" },
  { bg: "#fff7ed", border: "#fed7aa", icon: "#f97316" },
  { bg: "#fef2f2", border: "#fecaca", icon: "#ef4444" },
  { bg: "#f0fdfa", border: "#99f6e4", icon: "#14b8a6" },
  { bg: "#fefce8", border: "#fef08a", icon: "#eab308" },
  { bg: "#f8fafc", border: "#e2e8f0", icon: "#64748b" },
];

export default function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", price: "", parent_id: "" });
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const res = await api.get("/services");
    setServices(res.data);
  };

  useEffect(() => { load(); }, []);

  const toggle = (id: string) => {
    const s = new Set(expanded);
    s.has(id) ? s.delete(id) : s.add(id);
    setExpanded(s);
  };

  const openNew = (parentId = "") => {
    setForm({ name: "", price: "", parent_id: parentId });
    setEditId(null);
    setShowForm(true);
  };

  const openEdit = (svc: Service) => {
    setForm({ name: svc.name, price: svc.price?.toString() || "", parent_id: svc.parent_id || "" });
    setEditId(svc.id);
    setShowForm(true);
  };

  const save = async () => {
    setLoading(true);
    try {
      const body: any = { name: form.name };
      if (form.price) body.price = parseFloat(form.price);
      if (form.parent_id) body.parent_id = form.parent_id;
      if (editId) {
        await api.put(`/services/${editId}`, body);
      } else {
        await api.post("/services", body);
      }
      setShowForm(false);
      load();
    } catch (e: any) {
      alert(e.response?.data?.detail || "Error saving");
    } finally {
      setLoading(false);
    }
  };

  const del = async (id: string) => {
    if (!confirm("Deactivate this service?")) return;
    await api.delete(`/services/${id}`);
    load();
  };

  return (
    <div>
      <div style={s.header}>
        <div>
          <h2 style={s.title}>Services & Pricing</h2>
          <p style={s.subtitle}>{services.length} services configured</p>
        </div>
        <button style={s.addBtn} onClick={() => openNew()}>
          <Plus size={18} /> Add Service
        </button>
      </div>

      <div style={s.grid}>
        {services.map((svc, idx) => {
          const color = SERVICE_COLORS[idx % SERVICE_COLORS.length];
          const isExpanded = expanded.has(svc.id);
          return (
            <div key={svc.id} style={{ ...s.card, borderTop: `3px solid ${color.icon}` }}>
              <div style={s.cardTop}>
                <div style={{ ...s.iconBox, background: color.bg, border: `1px solid ${color.border}` }}>
                  <Tag size={18} color={color.icon} />
                </div>
                <div style={s.cardInfo}>
                  <div style={s.serviceName}>{svc.name}</div>
                  {svc.price !== null ? (
                    <div style={{ ...s.priceTag, color: color.icon }}>
                      <IndianRupee size={12} /> {svc.price}
                    </div>
                  ) : (
                    <div style={s.subCount}>{svc.children.length} sub-items</div>
                  )}
                </div>
                <div style={s.cardActions}>
                  {svc.children.length > 0 && (
                    <button style={s.iconBtn} onClick={() => openNew(svc.id)} title="Add sub-item">
                      <Plus size={15} color="#3b82f6" />
                    </button>
                  )}
                  <button style={s.iconBtn} onClick={() => openEdit(svc)}>
                    <Edit2 size={15} color="#64748b" />
                  </button>
                  <button style={s.iconBtn} onClick={() => del(svc.id)}>
                    <Trash2 size={15} color="#ef4444" />
                  </button>
                  {svc.children.length > 0 && (
                    <button style={{ ...s.iconBtn, background: color.bg }} onClick={() => toggle(svc.id)}>
                      {isExpanded ? <ChevronDown size={15} color={color.icon} /> : <ChevronRight size={15} color={color.icon} />}
                    </button>
                  )}
                </div>
              </div>

              {isExpanded && svc.children.length > 0 && (
                <div style={s.subList}>
                  {svc.children.map(child => (
                    <div key={child.id} style={s.subItem}>
                      <div style={s.subLeft}>
                        <div style={{ ...s.subDot, background: color.icon }} />
                        <span style={s.subName}>{child.name}</span>
                        <span style={{ ...s.subPrice, color: color.icon }}>₹{child.price}</span>
                      </div>
                      <div style={s.cardActions}>
                        <button style={s.iconBtn} onClick={() => openEdit(child)}>
                          <Edit2 size={13} color="#64748b" />
                        </button>
                        <button style={s.iconBtn} onClick={() => del(child.id)}>
                          <Trash2 size={13} color="#ef4444" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showForm && (
        <div style={s.overlay} onClick={() => setShowForm(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <h3 style={{ margin: 0, color: "#1e3a8a" }}>{editId ? "✏️ Edit" : "➕ Add"} Service</h3>
              <X size={20} style={{ cursor: "pointer", color: "#64748b" }} onClick={() => setShowForm(false)} />
            </div>
            {form.parent_id && (
              <div style={s.parentNote}>Adding sub-item to parent service</div>
            )}
            <label style={s.formLabel}>Service Name</label>
            <input style={s.input} placeholder="e.g. Steam Iron" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <label style={s.formLabel}>Price (₹)</label>
            <input style={s.input} placeholder="e.g. 15" type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
            <button style={{ ...s.saveBtn, opacity: !form.name ? 0.5 : 1 }} onClick={save} disabled={loading || !form.name}>
              {loading ? "Saving..." : "Save Service"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 },
  title: { color: "#1e3a8a", margin: 0, fontSize: 22 },
  subtitle: { color: "#94a3b8", fontSize: 13, margin: "4px 0 0" },
  addBtn: { display: "flex", alignItems: "center", gap: 6, background: "#1e40af", color: "#fff", border: "none", borderRadius: 10, padding: "10px 18px", fontSize: 14, fontWeight: 600, cursor: "pointer", boxShadow: "0 2px 8px rgba(30,64,175,0.3)" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 },
  card: { background: "#fff", borderRadius: 12, padding: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", transition: "box-shadow 0.2s" },
  cardTop: { display: "flex", alignItems: "center", gap: 12 },
  iconBox: { width: 42, height: 42, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  cardInfo: { flex: 1, minWidth: 0 },
  serviceName: { fontWeight: 700, fontSize: 15, color: "#1e293b", marginBottom: 2 },
  priceTag: { display: "flex", alignItems: "center", gap: 2, fontWeight: 700, fontSize: 14 },
  subCount: { fontSize: 12, color: "#94a3b8", fontWeight: 500 },
  cardActions: { display: "flex", gap: 4, flexShrink: 0 },
  iconBtn: { width: 28, height: 28, border: "none", borderRadius: 6, background: "#f8fafc", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  subList: { marginTop: 12, borderTop: "1px solid #f1f5f9", paddingTop: 10 },
  subItem: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0" },
  subLeft: { display: "flex", alignItems: "center", gap: 8 },
  subDot: { width: 6, height: 6, borderRadius: 3, flexShrink: 0 },
  subName: { fontSize: 13, color: "#475569", fontWeight: 500 },
  subPrice: { fontSize: 13, fontWeight: 700 },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 16 },
  modal: { background: "#fff", borderRadius: 16, padding: 24, width: "100%", maxWidth: 400, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  parentNote: { background: "#eff6ff", color: "#3b82f6", fontSize: 12, padding: "6px 12px", borderRadius: 6, marginBottom: 12 },
  formLabel: { display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6 },
  input: { width: "100%", padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 8, marginBottom: 14, fontSize: 14, outline: "none", boxSizing: "border-box" as const },
  saveBtn: { width: "100%", padding: 12, background: "#1e40af", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" },
};