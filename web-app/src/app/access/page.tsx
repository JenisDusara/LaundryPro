"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Eye, EyeOff, Lock, ArrowLeft } from "lucide-react";

export default function AccessPage() {
  const router = useRouter();
  const { login, isAuth } = useAuth();
  const [pw,      setPw]      = useState("");
  const [show,    setShow]    = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState(false);

  if (isAuth) { router.replace("/dashboard"); return null; }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pw) { setError("Please enter your password"); return; }
    setLoading(true); setError("");
    const result = await login(pw);
    if (result.ok) { setSuccess(true); setTimeout(() => router.replace("/dashboard"), 800); }
    else { setError(result.detail || "Incorrect password. Contact your LaundryPro admin."); setLoading(false); }
  };

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(160deg,#0f0c29 0%,#302b63 50%,#24243e 100%)", display:"flex", alignItems:"center", justifyContent:"center", padding:24, position:"relative", overflow:"hidden" }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}} @keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>

      {/* Background orbs */}
      <div style={{ position:"absolute", top:-100, left:-100, width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle,rgba(79,70,229,0.3) 0%,transparent 70%)", pointerEvents:"none" }}/>
      <div style={{ position:"absolute", bottom:-100, right:-100, width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle,rgba(124,58,237,0.2) 0%,transparent 70%)", pointerEvents:"none" }}/>
      <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:"100%", height:"100%", backgroundImage:"radial-gradient(rgba(255,255,255,0.025) 1px,transparent 1px)", backgroundSize:"30px 30px", pointerEvents:"none" }}/>

      {/* Back to home */}
      <a href="/" style={{ position:"absolute", top:24, left:28, display:"flex", alignItems:"center", gap:8, color:"rgba(255,255,255,0.4)", fontSize:13, fontWeight:600, textDecoration:"none", transition:"color 0.15s" }}
        onMouseEnter={e=>e.currentTarget.style.color="rgba(255,255,255,0.8)"}
        onMouseLeave={e=>e.currentTarget.style.color="rgba(255,255,255,0.4)"}>
        <ArrowLeft size={15}/> Back to Home
      </a>

      {/* Card */}
      <div style={{ width:"100%", maxWidth:420, animation:"fadeUp 0.4s ease both" }}>

        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ width:64, height:64, borderRadius:20, background:"linear-gradient(135deg,#4f46e5,#7c3aed)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:32, margin:"0 auto 14px", boxShadow:"0 8px 32px rgba(79,70,229,0.4)" }}>👔</div>
          <div style={{ color:"#fff", fontWeight:900, fontSize:24, letterSpacing:-0.5 }}>LaundryPro</div>
          <div style={{ color:"rgba(255,255,255,0.4)", fontSize:13, marginTop:4 }}>Staff Dashboard Access</div>
        </div>

        {/* Form card */}
        <div style={{ background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:24, padding:32, backdropFilter:"blur(20px)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:24 }}>
            <div style={{ width:38, height:38, borderRadius:11, background:"rgba(79,70,229,0.2)", border:"1px solid rgba(79,70,229,0.3)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Lock size={16} color="#818cf8"/>
            </div>
            <div>
              <div style={{ color:"#fff", fontWeight:700, fontSize:15 }}>Enter Dashboard Password</div>
              <div style={{ color:"rgba(255,255,255,0.4)", fontSize:12 }}>Provided by your LaundryPro admin</div>
            </div>
          </div>

          <form onSubmit={submit}>
            <div style={{ marginBottom:16 }}>
              <div style={{ color:"rgba(255,255,255,0.5)", fontSize:11, fontWeight:700, letterSpacing:"0.06em", marginBottom:8, textTransform:"uppercase" }}>Password</div>
              <div style={{ position:"relative" }}>
                <input
                  type={show ? "text" : "password"}
                  value={pw}
                  onChange={e => { setPw(e.target.value); setError(""); }}
                  placeholder="Enter your password…"
                  autoComplete="current-password"
                  style={{ width:"100%", padding:"14px 48px 14px 16px", borderRadius:13, border:"1.5px solid rgba(255,255,255,0.12)", background:"rgba(255,255,255,0.06)", color:"#fff", fontSize:15, outline:"none", boxSizing:"border-box", fontFamily:"inherit", transition:"border-color 0.15s" }}
                  onFocus={e=>e.target.style.borderColor="rgba(129,140,248,0.6)"}
                  onBlur={e=>e.target.style.borderColor="rgba(255,255,255,0.12)"}
                />
                <button type="button" onClick={()=>setShow(v=>!v)}
                  style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"rgba(255,255,255,0.35)", display:"flex", alignItems:"center" }}>
                  {show ? <EyeOff size={17}/> : <Eye size={17}/>}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ padding:"10px 14px", borderRadius:10, background:"rgba(239,68,68,0.12)", border:"1px solid rgba(239,68,68,0.25)", color:"#fca5a5", fontSize:13, marginBottom:14, display:"flex", alignItems:"center", gap:8 }}>
                ⚠️ {error}
              </div>
            )}

            <button type="submit" disabled={loading || success}
              style={{ width:"100%", padding:"14px", borderRadius:13, border:"none", background: success ? "linear-gradient(135deg,#22c55e,#16a34a)" : "linear-gradient(135deg,#4f46e5,#7c3aed)", color:"#fff", fontWeight:800, fontSize:15, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:10, boxShadow: success ? "0 6px 24px rgba(34,197,94,0.35)" : "0 6px 24px rgba(79,70,229,0.35)", transition:"all 0.2s", opacity: loading ? 0.8 : 1 }}>
              {success ? (
                <>✓ Access Granted — Opening Dashboard…</>
              ) : loading ? (
                <><div style={{ width:16, height:16, border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"#fff", borderRadius:"50%", animation:"spin 0.7s linear infinite" }}/> Verifying…</>
              ) : (
                <><Lock size={15}/> Unlock Dashboard</>
              )}
            </button>
          </form>

          <div style={{ marginTop:20, paddingTop:18, borderTop:"1px solid rgba(255,255,255,0.08)", textAlign:"center" }}>
            <div style={{ color:"rgba(255,255,255,0.25)", fontSize:12 }}>
              Want to see a demo first?{" "}
              <a href="/dashboard" style={{ color:"rgba(129,140,248,0.7)", textDecoration:"none", fontWeight:600 }}>View in read-only mode →</a>
            </div>
          </div>
        </div>

        {/* Note */}
        <div style={{ textAlign:"center", marginTop:20, color:"rgba(255,255,255,0.2)", fontSize:12 }}>
          Don't have access? Contact us on{" "}
          <a href="https://wa.me/919999999999" target="_blank" rel="noreferrer" style={{ color:"rgba(74,222,128,0.6)", textDecoration:"none", fontWeight:600 }}>WhatsApp</a>
        </div>
      </div>
    </div>
  );
}
