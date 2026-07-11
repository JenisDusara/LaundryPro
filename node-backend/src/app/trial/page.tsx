"use client";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import api from "@/lib/api";

const KEYFRAMES = `
@keyframes fadeSlideUp { from { opacity:0;transform:translateY(30px); } to { opacity:1;transform:translateY(0); } }
@keyframes float1 { 0%,100%{transform:translate(0,0) scale(1);} 50%{transform:translate(30px,-20px) scale(1.05);} }
@keyframes float2 { 0%,100%{transform:translate(0,0) scale(1);} 50%{transform:translate(-20px,25px) scale(1.08);} }
`;

const EMPTY = { shop_name: "", owner_name: "", phone: "", email: "", city: "" };

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "11px 14px", border: "1.5px solid var(--border)", borderRadius: 8,
  fontSize: 15, outline: "none", boxSizing: "border-box", background: "var(--bg-input)", color: "var(--text-primary)",
};
const labelStyle: React.CSSProperties = { display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 };

export default function TrialPage() {
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setError("");
    if (!form.shop_name || !form.owner_name || !form.phone || !form.email) {
      setError("Shop name, owner name, phone, and email are required");
      return;
    }
    const phoneDigits = form.phone.replace(/\D/g, "");
    if (phoneDigits.length !== 10) {
      setError("Enter a valid 10-digit phone number");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      setError("Enter a valid email address");
      return;
    }
    setLoading(true);
    try {
      await api.post("/signup-requests", form);
      setDone(true);
    } catch (e: any) {
      setError(e.response?.data?.detail || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-page)", padding: 16, position: "relative", overflow: "hidden" }}>
      <style>{KEYFRAMES}</style>
      <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(110,168,255,0.08),transparent 65%)", top: -100, right: -100, animation: "float1 8s ease-in-out infinite", pointerEvents: "none" }} />
      <div style={{ position: "absolute", width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle,rgba(110,168,255,0.06),transparent 65%)", bottom: -80, left: -80, animation: "float2 10s ease-in-out infinite", pointerEvents: "none" }} />

      <div style={{ width: "100%", maxWidth: 420, position: "relative", zIndex: 1 }}>
        <div className="web-card" style={{ padding: "36px 32px", animation: "fadeSlideUp 0.5s ease-out" }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg,#6EA8FF,#3f7fe0)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <span style={{ color: "#0b1830", fontWeight: 800, fontSize: 20 }}>LP</span>
          </div>

          {done ? (
            <div style={{ textAlign: "center", padding: "12px 0" }}>
              <CheckCircle2 size={40} color="#10b981" style={{ margin: "0 auto 14px" }} />
              <h1 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>Request received!</h1>
              <p style={{ color: "var(--text-muted)", fontSize: 14, lineHeight: 1.6, margin: 0 }}>
                Our team will contact you shortly on WhatsApp/call to set up your account.
              </p>
            </div>
          ) : (
            <>
              <h1 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 800, color: "var(--text-primary)", textAlign: "center" }}>Sign up</h1>
              <p style={{ color: "var(--text-muted)", marginBottom: 24, fontSize: 14, textAlign: "center" }}>Fill your details, we'll set you up</p>

              {error && (
                <div style={{ background: "var(--grade-f-bg)", color: "var(--grade-f-text)", padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 13, border: "1px solid var(--grade-f-border)", fontWeight: 500, textAlign: "left" }}>
                  {error}
                </div>
              )}

              <div style={{ marginBottom: 14, textAlign: "left" }}>
                <label style={labelStyle}>Shop name *</label>
                <input style={inputStyle} placeholder="e.g. Shree Laundry" value={form.shop_name} onChange={set("shop_name")} />
              </div>
              <div style={{ marginBottom: 14, textAlign: "left" }}>
                <label style={labelStyle}>Owner name *</label>
                <input style={inputStyle} placeholder="Your name" value={form.owner_name} onChange={set("owner_name")} />
              </div>
              <div style={{ marginBottom: 14, textAlign: "left" }}>
                <label style={labelStyle}>Phone *</label>
                <input style={inputStyle} placeholder="e.g. +91 98765 43210" value={form.phone} onChange={set("phone")} />
              </div>
              <div style={{ marginBottom: 14, textAlign: "left" }}>
                <label style={labelStyle}>Email *</label>
                <input style={inputStyle} type="email" placeholder="you@example.com" value={form.email} onChange={set("email")} />
              </div>
              <div style={{ marginBottom: 24, textAlign: "left" }}>
                <label style={labelStyle}>City / Area</label>
                <input style={inputStyle} placeholder="e.g. Ahmedabad" value={form.city} onChange={set("city")} />
              </div>

              <button
                style={{ width: "100%", padding: "13px", background: loading ? "var(--border-active)" : "var(--accent-primary)", color: "#0b1830", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" }}
                onClick={submit}
                disabled={loading}
              >
                {loading ? "Submitting…" : "Sign up"}
              </button>

              <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 24, marginBottom: 0, textAlign: "center" }}>LaundryPro © 2025 · Ahmedabad</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
