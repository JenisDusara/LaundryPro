"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

const KEYFRAMES = `
@keyframes fadeSlideUp { from { opacity:0;transform:translateY(30px); } to { opacity:1;transform:translateY(0); } }
@keyframes gradientShift { 0%{background-position:0% 50%;} 50%{background-position:100% 50%;} 100%{background-position:0% 50%;} }
@keyframes float1 { 0%,100%{transform:translate(0,0) scale(1);} 50%{transform:translate(30px,-20px) scale(1.05);} }
@keyframes float2 { 0%,100%{transform:translate(0,0) scale(1);} 50%{transform:translate(-20px,25px) scale(1.08);} }
@keyframes pulseGlow { 0%,100%{box-shadow:0 0 20px rgba(59,130,246,0.4);} 50%{box-shadow:0 0 45px rgba(59,130,246,0.8);} }
@keyframes borderGlow { 0%,100%{border-color:rgba(59,130,246,0.3);} 50%{border-color:rgba(99,170,255,0.5);} }
@keyframes inputReveal { from{opacity:0;transform:translateX(-20px);} to{opacity:1;transform:translateX(0);} }
@keyframes shimmer { 0%{transform:translateX(-100%) skewX(-15deg);} 100%{transform:translateX(200%) skewX(-15deg);} }
@keyframes blink { 0%,100%{opacity:1;} 50%{opacity:0;} }
`;

function Particles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    let animId: number;
    const dpr = window.devicePixelRatio || 1;
    const resize = () => { canvas.width = window.innerWidth*dpr; canvas.height = window.innerHeight*dpr; canvas.style.width = window.innerWidth+"px"; canvas.style.height = window.innerHeight+"px"; ctx.setTransform(dpr,0,0,dpr,0,0); };
    resize(); window.addEventListener("resize", resize);
    const dots = Array.from({length:50}, () => ({ x:Math.random()*window.innerWidth, y:Math.random()*window.innerHeight, r:Math.random()*2+0.5, dx:(Math.random()-0.5)*0.3, dy:(Math.random()-0.5)*0.3, alpha:Math.random()*0.5+0.2, pulse:Math.random()*Math.PI*2, pulseSpeed:Math.random()*0.02+0.005 }));
    const draw = () => {
      const w=window.innerWidth, h=window.innerHeight; ctx.clearRect(0,0,w,h);
      for (const d of dots) { d.x+=d.dx; d.y+=d.dy; d.pulse+=d.pulseSpeed; if(d.x<0)d.x=w; if(d.x>w)d.x=0; if(d.y<0)d.y=h; if(d.y>h)d.y=0; const a=d.alpha*(0.6+0.4*Math.sin(d.pulse)); ctx.beginPath(); ctx.arc(d.x,d.y,d.r,0,Math.PI*2); ctx.fillStyle=`rgba(147,197,253,${a})`; ctx.fill(); }
      for (let i=0;i<dots.length;i++) for (let j=i+1;j<dots.length;j++) { const dx=dots[i].x-dots[j].x, dy=dots[i].y-dots[j].y, dist=Math.sqrt(dx*dx+dy*dy); if(dist<120){ctx.beginPath();ctx.moveTo(dots[i].x,dots[i].y);ctx.lineTo(dots[j].x,dots[j].y);ctx.strokeStyle=`rgba(147,197,253,${0.08*(1-dist/120)})`;ctx.lineWidth=0.5;ctx.stroke();} }
      animId=requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize",resize); };
  }, []);
  return <canvas ref={canvasRef} style={{position:"absolute",inset:0,zIndex:0,pointerEvents:"none"}} />;
}

function TypingTitle({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  useEffect(() => { let i=0; const iv=setInterval(()=>{ i++; setDisplayed(text.slice(0,i)); if(i>=text.length){clearInterval(iv);setTimeout(()=>setShowCursor(false),1500);} },100); return ()=>clearInterval(iv); }, [text]);
  return <h1 style={s.title}>{displayed}{showCursor&&<span style={{animation:"blink 0.7s step-end infinite",color:"#3b82f6"}}>|</span>}</h1>;
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
    const rx=((y-rect.height/2)/rect.height/2)*-8, ry=((x-rect.width/2)/rect.width/2)*8;
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
    <div style={s.container}>
      <Particles />
      <div style={s.bgCircle1}/><div style={s.bgCircle2}/><div style={s.bgCircle3}/>
      <div ref={cardRef} style={s.card} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
        <div style={s.logoWrap}><span style={{fontSize:38}}>👔</span></div>
        <TypingTitle text="LaundryPro" />
        <p style={s.subtitle}>Sign in to your account</p>
        {error && <div style={s.error}>⚠️ {error}</div>}
        <div style={s.inputWrap}>
          <span style={{padding:"0 14px",fontSize:16}}>👤</span>
          <input style={s.input} placeholder="Username" value={username} onChange={e=>setUsername(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()} />
        </div>
        <div style={s.inputWrap}>
          <span style={{padding:"0 14px",fontSize:16}}>🔒</span>
          <input style={s.input} type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()} />
        </div>
        <button style={{...s.button,opacity:loading?0.8:1}} onClick={handleLogin} disabled={loading}>
          <span style={s.shimmer}/>
          {loading ? "Signing in..." : "Sign In →"}
        </button>
        <p style={s.footer}>LaundryPro © 2025 • Ahmedabad</p>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  container:{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(135deg,#020617 0%,#0f172a 25%,#1e3a8a 50%,#1d4ed8 75%,#0f172a 100%)",backgroundSize:"400% 400%",animation:"gradientShift 12s ease infinite",padding:16,position:"relative",overflow:"hidden"},
  bgCircle1:{position:"absolute",width:500,height:500,borderRadius:"50%",background:"radial-gradient(circle,rgba(59,130,246,0.18),transparent 65%)",top:-140,right:-140,animation:"float1 8s ease-in-out infinite"},
  bgCircle2:{position:"absolute",width:400,height:400,borderRadius:"50%",background:"radial-gradient(circle,rgba(147,51,234,0.15),transparent 65%)",bottom:-120,left:-120,animation:"float2 10s ease-in-out infinite"},
  bgCircle3:{position:"absolute",width:250,height:250,borderRadius:"50%",background:"radial-gradient(circle,rgba(14,165,233,0.12),transparent 65%)",top:"45%",left:"55%"},
  card:{background:"rgba(255,255,255,0.07)",backdropFilter:"blur(28px)",WebkitBackdropFilter:"blur(28px)",border:"1.5px solid rgba(59,130,246,0.3)",borderRadius:24,padding:"44px 38px",width:"100%",maxWidth:390,textAlign:"center",animation:"fadeSlideUp 0.6s ease-out, borderGlow 4s ease-in-out infinite",position:"relative",zIndex:1,transition:"transform 0.15s ease-out"},
  logoWrap:{width:76,height:76,borderRadius:22,background:"linear-gradient(135deg,rgba(30,58,138,0.9),rgba(59,130,246,0.9))",backdropFilter:"blur(12px)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 18px",animation:"pulseGlow 3s ease-in-out infinite"},
  title:{margin:0,fontSize:28,fontWeight:800,color:"#ffffff",letterSpacing:-0.5,minHeight:36},
  subtitle:{color:"rgba(255,255,255,0.5)",marginBottom:30,fontSize:14,marginTop:6},
  error:{background:"rgba(220,38,38,0.12)",color:"#fca5a5",padding:"10px 14px",borderRadius:10,marginBottom:16,fontSize:13,border:"1px solid rgba(220,38,38,0.25)"},
  inputWrap:{display:"flex",alignItems:"center",border:"1.5px solid rgba(255,255,255,0.12)",borderRadius:12,marginBottom:14,background:"rgba(255,255,255,0.06)"},
  input:{flex:1,padding:"14px 14px 14px 0",border:"none",background:"transparent",fontSize:15,outline:"none",color:"#e2e8f0"},
  button:{width:"100%",padding:"15px",background:"linear-gradient(135deg,rgba(30,58,138,0.85),rgba(37,99,235,0.85))",backdropFilter:"blur(12px)",color:"#fff",border:"1.5px solid rgba(255,255,255,0.2)",borderRadius:12,fontSize:15,fontWeight:700,cursor:"pointer",marginTop:10,boxShadow:"0 4px 25px rgba(59,130,246,0.3)",transition:"all 0.3s ease",position:"relative",overflow:"hidden"},
  shimmer:{position:"absolute",top:0,left:0,width:"50%",height:"100%",background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)",animation:"shimmer 2.5s ease-in-out infinite",pointerEvents:"none"},
  footer:{fontSize:11,color:"rgba(255,255,255,0.3)",marginTop:26,marginBottom:0},
};
