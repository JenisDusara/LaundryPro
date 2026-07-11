"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Building2, Plus, Trash2, X, Eye, EyeOff,
  Pencil, Check, Search, Users, RefreshCw, KeyRound,
  CalendarClock, AlertTriangle, RotateCcw, UserCheck, UserX, TrendingUp,
} from "lucide-react";
import api from "@/lib/api";
import ProtectedLayout from "@/components/ProtectedLayout";

interface Client {
  id: string; username: string; name: string;
  shop_id: string; shop_name: string; is_active: boolean; created_at: string;
  staff_count: number; plan_type: string | null; expires_at: string | null;
  total_entries?: number; month_revenue?: number; last_activity?: string | null;
}

// Human-friendly "last active" label from a YYYY-MM-DD date string.
function lastActiveLabel(dateStr: string | null | undefined): { text: string; stale: boolean } {
  if (!dateStr) return { text: "No activity", stale: true };
  const days = Math.floor((Date.now() - new Date(dateStr + "T00:00:00").getTime()) / 86400000);
  if (days <= 0) return { text: "Active today", stale: false };
  if (days === 1) return { text: "Active yesterday", stale: false };
  if (days <= 30) return { text: `Active ${days}d ago`, stale: days > 14 };
  return { text: `Idle ${Math.floor(days / 30)}mo`, stale: true };
}

function daysLeft(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  return Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000);
}

function calcExpiry(plan: "trial" | "monthly" | "yearly", currentExpiry: string | null): string {
  const base = currentExpiry && new Date(currentExpiry) > new Date() ? new Date(currentExpiry) : new Date();
  if (plan === "trial") base.setDate(base.getDate() + 7);
  else if (plan === "monthly") base.setDate(base.getDate() + 30);
  else base.setFullYear(base.getFullYear() + 1);
  return base.toISOString().slice(0, 10);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function expiryBadge(expiresAt: string | null) {
  const d = daysLeft(expiresAt);
  if (d === null) return { label: "No plan",  sub: "Not subscribed", color: "var(--text-muted)", dot: "var(--text-muted)" };
  if (d < 0)      return { label: "Expired",  sub: fmtDate(expiresAt!),       color: "#ef4444",           dot: "#ef4444" };
  if (d <= 7)     return { label: `${d}d left`, sub: fmtDate(expiresAt!),     color: "#f59e0b",           dot: "#f59e0b" };
  return           { label: `${d}d left`, sub: fmtDate(expiresAt!),           color: "#10b981",           dot: "#10b981" };
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

  const inp: React.CSSProperties = { width:"100%", padding:"11px 14px", border:"1px solid var(--border-hard)", borderRadius:10, fontSize:14, outline:"none", boxSizing:"border-box", background:"var(--bg-input)", color:"var(--text-primary)" };
  const lbl: React.CSSProperties = { fontSize:12, fontWeight:600, color:"var(--text-secondary)", marginBottom:6, display:"block" };

  const expiryAlerts = clients.filter(c => { const d = daysLeft(c.expires_at); return d !== null && d <= 7; });

  return (
    <ProtectedLayout>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        .client-row:hover{background:var(--pressed)!important}
      `}</style>

      {/* Header */}
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:24,flexWrap:"wrap",gap:14}}>
        <div>
          <div style={{fontSize:11,fontWeight:700,color:"var(--text-secondary)",textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:4}}>Super Admin</div>
          <h2 style={{color:"var(--text-primary)",margin:"0 0 4px",fontSize:26,fontWeight:900,letterSpacing:-0.5}}>Client management</h2>
          <p style={{color:"var(--text-muted)",fontSize:13,margin:0}}>{clients.filter(c=>c.is_active).length} active · {clients.length} total shops</p>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <div style={{position:"relative"}}>
            <Search size={14} style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"var(--text-muted)",pointerEvents:"none"}}/>
            <input placeholder="Search shop, username…" value={search} onChange={e=>setSearch(e.target.value)}
              style={{padding:"10px 14px 10px 34px",border:"1px solid var(--border-hard)",borderRadius:10,fontSize:13,outline:"none",background:"var(--bg-input)",width:200,color:"var(--text-primary)",boxSizing:"border-box"}}/>
          </div>
          <button onClick={load} style={{width:38,height:38,borderRadius:10,border:"1px solid var(--border-hard)",background:"var(--bg-card)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--text-secondary)"}}>
            <RefreshCw size={15} style={{animation:loading?"spin 1s linear infinite":undefined}}/>
          </button>
          <button onClick={()=>{setShowForm(v=>!v);setEditClient(null);}}
            style={{display:"flex",alignItems:"center",gap:8,padding:"10px 20px",borderRadius:10,border:"none",background:"#2563eb",color:"#fff",fontWeight:700,fontSize:14,cursor:"pointer",boxShadow:"0 4px 14px rgba(37,99,235,0.28)"}}>
            <Plus size={16}/> New client
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:14,marginBottom:24}}>
        {[
          {label:"Total clients", value:clients.length,                                icon:<Building2 size={18}/>, iconBg:"rgba(109,40,217,0.15)",  iconColor:"#8b5cf6"},
          {label:"Active",        value:clients.filter(c=>c.is_active).length,         icon:<UserCheck size={18}/>, iconBg:"rgba(5,150,105,0.15)",   iconColor:"#10b981"},
          {label:"Expiring ≤7d",  value:expiryAlerts.length,                           icon:<CalendarClock size={18}/>, iconBg:"rgba(245,158,11,0.15)", iconColor:"#f59e0b"},
          {label:"Revenue /mo",   value:`₹${clients.reduce((s,c)=>s+(c.month_revenue||0),0).toLocaleString("en-IN")}`, icon:<TrendingUp size={18}/>, iconBg:"rgba(37,99,235,0.15)", iconColor:"#2563eb"},
          {label:"Total staff",   value:clients.reduce((s,c)=>s+(c.staff_count||0),0), icon:<Users size={18}/>,     iconBg:"rgba(239,68,68,0.15)",   iconColor:"#ef4444"},
        ].map((s,i)=>(
          <div key={i} style={{background:"var(--bg-card)",borderRadius:14,padding:"16px 18px",border:"1px solid var(--border-hard)"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
              <div style={{width:36,height:36,borderRadius:10,background:s.iconBg,display:"flex",alignItems:"center",justifyContent:"center",color:s.iconColor,flexShrink:0}}>{s.icon}</div>
              <span style={{fontSize:12,fontWeight:600,color:"var(--text-secondary)"}}>{s.label}</span>
            </div>
            <div style={{fontSize:28,fontWeight:900,color:s.iconColor}}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Expiry alerts */}
      {expiryAlerts.length > 0 && (
        <div style={{background:"rgba(245,158,11,0.1)",border:"1px solid rgba(245,158,11,0.25)",borderRadius:12,padding:"14px 18px",marginBottom:20,display:"flex",gap:14,alignItems:"flex-start"}}>
          <div style={{width:34,height:34,borderRadius:9,background:"rgba(245,158,11,0.15)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <AlertTriangle size={16} color="#f59e0b"/>
          </div>
          <div>
            <div style={{fontWeight:700,fontSize:13,color:"var(--text-primary)",marginBottom:3}}>Subscription alert</div>
            <div style={{fontSize:13,color:"var(--text-secondary)",lineHeight:1.6}}>
              {expiryAlerts.map((c,i)=>{
                const d=daysLeft(c.expires_at);
                return <span key={c.id}>{i>0&&" · "}<b style={{color:"var(--text-primary)"}}>{c.shop_name}</b> — {d!==null&&d<0?"expired":`${d}d left`}</span>;
              })}
            </div>
          </div>
        </div>
      )}

      {msg && (
        <div style={{padding:"12px 18px",borderRadius:10,marginBottom:16,fontSize:13,fontWeight:600,
          background:msg.ok?"rgba(5,150,105,0.1)":"rgba(239,68,68,0.1)",
          color:msg.ok?"#10b981":"#ef4444",
          border:`1px solid ${msg.ok?"rgba(5,150,105,0.25)":"rgba(239,68,68,0.25)"}`}}>
          {msg.text}
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <div style={{background:"var(--bg-card)",borderRadius:16,border:"1px solid var(--border-hard)",marginBottom:24,padding:24}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
            <div>
              <h3 style={{margin:0,color:"var(--text-primary)",fontSize:17,fontWeight:800}}>New client</h3>
              <p style={{margin:"4px 0 0",fontSize:12,color:"var(--text-muted)"}}>Create a new shop admin account</p>
            </div>
            <X size={20} style={{cursor:"pointer",color:"var(--text-secondary)"}} onClick={()=>setShowForm(false)}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <div>
              <label style={lbl}>Shop Name *</label>
              <input style={inp} placeholder="e.g. Shree Chamunda Drycleaners" value={form.shop_name} onChange={e=>setForm(f=>({...f,shop_name:e.target.value}))}/>
            </div>
            <div>
              <label style={lbl}>Shop ID *</label>
              <input style={inp} placeholder="e.g. shop2 (unique, no spaces)" value={form.shop_id} onChange={e=>setForm(f=>({...f,shop_id:e.target.value}))}/>
            </div>
            <div>
              <label style={lbl}>Username *</label>
              <input style={inp} placeholder="Login username" value={form.username} onChange={e=>setForm(f=>({...f,username:e.target.value}))}/>
            </div>
            <div>
              <label style={lbl}>Password *</label>
              <div style={{position:"relative"}}>
                <input type={showPass?"text":"password"} placeholder="Login password" value={form.password}
                  onChange={e=>setForm(f=>({...f,password:e.target.value}))} style={{...inp,paddingRight:42}}/>
                <button onClick={()=>setShowPass(v=>!v)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",display:"flex",padding:2}}>
                  {showPass?<EyeOff size={16} color="var(--text-muted)"/>:<Eye size={16} color="var(--text-muted)"/>}
                </button>
              </div>
            </div>
            <div style={{gridColumn:"1 / -1"}}>
              <label style={lbl}>Owner Name <span style={{fontWeight:400,color:"var(--text-muted)"}}>(optional)</span></label>
              <input style={inp} placeholder="e.g. Harsh Chudasama" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/>
            </div>
            <div style={{gridColumn:"1 / -1",background:"var(--bg-elevated)",borderRadius:12,padding:16,border:"1px solid var(--border-hard)"}}>
              <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:14}}>
                <CalendarClock size={14} color="#2563eb"/>
                <span style={{fontSize:12,fontWeight:700,color:"var(--text-secondary)",textTransform:"uppercase",letterSpacing:"0.06em"}}>Subscription Plan</span>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:14}}>
                {([["trial","Trial","7 days"],["monthly","Monthly","30 days"],["yearly","Yearly","365 days"]] as const).map(([val,label,days])=>(
                  <div key={val} onClick={()=>setForm(f=>({...f,plan_type:val,expires_at:calcExpiry(val,null)}))}
                    style={{padding:"13px 16px",borderRadius:10,cursor:"pointer",transition:"all 0.15s",display:"flex",alignItems:"center",gap:12,
                      background:form.plan_type===val?"#2563eb":"var(--bg-input)",
                      border:`2px solid ${form.plan_type===val?"#2563eb":"var(--border-hard)"}`,
                      boxShadow:form.plan_type===val?"0 4px 12px rgba(37,99,235,0.25)":"none"}}>
                    <div style={{width:32,height:32,borderRadius:8,flexShrink:0,background:form.plan_type===val?"rgba(255,255,255,0.2)":"var(--bg-elevated)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <TrendingUp size={15} color={form.plan_type===val?"#fff":"#2563eb"}/>
                    </div>
                    <div>
                      <div style={{fontWeight:700,fontSize:13,color:form.plan_type===val?"#fff":"var(--text-primary)"}}>{label}</div>
                      <div style={{fontSize:11,color:form.plan_type===val?"rgba(255,255,255,0.6)":"var(--text-muted)",marginTop:1}}>{days}</div>
                    </div>
                    {form.plan_type===val&&<Check size={14} color="#fff" style={{marginLeft:"auto"}}/>}
                  </div>
                ))}
              </div>
              <div>
                <label style={{...lbl,marginBottom:7}}>Expiry Date <span style={{fontWeight:400,color:"var(--text-muted)"}}>— auto or custom</span></label>
                <input type="date" min={new Date().toISOString().slice(0,10)} value={form.expires_at}
                  onChange={e=>setForm(f=>({...f,expires_at:e.target.value}))}
                  style={{...inp,cursor:"pointer",
                    border:form.expires_at?"2px solid #2563eb":"1px solid var(--border-hard)",
                    background:form.expires_at?"rgba(37,99,235,0.08)":"var(--bg-input)",
                    color:form.expires_at?"#2563eb":"var(--text-muted)"}}/>
                {form.expires_at&&<div style={{marginTop:6,fontSize:12,color:"#2563eb",fontWeight:600}}>
                  ✓ {new Date(form.expires_at+"T00:00:00").toLocaleDateString("en-IN",{weekday:"short",day:"2-digit",month:"long",year:"numeric"})}
                </div>}
              </div>
            </div>
          </div>
          <div style={{display:"flex",gap:10,marginTop:18}}>
            <button onClick={()=>setShowForm(false)} style={{flex:1,padding:"11px",border:"1px solid var(--border-hard)",borderRadius:10,background:"transparent",fontWeight:600,fontSize:14,cursor:"pointer",color:"var(--text-secondary)"}}>Cancel</button>
            <button onClick={save} disabled={saving}
              style={{flex:2,padding:"11px",border:"none",borderRadius:10,background:saving?"var(--bg-elevated)":"#2563eb",color:saving?"var(--text-muted)":"#fff",fontWeight:700,fontSize:14,cursor:saving?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,opacity:saving?0.7:1}}>
              <Check size={15}/>{saving?"Creating…":"Create client"}
            </button>
          </div>
        </div>
      )}

      {/* Clients table */}
      {loading ? (
        <div style={{textAlign:"center",padding:"80px 20px",color:"var(--text-muted)"}}>
          <RefreshCw size={32} style={{margin:"0 auto 14px",display:"block",opacity:0.25,animation:"spin 1s linear infinite"}}/>
          <div style={{fontWeight:600,fontSize:14}}>Loading clients…</div>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{textAlign:"center",padding:"80px 20px",color:"var(--text-muted)"}}>
          <Building2 size={44} style={{margin:"0 auto 16px",display:"block",opacity:0.2}}/>
          <div style={{fontWeight:700,fontSize:15,marginBottom:4}}>{search?"No results found":"No clients yet"}</div>
          <div style={{fontSize:13}}>{search?"Try a different search":"Add your first client above"}</div>
        </div>
      ) : (
        <div className="mob-scroll" style={{borderRadius:14}}>
        <div style={{background:"var(--bg-card)",border:"1px solid var(--border-hard)",borderRadius:14,overflow:"hidden",minWidth:700}}>
          {/* Column headers */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 150px 60px 200px 80px 200px",background:"var(--bg-elevated)",borderBottom:"1px solid var(--border-hard)",padding:"0 16px"}}>
            {["Shop / Owner","Shop ID","Staff","Expiry","Active","Actions"].map(h=>(
              <div key={h} style={{padding:"11px 12px",fontSize:11,fontWeight:700,color:"var(--text-secondary)",textTransform:"uppercase",letterSpacing:"0.05em"}}>{h}</div>
            ))}
          </div>

          {filtered.map((c,i)=>{
            const badge = expiryBadge(c.expires_at);
            const color = avatarBg(c.shop_name);
            return (
              <div key={c.id} className="client-row"
                style={{display:"grid",gridTemplateColumns:"1fr 150px 60px 200px 80px 200px",
                  padding:"0 16px",borderBottom:i<filtered.length-1?"1px solid var(--border-hard)":"none"}}>

                {/* Shop / Owner */}
                <div style={{padding:"14px 12px",display:"flex",alignItems:"center",gap:12,minWidth:0}}>
                  <div style={{width:36,height:36,borderRadius:9,flexShrink:0,
                    background:c.is_active?`${color}22`:"var(--bg-elevated)",
                    display:"flex",alignItems:"center",justifyContent:"center",
                    color:c.is_active?color:"var(--text-muted)",fontWeight:700,fontSize:15}}>
                    {c.shop_name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{minWidth:0}}>
                    <div style={{fontWeight:600,fontSize:14,color:"var(--text-primary)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.shop_name}</div>
                    <div style={{fontSize:12,color:"var(--text-muted)",marginTop:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                      {c.name||"—"} · <span style={{fontFamily:"monospace"}}>@{c.username}</span>
                    </div>
                    {(() => { const la = lastActiveLabel(c.last_activity); return (
                      <div style={{display:"flex",alignItems:"center",gap:8,marginTop:4,whiteSpace:"nowrap"}}>
                        <span style={{fontSize:11,fontWeight:600,color:"var(--text-secondary)"}}>📋 {c.total_entries ?? 0}</span>
                        <span style={{fontSize:11,fontWeight:700,color:"#10b981"}}>₹{(c.month_revenue ?? 0).toLocaleString("en-IN")}<span style={{fontWeight:400,color:"var(--text-muted)"}}>/mo</span></span>
                        <span style={{fontSize:11,fontWeight:600,color:la.stale?"#f59e0b":"var(--text-muted)"}}>{la.stale?"● ":""}{la.text}</span>
                      </div>
                    ); })()}
                  </div>
                </div>

                {/* Shop ID */}
                <div style={{display:"flex",alignItems:"center",padding:"0 12px",minWidth:0}}>
                  <span style={{fontSize:12,color:"var(--text-secondary)",fontFamily:"monospace",background:"var(--bg-elevated)",
                    padding:"4px 8px",borderRadius:6,maxWidth:"100%",
                    overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",display:"block"}}>
                    {c.shop_id}
                  </span>
                </div>

                {/* Staff */}
                <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"0 12px"}}>
                  <span style={{fontSize:13,fontWeight:600,color:"var(--text-primary)"}}>{c.staff_count||0}</span>
                </div>

                {/* Expiry */}
                <div style={{display:"flex",flexDirection:"column",justifyContent:"center",gap:2,padding:"0 12px"}}>
                  {c.expires_at ? <>
                    <div style={{display:"flex",alignItems:"center",gap:5}}>
                      <span style={{width:6,height:6,borderRadius:"50%",background:badge.dot,flexShrink:0}}/>
                      <span style={{fontSize:12,fontWeight:700,color:badge.color,whiteSpace:"nowrap"}}>{badge.label}</span>
                    </div>
                    <span style={{fontSize:11,color:"var(--text-muted)"}}>{badge.sub} · <span style={{textTransform:"capitalize"}}>{c.plan_type||""}</span></span>
                  </> : <>
                    <span style={{fontSize:12,color:"var(--text-muted)",fontWeight:600}}>— No plan</span>
                    <span style={{fontSize:11,color:"var(--text-muted)"}}>Not subscribed</span>
                  </>}
                </div>

                {/* Toggle */}
                <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"0 12px"}}>
                  <div onClick={()=>toggleActive(c)} style={{cursor:"pointer"}}>
                    <div style={{width:44,height:24,borderRadius:12,position:"relative",transition:"background 0.2s",
                      background:c.is_active?"#16a34a":"var(--bg-elevated)"}}>
                      <div style={{position:"absolute",top:2,left:c.is_active?22:2,width:20,height:20,borderRadius:"50%",
                        background:"#fff",boxShadow:"0 1px 3px rgba(0,0,0,0.25)",transition:"left 0.2s"}}/>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{display:"flex",alignItems:"center",gap:6,padding:"0 12px"}}>
                  <button onClick={()=>{setRenewClient(c);setRenewPlan("monthly");setRenewDate(calcExpiry("monthly",c.expires_at));}}
                    style={{padding:"6px 11px",border:"1px solid rgba(5,150,105,0.3)",borderRadius:7,background:"rgba(5,150,105,0.1)",
                      color:"#10b981",fontWeight:600,fontSize:12,display:"flex",alignItems:"center",gap:4,cursor:"pointer",whiteSpace:"nowrap"}}>
                    <RotateCcw size={11}/> Renew
                  </button>
                  <button onClick={()=>openEdit(c)}
                    style={{padding:"6px 11px",border:"1px solid var(--border-hard)",borderRadius:7,background:"transparent",
                      color:"var(--text-secondary)",fontWeight:600,fontSize:12,display:"flex",alignItems:"center",gap:4,cursor:"pointer"}}>
                    <Pencil size={11}/> Edit
                  </button>
                  <button onClick={()=>setDeleteId(c.id)}
                    style={{width:30,height:30,border:"1px solid var(--border-hard)",borderRadius:7,background:"transparent",
                      color:"#ef4444",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}}>
                    <Trash2 size={12}/>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        </div>
      )}

      {/* Edit modal */}
      {editClient&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={()=>setEditClient(null)}>
          <div style={{background:"var(--bg-card)",borderRadius:16,width:"100%",maxWidth:480,border:"1px solid var(--border-hard)",overflow:"hidden"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"20px 24px",borderBottom:"1px solid var(--border-hard)"}}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:38,height:38,borderRadius:10,background:`${avatarBg(editClient.shop_name)}22`,display:"flex",alignItems:"center",justifyContent:"center",color:avatarBg(editClient.shop_name),fontWeight:800,fontSize:16}}>
                  {editClient.shop_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{color:"var(--text-primary)",fontWeight:800,fontSize:15}}>Edit client</div>
                  <div style={{color:"var(--text-muted)",fontSize:12,marginTop:1}}>{editClient.shop_name}</div>
                </div>
              </div>
              <button onClick={()=>setEditClient(null)} style={{width:32,height:32,background:"var(--bg-elevated)",border:"none",borderRadius:8,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <X size={15} color="var(--text-secondary)"/>
              </button>
            </div>
            <div style={{padding:24}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                <div><label style={lbl}>Shop Name *</label><input style={inp} value={editForm.shop_name} onChange={e=>setEditForm(f=>({...f,shop_name:e.target.value}))} placeholder="Shop name"/></div>
                <div><label style={lbl}>Shop ID *</label><input style={inp} value={editForm.shop_id} onChange={e=>setEditForm(f=>({...f,shop_id:e.target.value}))} placeholder="Shop ID"/></div>
                <div><label style={lbl}>Username *</label><input style={inp} value={editForm.username} onChange={e=>setEditForm(f=>({...f,username:e.target.value}))} placeholder="Username"/></div>
                <div><label style={lbl}>Owner Name</label><input style={inp} value={editForm.name} onChange={e=>setEditForm(f=>({...f,name:e.target.value}))} placeholder="Owner name"/></div>
                <div style={{gridColumn:"1 / -1"}}>
                  <label style={lbl}><KeyRound size={11} style={{display:"inline",marginRight:4}}/>New Password <span style={{fontWeight:400,color:"var(--text-muted)"}}>— blank = keep current</span></label>
                  <div style={{position:"relative"}}>
                    <input type={showEditPass?"text":"password"} placeholder="Enter new password to change"
                      value={editForm.password} onChange={e=>setEditForm(f=>({...f,password:e.target.value}))}
                      style={{...inp,paddingRight:42}}/>
                    <button onClick={()=>setShowEditPass(v=>!v)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",display:"flex",padding:2}}>
                      {showEditPass?<EyeOff size={16} color="var(--text-muted)"/>:<Eye size={16} color="var(--text-muted)"/>}
                    </button>
                  </div>
                </div>
              </div>
              <div style={{display:"flex",gap:10,marginTop:20}}>
                <button onClick={()=>setEditClient(null)} style={{flex:1,padding:"11px",border:"1px solid var(--border-hard)",borderRadius:10,background:"transparent",fontWeight:600,fontSize:14,cursor:"pointer",color:"var(--text-secondary)"}}>Cancel</button>
                <button onClick={saveEdit} disabled={editSaving} style={{flex:2,padding:"11px",border:"none",borderRadius:10,background:editSaving?"var(--bg-elevated)":"#2563eb",color:editSaving?"var(--text-muted)":"#fff",fontWeight:700,fontSize:14,cursor:editSaving?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,opacity:editSaving?0.7:1}}>
                  <Check size={15}/>{editSaving?"Saving…":"Save changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Renew modal */}
      {renewClient&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={()=>setRenewClient(null)}>
          <div style={{background:"var(--bg-card)",borderRadius:16,width:"100%",maxWidth:400,border:"1px solid var(--border-hard)",overflow:"hidden"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"20px 24px",borderBottom:"1px solid var(--border-hard)"}}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:38,height:38,borderRadius:10,background:"rgba(5,150,105,0.15)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <CalendarClock size={18} color="#10b981"/>
                </div>
                <div>
                  <div style={{color:"var(--text-primary)",fontWeight:800,fontSize:15}}>Renew subscription</div>
                  <div style={{color:"var(--text-muted)",fontSize:12,marginTop:1}}>{renewClient.shop_name}</div>
                </div>
              </div>
              <button onClick={()=>setRenewClient(null)} style={{width:32,height:32,background:"var(--bg-elevated)",border:"none",borderRadius:8,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <X size={15} color="var(--text-secondary)"/>
              </button>
            </div>
            <div style={{padding:24}}>
              <div style={{background:"var(--bg-elevated)",borderRadius:10,padding:"12px 14px",marginBottom:16,border:"1px solid var(--border-hard)",fontSize:13,color:"var(--text-secondary)"}}>
                Current: {renewClient.expires_at
                  ? <><b style={{color:expiryBadge(renewClient.expires_at).color}}>{expiryBadge(renewClient.expires_at).label}</b> · {new Date(renewClient.expires_at).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}</>
                  : <span style={{color:"var(--text-muted)"}}>No plan set</span>}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
                {([["monthly","Monthly","30 days"],["yearly","Yearly","365 days"]] as const).map(([val,label,sub])=>(
                  <div key={val} onClick={()=>{setRenewPlan(val);setRenewDate(calcExpiry(val,renewClient.expires_at));}}
                    style={{padding:"13px 14px",borderRadius:10,cursor:"pointer",transition:"all 0.15s",
                      background:renewPlan===val?"rgba(5,150,105,0.15)":"var(--bg-input)",
                      border:`2px solid ${renewPlan===val?"#10b981":"var(--border-hard)"}`,
                      boxShadow:renewPlan===val?"0 4px 12px rgba(5,150,105,0.15)":"none"}}>
                    <div style={{fontWeight:700,fontSize:13,color:renewPlan===val?"#10b981":"var(--text-primary)"}}>{label}</div>
                    <div style={{fontSize:11,color:"var(--text-muted)",marginTop:2}}>{sub}</div>
                  </div>
                ))}
              </div>
              <div style={{marginBottom:16}}>
                <label style={{...lbl,marginBottom:7}}>Expiry Date</label>
                <input type="date" value={renewDate} min={new Date().toISOString().slice(0,10)}
                  onChange={e=>setRenewDate(e.target.value)}
                  style={{...inp,cursor:"pointer",
                    border:"2px solid #10b981",
                    background:"rgba(5,150,105,0.08)",
                    color:"#10b981",fontWeight:700}}/>
                {renewDate&&<div style={{marginTop:6,fontSize:12,color:"#10b981",fontWeight:600}}>
                  ✓ {new Date(renewDate+"T00:00:00").toLocaleDateString("en-IN",{weekday:"short",day:"2-digit",month:"long",year:"numeric"})}
                </div>}
              </div>
              <div style={{display:"flex",gap:10}}>
                <button onClick={()=>setRenewClient(null)} style={{flex:1,padding:"11px",border:"1px solid var(--border-hard)",borderRadius:10,background:"transparent",fontWeight:600,fontSize:14,cursor:"pointer",color:"var(--text-secondary)"}}>Cancel</button>
                <button onClick={renewSubscription} disabled={renewSaving}
                  style={{flex:2,padding:"11px",border:"none",borderRadius:10,background:renewSaving?"var(--bg-elevated)":"rgba(5,150,105,0.9)",color:renewSaving?"var(--text-muted)":"#fff",fontWeight:700,fontSize:14,cursor:renewSaving?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,opacity:renewSaving?0.7:1}}>
                  <RotateCcw size={14}/>{renewSaving?"Renewing…":"Confirm renewal"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete modal */}
      {deleteId&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={()=>setDeleteId(null)}>
          <div style={{background:"var(--bg-card)",borderRadius:16,padding:28,maxWidth:340,width:"100%",border:"1px solid var(--border-hard)",textAlign:"center"}} onClick={e=>e.stopPropagation()}>
            <div style={{width:52,height:52,borderRadius:14,background:"rgba(239,68,68,0.1)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>
              <Trash2 size={24} color="#ef4444"/>
            </div>
            <div style={{fontWeight:800,fontSize:17,color:"var(--text-primary)",marginBottom:8}}>Remove client?</div>
            <div style={{fontSize:13,color:"var(--text-muted)",lineHeight:1.6,marginBottom:22}}>Login access will be removed. Customer data stays in the database.</div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setDeleteId(null)} style={{flex:1,padding:"11px",border:"1px solid var(--border-hard)",borderRadius:10,background:"transparent",fontWeight:600,fontSize:14,cursor:"pointer",color:"var(--text-secondary)"}}>Cancel</button>
              <button onClick={()=>deleteClient(deleteId)} style={{flex:1,padding:"11px",border:"none",borderRadius:10,background:"#ef4444",color:"#fff",fontWeight:700,fontSize:14,cursor:"pointer"}}>Remove</button>
            </div>
          </div>
        </div>
      )}
    </ProtectedLayout>
  );
}
