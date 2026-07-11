"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Users, Check, X, XCircle, RefreshCw, CalendarClock, TrendingUp,
} from "lucide-react";
import api from "@/lib/api";
import ProtectedLayout from "@/components/ProtectedLayout";

interface SignupRequestItem {
  id: string; shop_name: string; owner_name: string;
  phone: string; email: string; city: string;
  status: "pending" | "approved" | "rejected"; created_at: string;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function calcExpiry(plan: "trial" | "monthly" | "yearly"): string {
  const base = new Date();
  if (plan === "trial") base.setDate(base.getDate() + 7);
  else if (plan === "monthly") base.setDate(base.getDate() + 30);
  else base.setFullYear(base.getFullYear() + 1);
  return base.toISOString().slice(0, 10);
}

const AVATAR_COLORS = ["#6d28d9","#1d4ed8","#059669","#d97706","#be185d","#0891b2","#dc2626","#0f766e"];
function avatarBg(s: string) { return AVATAR_COLORS[s.charCodeAt(0) % AVATAR_COLORS.length]; }

const emptyAccept = { shop_name: "", shop_id: "", plan_type: "trial", expires_at: calcExpiry("trial") };

export default function SignupRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<SignupRequestItem[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [msg,      setMsg]      = useState<{text:string;ok:boolean}|null>(null);
  const [rejectingId, setRejectingId] = useState<string|null>(null);
  const [accepting,   setAccepting]   = useState<SignupRequestItem|null>(null);
  const [form,        setForm]        = useState(emptyAccept);
  const [saving,      setSaving]      = useState(false);

  useEffect(() => {
    api.get("/auth/me").then(r => {
      if (r.data.role !== "superadmin") { router.replace("/dashboard"); return; }
      load();
    }).catch(() => router.replace("/login"));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = () => {
    setLoading(true);
    api.get("/admin/signup-requests").then(r => setRequests(r.data)).finally(() => setLoading(false));
  };

  const flash = (text: string, ok: boolean) => { setMsg({ text, ok }); setTimeout(() => setMsg(null), 4000); };

  const openAccept = (r: SignupRequestItem) => {
    setAccepting(r);
    setForm({ ...emptyAccept, shop_name: r.shop_name });
  };

  const submitAccept = async () => {
    if (!accepting) return;
    if (!form.shop_name || !form.shop_id) { flash("Shop name and shop ID are required", false); return; }
    setSaving(true);
    try {
      await api.post("/admin/shops", { ...form, name: accepting.owner_name, signup_request_id: accepting.id });
      flash(`${form.shop_name} approved! Setup link emailed to ${accepting.email}`, true);
      setRequests(rs => rs.map(r => r.id === accepting.id ? { ...r, status: "approved" } : r));
      setAccepting(null);
    } catch (e: any) { flash(e.response?.data?.detail || "Failed", false); }
    finally { setSaving(false); }
  };

  const rejectRequest = async (id: string) => {
    try {
      await api.patch(`/admin/signup-requests/${id}`, { status: "rejected" });
      setRequests(rs => rs.map(r => r.id === id ? { ...r, status: "rejected" } : r));
      flash("Request rejected", true);
    } catch (e: any) { flash(e.response?.data?.detail || "Failed", false); }
    setRejectingId(null);
  };

  const inp: React.CSSProperties = { width:"100%", padding:"11px 14px", border:"1px solid var(--border-hard)", borderRadius:10, fontSize:14, outline:"none", boxSizing:"border-box", background:"var(--bg-input)", color:"var(--text-primary)" };
  const lbl: React.CSSProperties = { fontSize:12, fontWeight:600, color:"var(--text-secondary)", marginBottom:6, display:"block" };

  const pending  = requests.filter(r => r.status === "pending");
  const reviewed = requests.filter(r => r.status !== "pending");

  const statusCfg = (s: string) => s === "approved"
    ? { color:"#10b981", bg:"rgba(16,185,129,0.1)" }
    : { color:"#ef4444", bg:"rgba(239,68,68,0.1)" };

  return (
    <ProtectedLayout>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:24,flexWrap:"wrap",gap:14}}>
        <div>
          <div style={{fontSize:11,fontWeight:700,color:"var(--text-secondary)",textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:4}}>Super Admin</div>
          <h2 style={{color:"var(--text-primary)",margin:"0 0 4px",fontSize:26,fontWeight:900,letterSpacing:-0.5}}>Signup requests</h2>
          <p style={{color:"var(--text-muted)",fontSize:13,margin:0}}>{pending.length} pending · {requests.length} total leads</p>
        </div>
        <button onClick={load} style={{width:38,height:38,borderRadius:10,border:"1px solid var(--border-hard)",background:"var(--bg-card)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--text-secondary)"}}>
          <RefreshCw size={15} style={{animation:loading?"spin 1s linear infinite":undefined}}/>
        </button>
      </div>

      {msg && (
        <div style={{padding:"12px 18px",borderRadius:10,marginBottom:16,fontSize:13,fontWeight:600,
          background:msg.ok?"rgba(5,150,105,0.1)":"rgba(239,68,68,0.1)",
          color:msg.ok?"#10b981":"#ef4444",
          border:`1px solid ${msg.ok?"rgba(5,150,105,0.25)":"rgba(239,68,68,0.25)"}`}}>
          {msg.text}
        </div>
      )}

      {/* Pending */}
      <div style={{background:"var(--bg-card)",border:"1px solid var(--border-hard)",borderRadius:14,overflow:"hidden",marginBottom:20}}>
        <div style={{padding:"14px 20px",borderBottom:"1px solid var(--border-hard)",fontWeight:700,fontSize:14,color:"var(--text-primary)"}}>Pending</div>
        {loading ? (
          <div style={{padding:"30px 20px",textAlign:"center",color:"var(--text-muted)",fontSize:13}}>Loading…</div>
        ) : pending.length === 0 ? (
          <div style={{padding:"30px 20px",textAlign:"center",color:"var(--text-muted)",fontSize:13}}>No pending requests</div>
        ) : (
          <div>
            {pending.map((r, i) => (
              <div key={r.id} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 20px",flexWrap:"wrap",borderBottom:i<pending.length-1?"1px solid var(--border-hard)":"none"}}>
                <div style={{width:36,height:36,borderRadius:9,flexShrink:0,background:`${avatarBg(r.shop_name)}22`,display:"flex",alignItems:"center",justifyContent:"center",color:avatarBg(r.shop_name),fontWeight:700,fontSize:15}}>
                  {r.shop_name.charAt(0).toUpperCase()}
                </div>
                <div style={{flex:1,minWidth:200}}>
                  <div style={{fontSize:13.5,fontWeight:700,color:"var(--text-primary)"}}>{r.shop_name}</div>
                  <div style={{fontSize:12,color:"var(--text-muted)"}}>{r.owner_name} · {r.phone} · {r.email}{r.city?` · ${r.city}`:""}</div>
                </div>
                <div style={{fontSize:11,color:"var(--text-muted)",flexShrink:0}}>{fmtDate(r.created_at)}</div>
                <div style={{display:"flex",gap:8,flexShrink:0}}>
                  <button onClick={()=>openAccept(r)}
                    style={{padding:"7px 13px",border:"1px solid rgba(5,150,105,0.3)",borderRadius:7,background:"rgba(5,150,105,0.1)",color:"#10b981",fontWeight:700,fontSize:12,display:"flex",alignItems:"center",gap:5,cursor:"pointer"}}>
                    <Check size={12}/> Accept
                  </button>
                  <button onClick={()=>setRejectingId(r.id)}
                    style={{padding:"7px 13px",border:"1px solid var(--border-hard)",borderRadius:7,background:"transparent",color:"#ef4444",fontWeight:700,fontSize:12,display:"flex",alignItems:"center",gap:5,cursor:"pointer"}}>
                    <X size={12}/> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* History */}
      {reviewed.length > 0 && (
        <div style={{background:"var(--bg-card)",border:"1px solid var(--border-hard)",borderRadius:14,overflow:"hidden"}}>
          <div style={{padding:"14px 20px",borderBottom:"1px solid var(--border-hard)",fontWeight:700,fontSize:14,color:"var(--text-primary)"}}>History</div>
          {reviewed.map((r, i) => {
            const cfg = statusCfg(r.status);
            return (
              <div key={r.id} style={{display:"flex",alignItems:"center",gap:14,padding:"12px 20px",flexWrap:"wrap",borderBottom:i<reviewed.length-1?"1px solid var(--border-hard)":"none"}}>
                <div style={{width:32,height:32,borderRadius:8,flexShrink:0,background:`${avatarBg(r.shop_name)}22`,display:"flex",alignItems:"center",justifyContent:"center",color:avatarBg(r.shop_name),fontWeight:700,fontSize:13}}>
                  {r.shop_name.charAt(0).toUpperCase()}
                </div>
                <div style={{flex:1,minWidth:200}}>
                  <div style={{fontSize:13,fontWeight:600,color:"var(--text-primary)"}}>{r.shop_name}</div>
                  <div style={{fontSize:11.5,color:"var(--text-muted)"}}>{r.owner_name} · {r.phone} · {r.email}</div>
                </div>
                <div style={{fontSize:11,fontWeight:700,color:cfg.color,textTransform:"capitalize",padding:"3px 10px",borderRadius:6,background:cfg.bg}}>{r.status}</div>
                <div style={{fontSize:11,color:"var(--text-muted)",flexShrink:0}}>{fmtDate(r.created_at)}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Accept modal */}
      {accepting && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={()=>setAccepting(null)}>
          <div style={{background:"var(--bg-card)",borderRadius:16,width:"100%",maxWidth:480,border:"1px solid var(--border-hard)",overflow:"hidden",maxHeight:"90vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"20px 24px",borderBottom:"1px solid var(--border-hard)"}}>
              <div>
                <div style={{color:"var(--text-primary)",fontWeight:800,fontSize:15}}>Approve signup request</div>
                <div style={{color:"var(--text-muted)",fontSize:12,marginTop:1}}>Customer will get an email to set their own username &amp; password</div>
              </div>
              <button onClick={()=>setAccepting(null)} style={{width:32,height:32,background:"var(--bg-elevated)",border:"none",borderRadius:8,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <X size={15} color="var(--text-secondary)"/>
              </button>
            </div>
            <div style={{padding:24}}>
              <div style={{background:"rgba(37,99,235,0.08)",border:"1px solid rgba(37,99,235,0.25)",borderRadius:10,padding:"10px 14px",marginBottom:16,fontSize:12.5,color:"var(--text-secondary)"}}>
                From signup request: <b style={{color:"var(--text-primary)"}}>{accepting.owner_name}</b> · {accepting.phone} · {accepting.email}{accepting.city?` · ${accepting.city}`:""}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                <div style={{gridColumn:"1 / -1"}}>
                  <label style={lbl}>Shop Name *</label>
                  <input style={inp} value={form.shop_name} onChange={e=>setForm(f=>({...f,shop_name:e.target.value}))}/>
                </div>
                <div style={{gridColumn:"1 / -1"}}>
                  <label style={lbl}>Shop ID *</label>
                  <input style={inp} placeholder="e.g. shop2 (unique, no spaces)" value={form.shop_id} onChange={e=>setForm(f=>({...f,shop_id:e.target.value}))}/>
                </div>
                <div style={{gridColumn:"1 / -1",background:"var(--bg-elevated)",borderRadius:12,padding:16,border:"1px solid var(--border-hard)"}}>
                  <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:14}}>
                    <CalendarClock size={14} color="#2563eb"/>
                    <span style={{fontSize:12,fontWeight:700,color:"var(--text-secondary)",textTransform:"uppercase",letterSpacing:"0.06em"}}>Subscription Plan</span>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:14}}>
                    {([["trial","Trial","7 days"],["monthly","Monthly","30 days"],["yearly","Yearly","365 days"]] as const).map(([val,label,days])=>(
                      <div key={val} onClick={()=>setForm(f=>({...f,plan_type:val,expires_at:calcExpiry(val)}))}
                        style={{padding:"13px 12px",borderRadius:10,cursor:"pointer",transition:"all 0.15s",display:"flex",flexDirection:"column",gap:4,
                          background:form.plan_type===val?"#2563eb":"var(--bg-input)",
                          border:`2px solid ${form.plan_type===val?"#2563eb":"var(--border-hard)"}`}}>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                          <TrendingUp size={14} color={form.plan_type===val?"#fff":"#2563eb"}/>
                          {form.plan_type===val&&<Check size={13} color="#fff"/>}
                        </div>
                        <div style={{fontWeight:700,fontSize:13,color:form.plan_type===val?"#fff":"var(--text-primary)"}}>{label}</div>
                        <div style={{fontSize:11,color:form.plan_type===val?"rgba(255,255,255,0.6)":"var(--text-muted)"}}>{days}</div>
                      </div>
                    ))}
                  </div>
                  <div>
                    <label style={{...lbl,marginBottom:7}}>Expiry Date</label>
                    <input type="date" min={new Date().toISOString().slice(0,10)} value={form.expires_at}
                      onChange={e=>setForm(f=>({...f,expires_at:e.target.value}))}
                      style={{...inp,cursor:"pointer",border:"2px solid #2563eb",background:"rgba(37,99,235,0.08)",color:"#2563eb",fontWeight:700}}/>
                  </div>
                </div>
              </div>
              <div style={{display:"flex",gap:10,marginTop:20}}>
                <button onClick={()=>setAccepting(null)} style={{flex:1,padding:"11px",border:"1px solid var(--border-hard)",borderRadius:10,background:"transparent",fontWeight:600,fontSize:14,cursor:"pointer",color:"var(--text-secondary)"}}>Cancel</button>
                <button onClick={submitAccept} disabled={saving}
                  style={{flex:2,padding:"11px",border:"none",borderRadius:10,background:saving?"var(--bg-elevated)":"#2563eb",color:saving?"var(--text-muted)":"#fff",fontWeight:700,fontSize:14,cursor:saving?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,opacity:saving?0.7:1}}>
                  <Check size={15}/>{saving?"Creating…":"Approve & create"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject confirm modal */}
      {rejectingId && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={()=>setRejectingId(null)}>
          <div style={{background:"var(--bg-card)",borderRadius:16,padding:28,maxWidth:340,width:"100%",border:"1px solid var(--border-hard)",textAlign:"center"}} onClick={e=>e.stopPropagation()}>
            <div style={{width:52,height:52,borderRadius:14,background:"rgba(239,68,68,0.1)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>
              <XCircle size={24} color="#ef4444"/>
            </div>
            <div style={{fontWeight:800,fontSize:17,color:"var(--text-primary)",marginBottom:8}}>Reject this request?</div>
            <div style={{fontSize:13,color:"var(--text-muted)",lineHeight:1.6,marginBottom:22}}>This lead will be marked rejected. You can still see it in the record.</div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setRejectingId(null)} style={{flex:1,padding:"11px",border:"1px solid var(--border-hard)",borderRadius:10,background:"transparent",fontWeight:600,fontSize:14,cursor:"pointer",color:"var(--text-secondary)"}}>Cancel</button>
              <button onClick={()=>rejectRequest(rejectingId)} style={{flex:1,padding:"11px",border:"none",borderRadius:10,background:"#ef4444",color:"#fff",fontWeight:700,fontSize:14,cursor:"pointer"}}>Reject</button>
            </div>
          </div>
        </div>
      )}
    </ProtectedLayout>
  );
}
