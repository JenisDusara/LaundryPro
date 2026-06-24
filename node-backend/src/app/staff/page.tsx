"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Users, Plus, Trash2, X, Check, Eye, EyeOff, RefreshCw, Search } from "lucide-react";
import ProtectedLayout from "@/components/ProtectedLayout";
import api from "@/lib/api";

interface StaffMember {
  id: string; username: string; name: string;
  is_active: boolean; created_at: string;
}

const emptyForm = { username: "", password: "", name: "" };

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function StaffPage() {
  const router = useRouter();
  const [role,      setRole]      = useState<string>("");
  const [staff,     setStaff]     = useState<StaffMember[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");
  const [showForm,  setShowForm]  = useState(false);
  const [form,      setForm]      = useState(emptyForm);
  const [saving,    setSaving]    = useState(false);
  const [showPass,  setShowPass]  = useState(false);
  const [deleteId,  setDeleteId]  = useState<string | null>(null);
  const [msg,       setMsg]       = useState<{ text: string; ok: boolean } | null>(null);

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
      if (r_role !== "admin") { router.replace("/dashboard"); return; }
      setRole(r_role);
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

  const toggleActive = async (s: StaffMember) => {
    try {
      await api.patch(`/staff/${s.id}`, { is_active: !s.is_active });
      setStaff(prev => prev.map(x => x.id === s.id ? { ...x, is_active: !s.is_active } : x));
      flash(`${s.name} ${!s.is_active ? "enabled" : "disabled"}`, true);
    } catch { flash("Failed to update", false); }
  };

  const deleteStaff = async (id: string) => {
    try {
      await api.delete(`/staff/${id}`);
      setStaff(s => s.filter(x => x.id !== id));
      flash("Staff member removed", true);
    } catch { flash("Failed to remove", false); }
    setDeleteId(null);
  };

  const filtered = staff.filter(s =>
    !search ||
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.username.toLowerCase().includes(search.toLowerCase())
  );

  const inp: React.CSSProperties = { width: "100%", padding: "11px 14px", border: "1.5px solid #e2e8f0", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box", background: "#f8fafc", color: "#0f172a" };
  const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" };

  return (
    <ProtectedLayout>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        .row-hover{transition:background 0.12s}.row-hover:hover{background:#f8fafc!important}
        .act-btn{transition:all 0.15s}.act-btn:hover{opacity:0.8;transform:translateY(-1px)}
      `}</style>

      {/* Header */}
      <div style={{ animation: "fadeUp 0.3s ease both", background: "linear-gradient(135deg,#0f172a,#1e3a8a,#2563eb)", borderRadius: 20, padding: "24px 28px", marginBottom: 20, color: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 50, height: 50, borderRadius: 14, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Users size={26} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 22 }}>Staff</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>
                {staff.length} member{staff.length !== 1 ? "s" : ""} · {staff.filter(s => s.is_active).length} active
              </div>
            </div>
          </div>
          {role === "admin" && (
            <button
              onClick={() => { setShowForm(v => !v); }}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 11, border: "1px solid rgba(255,255,255,0.25)", background: "rgba(255,255,255,0.1)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
              <Plus size={16} /> Add Staff
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 20 }}>
        {[
          { label: "Total Staff",   value: staff.length,                              color: "#1d4ed8", bg: "linear-gradient(135deg,#eff6ff,#dbeafe)", border: "#93c5fd" },
          { label: "Active",        value: staff.filter(s => s.is_active).length,     color: "#059669", bg: "linear-gradient(135deg,#f0fdf4,#dcfce7)", border: "#86efac" },
          { label: "Disabled",      value: staff.filter(s => !s.is_active).length,    color: "#dc2626", bg: "linear-gradient(135deg,#fef2f2,#fee2e2)", border: "#fca5a5" },
        ].map((s, i) => (
          <div key={i} style={{ animation: `fadeUp 0.3s ease ${i * 0.07}s both`, background: s.bg, border: `1.5px solid ${s.border}`, borderRadius: 16, padding: "18px 20px" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: s.color, letterSpacing: -0.5 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {msg && (
        <div style={{ animation: "slideIn 0.2s ease both", padding: "12px 18px", borderRadius: 12, marginBottom: 16, fontSize: 14, fontWeight: 600, background: msg.ok ? "#f0fdf4" : "#fef2f2", color: msg.ok ? "#16a34a" : "#dc2626", border: `1.5px solid ${msg.ok ? "#86efac" : "#fca5a5"}` }}>
          {msg.ok ? "✓ " : "✕ "}{msg.text}
        </div>
      )}

      {/* Add form */}
      {showForm && role === "admin" && (
        <div style={{ animation: "slideIn 0.22s ease both", background: "#fff", borderRadius: 18, padding: 24, marginBottom: 20, border: "1.5px solid #e2e8f0", boxShadow: "0 8px 30px rgba(0,0,0,0.08)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16 }}>New Staff Member</div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>They will be able to login and use your shop's data</div>
            </div>
            <button onClick={() => setShowForm(false)} style={{ width: 34, height: 34, background: "#f1f5f9", border: "none", borderRadius: 9, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <X size={16} color="#64748b" />
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 18 }}>
            <div>
              <div style={lbl}>Name</div>
              <input style={inp} placeholder="e.g. Raju Prasad" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <div style={lbl}>Username *</div>
              <input style={inp} placeholder="Login username" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
            </div>
            <div>
              <div style={lbl}>Password *</div>
              <div style={{ position: "relative" }}>
                <input type={showPass ? "text" : "password"} style={{ ...inp, paddingRight: 42 }} placeholder="Min 6 characters" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                <button onClick={() => setShowPass(v => !v)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", display: "flex", padding: 2 }}>
                  {showPass ? <EyeOff size={16} color="#94a3b8" /> : <Eye size={16} color="#94a3b8" />}
                </button>
              </div>
            </div>
          </div>
          <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#92400e" }}>
            Staff can access: Dashboard, New Entry, Customers, Entries, Deliveries. They cannot access Reports, Accounting, Labour, or Settings.
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: "11px", border: "1.5px solid #e2e8f0", borderRadius: 10, background: "#f8fafc", fontWeight: 600, fontSize: 14, cursor: "pointer", color: "#64748b" }}>Cancel</button>
            <button onClick={save} disabled={saving} style={{ flex: 2, padding: "11px", border: "none", borderRadius: 10, background: "linear-gradient(135deg,#1e3a8a,#2563eb)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: saving ? 0.7 : 1, boxShadow: "0 4px 14px rgba(37,99,235,0.3)" }}>
              <Check size={16} /> {saving ? "Adding…" : "Add Staff Member"}
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: 18, border: "1.5px solid #e2e8f0", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
        {/* Toolbar */}
        <div style={{ padding: "14px 20px", borderBottom: "1.5px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", background: "linear-gradient(135deg,#fafafa,#f8fafc)" }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15 }}>All Staff</div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 1 }}>{filtered.length} of {staff.length} members</div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ position: "relative" }}>
              <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
              <input placeholder="Search name or username…" value={search} onChange={e => setSearch(e.target.value)}
                style={{ padding: "9px 14px 9px 34px", border: "1.5px solid #e2e8f0", borderRadius: 10, fontSize: 13, outline: "none", background: "#fff", width: 220, color: "#0f172a" }} />
            </div>
            <button onClick={load} style={{ width: 36, height: 36, borderRadius: 9, border: "1.5px solid #e2e8f0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
              <RefreshCw size={15} />
            </button>
          </div>
        </div>

        {/* Column headers */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 1fr 0.8fr 0.9fr", padding: "10px 20px", background: "#f8fafc", borderBottom: "1px solid #f1f5f9" }}>
          {["Name", "Username", "Added", "Active?", "Actions"].map(h => (
            <div key={h} style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em" }}>{h}</div>
          ))}
        </div>

        {/* Rows */}
        {loading ? (
          <div style={{ padding: "60px 20px", textAlign: "center", color: "#94a3b8" }}>
            <RefreshCw size={28} style={{ margin: "0 auto 12px", display: "block", opacity: 0.3 }} />
            <div style={{ fontWeight: 600 }}>Loading staff…</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "60px 20px", textAlign: "center" }}>
            <Users size={40} style={{ margin: "0 auto 14px", display: "block", color: "#cbd5e1" }} />
            <div style={{ fontWeight: 700, fontSize: 15, color: "#94a3b8" }}>No staff members yet</div>
            <div style={{ fontSize: 13, color: "#cbd5e1", marginTop: 4 }}>{search ? "Try a different search" : "Add your first staff member"}</div>
          </div>
        ) : (
          <div>
            {filtered.map((s, i) => (
              <div key={s.id} className="row-hover"
                style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 1fr 0.8fr 0.9fr", padding: "14px 20px", borderBottom: i < filtered.length - 1 ? "1px solid #f1f5f9" : "none", alignItems: "center", background: s.is_active ? "#fff" : "#fafafa" }}>

                {/* Name */}
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: s.is_active ? "linear-gradient(135deg,#1d4ed8,#3b82f6)" : "#cbd5e1", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 16, flexShrink: 0, opacity: s.is_active ? 1 : 0.7 }}>
                    {s.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: s.is_active ? "#0f172a" : "#94a3b8" }}>{s.name}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>Staff Member</div>
                  </div>
                </div>

                {/* Username */}
                <div style={{ fontSize: 13, fontWeight: 600, color: s.is_active ? "#374151" : "#94a3b8", fontFamily: "monospace" }}>@{s.username}</div>

                {/* Date */}
                <div style={{ fontSize: 12, color: "#64748b" }}>{fmtDate(s.created_at)}</div>

                {/* Toggle */}
                <div>
                  {role === "admin" ? (
                    <div onClick={() => toggleActive(s)} style={{ cursor: "pointer", display: "inline-block" }}>
                      <div style={{ width: 46, height: 26, borderRadius: 13, position: "relative", transition: "background 0.25s", background: s.is_active ? "#22c55e" : "#d1d5db", boxShadow: s.is_active ? "0 0 0 3px rgba(34,197,94,0.15)" : "none" }}>
                        <div style={{ position: "absolute", top: 3, left: s.is_active ? 23 : 3, width: 20, height: 20, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.22)", transition: "left 0.22s cubic-bezier(.4,0,.2,1)" }} />
                      </div>
                    </div>
                  ) : (
                    <span style={{ fontSize: 12, fontWeight: 600, color: s.is_active ? "#059669" : "#dc2626" }}>{s.is_active ? "Active" : "Disabled"}</span>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 6 }}>
                  {role === "admin" && (
                    <button className="act-btn" onClick={() => setDeleteId(s.id)}
                      style={{ width: 32, height: 32, background: "#fef2f2", border: "1.5px solid #fecaca", borderRadius: 9, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Trash2 size={13} color="#dc2626" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && staff.length > 0 && (
          <div style={{ padding: "10px 20px", borderTop: "1.5px solid #f1f5f9", background: "#f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "#94a3b8" }}>{staff.length} total staff member{staff.length !== 1 ? "s" : ""}</span>
            {role === "admin" && (
              <button onClick={() => setShowForm(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "linear-gradient(135deg,#1e3a8a,#2563eb)", color: "#fff", border: "none", borderRadius: 9, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                <Plus size={13} /> Add Staff
              </button>
            )}
          </div>
        )}
      </div>

      {/* Delete confirm modal */}
      {deleteId && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={() => setDeleteId(null)}>
          <div style={{ background: "#fff", borderRadius: 20, padding: 28, maxWidth: 340, width: "100%", boxShadow: "0 24px 60px rgba(0,0,0,0.22)", animation: "slideIn 0.2s ease both" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: "center", marginBottom: 22 }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                <Trash2 size={26} color="#dc2626" />
              </div>
              <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 6 }}>Remove Staff Member?</div>
              <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>They will no longer be able to log in. This cannot be undone.</div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setDeleteId(null)} style={{ flex: 1, padding: "11px", border: "1.5px solid #e2e8f0", borderRadius: 10, background: "#f8fafc", fontWeight: 600, fontSize: 14, cursor: "pointer", color: "#475569" }}>Cancel</button>
              <button onClick={() => deleteStaff(deleteId)} style={{ flex: 1, padding: "11px", border: "none", borderRadius: 10, background: "linear-gradient(135deg,#ef4444,#dc2626)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", boxShadow: "0 4px 12px rgba(239,68,68,0.3)" }}>Remove</button>
            </div>
          </div>
        </div>
      )}
    </ProtectedLayout>
  );
}
