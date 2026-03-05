import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/auth/login", { username, password });
      localStorage.setItem("token", res.data.access_token);
      navigate("/");
    } catch {
      setError("Invalid username or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.container}>
      <div style={s.bgCircle1} />
      <div style={s.bgCircle2} />
      <div style={s.card}>
        <div style={s.logoWrap}>
          <span style={s.logoEmoji}>👔</span>
        </div>
        <h1 style={s.title}>LaundryPro</h1>
        <p style={s.subtitle}>Sign in to your account</p>

        {error && (
          <div style={s.error}>
            <span>⚠️</span> {error}
          </div>
        )}

        <div style={s.inputWrap}>
          <span style={s.inputIcon}>👤</span>
          <input
            style={s.input}
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
          />
        </div>
        <div style={s.inputWrap}>
          <span style={s.inputIcon}>🔒</span>
          <input
            style={s.input}
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
          />
        </div>

        <button style={{ ...s.button, opacity: loading ? 0.8 : 1 }} onClick={handleLogin} disabled={loading}>
          {loading ? "Signing in..." : "Sign In →"}
        </button>

        <p style={s.footer}>LaundryPro © 2026 • Ahmedabad</p>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    display: "flex", alignItems: "center", justifyContent: "center",
    background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #1d4ed8 100%)",
    padding: 16, position: "relative", overflow: "hidden",
  },
  bgCircle1: {
    position: "absolute", width: 400, height: 400, borderRadius: "50%",
    background: "rgba(255,255,255,0.04)", top: -100, right: -100,
  },
  bgCircle2: {
    position: "absolute", width: 300, height: 300, borderRadius: "50%",
    background: "rgba(255,255,255,0.04)", bottom: -80, left: -80,
  },
  card: {
    background: "rgba(255,255,255,0.98)",
    borderRadius: 24, padding: "40px 36px",
    width: "100%", maxWidth: 380,
    textAlign: "center",
    boxShadow: "0 24px 64px rgba(0,0,0,0.3)",
    position: "relative", zIndex: 1,
  },
  logoWrap: {
    width: 72, height: 72, borderRadius: 20,
    background: "linear-gradient(135deg, #1e3a8a, #3b82f6)",
    display: "flex", alignItems: "center", justifyContent: "center",
    margin: "0 auto 16px", boxShadow: "0 8px 24px rgba(30,58,138,0.35)",
  },
  logoEmoji: { fontSize: 36 },
  title: { margin: 0, fontSize: 26, fontWeight: 800, color: "#0f172a", letterSpacing: -0.5 },
  subtitle: { color: "#64748b", marginBottom: 28, fontSize: 14, marginTop: 6 },
  error: {
    background: "#fef2f2", color: "#dc2626",
    padding: "10px 14px", borderRadius: 10,
    marginBottom: 16, fontSize: 13, display: "flex", alignItems: "center", gap: 8,
    border: "1px solid #fecaca",
  },
  inputWrap: {
    display: "flex", alignItems: "center",
    border: "1.5px solid #e2e8f0", borderRadius: 12,
    marginBottom: 14, background: "#f8fafc",
    transition: "border 0.2s",
  },
  inputIcon: { padding: "0 12px", fontSize: 16 },
  input: {
    flex: 1, padding: "13px 12px 13px 0",
    border: "none", background: "transparent",
    fontSize: 15, outline: "none", color: "#1e293b",
  },
  button: {
    width: "100%", padding: "14px",
    background: "linear-gradient(135deg, #1e3a8a, #2563eb)",
    color: "#fff", border: "none", borderRadius: 12,
    fontSize: 15, fontWeight: 700, cursor: "pointer",
    marginTop: 8, letterSpacing: 0.3,
    boxShadow: "0 4px 16px rgba(30,58,138,0.35)",
    transition: "all 0.2s",
  },
  footer: { fontSize: 11, color: "#94a3b8", marginTop: 24, marginBottom: 0 },
};