"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Building2, Plus, Trash2, X, Eye, EyeOff, ShieldCheck, Pencil, Check } from "lucide-react";
import api from "@/lib/api";
import ProtectedLayout from "@/components/ProtectedLayout";

interface Client {
  id: string;
  username: string;
  name: string;
  shop_id: string;
  shop_name: string;
  created_at: string;
}

const emptyForm = { username: "", password: "", name: "", shop_id: "", shop_name: "" };

export default function SuperAdminPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [editForm, setEditForm] = useState({ username: "", name: "", shop_id: "", shop_name: "", password: "" });
  const [editSaving, setEditSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [showPass, setShowPass] = useState(false);
  const [showEditPass, setShowEditPass] = useState(false);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    api.get("/auth/me").then(r => {
      if (r.data.role !== "superadmin") { router.replace("/dashboard"); return; }
      load();
    }).catch(() => router.replace("/login"));
  }, []);

  const load = () => {
    setLoading(true);
    api.get("/admin/shops").then(r => setClients(r.data)).finally(() => setLoading(false));
  };

  const flash = (text: string, ok: boolean) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 4000);
  };

  const save = async () => {
    if (!form.username || !form.password || !form.shop_id || !form.shop_name) {
      flash("All fields are required", false); return;
    }
    setSaving(true);
    try {
      await api.post("/admin/shops", form);
      flash("Client created successfully!", true);
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch (e: any) {
      flash(e.response?.data?.detail || "Failed to create client", false);
    } finally { setSaving(false); }
  };

  const openEdit = (c: Client) => {
    setEditClient(c);
    setEditForm({ username: c.username, name: c.name, shop_id: c.shop_id, shop_name: c.shop_name, password: "" });
    setShowEditPass(false);
  };

  const saveEdit = async () => {
    if (!editClient) return;
    if (!editForm.username || !editForm.shop_id || !editForm.shop_name) {
      flash("Username, Shop ID and Shop Name are required", false); return;
    }
    setEditSaving(true);
    try {
      const payload: any = {
        username: editForm.username,
        name: editForm.name,
        shop_id: editForm.shop_id,
        shop_name: editForm.shop_name,
      };
      if (editForm.password) payload.password = editForm.password;
      const res = await api.put(`/admin/shops/${editClient.id}`, payload);
      setClients(cs => cs.map(c => c.id === editClient.id ? { ...c, ...res.data } : c));
      flash("Client updated successfully!", true);
      setEditClient(null);
    } catch (e: any) {
      flash(e.response?.data?.detail || "Failed to update", false);
    } finally { setEditSaving(false); }
  };

  const deleteClient = async (id: string) => {
    try {
      await api.delete(`/admin/users/${id}`);
      setClients(c => c.filter(x => x.id !== id));
    } catch (e: any) {
      flash(e.response?.data?.detail || "Failed to delete", false);
    }
    setDeleteId(null);
  };

  const inp = (field: keyof typeof form, placeholder: string, type = "text") => (
    <input type={type} placeholder={placeholder} value={form[field]}
      onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
      style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #e2e8f0", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box", background: "#f8fafc" }} />
  );

  const eInp = (field: keyof typeof editForm, placeholder: string, type = "text") => (
    <input type={type} placeholder={placeholder} value={editForm[field]}
      onChange={e => setEditForm(f => ({ ...f, [field]: e.target.value }))}
      style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #e2e8f0", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box", background: "#f8fafc" }} />
  );

  return (
    <ProtectedLayout>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Header */}
      <div style={{ animation: "fadeUp 0.35s ease both", background: "linear-gradient(135deg,#0f172a,#1e3a8a,#1d4ed8)", borderRadius: 20, padding: "28px 28px 24px", marginBottom: 24, color: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ShieldCheck size={26} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 22 }}>Super Admin Panel</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>{clients.length} client{clients.length !== 1 ? "s" : ""} registered</div>
          </div>
        </div>
      </div>

      {msg && (
        <div style={{ padding: "12px 16px", borderRadius: 10, marginBottom: 16, fontSize: 14, fontWeight: 600, background: msg.ok ? "#f0fdf4" : "#fef2f2", color: msg.ok ? "#16a34a" : "#dc2626", border: `1px solid ${msg.ok ? "#bbf7d0" : "#fecaca"}` }}>
          {msg.text}
        </div>
      )}

      {/* Add Client Button */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <button onClick={() => { setShowForm(v => !v); setEditClient(null); }}
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 20px", background: "linear-gradient(135deg,#1e3a8a,#1d4ed8)", color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: "pointer", boxShadow: "0 4px 12px rgba(29,78,216,0.3)" }}>
          <Plus size={16} /> Add New Client
        </button>
      </div>

      {/* Add Client Form */}
      {showForm && (
        <div style={{ animation: "fadeUp 0.3s ease both", background: "#fff", borderRadius: 16, padding: 24, marginBottom: 20, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", border: "1.5px solid #e2e8f0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <span style={{ fontWeight: 700, fontSize: 16, color: "#0f172a" }}>New Client</span>
            <button onClick={() => setShowForm(false)} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, padding: 6, cursor: "pointer", display: "flex" }}>
              <X size={16} color="#64748b" />
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 5 }}>Shop Name *</div>
              {inp("shop_name", "e.g. Shree Chamunda Drycleaners")}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 5 }}>Shop ID *</div>
              {inp("shop_id", "e.g. shop2 (unique, no spaces)")}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 5 }}>Username *</div>
              {inp("username", "Login username")}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 5 }}>Password *</div>
              <div style={{ position: "relative" }}>
                <input type={showPass ? "text" : "password"} placeholder="Login password" value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  style={{ width: "100%", padding: "11px 40px 11px 14px", border: "1.5px solid #e2e8f0", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box", background: "#f8fafc" }} />
                <button onClick={() => setShowPass(v => !v)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", display: "flex", padding: 2 }}>
                  {showPass ? <EyeOff size={16} color="#94a3b8" /> : <Eye size={16} color="#94a3b8" />}
                </button>
              </div>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 5 }}>Owner Name (optional)</div>
              {inp("name", "e.g. Harsh Chudasama")}
            </div>
          </div>
          <button onClick={save} disabled={saving}
            style={{ marginTop: 16, width: "100%", padding: "12px", border: "none", borderRadius: 12, background: "linear-gradient(135deg,#1e3a8a,#1d4ed8)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
            {saving ? "Creating..." : "Create Client"}
          </button>
        </div>
      )}

      {/* Clients List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>Loading...</div>
      ) : clients.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>
          <Building2 size={48} style={{ margin: "0 auto 12px", display: "block", opacity: 0.3 }} />
          <div style={{ fontSize: 15, fontWeight: 600 }}>No clients yet</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Add your first client above</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {clients.map((c, i) => (
            <div key={c.id} style={{ animation: `fadeUp 0.3s ease ${i * 0.05}s both`, background: "#fff", borderRadius: 14, padding: "18px 20px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)", border: "1.5px solid #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg,#eff6ff,#dbeafe)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Building2 size={22} color="#1d4ed8" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a", marginBottom: 2 }}>{c.shop_name}</div>
                  <div style={{ fontSize: 13, color: "#64748b" }}>
                    <span style={{ background: "#f1f5f9", padding: "2px 8px", borderRadius: 6, marginRight: 8, fontSize: 12 }}>ID: {c.shop_id}</span>
                    <span>@{c.username}</span>
                    {c.name && c.name !== c.username && <span style={{ color: "#94a3b8" }}> · {c.name}</span>}
                  </div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>
                    Added {new Date(c.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => openEdit(c)}
                    style={{ background: "#eff6ff", border: "1.5px solid #bfdbfe", borderRadius: 10, padding: "8px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: "#1d4ed8", fontWeight: 600, fontSize: 13 }}>
                    <Pencil size={14} /> Edit
                  </button>
                  <button onClick={() => setDeleteId(c.id)}
                    style={{ background: "#fef2f2", border: "1.5px solid #fecaca", borderRadius: 10, padding: "8px 10px", cursor: "pointer", display: "flex", alignItems: "center", color: "#dc2626" }}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Client Modal */}
      {editClient && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={() => setEditClient(null)}>
          <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 480, boxShadow: "0 20px 60px rgba(0,0,0,0.25)", maxHeight: "90vh", overflowY: "auto" }}
            onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={{ background: "linear-gradient(135deg,#0f172a,#1e3a8a)", padding: "22px 24px", borderRadius: "20px 20px 0 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Pencil size={18} color="#fff" />
                </div>
                <div>
                  <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>Edit Client</div>
                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>{editClient.shop_name}</div>
                </div>
              </div>
              <button onClick={() => setEditClient(null)} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, padding: 7, cursor: "pointer", display: "flex" }}>
                <X size={16} color="#fff" />
              </button>
            </div>

            <div style={{ padding: 24 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 5 }}>Shop Name *</div>
                  {eInp("shop_name", "Shop name")}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 5 }}>Shop ID *</div>
                  {eInp("shop_id", "Shop ID")}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 5 }}>Username *</div>
                  {eInp("username", "Login username")}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 5 }}>Owner Name</div>
                  {eInp("name", "Owner name")}
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 5 }}>New Password <span style={{ color: "#94a3b8", fontWeight: 400 }}>(leave blank to keep current)</span></div>
                  <div style={{ position: "relative" }}>
                    <input type={showEditPass ? "text" : "password"} placeholder="Enter new password to change"
                      value={editForm.password} onChange={e => setEditForm(f => ({ ...f, password: e.target.value }))}
                      style={{ width: "100%", padding: "11px 40px 11px 14px", border: "1.5px solid #e2e8f0", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box", background: "#f8fafc" }} />
                    <button onClick={() => setShowEditPass(v => !v)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", display: "flex", padding: 2 }}>
                      {showEditPass ? <EyeOff size={16} color="#94a3b8" /> : <Eye size={16} color="#94a3b8" />}
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                <button onClick={() => setEditClient(null)}
                  style={{ flex: 1, padding: "11px", border: "1.5px solid #e2e8f0", borderRadius: 12, background: "#f8fafc", fontWeight: 600, fontSize: 14, cursor: "pointer", color: "#475569" }}>
                  Cancel
                </button>
                <button onClick={saveEdit} disabled={editSaving}
                  style={{ flex: 2, padding: "11px", border: "none", borderRadius: 12, background: "linear-gradient(135deg,#1e3a8a,#1d4ed8)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: editSaving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: editSaving ? 0.7 : 1 }}>
                  <Check size={16} /> {editSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteId && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={() => setDeleteId(null)}>
          <div style={{ background: "#fff", borderRadius: 18, padding: 28, maxWidth: 340, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                <Trash2 size={26} color="#dc2626" />
              </div>
              <div style={{ fontWeight: 800, fontSize: 17, color: "#0f172a", marginBottom: 6 }}>Delete Client?</div>
              <div style={{ fontSize: 14, color: "#64748b" }}>This will only remove the login. Customer data will remain in the database.</div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setDeleteId(null)} style={{ flex: 1, padding: "11px", border: "1.5px solid #e2e8f0", borderRadius: 10, background: "#f8fafc", fontWeight: 600, fontSize: 14, cursor: "pointer", color: "#475569" }}>
                Cancel
              </button>
              <button onClick={() => deleteClient(deleteId)} style={{ flex: 1, padding: "11px", border: "none", borderRadius: 10, background: "linear-gradient(135deg,#ef4444,#dc2626)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedLayout>
  );
}
