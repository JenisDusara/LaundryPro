import { useState, useEffect } from "react";
import { Settings, Users, Download, Key } from "lucide-react";
import api from "../api/client";

export default function Admin() {
  const [tab, setTab] = useState<"settings" | "users" | "backup" | "password">("settings");

  // Shop Settings
  const [shopName, setShopName] = useState("");
  const [contact, setContact] = useState("");
  const [address, setAddress] = useState("");
  const [settingsMsg, setSettingsMsg] = useState("");

  // Users
  const [admins, setAdmins] = useState<{ id: string; username: string; created_at: string }[]>([]);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [userMsg, setUserMsg] = useState("");

  // Password
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [passMsg, setPassMsg] = useState("");

  useEffect(() => {
    api.get("/admin/settings").then(r => {
      setShopName(r.data.shop_name);
      setContact(r.data.contact);
      setAddress(r.data.address);
    });
    api.get("/admin/users").then(r => setAdmins(r.data));
  }, []);

  const saveSettings = async () => {
    await api.put("/admin/settings", { shop_name: shopName, contact, address });
    setSettingsMsg("✅ Settings saved!");
    setTimeout(() => setSettingsMsg(""), 3000);
  };

  const createAdmin = async () => {
    if (!newUsername || !newPassword) return;
    try {
      await api.post("/admin/users", { username: newUsername, password: newPassword });
      setNewUsername(""); setNewPassword("");
      setUserMsg("✅ Admin created!");
      api.get("/admin/users").then(r => setAdmins(r.data));
    } catch (e: any) {
      setUserMsg("❌ " + (e.response?.data?.detail || "Error"));
    }
    setTimeout(() => setUserMsg(""), 3000);
  };

  const deleteAdmin = async (id: string) => {
    if (!confirm("Delete this admin?")) return;
    await api.delete(`/admin/users/${id}`);
    api.get("/admin/users").then(r => setAdmins(r.data));
  };

  const changePassword = async () => {
    if (!oldPass || !newPass) return;
    try {
      await api.post("/admin/change-password", { old_password: oldPass, new_password: newPass });
      setOldPass(""); setNewPass("");
      setPassMsg("✅ Password changed!");
    } catch (e: any) {
      setPassMsg("❌ " + (e.response?.data?.detail || "Error"));
    }
    setTimeout(() => setPassMsg(""), 3000);
  };

  const backup = () => {
    window.open(`http://localhost:8000/api/admin/backup?token=${localStorage.getItem("token")}`, "_blank");
  };

  return (
    <div>
      <h2 style={{ color: "#1e3a8a", marginBottom: 16 }}>Admin Panel</h2>

      {/* Tabs */}
      <div style={s.tabs}>
        {([["settings", "⚙️ Shop Settings", Settings], ["users", "👥 Manage Users", Users],
           ["backup", "💾 Backup", Download], ["password", "🔑 Password", Key]] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{ ...s.tab, ...(tab === key ? s.tabActive : {}) }}>
            {label}
          </button>
        ))}
      </div>

      <div style={s.card}>
        {/* Shop Settings */}
        {tab === "settings" && (
          <div>
            <h3 style={s.cardTitle}>Shop Settings</h3>
            <label style={s.label}>Shop Name</label>
            <input style={s.input} value={shopName} onChange={e => setShopName(e.target.value)} />
            <label style={s.label}>Contact Number</label>
            <input style={s.input} value={contact} onChange={e => setContact(e.target.value)} />
            <label style={s.label}>Address</label>
            <input style={s.input} value={address} onChange={e => setAddress(e.target.value)} />
            {settingsMsg && <div style={s.msg}>{settingsMsg}</div>}
            <button style={s.btn} onClick={saveSettings}>Save Settings</button>
          </div>
        )}

        {/* Manage Users */}
        {tab === "users" && (
          <div>
            <h3 style={s.cardTitle}>Admin Users</h3>
            <div style={s.userList}>
              {admins.map(a => (
                <div key={a.id} style={s.userRow}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{a.username}</div>
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>Created: {new Date(a.created_at).toLocaleDateString("en-IN")}</div>
                  </div>
                  <button onClick={() => deleteAdmin(a.id)} style={s.deleteBtn}>Delete</button>
                </div>
              ))}
            </div>
            <h3 style={{ ...s.cardTitle, marginTop: 24 }}>Add New Admin</h3>
            <label style={s.label}>Username</label>
            <input style={s.input} value={newUsername} onChange={e => setNewUsername(e.target.value)} placeholder="Enter username" />
            <label style={s.label}>Password</label>
            <input style={s.input} type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Enter password" />
            {userMsg && <div style={s.msg}>{userMsg}</div>}
            <button style={s.btn} onClick={createAdmin}>Create Admin</button>
          </div>
        )}

        {/* Backup */}
        {tab === "backup" && (
          <div>
            <h3 style={s.cardTitle}>Backup Data</h3>
            <p style={{ color: "#64748b", marginBottom: 16, fontSize: 14 }}>
              Download a complete backup of all your data — customers, entries, services — as a JSON file.
              Store it safely for emergency restore.
            </p>
            <button style={s.btn} onClick={backup}>⬇️ Download Backup</button>
          </div>
        )}

        {/* Change Password */}
        {tab === "password" && (
          <div>
            <h3 style={s.cardTitle}>Change Password</h3>
            <label style={s.label}>Current Password</label>
            <input style={s.input} type="password" value={oldPass} onChange={e => setOldPass(e.target.value)} placeholder="Current password" />
            <label style={s.label}>New Password</label>
            <input style={s.input} type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="New password" />
            {passMsg && <div style={s.msg}>{passMsg}</div>}
            <button style={s.btn} onClick={changePassword}>Change Password</button>
          </div>
        )}
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  tabs: { display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" },
  tab: { padding: "8px 16px", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, background: "#e2e8f0", color: "#475569" },
  tabActive: { background: "#1e40af", color: "#fff" },
  card: { background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", maxWidth: 500 },
  cardTitle: { color: "#1e3a8a", marginBottom: 16, fontSize: 16 },
  label: { display: "block", fontSize: 13, color: "#475569", marginBottom: 4, fontWeight: 500 },
  input: { width: "100%", padding: "10px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, marginBottom: 12, outline: "none", boxSizing: "border-box" as const },
  btn: { padding: "10px 20px", background: "#1e40af", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 600 },
  msg: { padding: "8px 12px", background: "#f0fdf4", color: "#16a34a", borderRadius: 6, marginBottom: 12, fontSize: 13 },
  userList: { marginBottom: 8 },
  userRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f1f5f9" },
  deleteBtn: { padding: "4px 12px", background: "#fef2f2", color: "#ef4444", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600 },
};