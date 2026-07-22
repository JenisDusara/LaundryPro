"use client";
import { useState, useEffect, useRef } from "react";
import { Store, Save, Upload, Trash2, ImageIcon, Download, DatabaseBackup, Mail, Send, MessageCircle, IndianRupee } from "lucide-react";
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
  weekly_report_enabled: boolean;
  wa_auto_enabled: boolean;
  wa_show_prices: boolean;
};

const EMPTY: Profile = {
  shop_name: "", tagline: "", phone: "", address: "",
  email: "", upi_id: "", gst_number: "", gst_rate: 0,
  invoice_terms: "", footer_note: "", default_labour_rate: 2, logo_data: null,
  weekly_report_enabled: true, wa_auto_enabled: false, wa_show_prices: true,
};

const LOGO_MAX_BYTES = 150 * 1024; // ~150 KB, stored in the shop profile.

// Reads the logged-in user's role from the JWT (same approach as the Sidebar). The weekly
// report is a superadmin-managed feature, so the card is hidden from regular shop admins.
function getTokenRole(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(payload)).role || null;
  } catch { return null; }
}

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
  const [reportBusy, setReportBusy] = useState(false);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setIsSuperadmin(getTokenRole() === "superadmin"); }, []);

  // WhatsApp (Baileys via WA-Service) connection state for this shop.
  const [wa, setWa] = useState<{ state: string; qr?: string | null; pairingCode?: string | null; number?: string | null }>({ state: "loading" });
  const [waBusy, setWaBusy] = useState(false);
  const [waPhone, setWaPhone] = useState("");
  const waPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopWaPoll = () => { if (waPollRef.current) { clearInterval(waPollRef.current); waPollRef.current = null; } };
  const loadWaStatus = async () => {
    try { const r = await api.get("/whatsapp/status"); setWa(r.data); return r.data?.state as string; }
    catch { setWa({ state: "unavailable" }); return "unavailable"; }
  };
  const startWaPoll = () => {
    if (waPollRef.current) return;
    waPollRef.current = setInterval(async () => {
      const st = await loadWaStatus();
      if (st === "open" || st === "unavailable" || st === "not_configured" || st === "disconnected") stopWaPoll();
    }, 2500);
  };
  const connectWa = async () => {
    setWaBusy(true);
    try { const r = await api.post("/whatsapp/connect"); setWa(r.data); startWaPoll(); }
    catch { setMsg({ text: "WhatsApp connect failed", ok: false }); }
    finally { setWaBusy(false); }
  };
  const pairWa = async () => {
    if (waPhone.replace(/\D/g, "").length < 10) { setMsg({ text: "Sahi WhatsApp number daalo (10 digit)", ok: false }); return; }
    setWaBusy(true);
    try { const r = await api.post("/whatsapp/pair", { phone: waPhone }); setWa(r.data); startWaPoll(); }
    catch { setMsg({ text: "Pairing code lene mein dikkat", ok: false }); }
    finally { setWaBusy(false); }
  };
  // Go back from the QR / pairing view to the choice screen (so the user can switch method).
  const resetWaChoice = () => { stopWaPoll(); setWa({ state: "disconnected" }); };
  // Auto-send toggle saves immediately (no separate "Save changes" needed).
  const toggleWaAuto = async () => {
    const next = !form.wa_auto_enabled;
    setForm(f => ({ ...f, wa_auto_enabled: next }));
    try {
      await api.put("/admin/settings", { ...form, wa_auto_enabled: next });
      setMsg({ text: next ? "WhatsApp auto-send ON" : "WhatsApp auto-send OFF", ok: true });
    } catch (e: any) {
      setForm(f => ({ ...f, wa_auto_enabled: !next })); // revert on failure
      setMsg({ text: e?.response?.data?.detail || "Save failed", ok: false });
    }
  };
  // "Show prices in WhatsApp" — when off, WhatsApp bills (auto + manual) show only items,
  // no price/total/balance. Saves instantly. Independent of WhatsApp connection.
  const toggleShowPrices = async () => {
    const next = !form.wa_show_prices;
    setForm(f => ({ ...f, wa_show_prices: next }));
    try {
      await api.put("/admin/settings", { ...form, wa_show_prices: next });
    } catch {
      setForm(f => ({ ...f, wa_show_prices: !next })); // revert on failure
    }
  };

  // Weekly-report toggle saves immediately (same as WhatsApp) — no separate "Save changes".
  const toggleWeekly = async () => {
    const next = !form.weekly_report_enabled;
    setForm(f => ({ ...f, weekly_report_enabled: next }));
    try {
      await api.put("/admin/settings", { ...form, weekly_report_enabled: next });
      setMsg({ text: next ? "Weekly report ON" : "Weekly report OFF", ok: true });
      setTimeout(() => setMsg(null), 3000);
    } catch (e: any) {
      setForm(f => ({ ...f, weekly_report_enabled: !next }));
      setMsg({ text: e?.response?.data?.detail || "Save failed", ok: false });
    }
  };
  const disconnectWa = async () => {
    if (!confirm("Is shop ka WhatsApp disconnect karein?")) return;
    setWaBusy(true);
    try { await api.post("/whatsapp/disconnect"); await loadWaStatus(); }
    finally { setWaBusy(false); }
  };

  useEffect(() => { loadWaStatus(); return () => stopWaPoll(); }, []);

  const downloadBackup = async () => {
    setBackupBusy(true);
    try {
      await downloadAuthedFile("/admin/backup", `laundrymax-backup-${todayIST()}.xlsx`);
    } catch (e: any) {
      // The error body is a Blob (blob responseType) — read it to surface the real reason,
      // e.g. superadmin trying to back up without selecting a shop.
      let detail = "Backup download failed";
      try { const t = await e?.response?.data?.text?.(); if (t) detail = JSON.parse(t).detail || detail; } catch {}
      setMsg({ text: detail, ok: false });
      setTimeout(() => setMsg(null), 5000);
    } finally {
      setBackupBusy(false);
    }
  };

  const sendReportNow = async () => {
    setReportBusy(true);
    try {
      const r = await api.post("/reports/weekly/send");
      setMsg({ text: `Report sent! (${r.data.start} to ${r.data.end})`, ok: true });
    } catch (e: any) {
      setMsg({ text: e.response?.data?.detail || "Failed to send report", ok: false });
    } finally {
      setReportBusy(false);
      setTimeout(() => setMsg(null), 4000);
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
        <h2 style={{ color: "var(--text-primary)", margin: "0 0 4px", fontSize: 26, fontWeight: 900, letterSpacing: -0.5 }}>Settings</h2>
        <p style={{ color: "var(--text-muted)", fontSize: 13, margin: 0 }}>Business profile, payment, WhatsApp and reports — all in one place.</p>
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
                  PNG/JPG, 150 KB se chhoti. Simple black-and-white invoice me logo use nahi hota.
                </div>
              </div>
            </div>
          </div>

          {/* Details card */}
          <div style={{ background: "var(--bg-card)", borderRadius: 14, border: "1px solid var(--border-hard)", padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, color: "var(--text-primary)" }}>
              <Store size={16} color="var(--accent-primary)" />
              <span style={{ fontWeight: 700, fontSize: 14 }}>Business &amp; Invoice</span>
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
                <label style={label}>GST number</label>
                <input style={inp} value={form.gst_number} onChange={set("gst_number")} placeholder="e.g. 24ABCDE1234F1Z5" />
              </div>
              <div>
                <label style={label}>GST rate (%)</label>
                <input style={inp} type="number" min={0} step="0.01" value={form.gst_rate} onChange={set("gst_rate")} placeholder="Stored for profile; totals use ledger amount" />
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

          </div>

          {/* Payment card — UPI is prominent here (powers the invoice UPI line) */}
          <div style={{ background: "var(--bg-card)", borderRadius: 14, border: "1px solid var(--border-hard)", padding: 20, marginTop: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, color: "var(--text-primary)" }}>
              <IndianRupee size={16} color="var(--accent-primary)" />
              <span style={{ fontWeight: 700, fontSize: 14 }}>Payment</span>
            </div>
            <div style={{ maxWidth: 380 }}>
              <label style={label}>UPI ID</label>
              <input style={inp} value={form.upi_id} onChange={set("upi_id")} placeholder="e.g. shop@okhdfcbank" />
              <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 8 }}>
                Shown on your invoices so customers can pay you directly by UPI. Keep it accurate.
              </div>
            </div>
          </div>

          {/* Save (covers Business & Invoice + Payment text fields) */}
          {msg && (
            <div style={{ marginTop: 16, padding: "9px 13px", borderRadius: 8, fontSize: 13, fontWeight: 500, background: msg.ok ? "var(--grade-a-bg)" : "var(--grade-f-bg)", color: msg.ok ? "var(--grade-a-text)" : "var(--grade-f-text)" }}>
              {msg.text}
            </div>
          )}
          <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
            <button onClick={save} disabled={saving}
              style={{ display: "flex", alignItems: "center", gap: 7, background: saving ? "var(--border-active)" : "#2563eb", color: "#fff", border: "none", borderRadius: 10, padding: "11px 24px", fontSize: 14, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", boxShadow: "0 4px 14px rgba(37,99,235,0.28)" }}>
              <Save size={16} /> {saving ? "Saving…" : "Save changes"}
            </button>
          </div>

          {/* Data & backup card */}
          <div style={{ background: "var(--bg-card)", borderRadius: 14, border: "1px solid var(--border-hard)", padding: 20, marginTop: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, color: "var(--text-primary)" }}>
              <DatabaseBackup size={16} color="var(--accent-primary)" />
              <span style={{ fontWeight: 700, fontSize: 14 }}>Data &amp; backup</span>
            </div>
            <p style={{ fontSize: 12.5, color: "var(--text-muted)", margin: "0 0 14px" }}>
              Apne shop ka pura data (customers, entries, services, labour) ek Excel file me download karein — alag-alag sheets me, aasani se dekhne ke liye. Safe jagah rakhein.
            </p>
            <button onClick={downloadBackup} disabled={backupBusy}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 18px", border: "1px solid var(--border-hard)", borderRadius: 10, background: "var(--bg-input)", color: "var(--text-primary)", fontSize: 13.5, fontWeight: 700, cursor: backupBusy ? "not-allowed" : "pointer", opacity: backupBusy ? 0.6 : 1 }}>
              <Download size={15} /> {backupBusy ? "Preparing…" : "Download backup"}
            </button>
          </div>

          {/* Weekly report card — superadmin only (regular shop admins don't manage this) */}
          {isSuperadmin && (
          <div style={{ background: "var(--bg-card)", borderRadius: 14, border: "1px solid var(--border-hard)", padding: 20, marginTop: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, color: "var(--text-primary)" }}>
              <Mail size={16} color="var(--accent-primary)" />
              <span style={{ fontWeight: 700, fontSize: 14 }}>Weekly report email</span>
            </div>
            <p style={{ fontSize: 12.5, color: "var(--text-muted)", margin: "0 0 14px" }}>
              Har Sunday subah 8 baje, is shop ke earnings/entries/udhaar ka poora report is email pe automatically chala jayega: <b style={{ color: "var(--text-secondary)" }}>{form.email || "(set an email above first)"}</b>
            </p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div onClick={toggleWeekly} style={{ cursor: "pointer" }}>
                  <div style={{ width: 44, height: 24, borderRadius: 12, position: "relative", transition: "background 0.2s", background: form.weekly_report_enabled ? "#16a34a" : "var(--bg-elevated)" }}>
                    <div style={{ position: "absolute", top: 2, left: form.weekly_report_enabled ? 22 : 2, width: 20, height: 20, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.25)", transition: "left 0.2s" }} />
                  </div>
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                  Automatic Sunday email {form.weekly_report_enabled ? "ON" : "OFF"} <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(saves instantly)</span>
                </span>
              </div>
              <button onClick={sendReportNow} disabled={reportBusy || !form.email}
                title={!form.email ? "Pehle upar email address set karo" : undefined}
                style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 18px", border: "1px solid var(--border-hard)", borderRadius: 10, background: "var(--bg-input)", color: "var(--text-primary)", fontSize: 13.5, fontWeight: 700, cursor: (reportBusy || !form.email) ? "not-allowed" : "pointer", opacity: (reportBusy || !form.email) ? 0.6 : 1 }}>
                <Send size={15} /> {reportBusy ? "Sending…" : "Send now"}
              </button>
            </div>
            <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 10 }}>
              Toggle turant save hota hai. "Send now" abhi bhejta hai, toggle se independent.
            </div>
          </div>
          )}

          {/* Bill price-display card — separate from WhatsApp connection/auto-send */}
          <div style={{ background: "var(--bg-card)", borderRadius: 14, border: "1px solid var(--border-hard)", padding: 20, marginTop: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, color: "var(--text-primary)" }}>
              <IndianRupee size={16} color="#16a34a" />
              <span style={{ fontWeight: 700, fontSize: 14 }}>Bill prices in WhatsApp</span>
            </div>
            <p style={{ fontSize: 12.5, color: "var(--text-muted)", margin: "0 0 14px" }}>
              WhatsApp bills (auto-send + manual) me price dikhani hai ya nahi. Kuch shops sirf items dikhana chahte hain, price/total nahi.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div onClick={toggleShowPrices} style={{ cursor: "pointer", flexShrink: 0 }}>
                <div style={{ width: 44, height: 24, borderRadius: 12, position: "relative", transition: "background 0.2s", background: form.wa_show_prices ? "#16a34a" : "var(--bg-elevated)" }}>
                  <div style={{ position: "absolute", top: 2, left: form.wa_show_prices ? 22 : 2, width: 20, height: 20, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.25)", transition: "left 0.2s" }} />
                </div>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                  Show prices in WhatsApp {form.wa_show_prices ? "ON" : "OFF"} <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(turant save)</span>
                </div>
                <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 2 }}>
                  {form.wa_show_prices ? "Bill me items + price/total dono jaate hain." : "Sirf items + quantity jaate hain — price/total nahi."}
                </div>
              </div>
            </div>
          </div>

          {/* WhatsApp auto-send card */}
          <div style={{ background: "var(--bg-card)", borderRadius: 14, border: "1px solid var(--border-hard)", padding: 20, marginTop: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, color: "var(--text-primary)" }}>
              <MessageCircle size={16} color="#16a34a" />
              <span style={{ fontWeight: 700, fontSize: 14 }}>WhatsApp auto-send</span>
            </div>
            <p style={{ fontSize: 12.5, color: "var(--text-muted)", margin: "0 0 14px" }}>
              Naye pickup aur delivery complete hone par customer ko automatically WhatsApp message bhejo. Iske liye pehle apna WhatsApp number connect karein.
            </p>

            {wa.state === "not_configured" || wa.state === "unavailable" ? (
              <div style={{ fontSize: 13, color: "var(--text-muted)", background: "var(--bg-elevated)", border: "1px solid var(--border-hard)", borderRadius: 10, padding: "12px 14px" }}>
                ⚠️ WhatsApp connect nahi hai. Auto-send ka toggle connect karne ke baad dikhega. (Admin: <b style={{ color: "var(--text-secondary)" }}>WA_SERVICE_URL</b> set karein.)
              </div>
            ) : wa.state === "open" ? (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, color: "#16a34a", fontWeight: 700, fontSize: 13 }}>
                  ✅ Connected{wa.number ? ` · ${wa.number}` : ""}
                </div>
                {/* Auto-send toggle — only shown once WhatsApp is connected */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <div onClick={toggleWaAuto} style={{ cursor: "pointer", flexShrink: 0 }}>
                    <div style={{ width: 44, height: 24, borderRadius: 12, position: "relative", transition: "background 0.2s", background: form.wa_auto_enabled ? "#16a34a" : "var(--bg-elevated)" }}>
                      <div style={{ position: "absolute", top: 2, left: form.wa_auto_enabled ? 22 : 2, width: 20, height: 20, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.25)", transition: "left 0.2s" }} />
                    </div>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                    Auto-send on pickup &amp; delivery {form.wa_auto_enabled ? "ON" : "OFF"} <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(turant save)</span>
                  </span>
                </div>
                <button onClick={disconnectWa} disabled={waBusy}
                  style={{ padding: "9px 16px", border: "1px solid var(--grade-f-border)", borderRadius: 10, background: "var(--grade-f-bg)", color: "var(--grade-f-text)", fontSize: 13, fontWeight: 700, cursor: waBusy ? "not-allowed" : "pointer" }}>
                  Disconnect
                </button>
              </>
            ) : wa.state === "pairing" && wa.pairingCode ? (
              <div>
                <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 8 }}>
                  Phone pe: <b>WhatsApp → Linked Devices → "Link with phone number"</b> → yeh code daalo:
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: 4, color: "var(--text-primary)", background: "var(--bg-elevated)", border: "1px solid var(--border-hard)", borderRadius: 10, padding: "12px 16px", textAlign: "center", fontFamily: "monospace" }}>
                  {wa.pairingCode}
                </div>
                <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 8 }}>Code daalte hi apne aap connect ho jayega…</div>
                <button onClick={resetWaChoice} style={{ marginTop: 12, background: "none", border: "none", color: "var(--accent-primary)", fontSize: 12.5, fontWeight: 700, cursor: "pointer", padding: 0 }}>← Dusra tareeka (QR / number badlo)</button>
              </div>
            ) : wa.state === "qr" && wa.qr ? (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 10 }}>Doosri screen pe QR dikhaakar phone se: WhatsApp → Linked Devices → scan:</div>
                <img src={wa.qr} alt="WhatsApp QR" style={{ width: 220, height: 220, borderRadius: 12, border: "1px solid var(--border-hard)", background: "#fff", padding: 8 }} />
                <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 8 }}>Scan hote hi apne aap connect ho jayega…</div>
                <div><button onClick={resetWaChoice} style={{ marginTop: 12, background: "none", border: "none", color: "var(--accent-primary)", fontSize: 12.5, fontWeight: 700, cursor: "pointer", padding: 0 }}>← Dusra tareeka (phone number se link karo)</button></div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {/* Option 1 — pairing code (ek hi phone pe kaam karta hai) */}
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>Phone number se link karo <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(ek hi phone pe)</span></div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <input value={waPhone} onChange={e => setWaPhone(e.target.value)} placeholder="WhatsApp number (10 digit)" inputMode="numeric"
                      style={{ ...inp, flex: 1, minWidth: 160 }} />
                    <button onClick={pairWa} disabled={waBusy}
                      style={{ padding: "10px 18px", border: "none", borderRadius: 10, background: "#16a34a", color: "#fff", fontSize: 13.5, fontWeight: 700, cursor: waBusy ? "not-allowed" : "pointer", opacity: waBusy ? 0.6 : 1, whiteSpace: "nowrap" }}>
                      {waBusy ? "…" : "Get code"}
                    </button>
                  </div>
                </div>
                {/* divider */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ flex: 1, height: 1, background: "var(--border-hard)" }} />
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>ya QR se</span>
                  <div style={{ flex: 1, height: 1, background: "var(--border-hard)" }} />
                </div>
                {/* Option 2 — QR (doosri screen chahiye) */}
                <button onClick={connectWa} disabled={waBusy}
                  style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", border: "1px solid var(--border-hard)", borderRadius: 10, background: "var(--bg-input)", color: "var(--text-primary)", fontSize: 13.5, fontWeight: 700, cursor: waBusy ? "not-allowed" : "pointer", opacity: waBusy ? 0.6 : 1 }}>
                  <MessageCircle size={15} /> {wa.state === "connecting" ? "Connecting…" : "QR se connect karo"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </ProtectedLayout>
  );
}
