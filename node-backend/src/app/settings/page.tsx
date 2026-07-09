"use client";
import { useState, useEffect, useRef } from "react";
import { Store, Save, Upload, Trash2, ImageIcon, Download, DatabaseBackup } from "lucide-react";
import api from "@/lib/api";
import { downloadAuthedFile } from "@/lib/download";
import { todayIST } from "@/lib/dates";
import ProtectedLayout from "@/components/ProtectedLayout";

type Profile = {
  shop_name: string;
  tagline: string;
  phone: string;
  address: string;
  email: string;
  upi_id: string;
  gst_number: string;
  gst_rate: number | string;
  invoice_terms: string;
  footer_note: string;
  default_labour_rate: number | string;
  logo_data: string | null;
};

const EMPTY: Profile = {
  shop_name: "", tagline: "", phone: "", address: "",
  email: "", upi_id: "", gst_number: "", gst_rate: 0,
  invoice_terms: "", footer_note: "", default_labour_rate: 2, logo_data: null,
};

const LOGO_MAX_BYTES = 150 * 1024; // ~150 KB — logo is embedded in every invoice, keep it small

const label: React.CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-secondary)",
  marginBottom: 6, letterSpacing: "0.02em",
};
const inp: React.CSSProperties = {
  width: "100%", padding: "10px 13px", border: "1px solid var(--border-default)",
  borderRadius: 9, fontSize: 14, outline: "none", boxSizing: "border-box",
  background: "var(--bg-input)", color: "var(--text-primary)",
};

export default function Settings() {
  const [form, setForm] = useState<Profile>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [backupBusy, setBackupBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const downloadBackup = async () => {
    setBackupBusy(true);
    try {
      await downloadAuthedFile("/admin/backup", `laundrypro-backup-${todayIST()}.json`);
    } catch {
      setMsg({ text: "Backup download failed", ok: false });
      setTimeout(() => setMsg(null), 4000);
    } finally {
      setBackupBusy(false);
    }
  };

  useEffect(() => {
    api.get("/admin/settings")
      .then(r => setForm({ ...EMPTY, ...r.data }))
      .catch((e: any) => setMsg({ text: e.response?.data?.detail || "Could not load settings", ok: false }))
      .finally(() => setLoading(false));
  }, []);

  const set = (k: keyof Profile) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const onLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMsg({ text: "Please choose an image file", ok: false });
      return;
    }
    if (file.size > LOGO_MAX_BYTES) {
      setMsg({ text: "Logo too large — please use an image under 150 KB", ok: false });
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setForm(f => ({ ...f, logo_data: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setForm(f => ({ ...f, logo_data: null }));
    if (fileRef.current) fileRef.current.value = "";
  };

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const r = await api.put("/admin/settings", form);
      setForm({ ...EMPTY, ...r.data });
      setMsg({ text: "Settings saved", ok: true });
    } catch (e: any) {
      setMsg({ text: e.response?.data?.detail || "Failed to save", ok: false });
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(null), 4000);
    }
  };

  return (
    <ProtectedLayout>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 4 }}>Configuration</div>
        <h2 style={{ color: "var(--text-primary)", margin: "0 0 4px", fontSize: 26, fontWeight: 900, letterSpacing: -0.5 }}>Business profile</h2>
        <p style={{ color: "var(--text-muted)", fontSize: 13, margin: 0 }}>Yeh details aapke invoices ke header par dikhengi</p>
      </div>

      {loading ? (
        <div style={{ color: "var(--text-muted)", fontSize: 14, padding: "40px 0" }}>Loading…</div>
      ) : (
        <div style={{ maxWidth: 720 }}>
          {/* Logo card */}
          <div style={{ background: "var(--bg-card)", borderRadius: 14, border: "1px solid var(--border-hard)", padding: 20, marginBottom: 16 }}>
            <div style={{ ...label, marginBottom: 12 }}>Shop logo</div>
            <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <div style={{
                width: 72, height: 72, borderRadius: 14, flexShrink: 0,
                background: "var(--bg-elevated)", border: "1px dashed var(--border-default)",
                display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
              }}>
                {form.logo_data
                  ? <img src={form.logo_data} alt="logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <ImageIcon size={26} color="var(--text-muted)" />}
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <input ref={fileRef} type="file" accept="image/*" onChange={onLogo} style={{ display: "none" }} />
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button onClick={() => fileRef.current?.click()}
                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", border: "1px solid var(--border-hard)", borderRadius: 9, background: "var(--bg-input)", color: "var(--text-primary)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                    <Upload size={14} /> {form.logo_data ? "Change" : "Upload"} logo
                  </button>
                  {form.logo_data && (
                    <button onClick={removeLogo}
                      style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", border: "1px solid var(--grade-f-border)", borderRadius: 9, background: "var(--grade-f-bg)", color: "var(--grade-f-text)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                      <Trash2 size={14} /> Remove
                    </button>
                  )}
                </div>
                <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 8 }}>
                  PNG/JPG, 150 KB se chhoti. Logo na hone par invoice par blank rahega.
                </div>
              </div>
            </div>
          </div>

          {/* Details card */}
          <div style={{ background: "var(--bg-card)", borderRadius: 14, border: "1px solid var(--border-hard)", padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, color: "var(--text-primary)" }}>
              <Store size={16} color="var(--accent-primary)" />
              <span style={{ fontWeight: 700, fontSize: 14 }}>Business details</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 14 }}>
              <div>
                <label style={label}>Shop name</label>
                <input style={inp} value={form.shop_name} onChange={set("shop_name")} placeholder="e.g. Shree Laundry" />
              </div>
              <div>
                <label style={label}>Tagline</label>
                <input style={inp} value={form.tagline} onChange={set("tagline")} placeholder="e.g. Dry Cleaning & Laundry Services" />
              </div>
              <div>
                <label style={label}>Phone</label>
                <input style={inp} value={form.phone} onChange={set("phone")} placeholder="e.g. +91 98765 43210" />
              </div>
              <div>
                <label style={label}>Email</label>
                <input style={inp} value={form.email} onChange={set("email")} placeholder="e.g. shop@example.com" />
              </div>
              <div>
                <label style={label}>UPI ID</label>
                <input style={inp} value={form.upi_id} onChange={set("upi_id")} placeholder="e.g. shop@okhdfcbank" />
              </div>
              <div>
                <label style={label}>GST number</label>
                <input style={inp} value={form.gst_number} onChange={set("gst_number")} placeholder="e.g. 24ABCDE1234F1Z5" />
              </div>
              <div>
                <label style={label}>GST rate (%)</label>
                <input style={inp} type="number" min={0} step="0.01" value={form.gst_rate} onChange={set("gst_rate")} placeholder="e.g. 5 (0 = no tax on invoice)" />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={label}>Address</label>
                <textarea style={{ ...inp, minHeight: 70, resize: "vertical", fontFamily: "inherit" }} value={form.address} onChange={set("address")} placeholder="Shop address" />
              </div>
              <div>
                <label style={label}>Default labour rate (₹/piece)</label>
                <input style={inp} type="number" min={0} step="0.01" value={form.default_labour_rate} onChange={set("default_labour_rate")} placeholder="e.g. 2" />
              </div>
              <div>
                <label style={label}>Invoice footer note</label>
                <input style={inp} value={form.footer_note} onChange={set("footer_note")} placeholder="e.g. Thank you for your business" />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={label}>Invoice terms &amp; conditions</label>
                <textarea style={{ ...inp, minHeight: 60, resize: "vertical", fontFamily: "inherit" }} value={form.invoice_terms} onChange={set("invoice_terms")} placeholder="e.g. Garments held 30 days · not responsible for colour bleed or shrinkage" />
              </div>
            </div>

            {msg && (
              <div style={{ marginTop: 16, padding: "9px 13px", borderRadius: 8, fontSize: 13, fontWeight: 500, background: msg.ok ? "var(--grade-a-bg)" : "var(--grade-f-bg)", color: msg.ok ? "var(--grade-a-text)" : "var(--grade-f-text)" }}>
                {msg.text}
              </div>
            )}

            <div style={{ marginTop: 18, display: "flex", justifyContent: "flex-end" }}>
              <button onClick={save} disabled={saving}
                style={{ display: "flex", alignItems: "center", gap: 7, background: saving ? "var(--border-active)" : "#2563eb", color: "#fff", border: "none", borderRadius: 10, padding: "11px 24px", fontSize: 14, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", boxShadow: "0 4px 14px rgba(37,99,235,0.28)" }}>
                <Save size={16} /> {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>

          {/* Data & backup card */}
          <div style={{ background: "var(--bg-card)", borderRadius: 14, border: "1px solid var(--border-hard)", padding: 20, marginTop: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, color: "var(--text-primary)" }}>
              <DatabaseBackup size={16} color="var(--accent-primary)" />
              <span style={{ fontWeight: 700, fontSize: 14 }}>Data &amp; backup</span>
            </div>
            <p style={{ fontSize: 12.5, color: "var(--text-muted)", margin: "0 0 14px" }}>
              Apne shop ka pura data (customers, entries, services, labour) ek JSON file me download karein. Safe jagah rakhein.
            </p>
            <button onClick={downloadBackup} disabled={backupBusy}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 18px", border: "1px solid var(--border-hard)", borderRadius: 10, background: "var(--bg-input)", color: "var(--text-primary)", fontSize: 13.5, fontWeight: 700, cursor: backupBusy ? "not-allowed" : "pointer", opacity: backupBusy ? 0.6 : 1 }}>
              <Download size={15} /> {backupBusy ? "Preparing…" : "Download backup"}
            </button>
          </div>
        </div>
      )}
    </ProtectedLayout>
  );
}
