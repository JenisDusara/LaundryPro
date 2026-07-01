"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

const KEYFRAMES = `
@keyframes fadeSlideUp { from { opacity:0;transform:translateY(30px); } to { opacity:1;transform:translateY(0); } }
@keyframes float1 { 0%,100%{transform:translate(0,0) scale(1);} 50%{transform:translate(30px,-20px) scale(1.05);} }
@keyframes float2 { 0%,100%{transform:translate(0,0) scale(1);} 50%{transform:translate(-20px,25px) scale(1.08);} }
@keyframes blink { 0%,100%{opacity:1;} 50%{opacity:0;} }
`;

function TypingTitle({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  useEffect(() => { let i=0; const iv=setInterval(()=>{ i++; setDisplayed(text.slice(0,i)); if(i>=text.length){clearInterval(iv);setTimeout(()=>setShowCursor(false),1500);} },100); return ()=>clearInterval(iv); }, [text]);
  return <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "var(--text-primary)", letterSpacing: -0.3, minHeight: 32 }}>{displayed}{showCursor&&<span style={{animation:"blink 0.7s step-end infinite",color:"var(--accent-primary)"}}>|</span>}</h1>;
}

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const id = "login-kf"; if (!document.getElementById(id)) { const s=document.createElement("style"); s.id=id; s.textContent=KEYFRAMES; document.head.appendChild(s); }
    return () => { document.getElementById("login-kf")?.remove(); };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card=cardRef.current; if(!card)return;
    const rect=card.getBoundingClientRect(); const x=e.clientX-rect.left, y=e.clientY-rect.top;
    const rx=((y-rect.height/2)/rect.height/2)*-6, ry=((x-rect.width/2)/rect.width/2)*6;
    card.style.transform=`perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg)`;
  }, []);

  const handleMouseLeave = useCallback(() => { if(cardRef.current) cardRef.current.style.transform="perspective(800px) rotateX(0deg) rotateY(0deg)"; }, []);

  const handleLogin = async () => {
    setLoading(true); setError("");
    try {
      const res = await api.post("/auth/login", { username, password });
      localStorage.setItem("token", res.data.access_token);
      router.push("/dashboard");
    } catch { setError("Invalid username or password"); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-page)", padding: 16, position: "relative", overflow: "hidden" }}>
      {/* Subtle decorative blobs using accent color */}
      <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(110,168,255,0.08),transparent 65%)", top: -100, right: -100, animation: "float1 8s ease-in-out infinite", pointerEvents: "none" }} />
      <div style={{ position: "absolute", width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle,rgba(110,168,255,0.06),transparent 65%)", bottom: -80, left: -80, animation: "float2 10s ease-in-out infinite", pointerEvents: "none" }} />

      <div style={{ width: "100%", maxWidth: 400, position: "relative", zIndex: 1 }}>
        {/* Card */}
        <div
          ref={cardRef}
          className="web-card"
          style={{ padding: "36px 32px", textAlign: "center", animation: "fadeSlideUp 0.5s ease-out", transition: "transform 0.15s ease-out" }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* LP Badge */}
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg,#6EA8FF,#3f7fe0)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <span style={{ color: "#0b1830", fontWeight: 800, fontSize: 20 }}>LP</span>
          </div>

          <TypingTitle text="LaundryPro" />
          <p style={{ color: "var(--text-muted)", marginBottom: 28, fontSize: 14, marginTop: 6 }}>Sign in to continue</p>

          {error && (
            <div style={{ background: "var(--grade-f-bg)", color: "var(--grade-f-text)", padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 13, border: "1px solid var(--grade-f-border)", fontWeight: 500, textAlign: "left" }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: 14, textAlign: "left" }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>Username</label>
            <input
              style={{ width: "100%", padding: "11px 14px", border: "1.5px solid var(--border)", borderRadius: 8, fontSize: 15, outline: "none", boxSizing: "border-box", background: "var(--bg-input)", color: "var(--text-primary)", transition: "border-color 0.15s" }}
              placeholder="Enter your username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              onFocus={e => e.target.style.borderColor = "var(--border-active)"}
              onBlur={e => e.target.style.borderColor = "var(--border)"}
            />
          </div>

          <div style={{ marginBottom: 24, textAlign: "left" }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>Password</label>
            <input
              type="password"
              style={{ width: "100%", padding: "11px 14px", border: "1.5px solid var(--border)", borderRadius: 8, fontSize: 15, outline: "none", boxSizing: "border-box", background: "var(--bg-input)", color: "var(--text-primary)", transition: "border-color 0.15s" }}
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              onFocus={e => e.target.style.borderColor = "var(--border-active)"}
              onBlur={e => e.target.style.borderColor = "var(--border)"}
            />
          </div>

          <button
            style={{ width: "100%", padding: "13px", background: loading ? "var(--border-active)" : "var(--accent-primary)", color: "#0b1830", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", boxShadow: loading ? "none" : "var(--shadow-glow-blue)", transition: "opacity 0.15s", position: "relative", overflow: "hidden" }}
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>

          <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 24, marginBottom: 0 }}>LaundryPro © 2025 · Ahmedabad</p>
        </div>
      </div>
    </div>
  );
}
