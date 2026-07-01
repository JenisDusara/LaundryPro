"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, X, Check, Eye, EyeOff, RefreshCw } from "lucide-react";
import ProtectedLayout from "@/components/ProtectedLayout";
import api from "@/lib/api";

interface StaffMember {
  id: string; username: string; name: string;
  is_active: boolean; created_at: string;
  role?: string; shop_name?: string;
}

const emptyForm = { username: "", password: "", name: "" };
const AVATAR_COLORS = ["#2563eb","#7c3aed","#059669","#d97706","#dc2626","#0891b2"];

export default function StaffPage() {
  const router = useRouter();
  const [myRole, setMyRole] = useState<string>("");
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const flash = (text: string, ok: boolean) => {
    setMsg({ text, ok }); setTimeout(() => setMsg(null), 4000);
  };

  const load = () => {
    setLoading(true);
    api.get("/staff").then(r => setStaff(r.data)).catch(() => flash("Failed to load staff", false)).finally(() => setLoading(false));
  };

  useEffect(() => {
    api.get("/auth/me").then(r => {
      const r_role = r.data.role;
      if (!["admin", "superadmin"].includes(r_role)) { router.replace("/dashboard"); return; }
      setMyRole(r_role);
      load();
    }).catch(() => router.replace("/login"));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async () => {
    if (!form.username || !form.password) { flash("Username and password are required", false); return; }
    if (form.password.length < 6) { flash("Password must be at least 6 characters", false); return; }
    setSaving(true);
    try {
      const res = await api.post("/staff", form);
      setStaff(s => [...s, res.data]);
      flash("Staff member added!", true);
      setForm(emptyForm); setShowForm(false);
    } catch (e: any) { flash(e.response?.data?.detail || "Failed to add staff", false); }
    finally { setSaving(false); }
  };

  const deleteStaff = async (id: string) => {
    try {
      await api.delete(`/staff/${id}`);
      setStaff(s => s.filter(x => x.id !== id));
      flash("Staff member removed", true);
    } catch { flash("Failed to remove", false); }
    setDeleteId(null);
  };

  const inp: React.CSSProperties = { width: "100%", padding: "11px 14px", border: "1px solid var(--border-hard)", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box", background: "var(--bg-input)", color: "var(--text-primary)" };
  const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6, display: "block" };

  return (
    <ProtectedLayout>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 4 }}>Team</div>
          <h2 style={{ color: "var(--text-primary)", margin: "0 0 4px", fontSize: 26, fontWeight: 900, letterSpacing: -0.5 }}>Staff</h2>
          <p style={{ color: "var(--text-muted)", fontSize: 13, margin: 0 }}>
            {staff.length} member{staff.length !== 1 ? "s" : ""}
            {staff.length > 0 && ` · ${staff.filter(s => s.is_active).length} active`}
          </p>
        </div>
        {["admin", "superadmin"].includes(myRole) && (
          <button onClick={() => { setForm(emptyForm); setShowForm(true); }}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "#2563eb", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(37,99,235,0.28)" }}>
            <Plus size={16} /> Add staff
          </button>
        )}
      </div>

      {msg && (
        <div style={{ padding: "12px 18px", borderRadius: 10, marginBottom: 16, fontSize: 13, fontWeight: 600, background: msg.ok ? "rgba(5,150,105,0.1)" : "rgba(239,68,68,0.1)", color: msg.ok ? "#059669" : "#ef4444", border: `1px solid ${msg.ok ? "rgba(5,150,105,0.25)" : "rgba(239,68,68,0.25)"}` }}>
          {msg.text}
        </div>
      )}

      {/* Staff grid */}
      {loading ? (
        <div style={{ padding: "60px 20px", textAlign: "center", color: "var(--text-muted)" }}>
          <RefreshCw size={28} style={{ margin: "0 auto 12px", display: "block", opacity: 0.3 }} />
          <div style={{ fontWeight: 600 }}>Loading staff…</div>
        </div>
      ) : staff.length === 0 ? (
        <div style={{ padding: "60px 20px", textAlign: "center", color: "var(--text-muted)" }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>No staff members yet</div>
          <div style={{ fontSize: 13 }}>Add your first staff member above</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
          {staff.map((s, i) => {
            const avatarColor = AVATAR_COLORS[i % AVATAR_COLORS.length];
            const roleName: string = s.role || "Staff";
            const shopName: string | undefined = s.shop_name;
            const isSuperAdmin = roleName.toLowerCase().includes("super") || roleName.toLowerCase() === "admin";
            return (
              <div key={s.id} style={{ background: "var(--bg-card)", borderRadius: 14, border: "1px solid var(--border-hard)", padding: "20px 20px 16px", opacity: s.is_active ? 1 : 0.6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: s.is_active ? `${avatarColor}22` : "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center", color: s.is_active ? avatarColor : "var(--text-muted)", fontWeight: 800, fontSize: 18, flexShrink: 0 }}>
                    {s.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{shopName || `@${s.username}`}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 20, background: isSuperAdmin ? "#2563eb" : "transparent", color: isSuperAdmin ? "#fff" : "var(--text-secondary)", border: isSuperAdmin ? "none" : "1px solid var(--border-hard)" }}>
                    {roleName}
                  </span>
                  {["admin", "superadmin"].includes(myRole) && (
                    <button onClick={() => setDeleteId(s.id)} style={{ width: 30, height: 30, border: "1px solid var(--border-hard)", borderRadius: 8, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Trash2 size={13} color="#ef4444" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add staff modal */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 16 }} onClick={() => setShowForm(false)}>
          <div style={{ background: "var(--bg-card)", borderRadius: 16, padding: 24, width: "100%", maxWidth: 420, border: "1px solid var(--border-hard)" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <h3 style={{ margin: 0, color: "var(--text-primary)", fontSize: 17, fontWeight: 800 }}>Add staff member</h3>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--text-muted)" }}>They'll be able to log in and use your shop's data</p>
              </div>
              <X size={20} style={{ cursor: "pointer", color: "var(--text-secondary)", flexShrink: 0 }} onClick={() => setShowForm(false)} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Name</label>
              <input style={inp} placeholder="e.g. Raju Prasad" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div>
                <label style={lbl}>Username *</label>
                <input style={inp} placeholder="Login username" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
              </div>
              <div>
                <label style={lbl}>Password *</label>
                <div style={{ position: "relative" }}>
                  <input type={showPass ? "text" : "password"} style={{ ...inp, paddingRight: 42 }} placeholder="Min 6 chars" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                  <button onClick={() => setShowPass(v => !v)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", display: "flex", padding: 2 }}>
                    {showPass ? <EyeOff size={16} color="var(--text-muted)" /> : <Eye size={16} color="var(--text-muted)" />}
                  </button>
                </div>
              </div>
            </div>
            <div style={{ background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.2)", borderRadius: 8, padding: "10px 14px", marginBottom: 18, fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>
              Staff can access: Dashboard, New Entry, Customers, Entries, Deliveries. They cannot access Reports, Accounting, Labour, or Settings.
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button onClick={() => setShowForm(false)} style={{ padding: "10px 22px", border: "1px solid var(--border-hard)", borderRadius: 9, background: "transparent", fontSize: 14, fontWeight: 600, cursor: "pointer", color: "var(--text-secondary)" }}>Cancel</button>
              <button onClick={save} disabled={saving || !form.username || !form.password}
                style={{ padding: "10px 28px", border: "none", borderRadius: 9, fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", gap: 8, cursor: saving || !form.username || !form.password ? "not-allowed" : "pointer", background: saving || !form.username || !form.password ? "var(--bg-elevated)" : "#2563eb", color: saving || !form.username || !form.password ? "var(--text-muted)" : "#fff", opacity: saving || !form.username || !form.password ? 0.6 : 1 }}>
                <Check size={15} /> {saving ? "Adding…" : "Add Staff"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={() => setDeleteId(null)}>
          <div style={{ background: "var(--bg-card)", borderRadius: 16, padding: 28, maxWidth: 340, width: "100%", border: "1px solid var(--border-hard)" }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: "center", marginBottom: 22 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(239,68,68,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                <Trash2 size={24} color="#ef4444" />
              </div>
              <div style={{ fontWeight: 800, fontSize: 17, color: "var(--text-primary)", marginBottom: 6 }}>Remove staff member?</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>They will no longer be able to log in. This cannot be undone.</div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button onClick={() => setDeleteId(null)} style={{ padding: "10px 22px", border: "1px solid var(--border-hard)", borderRadius: 9, background: "transparent", fontSize: 14, fontWeight: 600, cursor: "pointer", color: "var(--text-secondary)" }}>Cancel</button>
              <button onClick={() => deleteStaff(deleteId)} style={{ padding: "10px 28px", border: "none", borderRadius: 9, background: "#ef4444", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Remove</button>
            </div>
          </div>
        </div>
      )}
    </ProtectedLayout>
  );
}
