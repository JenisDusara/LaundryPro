"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Building2, Plus, Trash2, X, Eye, EyeOff, ShieldCheck,
  Pencil, Check, Search, Users, Activity, RefreshCw, KeyRound
} from "lucide-react";
import api from "@/lib/api";
import ProtectedLayout from "@/components/ProtectedLayout";

interface Client {
  id: string; username: string; name: string;
  shop_id: string; shop_name: string; is_active: boolean; created_at: string;
}

const emptyForm = { username: "", password: "", name: "", shop_id: "", shop_name: "" };

const AVATAR_COLORS = ["#1d4ed8","#7c3aed","#059669","#d97706","#be185d","#0891b2","#dc2626","#0f766e"];
function avatarBg(s: string) { return AVATAR_COLORS[s.charCodeAt(0) % AVATAR_COLORS.length]; }

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" });
}

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

  const flash = (text: string, ok: boolean) => {
    setMsg({text,ok}); setTimeout(()=>setMsg(null), 4000);
  };

  const save = async () => {
    if (!form.username||!form.password||!form.shop_id||!form.shop_name){flash("All fields are required",false);return;}
    setSaving(true);
    try {
      await api.post("/admin/shops", form);
      flash("Client created successfully!",true);
      setForm(emptyForm); setShowForm(false); load();
    } catch(e:any){ flash(e.response?.data?.detail||"Failed to create client",false); }
    finally { setSaving(false); }
  };

  const openEdit = (c: Client) => {
    setEditClient(c);
    setEditForm({username:c.username,name:c.name,shop_id:c.shop_id,shop_name:c.shop_name,password:""});
    setShowEditPass(false);
  };

  const saveEdit = async () => {
    if (!editClient) return;
    if (!editForm.username||!editForm.shop_id||!editForm.shop_name){flash("Username, Shop ID and Shop Name are required",false);return;}
    setEditSaving(true);
    try {
      const payload: any = {username:editForm.username,name:editForm.name,shop_id:editForm.shop_id,shop_name:editForm.shop_name};
      if (editForm.password) payload.password = editForm.password;
      const res = await api.put(`/admin/shops/${editClient.id}`,payload);
      setClients(cs=>cs.map(c=>c.id===editClient.id?{...c,...res.data}:c));
      flash("Client updated!",true); setEditClient(null);
    } catch(e:any){ flash(e.response?.data?.detail||"Failed to update",false); }
    finally { setEditSaving(false); }
  };

  const toggleActive = async (c: Client) => {
    try {
      await api.patch(`/admin/shops/${c.id}`, { is_active: !c.is_active });
      setClients(cs => cs.map(x => x.id === c.id ? { ...x, is_active: !c.is_active } : x));
      flash(`${c.shop_name} ${!c.is_active ? "enabled" : "disabled"} successfully`, true);
    } catch(e:any){ flash(e.response?.data?.detail || "Failed to update status", false); }
  };

  const deleteClient = async (id: string) => {
    try {
      await api.delete(`/admin/users/${id}`);
      setClients(c=>c.filter(x=>x.id!==id));
      flash("Client removed",true);
    } catch(e:any){ flash(e.response?.data?.detail||"Failed to delete",false); }
    setDeleteId(null);
  };

  const filtered = clients.filter(c =>
    !search ||
    c.shop_name.toLowerCase().includes(search.toLowerCase()) ||
    c.username.toLowerCase().includes(search.toLowerCase()) ||
    c.shop_id.toLowerCase().includes(search.toLowerCase()) ||
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const labelStyle: React.CSSProperties = { fontSize:11, fontWeight:700, color:"#64748b", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.05em" };
  const inputStyle: React.CSSProperties = { width:"100%", padding:"11px 14px", border:"1.5px solid #e2e8f0", borderRadius:10, fontSize:14, outline:"none", boxSizing:"border-box", background:"#f8fafc", color:"#0f172a" };

  return (
    <ProtectedLayout>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        .cli-row{transition:background 0.12s}
        .cli-row:hover{background:#f8fafc!important}
        .act-btn{transition:all 0.15s}
        .act-btn:hover{opacity:0.85;transform:translateY(-1px)}
      `}</style>

      {/* ── HEADER ── */}
      <div style={{animation:"fadeUp 0.3s ease both",background:"linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#4c1d95 100%)",borderRadius:20,padding:"24px 28px",marginBottom:20,color:"#fff",boxShadow:"0 8px 32px rgba(76,29,149,0.3)",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-40,right:-30,width:160,height:160,borderRadius:"50%",background:"rgba(255,255,255,0.04)"}}/>
        <div style={{position:"absolute",bottom:-20,right:120,width:80,height:80,borderRadius:"50%",background:"rgba(255,255,255,0.05)"}}/>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12,position:"relative"}}>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <div style={{width:50,height:50,borderRadius:14,background:"rgba(251,191,36,0.2)",display:"flex",alignItems:"center",justifyContent:"center",border:"1px solid rgba(251,191,36,0.35)"}}>
              <ShieldCheck size={26} color="#fbbf24"/>
            </div>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontWeight:800,fontSize:22,letterSpacing:-0.3}}>Admin Panel</span>
                <span style={{fontSize:10,fontWeight:800,background:"#fbbf24",color:"#78350f",padding:"3px 10px",borderRadius:6}}>SUPERADMIN</span>
              </div>
              <div style={{fontSize:12,color:"rgba(255,255,255,0.5)",marginTop:2}}>Manage all client shops and their access</div>
            </div>
          </div>
          <button onClick={()=>{setShowForm(v=>!v);setEditClient(null);}}
            style={{display:"flex",alignItems:"center",gap:8,padding:"10px 20px",borderRadius:11,border:"1px solid rgba(251,191,36,0.4)",background:"rgba(251,191,36,0.15)",color:"#fbbf24",fontWeight:700,fontSize:14,cursor:"pointer"}}>
            <Plus size={16}/> Add Client
          </button>
        </div>
      </div>

      {/* ── STATS ── */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginBottom:20}}>
        {[
          {label:"Total Clients",  value:clients.length,                                    icon:<Building2 size={18}/>, color:"#7c3aed",bg:"linear-gradient(135deg,#f5f3ff,#ede9fe)",border:"#c4b5fd"},
          {label:"Active Shops",   value:clients.filter(c=>c.is_active).length,             icon:<Users size={18}/>,     color:"#059669",bg:"linear-gradient(135deg,#f0fdf4,#dcfce7)",border:"#86efac"},
          {label:"Disabled Shops", value:clients.filter(c=>!c.is_active).length,            icon:<Activity size={18}/>,  color:"#dc2626",bg:"linear-gradient(135deg,#fef2f2,#fee2e2)",border:"#fca5a5"},
        ].map((s,i)=>(
          <div key={i} style={{animation:`fadeUp 0.3s ease ${i*0.07}s both`,background:s.bg,border:`1.5px solid ${s.border}`,borderRadius:16,padding:"18px 20px"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
              <span style={{fontSize:12,fontWeight:600,color:"#475569"}}>{s.label}</span>
              <div style={{width:34,height:34,borderRadius:9,background:"rgba(255,255,255,0.7)",display:"flex",alignItems:"center",justifyContent:"center",color:s.color}}>{s.icon}</div>
            </div>
            <div style={{fontSize:28,fontWeight:900,color:s.color,letterSpacing:-0.5}}>{s.value}</div>
          </div>
        ))}
      </div>

      {msg&&(
        <div style={{animation:"slideIn 0.2s ease both",padding:"12px 18px",borderRadius:12,marginBottom:16,fontSize:14,fontWeight:600,
          background:msg.ok?"#f0fdf4":"#fef2f2",color:msg.ok?"#16a34a":"#dc2626",border:`1.5px solid ${msg.ok?"#86efac":"#fca5a5"}`}}>
          {msg.ok?"✓ ":"✕ "}{msg.text}
        </div>
      )}

      {/* ── ADD FORM ── */}
      {showForm&&(
        <div style={{animation:"slideIn 0.22s ease both",background:"#fff",borderRadius:18,padding:24,marginBottom:20,boxShadow:"0 8px 30px rgba(0,0,0,0.10)",border:"1.5px solid #e2e8f0"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
            <div>
              <div style={{fontWeight:800,fontSize:16,color:"#0f172a"}}>New Client</div>
              <div style={{fontSize:12,color:"#94a3b8",marginTop:2}}>Create a new shop admin account</div>
            </div>
            <button onClick={()=>setShowForm(false)} style={{width:34,height:34,background:"#f1f5f9",border:"none",borderRadius:9,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <X size={16} color="#64748b"/>
            </button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <div>
              <div style={labelStyle}>Shop Name *</div>
              <input style={inputStyle} placeholder="e.g. Shree Chamunda Drycleaners" value={form.shop_name} onChange={e=>setForm(f=>({...f,shop_name:e.target.value}))}/>
            </div>
            <div>
              <div style={labelStyle}>Shop ID *</div>
              <input style={inputStyle} placeholder="e.g. shop2 (unique, no spaces)" value={form.shop_id} onChange={e=>setForm(f=>({...f,shop_id:e.target.value}))}/>
            </div>
            <div>
              <div style={labelStyle}>Username *</div>
              <input style={inputStyle} placeholder="Login username" value={form.username} onChange={e=>setForm(f=>({...f,username:e.target.value}))}/>
            </div>
            <div>
              <div style={labelStyle}>Password *</div>
              <div style={{position:"relative"}}>
                <input type={showPass?"text":"password"} placeholder="Login password" value={form.password}
                  onChange={e=>setForm(f=>({...f,password:e.target.value}))}
                  style={{...inputStyle,paddingRight:42}}/>
                <button onClick={()=>setShowPass(v=>!v)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",display:"flex",padding:2}}>
                  {showPass?<EyeOff size={16} color="#94a3b8"/>:<Eye size={16} color="#94a3b8"/>}
                </button>
              </div>
            </div>
            <div style={{gridColumn:"1 / -1"}}>
              <div style={labelStyle}>Owner Name <span style={{fontWeight:400,textTransform:"none",fontSize:11,color:"#94a3b8"}}>(optional)</span></div>
              <input style={inputStyle} placeholder="e.g. Harsh Chudasama" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/>
            </div>
          </div>
          <div style={{display:"flex",gap:10,marginTop:18}}>
            <button onClick={()=>setShowForm(false)} style={{flex:1,padding:"11px",border:"1.5px solid #e2e8f0",borderRadius:10,background:"#f8fafc",fontWeight:600,fontSize:14,cursor:"pointer",color:"#64748b"}}>Cancel</button>
            <button onClick={save} disabled={saving}
              style={{flex:2,padding:"11px",border:"none",borderRadius:10,background:"linear-gradient(135deg,#4c1d95,#7c3aed)",color:"#fff",fontWeight:700,fontSize:14,cursor:saving?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,opacity:saving?0.7:1,boxShadow:"0 4px 14px rgba(124,58,237,0.3)"}}>
              <Check size={16}/> {saving?"Creating…":"Create Client"}
            </button>
          </div>
        </div>
      )}

      {/* ── TABLE ── */}
      <div style={{background:"#fff",borderRadius:18,border:"1.5px solid #e2e8f0",overflow:"hidden",boxShadow:"0 4px 20px rgba(0,0,0,0.06)"}}>
        {/* Table toolbar */}
        <div style={{padding:"16px 20px",borderBottom:"1.5px solid #f1f5f9",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap",background:"linear-gradient(135deg,#fafafa,#f8fafc)"}}>
          <div>
            <div style={{fontWeight:800,fontSize:15,color:"#0f172a"}}>All Clients</div>
            <div style={{fontSize:12,color:"#94a3b8",marginTop:1}}>{filtered.length} of {clients.length} shops</div>
          </div>
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            <div style={{position:"relative"}}>
              <Search size={14} style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"#94a3b8"}}/>
              <input placeholder="Search shop, username, ID…" value={search} onChange={e=>setSearch(e.target.value)}
                style={{padding:"9px 14px 9px 34px",border:"1.5px solid #e2e8f0",borderRadius:10,fontSize:13,outline:"none",background:"#fff",width:220,color:"#0f172a"}}/>
            </div>
            <button onClick={load}
              style={{width:36,height:36,borderRadius:9,border:"1.5px solid #e2e8f0",background:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#64748b"}}>
              <RefreshCw size={15}/>
            </button>
          </div>
        </div>

        {/* Column headers */}
        <div style={{display:"grid",gridTemplateColumns:"2.5fr 1.2fr 1.2fr 1fr 0.8fr 0.9fr",padding:"10px 20px",background:"#f8fafc",borderBottom:"1px solid #f1f5f9"}}>
          {["Shop / Owner","Username","Shop ID","Created","Enabled?","Actions"].map(h=>(
            <div key={h} style={{fontSize:11,fontWeight:800,color:"#64748b",textTransform:"uppercase",letterSpacing:"0.07em"}}>{h}</div>
          ))}
        </div>

        {/* Rows */}
        {loading?(
          <div style={{padding:"60px 20px",textAlign:"center",color:"#94a3b8"}}>
            <RefreshCw size={28} style={{margin:"0 auto 12px",display:"block",opacity:0.3}}/>
            <div style={{fontWeight:600}}>Loading clients…</div>
          </div>
        ):filtered.length===0?(
          <div style={{padding:"60px 20px",textAlign:"center"}}>
            <Building2 size={40} style={{margin:"0 auto 14px",display:"block",color:"#cbd5e1"}}/>
            <div style={{fontWeight:700,fontSize:15,color:"#94a3b8"}}>No clients found</div>
            <div style={{fontSize:13,color:"#cbd5e1",marginTop:4}}>{search?"Try a different search":"Add your first client"}</div>
          </div>
        ):(
          <div>
            {filtered.map((c,i)=>(
              <div key={c.id} className="cli-row"
                style={{display:"grid",gridTemplateColumns:"2.5fr 1.2fr 1.2fr 1fr 0.8fr 0.9fr",padding:"14px 20px",borderBottom:i<filtered.length-1?"1px solid #f1f5f9":"none",alignItems:"center",background:c.is_active?"#fff":"#fafafa"}}>

                {/* Shop / Owner */}
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <div style={{width:42,height:42,borderRadius:13,background:c.is_active?`linear-gradient(135deg,${avatarBg(c.shop_name)},${avatarBg(c.shop_name)}bb)`:"#cbd5e1",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:17,flexShrink:0,opacity:c.is_active?1:0.6}}>
                    {c.shop_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{fontWeight:700,fontSize:14,color:c.is_active?"#0f172a":"#94a3b8"}}>{c.shop_name}</div>
                    {c.name&&<div style={{fontSize:12,color:"#94a3b8",marginTop:1}}>{c.name}</div>}
                  </div>
                </div>

                {/* Username */}
                <div style={{fontSize:13,fontWeight:600,color:c.is_active?"#374151":"#94a3b8",fontFamily:"monospace"}}>@{c.username}</div>

                {/* Shop ID */}
                <div>
                  <span style={{fontSize:12,fontWeight:700,background:"#f1f5f9",border:"1px solid #e2e8f0",padding:"3px 10px",borderRadius:7,color:"#475569",fontFamily:"monospace"}}>
                    {c.shop_id}
                  </span>
                </div>

                {/* Created */}
                <div style={{fontSize:12,color:"#64748b"}}>{fmtDate(c.created_at)}</div>

                {/* Enabled toggle — in Status column */}
                <div>
                  <div onClick={()=>toggleActive(c)} style={{cursor:"pointer",display:"inline-block"}}>
                    <div style={{
                      width:46,height:26,borderRadius:13,position:"relative",transition:"background 0.25s",
                      background:c.is_active?"#22c55e":"#d1d5db",
                      boxShadow:c.is_active?"0 0 0 3px rgba(34,197,94,0.15)":"none"
                    }}>
                      <div style={{
                        position:"absolute",top:3,
                        left:c.is_active?23:3,
                        width:20,height:20,borderRadius:"50%",
                        background:"#fff",
                        boxShadow:"0 1px 4px rgba(0,0,0,0.22)",
                        transition:"left 0.22s cubic-bezier(.4,0,.2,1)"
                      }}/>
                    </div>
                  </div>
                </div>

                {/* Actions — Edit + Delete only */}
                <div style={{display:"flex",gap:6,alignItems:"center"}}>
                  <button className="act-btn" onClick={()=>openEdit(c)}
                    style={{width:32,height:32,background:"#eff6ff",border:"1.5px solid #bfdbfe",borderRadius:9,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#1d4ed8"}}>
                    <Pencil size={13}/>
                  </button>
                  <button className="act-btn" onClick={()=>setDeleteId(c.id)}
                    style={{width:32,height:32,background:"#fef2f2",border:"1.5px solid #fecaca",borderRadius:9,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#dc2626"}}>
                    <Trash2 size={13}/>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer count */}
        {!loading&&clients.length>0&&(
          <div style={{padding:"10px 20px",borderTop:"1.5px solid #f1f5f9",background:"#f8fafc",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:12,color:"#94a3b8"}}>{clients.length} total client{clients.length!==1?"s":""}</span>
            <button onClick={()=>{setShowForm(true);setEditClient(null);}}
              style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",background:"linear-gradient(135deg,#4c1d95,#7c3aed)",color:"#fff",border:"none",borderRadius:9,fontWeight:700,fontSize:12,cursor:"pointer"}}>
              <Plus size={13}/> Add Client
            </button>
          </div>
        )}
      </div>

      {/* ── EDIT MODAL ── */}
      {editClient&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}
          onClick={()=>setEditClient(null)}>
          <div style={{background:"#fff",borderRadius:20,width:"100%",maxWidth:480,boxShadow:"0 24px 60px rgba(0,0,0,0.25)",overflow:"hidden",animation:"slideIn 0.2s ease both"}}
            onClick={e=>e.stopPropagation()}>
            <div style={{background:"linear-gradient(135deg,#0f172a,#1e1b4b)",padding:"22px 24px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:40,height:40,borderRadius:11,background:`linear-gradient(135deg,${avatarBg(editClient.shop_name)},${avatarBg(editClient.shop_name)}bb)`,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:18}}>
                  {editClient.shop_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{color:"#fff",fontWeight:700,fontSize:15}}>Edit Client</div>
                  <div style={{color:"rgba(255,255,255,0.45)",fontSize:12}}>{editClient.shop_name}</div>
                </div>
              </div>
              <button onClick={()=>setEditClient(null)} style={{width:32,height:32,background:"rgba(255,255,255,0.1)",border:"none",borderRadius:8,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <X size={16} color="#fff"/>
              </button>
            </div>
            <div style={{padding:24}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                <div>
                  <div style={labelStyle}>Shop Name *</div>
                  <input style={inputStyle} value={editForm.shop_name} onChange={e=>setEditForm(f=>({...f,shop_name:e.target.value}))} placeholder="Shop name"/>
                </div>
                <div>
                  <div style={labelStyle}>Shop ID *</div>
                  <input style={inputStyle} value={editForm.shop_id} onChange={e=>setEditForm(f=>({...f,shop_id:e.target.value}))} placeholder="Shop ID"/>
                </div>
                <div>
                  <div style={labelStyle}>Username *</div>
                  <input style={inputStyle} value={editForm.username} onChange={e=>setEditForm(f=>({...f,username:e.target.value}))} placeholder="Username"/>
                </div>
                <div>
                  <div style={labelStyle}>Owner Name</div>
                  <input style={inputStyle} value={editForm.name} onChange={e=>setEditForm(f=>({...f,name:e.target.value}))} placeholder="Owner name"/>
                </div>
                <div style={{gridColumn:"1 / -1"}}>
                  <div style={labelStyle}>
                    <KeyRound size={11} style={{display:"inline",marginRight:5}}/>
                    New Password <span style={{fontWeight:400,textTransform:"none",color:"#94a3b8"}}>(leave blank to keep current)</span>
                  </div>
                  <div style={{position:"relative"}}>
                    <input type={showEditPass?"text":"password"} placeholder="Enter new password to change"
                      value={editForm.password} onChange={e=>setEditForm(f=>({...f,password:e.target.value}))}
                      style={{...inputStyle,paddingRight:42}}/>
                    <button onClick={()=>setShowEditPass(v=>!v)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",display:"flex",padding:2}}>
                      {showEditPass?<EyeOff size={16} color="#94a3b8"/>:<Eye size={16} color="#94a3b8"/>}
                    </button>
                  </div>
                </div>
              </div>
              <div style={{display:"flex",gap:10,marginTop:20}}>
                <button onClick={()=>setEditClient(null)} style={{flex:1,padding:"11px",border:"1.5px solid #e2e8f0",borderRadius:10,background:"#f8fafc",fontWeight:600,fontSize:14,cursor:"pointer",color:"#64748b"}}>Cancel</button>
                <button onClick={saveEdit} disabled={editSaving}
                  style={{flex:2,padding:"11px",border:"none",borderRadius:10,background:"linear-gradient(135deg,#4c1d95,#7c3aed)",color:"#fff",fontWeight:700,fontSize:14,cursor:editSaving?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,opacity:editSaving?0.7:1,boxShadow:"0 4px 14px rgba(124,58,237,0.28)"}}>
                  <Check size={16}/> {editSaving?"Saving…":"Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE MODAL ── */}
      {deleteId&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}
          onClick={()=>setDeleteId(null)}>
          <div style={{background:"#fff",borderRadius:20,padding:28,maxWidth:340,width:"100%",boxShadow:"0 24px 60px rgba(0,0,0,0.22)",animation:"slideIn 0.2s ease both"}}
            onClick={e=>e.stopPropagation()}>
            <div style={{textAlign:"center",marginBottom:22}}>
              <div style={{width:56,height:56,borderRadius:16,background:"#fef2f2",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px"}}>
                <Trash2 size={26} color="#dc2626"/>
              </div>
              <div style={{fontWeight:800,fontSize:17,color:"#0f172a",marginBottom:6}}>Remove Client?</div>
              <div style={{fontSize:13,color:"#64748b",lineHeight:1.5}}>This will remove the login access. Customer data will remain in the database.</div>
            </div>
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
