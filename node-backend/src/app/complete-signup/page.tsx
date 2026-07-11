"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { XCircle } from "lucide-react";
import api from "@/lib/api";

const KEYFRAMES = `
@keyframes fadeSlideUp { from { opacity:0;transform:translateY(30px); } to { opacity:1;transform:translateY(0); } }
@keyframes float1 { 0%,100%{transform:translate(0,0) scale(1);} 50%{transform:translate(30px,-20px) scale(1.05);} }
@keyframes float2 { 0%,100%{transform:translate(0,0) scale(1);} 50%{transform:translate(-20px,25px) scale(1.08);} }
`;

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "11px 14px", border: "1.5px solid var(--border)", borderRadius: 8,
  fontSize: 15, outline: "none", boxSizing: "border-box", background: "var(--bg-input)", color: "var(--text-primary)",
};
const labelStyle: React.CSSProperties = { display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 };

export default function CompleteSignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [checking, setChecking] = useState(true);
  const [shopName, setShopName] = useState("");
  const [linkError, setLinkError] = useState("");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const id = "complete-signup-kf";
    if (!document.getElementById(id)) { const s = document.createElement("style"); s.id = id; s.textContent = KEYFRAMES; document.head.appendChild(s); }
    return () => { document.getElementById(id)?.remove(); };
  }, []);

  useEffect(() => {
    if (!token) { setLinkError("This link is missing a token."); setChecking(false); return; }
    api.get(`/auth/complete-signup?token=${encodeURIComponent(token)}`)
      .then(r => setShopName(r.data.shop_name))
      .catch(e => setLinkError(e.response?.data?.detail || "This setup link is invalid or has expired."))
      .finally(() => setChecking(false));
  }, [token]);

  const submit = async () => {
    setError("");
    if (!username || !password || !confirm) { setError("All fields are required"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (password !== confirm) { setError("Passwords do not match"); return; }
    setLoading(true);
    try {
      const res = await api.post("/auth/complete-signup", { token, username, password });
      localStorage.setItem("token", res.data.access_token);
      router.push("/dashboard");
    } catch (e: any) {
      setError(e.response?.data?.detail || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-page)", padding: 16, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(110,168,255,0.08),transparent 65%)", top: -100, right: -100, animation: "float1 8s ease-in-out infinite", pointerEvents: "none" }} />
      <div style={{ position: "absolute", width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle,rgba(110,168,255,0.06),transparent 65%)", bottom: -80, left: -80, animation: "float2 10s ease-in-out infinite", pointerEvents: "none" }} />

      <div style={{ width: "100%", maxWidth: 420, position: "relative", zIndex: 1 }}>
        <div className="web-card" style={{ padding: "36px 32px", animation: "fadeSlideUp 0.5s ease-out" }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg,#6EA8FF,#3f7fe0)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <span style={{ color: "#0b1830", fontWeight: 800, fontSize: 20 }}>LP</span>
          </div>

          {checking ? (
            <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 14, padding: "20px 0" }}>Checking your link…</div>
          ) : linkError ? (
            <div style={{ textAlign: "center", padding: "12px 0" }}>
              <XCircle size={40} color="#ef4444" style={{ margin: "0 auto 14px" }} />
              <h1 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>Link problem</h1>
              <p style={{ color: "var(--text-muted)", fontSize: 14, lineHeight: 1.6, margin: 0 }}>{linkError}</p>
            </div>
          ) : (
            <>
              <h1 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 800, color: "var(--text-primary)", textAlign: "center" }}>Set up your account</h1>
              <p style={{ color: "var(--text-muted)", marginBottom: 24, fontSize: 14, textAlign: "center" }}>for <strong>{shopName}</strong> — choose your login details</p>

              {error && (
                <div style={{ background: "var(--grade-f-bg)", color: "var(--grade-f-text)", padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 13, border: "1px solid var(--grade-f-border)", fontWeight: 500, textAlign: "left" }}>
                  {error}
                </div>
              )}

              <div style={{ marginBottom: 14, textAlign: "left" }}>
                <label style={labelStyle}>Username</label>
                <input style={inputStyle} placeholder="Choose a username" value={username} onChange={e => setUsername(e.target.value)} />
              </div>
              <div style={{ marginBottom: 14, textAlign: "left" }}>
                <label style={labelStyle}>Password</label>
                <input type="password" style={inputStyle} placeholder="At least 6 characters" value={password} onChange={e => setPassword(e.target.value)} />
              </div>
              <div style={{ marginBottom: 24, textAlign: "left" }}>
                <label style={labelStyle}>Confirm Password</label>
                <input type="password" style={inputStyle} placeholder="Re-enter password" value={confirm} onChange={e => setConfirm(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && submit()} />
              </div>

              <button
                style={{ width: "100%", padding: "13px", background: loading ? "var(--border-active)" : "var(--accent-primary)", color: "#0b1830", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" }}
                onClick={submit}
                disabled={loading}
              >
                {loading ? "Setting up…" : "Set up & log in"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
