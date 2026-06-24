"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Building2, Plus, Trash2, X, Eye, EyeOff, ShieldCheck,
  Pencil, Check, Search, Users, RefreshCw, KeyRound,
  CalendarClock, AlertTriangle, RotateCcw, UserCheck, UserX, TrendingUp
} from "lucide-react";
import api from "@/lib/api";
import ProtectedLayout from "@/components/ProtectedLayout";

interface Client {
  id: string; username: string; name: string;
  shop_id: string; shop_name: string; is_active: boolean; created_at: string;
  staff_count: number; plan_type: string | null; expires_at: string | null;
}

function daysLeft(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  return Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000);
}

function calcExpiry(plan: "monthly" | "yearly", currentExpiry: string | null): string {
  const base = currentExpiry && new Date(currentExpiry) > new Date() ? new Date(currentExpiry) : new Date();
  if (plan === "monthly") base.setDate(base.getDate() + 30);
  else base.setFullYear(base.getFullYear() + 1);
  return base.toISOString().slice(0, 10);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function expiryBadge(expiresAt: string | null) {
  const d = daysLeft(expiresAt);
  if (d === null) return { label: "No Plan", bg: "#f1f5f9", text: "#94a3b8", dot: "#cbd5e1" };
  if (d < 0)      return { label: "Expired",  bg: "#fef2f2", text: "#dc2626", dot: "#dc2626" };
  if (d <= 7)     return { label: `${d}d left`, bg: "#fffbeb", text: "#d97706", dot: "#f59e0b" };
  return           { label: `${d}d left`, bg: "#f0fdf4", text: "#16a34a", dot: "#22c55e" };
}

const AVATAR_COLORS = ["#6d28d9","#1d4ed8","#059669","#d97706","#be185d","#0891b2","#dc2626","#0f766e"];
function avatarBg(s: string) { return AVATAR_COLORS[s.charCodeAt(0) % AVATAR_COLORS.length]; }

const emptyForm = { username: "", password: "", name: "", shop_id: "", shop_name: "", plan_type: "monthly", expires_at: "" };

export default function SuperAdminPage() {
  const router = useRouter();
  const [clients,    setClients]    = useState<Client[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [showForm,   setShowForm]   = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [deleteId,   setDeleteId]   = useState<string|null>(null);
  const [editClient, setEditClient] = useState<Client|null>(null);
  const [editForm,   setEditForm]   = useState({ username:"", name:"", shop_id:"", shop_name:"", password:"" });
  const [editSaving, setEditSaving] = useState(false);
  const [msg,        setMsg]        = useState<{text:string;ok:boolean}|null>(null);
  const [showPass,   setShowPass]   = useState(false);
  const [showEditPass, setShowEditPass] = useState(false);
  const [form,       setForm]       = useState(emptyForm);
  const [renewClient, setRenewClient] = useState<Client|null>(null);
  const [renewPlan,   setRenewPlan]   = useState<"monthly"|"yearly">("monthly");
  const [renewDate,   setRenewDate]   = useState("");
  const [renewSaving, setRenewSaving] = useState(false);

  useEffect(() => {
    api.get("/auth/me").then(r => {
      if (r.data.role !== "superadmin") { router.replace("/dashboard"); return; }
      load();
    }).catch(() => router.replace("/login"));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = () => {
    setLoading(true);
    api.get("/admin/shops").then(r => setClients(r.data)).finally(() => setLoading(false));
  };

  const flash = (text: string, ok: boolean) => { setMsg({text,ok}); setTimeout(()=>setMsg(null),4000); };

  const save = async () => {
    if (!form.username||!form.password||!form.shop_id||!form.shop_name){flash("All fields are required",false);return;}
    setSaving(true);
    try {
      await api.post("/admin/shops", form);
      flash("Client created!",true); setForm(emptyForm); setShowForm(false); load();
    } catch(e:any){ flash(e.response?.data?.detail||"Failed",false); }
    finally { setSaving(false); }
  };

  const openEdit = (c: Client) => { setEditClient(c); setEditForm({username:c.username,name:c.name,shop_id:c.shop_id,shop_name:c.shop_name,password:""}); setShowEditPass(false); };

  const saveEdit = async () => {
    if (!editClient) return;
    if (!editForm.username||!editForm.shop_id||!editForm.shop_name){flash("Required fields missing",false);return;}
    setEditSaving(true);
    try {
      const payload: any = {username:editForm.username,name:editForm.name,shop_id:editForm.shop_id,shop_name:editForm.shop_name};
      if (editForm.password) payload.password = editForm.password;
      const res = await api.put(`/admin/shops/${editClient.id}`,payload);
      setClients(cs=>cs.map(c=>c.id===editClient.id?{...c,...res.data}:c));
      flash("Updated!",true); setEditClient(null);
    } catch(e:any){ flash(e.response?.data?.detail||"Failed",false); }
    finally { setEditSaving(false); }
  };

  const toggleActive = async (c: Client) => {
    try {
      await api.patch(`/admin/shops/${c.id}`, { is_active: !c.is_active });
      setClients(cs=>cs.map(x=>x.id===c.id?{...x,is_active:!c.is_active}:x));
      flash(`${c.shop_name} ${!c.is_active?"enabled":"disabled"}`,true);
    } catch{ flash("Failed",false); }
  };

  const renewSubscription = async () => {
    if (!renewClient||!renewDate) return;
    setRenewSaving(true);
    try {
      const res = await api.patch(`/admin/shops/${renewClient.id}`,{plan_type:renewPlan,expires_at:renewDate});
      setClients(cs=>cs.map(c=>c.id===renewClient.id?{...c,plan_type:res.data.plan_type,expires_at:res.data.expires_at,is_active:true}:c));
      flash(`${renewClient.shop_name} renewed!`,true); setRenewClient(null);
    } catch(e:any){ flash(e.response?.data?.detail||"Failed",false); }
    finally { setRenewSaving(false); }
  };

  const deleteClient = async (id: string) => {
    try { await api.delete(`/admin/users/${id}`); setClients(c=>c.filter(x=>x.id!==id)); flash("Removed",true); }
    catch(e:any){ flash(e.response?.data?.detail||"Failed",false); }
    setDeleteId(null);
  };

  const filtered = clients.filter(c => !search ||
    c.shop_name.toLowerCase().includes(search.toLowerCase()) ||
    c.username.toLowerCase().includes(search.toLowerCase()) ||
    c.shop_id.toLowerCase().includes(search.toLowerCase()) ||
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const inp: React.CSSProperties = { width:"100%", padding:"11px 14px", border:"1.5px solid #e2e8f0", borderRadius:10, fontSize:14, outline:"none", boxSizing:"border-box", background:"#f8fafc", color:"#0f172a" };
  const lbl: React.CSSProperties = { fontSize:11, fontWeight:700, color:"#64748b", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.05em" };

  const expiryAlerts = clients.filter(c => { const d = daysLeft(c.expires_at); return d !== null && d <= 7; });

  return (
    <ProtectedLayout>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pop{from{opacity:0;transform:scale(0.96)}to{opacity:1;transform:scale(1)}}
        .card-hover{transition:box-shadow 0.18s,transform 0.18s}
        .card-hover:hover{box-shadow:0 12px 40px rgba(0,0,0,0.10)!important;transform:translateY(-2px)}
        .act{transition:all 0.14s;cursor:pointer}
        .act:hover{opacity:0.8;transform:translateY(-1px)}
      `}</style>

      {/* ─── TOP BAR ─── */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:28,flexWrap:"wrap",gap:14}}>
        <div style={{animation:"fadeUp 0.3s ease both"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
            <div style={{width:4,height:28,borderRadius:4,background:"linear-gradient(#7c3aed,#4c1d95)"}}/>
            <h1 style={{margin:0,fontSize:22,fontWeight:900,color:"#0f172a",letterSpacing:-0.5}}>Client Management</h1>
            <span style={{fontSize:10,fontWeight:800,background:"linear-gradient(135deg,#7c3aed,#4c1d95)",color:"#fff",padding:"3px 10px",borderRadius:20,letterSpacing:"0.08em"}}>SUPERADMIN</span>
          </div>
          <p style={{margin:0,fontSize:13,color:"#94a3b8"}}>{clients.filter(c=>c.is_active).length} active · {clients.length} total shops</p>
        </div>
        <div style={{display:"flex",gap:10,animation:"fadeUp 0.3s ease 0.05s both"}}>
          <div style={{position:"relative"}}>
            <Search size={14} style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"#94a3b8",pointerEvents:"none"}}/>
            <input placeholder="Search shop, username…" value={search} onChange={e=>setSearch(e.target.value)}
              style={{padding:"10px 16px 10px 36px",border:"1.5px solid #e2e8f0",borderRadius:12,fontSize:13,outline:"none",background:"#fff",width:210,color:"#0f172a",boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}/>
          </div>
          <button onClick={load} style={{width:40,height:40,borderRadius:11,border:"1.5px solid #e2e8f0",background:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#64748b",boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
            <RefreshCw size={15}/>
          </button>
          <button onClick={()=>{setShowForm(v=>!v);setEditClient(null);}}
            style={{display:"flex",alignItems:"center",gap:8,padding:"10px 20px",borderRadius:12,border:"none",background:"linear-gradient(135deg,#6d28d9,#4c1d95)",color:"#fff",fontWeight:700,fontSize:14,cursor:"pointer",boxShadow:"0 4px 14px rgba(109,40,217,0.35)"}}>
            <Plus size={16}/> New Client
          </button>
        </div>
      </div>

      {/* ─── STATS ─── */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:24}}>
        {[
          { label:"Total Clients",   value:clients.length,                                   icon:Building2,   from:"#ede9fe", to:"#ddd6fe", accent:"#7c3aed" },
          { label:"Active",          value:clients.filter(c=>c.is_active).length,            icon:UserCheck,   from:"#dcfce7", to:"#bbf7d0", accent:"#16a34a" },
          { label:"Disabled",        value:clients.filter(c=>!c.is_active).length,           icon:UserX,       from:"#fee2e2", to:"#fecaca", accent:"#dc2626" },
          { label:"Total Staff",     value:clients.reduce((s,c)=>s+(c.staff_count||0),0),    icon:Users,       from:"#e0f2fe", to:"#bae6fd", accent:"#0284c7" },
        ].map((s,i)=>(
          <div key={i} style={{animation:`fadeUp 0.3s ease ${i*0.06}s both`,borderRadius:16,padding:"20px 22px",
            background:`linear-gradient(135deg,${s.from},${s.to})`,border:`1px solid ${s.to}`,
            boxShadow:"0 2px 12px rgba(0,0,0,0.05)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
              <span style={{fontSize:12,fontWeight:700,color:"#475569",letterSpacing:"0.02em"}}>{s.label}</span>
              <div style={{width:32,height:32,borderRadius:9,background:"rgba(255,255,255,0.6)",display:"flex",alignItems:"center",justifyContent:"center",color:s.accent}}>
                <s.icon size={16}/>
              </div>
            </div>
            <div style={{fontSize:32,fontWeight:900,color:s.accent,letterSpacing:-1}}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ─── ALERTS ─── */}
      {expiryAlerts.length > 0 && (
        <div style={{animation:"slideIn 0.25s ease both",background:"#fffbeb",border:"1.5px solid #fde68a",borderRadius:14,padding:"14px 18px",marginBottom:20,display:"flex",gap:14,alignItems:"flex-start"}}>
          <div style={{width:36,height:36,borderRadius:10,background:"#fef3c7",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2}}>
            <AlertTriangle size={18} color="#d97706"/>
          </div>
          <div>
            <div style={{fontWeight:800,fontSize:13,color:"#92400e",marginBottom:4}}>Subscription Alert</div>
            <div style={{fontSize:13,color:"#78350f",lineHeight:1.6}}>
              {expiryAlerts.map((c,i)=>{
                const d=daysLeft(c.expires_at);
                return <span key={c.id}>{i>0&&" · "}<b>{c.shop_name}</b> — {d!==null&&d<0?"expired":`${d}d left`}</span>;
              })}
            </div>
          </div>
        </div>
      )}

      {msg && (
        <div style={{animation:"slideIn 0.2s ease both",padding:"12px 18px",borderRadius:12,marginBottom:18,fontSize:14,fontWeight:600,
          background:msg.ok?"#f0fdf4":"#fef2f2",color:msg.ok?"#16a34a":"#dc2626",border:`1.5px solid ${msg.ok?"#86efac":"#fca5a5"}`}}>
          {msg.ok?"✓  ":"✕  "}{msg.text}
        </div>
      )}

      {/* ─── ADD FORM ─── */}
      {showForm && (
        <div style={{animation:"slideIn 0.22s ease both",background:"#fff",borderRadius:20,border:"1.5px solid #e2e8f0",boxShadow:"0 8px 40px rgba(0,0,0,0.09)",marginBottom:24,overflow:"hidden"}}>
          <div style={{background:"linear-gradient(135deg,#1e1b4b,#4c1d95)",padding:"20px 24px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div>
              <div style={{color:"#fff",fontWeight:800,fontSize:16}}>New Client</div>
              <div style={{color:"rgba(255,255,255,0.45)",fontSize:12,marginTop:2}}>Create a new shop admin account</div>
            </div>
            <button onClick={()=>setShowForm(false)} style={{width:32,height:32,background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:9,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <X size={15} color="#fff"/>
            </button>
          </div>
          <div style={{padding:24}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              <div>
                <div style={lbl}>Shop Name *</div>
                <input style={inp} placeholder="e.g. Shree Chamunda Drycleaners" value={form.shop_name} onChange={e=>setForm(f=>({...f,shop_name:e.target.value}))}/>
              </div>
              <div>
                <div style={lbl}>Shop ID *</div>
                <input style={inp} placeholder="e.g. shop2 (unique, no spaces)" value={form.shop_id} onChange={e=>setForm(f=>({...f,shop_id:e.target.value}))}/>
              </div>
              <div>
                <div style={lbl}>Username *</div>
                <input style={inp} placeholder="Login username" value={form.username} onChange={e=>setForm(f=>({...f,username:e.target.value}))}/>
              </div>
              <div>
                <div style={lbl}>Password *</div>
                <div style={{position:"relative"}}>
                  <input type={showPass?"text":"password"} placeholder="Login password" value={form.password}
                    onChange={e=>setForm(f=>({...f,password:e.target.value}))} style={{...inp,paddingRight:42}}/>
                  <button onClick={()=>setShowPass(v=>!v)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",display:"flex",padding:2}}>
                    {showPass?<EyeOff size={16} color="#94a3b8"/>:<Eye size={16} color="#94a3b8"/>}
                  </button>
                </div>
              </div>
              <div style={{gridColumn:"1 / -1"}}>
                <div style={lbl}>Owner Name <span style={{fontWeight:400,textTransform:"none",color:"#94a3b8"}}>(optional)</span></div>
                <input style={inp} placeholder="e.g. Harsh Chudasama" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/>
              </div>
              <div style={{gridColumn:"1 / -1",background:"#fafafa",borderRadius:14,padding:16,border:"1px solid #f1f5f9"}}>
                <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:14}}>
                  <CalendarClock size={14} color="#7c3aed"/>
                  <span style={{fontSize:12,fontWeight:800,color:"#374151",textTransform:"uppercase",letterSpacing:"0.06em"}}>Subscription Plan</span>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
                  {([["monthly","Monthly","30 din"],["yearly","Yearly","365 din"]] as const).map(([val,label,days])=>(
                    <div key={val} onClick={()=>setForm(f=>({...f,plan_type:val,expires_at:calcExpiry(val,null)}))}
                      style={{padding:"13px 16px",borderRadius:11,cursor:"pointer",transition:"all 0.15s",display:"flex",alignItems:"center",gap:12,
                        background:form.plan_type===val?"linear-gradient(135deg,#4c1d95,#7c3aed)":"#fff",
                        border:`2px solid ${form.plan_type===val?"#7c3aed":"#e2e8f0"}`,
                        boxShadow:form.plan_type===val?"0 4px 12px rgba(124,58,237,0.22)":"none"}}>
                      <div style={{width:34,height:34,borderRadius:9,flexShrink:0,background:form.plan_type===val?"rgba(255,255,255,0.15)":"#ede9fe",display:"flex",alignItems:"center",justifyContent:"center"}}>
                        <TrendingUp size={16} color={form.plan_type===val?"#fff":"#7c3aed"}/>
                      </div>
                      <div>
                        <div style={{fontWeight:800,fontSize:13,color:form.plan_type===val?"#fff":"#1e1b4b"}}>{label}</div>
                        <div style={{fontSize:11,color:form.plan_type===val?"rgba(255,255,255,0.6)":"#94a3b8",marginTop:1}}>{days}</div>
                      </div>
                      {form.plan_type===val&&<Check size={14} color="#fff" style={{marginLeft:"auto"}}/>}
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:"#64748b",marginBottom:7,textTransform:"uppercase",letterSpacing:"0.05em"}}>
                    Expiry Date <span style={{fontWeight:500,textTransform:"none",color:"#94a3b8"}}>— auto ya khud set karo</span>
                  </div>
                  <input type="date" min={new Date().toISOString().slice(0,10)} value={form.expires_at}
                    onChange={e=>setForm(f=>({...f,expires_at:e.target.value}))}
                    style={{...inp,cursor:"pointer",fontWeight:form.expires_at?700:400,
                      border:form.expires_at?"2px solid #7c3aed":"1.5px solid #e2e8f0",
                      background:form.expires_at?"#faf5ff":"#f8fafc",color:form.expires_at?"#4c1d95":"#94a3b8"}}/>
                  {form.expires_at&&<div style={{marginTop:6,fontSize:12,color:"#7c3aed",fontWeight:600}}>
                    ✓ {new Date(form.expires_at+"T00:00:00").toLocaleDateString("en-IN",{weekday:"short",day:"2-digit",month:"long",year:"numeric"})}
                  </div>}
                </div>
              </div>
            </div>
            <div style={{display:"flex",gap:10,marginTop:18}}>
              <button onClick={()=>setShowForm(false)} style={{flex:1,padding:"11px",border:"1.5px solid #e2e8f0",borderRadius:10,background:"#f8fafc",fontWeight:600,fontSize:14,cursor:"pointer",color:"#64748b"}}>Cancel</button>
              <button onClick={save} disabled={saving} style={{flex:2,padding:"11px",border:"none",borderRadius:10,background:"linear-gradient(135deg,#4c1d95,#7c3aed)",color:"#fff",fontWeight:700,fontSize:14,cursor:saving?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,opacity:saving?0.7:1,boxShadow:"0 4px 14px rgba(124,58,237,0.3)"}}>
                <Check size={16}/>{saving?"Creating…":"Create Client"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── CLIENT CARDS ─── */}
      {loading ? (
        <div style={{textAlign:"center",padding:"80px 20px",color:"#94a3b8"}}>
          <RefreshCw size={32} style={{margin:"0 auto 14px",display:"block",opacity:0.25}}/>
          <div style={{fontWeight:600,fontSize:14}}>Loading clients…</div>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{textAlign:"center",padding:"80px 20px"}}>
          <Building2 size={44} style={{margin:"0 auto 16px",display:"block",color:"#e2e8f0"}}/>
          <div style={{fontWeight:700,fontSize:15,color:"#94a3b8"}}>{search?"No results found":"No clients yet"}</div>
          <div style={{fontSize:13,color:"#cbd5e1",marginTop:4}}>{search?"Try a different search":"Add your first client above"}</div>
        </div>
      ) : (
        <div style={{background:"#fff",borderRadius:14,border:"1px solid #e5e7eb",overflow:"hidden",animation:"fadeUp 0.3s ease both"}}>
          {/* Header */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 150px 60px 200px 80px 200px",
            background:"#f9fafb",borderBottom:"1px solid #e5e7eb",padding:"0 16px"}}>
            {["Shop / Owner","Shop ID","Staff","Expiry","Active","Actions"].map(h=>(
              <div key={h} style={{padding:"11px 12px",fontSize:11,fontWeight:700,color:"#6b7280",letterSpacing:"0.03em"}}>{h}</div>
            ))}
          </div>

          {filtered.map((c,i)=>{
            const badge = expiryBadge(c.expires_at);
            const color = avatarBg(c.shop_name);
            return (
              <div key={c.id}
                style={{display:"grid",gridTemplateColumns:"1fr 150px 60px 200px 80px 200px",
                  padding:"0 16px",borderBottom:i<filtered.length-1?"1px solid #f3f4f6":"none",
                  background:"#fff",transition:"background 0.12s"}}
                onMouseEnter={e=>e.currentTarget.style.background="#f9fafb"}
                onMouseLeave={e=>e.currentTarget.style.background="#fff"}>

                {/* Shop / Owner */}
                <div style={{padding:"13px 12px",display:"flex",alignItems:"center",gap:10,minWidth:0}}>
                  <div style={{width:36,height:36,borderRadius:9,flexShrink:0,
                    background:c.is_active?color:"#d1d5db",
                    display:"flex",alignItems:"center",justifyContent:"center",
                    color:"#fff",fontWeight:700,fontSize:15}}>
                    {c.shop_name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{minWidth:0}}>
                    <div style={{fontWeight:600,fontSize:14,color:"#111827",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.shop_name}</div>
                    <div style={{fontSize:12,color:"#6b7280",marginTop:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                      {c.name||"—"} · <span style={{fontFamily:"monospace"}}>@{c.username}</span>
                    </div>
                  </div>
                </div>

                {/* Shop ID */}
                <div style={{display:"flex",alignItems:"center",padding:"0 12px",minWidth:0}}>
                  <span style={{fontSize:12,color:"#374151",fontFamily:"monospace",background:"#f3f4f6",
                    padding:"4px 8px",borderRadius:5,maxWidth:"100%",
                    overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",display:"block"}}>
                    {c.shop_id}
                  </span>
                </div>

                {/* Staff */}
                <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"0 12px"}}>
                  <span style={{fontSize:13,fontWeight:600,color:"#374151"}}>{c.staff_count||0}</span>
                </div>

                {/* Expiry */}
                <div style={{display:"flex",flexDirection:"column",justifyContent:"center",gap:3,padding:"0 12px"}}>
                  {c.expires_at ? <>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <span style={{width:7,height:7,borderRadius:"50%",background:badge.dot,flexShrink:0}}/>
                      <span style={{fontSize:12,fontWeight:600,color:badge.text,whiteSpace:"nowrap"}}>{badge.label}</span>
                    </div>
                    <span style={{fontSize:11,color:"#6b7280"}}>{fmtDate(c.expires_at)} · <span style={{textTransform:"capitalize"}}>{c.plan_type||""}</span></span>
                  </> : (
                    <span style={{fontSize:12,color:"#9ca3af"}}>— No plan</span>
                  )}
                </div>

                {/* Toggle */}
                <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"0 12px"}}>
                  <div onClick={()=>toggleActive(c)} style={{cursor:"pointer"}}>
                    <div style={{width:44,height:24,borderRadius:12,position:"relative",transition:"background 0.2s",
                      background:c.is_active?"#16a34a":"#d1d5db"}}>
                      <div style={{position:"absolute",top:2,left:c.is_active?22:2,width:20,height:20,borderRadius:"50%",
                        background:"#fff",boxShadow:"0 1px 3px rgba(0,0,0,0.2)",transition:"left 0.2s"}}/>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{display:"flex",alignItems:"center",gap:6,padding:"0 12px"}}>
                  <button className="act" onClick={()=>{setRenewClient(c);setRenewPlan("monthly");setRenewDate(calcExpiry("monthly",c.expires_at));}}
                    style={{padding:"6px 11px",border:"1px solid #d1fae5",borderRadius:7,background:"#f0fdf4",
                      color:"#15803d",fontWeight:600,fontSize:12,display:"flex",alignItems:"center",gap:4,whiteSpace:"nowrap"}}>
                    <RotateCcw size={11}/> Renew
                  </button>
                  <button className="act" onClick={()=>openEdit(c)}
                    style={{padding:"6px 11px",border:"1px solid #dbeafe",borderRadius:7,background:"#eff6ff",
                      color:"#1d4ed8",fontWeight:600,fontSize:12,display:"flex",alignItems:"center",gap:4}}>
                    <Pencil size={11}/> Edit
                  </button>
                  <button className="act" onClick={()=>setDeleteId(c.id)}
                    style={{width:30,height:30,border:"1px solid #fecaca",borderRadius:7,background:"#fef2f2",
                      color:"#dc2626",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <Trash2 size={12}/>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── EDIT MODAL ─── */}
      {editClient&&(
        <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,0.6)",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={()=>setEditClient(null)}>
          <div style={{background:"#fff",borderRadius:20,width:"100%",maxWidth:480,boxShadow:"0 32px 80px rgba(0,0,0,0.25)",overflow:"hidden",animation:"pop 0.2s ease both"}} onClick={e=>e.stopPropagation()}>
            <div style={{background:"linear-gradient(135deg,#1e1b4b,#4c1d95)",padding:"20px 24px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:40,height:40,borderRadius:11,background:`linear-gradient(135deg,${avatarBg(editClient.shop_name)},${avatarBg(editClient.shop_name)}99)`,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:18}}>
                  {editClient.shop_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{color:"#fff",fontWeight:800,fontSize:15}}>Edit Client</div>
                  <div style={{color:"rgba(255,255,255,0.4)",fontSize:12,marginTop:1}}>{editClient.shop_name}</div>
                </div>
              </div>
              <button onClick={()=>setEditClient(null)} style={{width:32,height:32,background:"rgba(255,255,255,0.1)",border:"none",borderRadius:8,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <X size={15} color="#fff"/>
              </button>
            </div>
            <div style={{padding:24}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                <div><div style={lbl}>Shop Name *</div><input style={inp} value={editForm.shop_name} onChange={e=>setEditForm(f=>({...f,shop_name:e.target.value}))} placeholder="Shop name"/></div>
                <div><div style={lbl}>Shop ID *</div><input style={inp} value={editForm.shop_id} onChange={e=>setEditForm(f=>({...f,shop_id:e.target.value}))} placeholder="Shop ID"/></div>
                <div><div style={lbl}>Username *</div><input style={inp} value={editForm.username} onChange={e=>setEditForm(f=>({...f,username:e.target.value}))} placeholder="Username"/></div>
                <div><div style={lbl}>Owner Name</div><input style={inp} value={editForm.name} onChange={e=>setEditForm(f=>({...f,name:e.target.value}))} placeholder="Owner name"/></div>
                <div style={{gridColumn:"1 / -1"}}>
                  <div style={lbl}><KeyRound size={11} style={{display:"inline",marginRight:4}}/>New Password <span style={{fontWeight:400,textTransform:"none",color:"#94a3b8"}}>(blank = keep current)</span></div>
                  <div style={{position:"relative"}}>
                    <input type={showEditPass?"text":"password"} placeholder="Enter new password to change"
                      value={editForm.password} onChange={e=>setEditForm(f=>({...f,password:e.target.value}))}
                      style={{...inp,paddingRight:42}}/>
                    <button onClick={()=>setShowEditPass(v=>!v)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",display:"flex",padding:2}}>
                      {showEditPass?<EyeOff size={16} color="#94a3b8"/>:<Eye size={16} color="#94a3b8"/>}
                    </button>
                  </div>
                </div>
              </div>
              <div style={{display:"flex",gap:10,marginTop:20}}>
                <button onClick={()=>setEditClient(null)} style={{flex:1,padding:"11px",border:"1.5px solid #e2e8f0",borderRadius:10,background:"#f8fafc",fontWeight:600,fontSize:14,cursor:"pointer",color:"#64748b"}}>Cancel</button>
                <button onClick={saveEdit} disabled={editSaving} style={{flex:2,padding:"11px",border:"none",borderRadius:10,background:"linear-gradient(135deg,#4c1d95,#7c3aed)",color:"#fff",fontWeight:700,fontSize:14,cursor:editSaving?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,opacity:editSaving?0.7:1,boxShadow:"0 4px 14px rgba(124,58,237,0.28)"}}>
                  <Check size={15}/>{editSaving?"Saving…":"Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── RENEW MODAL ─── */}
      {renewClient&&(
        <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,0.6)",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={()=>setRenewClient(null)}>
          <div style={{background:"#fff",borderRadius:20,width:"100%",maxWidth:400,boxShadow:"0 32px 80px rgba(0,0,0,0.25)",overflow:"hidden",animation:"pop 0.2s ease both"}} onClick={e=>e.stopPropagation()}>
            <div style={{background:"linear-gradient(135deg,#064e3b,#065f46)",padding:"20px 24px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:40,height:40,borderRadius:11,background:"rgba(255,255,255,0.12)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <CalendarClock size={20} color="#fff"/>
                </div>
                <div>
                  <div style={{color:"#fff",fontWeight:800,fontSize:15}}>Renew Subscription</div>
                  <div style={{color:"rgba(255,255,255,0.5)",fontSize:12,marginTop:1}}>{renewClient.shop_name}</div>
                </div>
              </div>
              <button onClick={()=>setRenewClient(null)} style={{width:32,height:32,background:"rgba(255,255,255,0.1)",border:"none",borderRadius:8,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <X size={15} color="#fff"/>
              </button>
            </div>
            <div style={{padding:24}}>
              <div style={{background:"#f8fafc",borderRadius:11,padding:"12px 14px",marginBottom:18,border:"1px solid #f1f5f9",fontSize:13,color:"#64748b"}}>
                Current: {renewClient.expires_at
                  ? <><b style={{color:expiryBadge(renewClient.expires_at).text}}>{expiryBadge(renewClient.expires_at).label}</b> · {new Date(renewClient.expires_at).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}</>
                  : <span style={{color:"#94a3b8"}}>No plan set</span>}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
                {([["monthly","Monthly","30 days"],["yearly","Yearly","365 days"]] as const).map(([val,label,sub])=>(
                  <div key={val} onClick={()=>{setRenewPlan(val);setRenewDate(calcExpiry(val,renewClient.expires_at));}}
                    style={{padding:"13px 14px",borderRadius:11,cursor:"pointer",transition:"all 0.15s",
                      background:renewPlan===val?"linear-gradient(135deg,#064e3b,#065f46)":"#f8fafc",
                      border:`2px solid ${renewPlan===val?"#059669":"#e2e8f0"}`,
                      boxShadow:renewPlan===val?"0 4px 12px rgba(5,150,105,0.2)":"none"}}>
                    <div style={{fontWeight:800,fontSize:13,color:renewPlan===val?"#fff":"#1e1b4b"}}>{label}</div>
                    <div style={{fontSize:11,color:renewPlan===val?"rgba(255,255,255,0.6)":"#94a3b8",marginTop:2}}>{sub}</div>
                  </div>
                ))}
              </div>
              <div style={{marginBottom:16}}>
                <div style={{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:7}}>
                  Expiry Date <span style={{fontWeight:400,textTransform:"none",color:"#94a3b8"}}>— auto ya khud set karo</span>
                </div>
                <input type="date" value={renewDate} min={new Date().toISOString().slice(0,10)}
                  onChange={e=>setRenewDate(e.target.value)}
                  style={{width:"100%",padding:"11px 14px",border:"2px solid #059669",borderRadius:10,fontSize:14,fontWeight:700,outline:"none",boxSizing:"border-box",background:"#f0fdf4",color:"#064e3b",cursor:"pointer"}}/>
                {renewDate&&<div style={{marginTop:6,fontSize:12,color:"#059669",fontWeight:600}}>
                  ✓ {new Date(renewDate+"T00:00:00").toLocaleDateString("en-IN",{weekday:"short",day:"2-digit",month:"long",year:"numeric"})}
                </div>}
              </div>
              <div style={{display:"flex",gap:10}}>
                <button onClick={()=>setRenewClient(null)} style={{flex:1,padding:"11px",border:"1.5px solid #e2e8f0",borderRadius:10,background:"#f8fafc",fontWeight:600,fontSize:14,cursor:"pointer",color:"#64748b"}}>Cancel</button>
                <button onClick={renewSubscription} disabled={renewSaving} style={{flex:2,padding:"11px",border:"none",borderRadius:10,background:"linear-gradient(135deg,#064e3b,#059669)",color:"#fff",fontWeight:700,fontSize:14,cursor:renewSaving?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,opacity:renewSaving?0.7:1,boxShadow:"0 4px 14px rgba(5,150,105,0.3)"}}>
                  <RotateCcw size={14}/>{renewSaving?"Renewing…":"Confirm Renewal"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── DELETE MODAL ─── */}
      {deleteId&&(
        <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,0.6)",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={()=>setDeleteId(null)}>
          <div style={{background:"#fff",borderRadius:20,padding:28,maxWidth:340,width:"100%",boxShadow:"0 32px 80px rgba(0,0,0,0.22)",animation:"pop 0.2s ease both",textAlign:"center"}} onClick={e=>e.stopPropagation()}>
            <div style={{width:56,height:56,borderRadius:16,background:"#fef2f2",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>
              <Trash2 size={26} color="#dc2626"/>
            </div>
            <div style={{fontWeight:800,fontSize:17,color:"#0f172a",marginBottom:8}}>Remove Client?</div>
            <div style={{fontSize:13,color:"#64748b",lineHeight:1.6,marginBottom:22}}>Login access will be removed. Customer data stays in the database.</div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setDeleteId(null)} style={{flex:1,padding:"11px",border:"1.5px solid #e2e8f0",borderRadius:10,background:"#f8fafc",fontWeight:600,fontSize:14,cursor:"pointer",color:"#475569"}}>Cancel</button>
              <button onClick={()=>deleteClient(deleteId)} style={{flex:1,padding:"11px",border:"none",borderRadius:10,background:"linear-gradient(135deg,#ef4444,#dc2626)",color:"#fff",fontWeight:700,fontSize:14,cursor:"pointer",boxShadow:"0 4px 12px rgba(239,68,68,0.3)"}}>Remove</button>
            </div>
          </div>
        </div>
      )}
    </ProtectedLayout>
  );
}
