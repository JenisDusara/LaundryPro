"use client";
import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, X, ChevronDown, ChevronRight, Tag } from "lucide-react";
import api from "@/lib/api";
import ProtectedLayout from "@/components/ProtectedLayout";
import type { Service } from "@/types";

const COLORS = [
  {bg:"#eff6ff",border:"#bfdbfe",icon:"#3b82f6"},{bg:"#f0fdf4",border:"#bbf7d0",icon:"#22c55e"},
  {bg:"#fdf4ff",border:"#e9d5ff",icon:"#a855f7"},{bg:"#fff7ed",border:"#fed7aa",icon:"#f97316"},
  {bg:"#fef2f2",border:"#fecaca",icon:"#ef4444"},{bg:"#f0fdfa",border:"#99f6e4",icon:"#14b8a6"},
  {bg:"#fefce8",border:"#fef08a",icon:"#eab308"},{bg:"#f8fafc",border:"#e2e8f0",icon:"#64748b"},
];

const CATEGORIES = ["", "MEN", "WOMEN", "KIDS", "HOUSEHOLD", "INSTITUTIONAL", "OTHERS"];

export default function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({name:"",price:"",parent_id:"",category:"",description:""});
  const [editId, setEditId] = useState<string|null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => { const res = await api.get("/services"); setServices(res.data); };
  useEffect(()=>{load();},[]);

  const toggle = (id:string) => { const s=new Set(expanded); s.has(id)?s.delete(id):s.add(id); setExpanded(s); };

  const save = async () => {
    setLoading(true);
    try {
      const body: any={name:form.name, category:form.category||null, description:form.description||null};
      if(form.price) body.price=parseFloat(form.price);
      if(form.parent_id) body.parent_id=form.parent_id;
      if(editId) await api.put(`/services/${editId}`,body);
      else await api.post("/services",body);
      setShowForm(false); load();
    } catch(e:any){alert(e.response?.data?.detail||"Error");}
    finally{setLoading(false);}
  };

  const del = async (id:string) => { if(!confirm("Deactivate?"))return; await api.delete(`/services/${id}`); load(); };

  return (
    <ProtectedLayout>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24}}>
        <div>
          <div style={{fontSize:11,fontWeight:700,color:"var(--text-secondary)",textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:4}}>Catalogue</div>
          <h2 style={{color:"var(--text-primary)",margin:"0 0 4px",fontSize:26,fontWeight:900,letterSpacing:-0.5}}>Services & pricing</h2>
          <p style={{color:"var(--text-muted)",fontSize:13,margin:0}}>{services.length} services</p>
        </div>
        <button onClick={()=>{setForm({name:"",price:"",parent_id:"",category:"",description:""});setEditId(null);setShowForm(true);}}
          style={{display:"flex",alignItems:"center",gap:6,background:"#2563eb",color:"#fff",border:"none",borderRadius:10,padding:"10px 20px",fontSize:14,fontWeight:700,cursor:"pointer",boxShadow:"0 4px 14px rgba(37,99,235,0.28)"}}>
          <Plus size={16}/> Add service
        </button>
      </div>

      {/* Grid */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:14}}>
        {services.map((svc,idx) => {
          const color=COLORS[idx%COLORS.length];
          const isExp=expanded.has(svc.id);
          return (
            <div key={svc.id} style={{background:"var(--bg-card)",borderRadius:14,border:"1px solid var(--border-hard)",borderTop:`3px solid ${color.icon}`,overflow:"hidden"}}>
              {/* Info row */}
              <div style={{display:"flex",alignItems:"center",gap:12,padding:"16px 16px 12px"}}>
                <div style={{width:40,height:40,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",background:"var(--bg-elevated)",flexShrink:0}}>
                  <Tag size={17} color={color.icon}/>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:15,color:"var(--text-primary)"}}>{svc.name}</div>
                  {svc.children.length>0
                    ? <div style={{fontSize:12,color:"var(--text-muted)",marginTop:2}}>{svc.children.length} sub-item{svc.children.length!==1?"s":""}</div>
                    : svc.price!==null
                      ? <div style={{fontSize:12,color:"var(--text-muted)",marginTop:2}}>₹{svc.price} flat rate</div>
                      : null}
                </div>
              </div>

              {/* Footer actions */}
              <div style={{display:"flex",alignItems:"center",gap:6,padding:"10px 12px",borderTop:"1px solid var(--border-hard)"}}>
                {!svc.parent_id&&(
                  <button style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:5,padding:"7px",border:"1px solid var(--border-hard)",borderRadius:8,background:"transparent",cursor:"pointer",fontSize:12,fontWeight:600,color:"var(--text-secondary)"}}
                    onClick={()=>{setForm({name:"",price:"",parent_id:svc.id,category:svc.category||"",description:""});setEditId(null);setShowForm(true);}}>
                    <Plus size={13}/> Sub-item
                  </button>
                )}
                <button style={{width:32,height:32,border:"1px solid var(--border-hard)",borderRadius:8,background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}
                  onClick={()=>{setForm({name:svc.name,price:svc.price?.toString()||"",parent_id:svc.parent_id||"",category:svc.category||"",description:svc.description||""});setEditId(svc.id);setShowForm(true);}}>
                  <Edit2 size={14} color="var(--text-secondary)"/>
                </button>
                <button style={{width:32,height:32,border:"1px solid var(--border-hard)",borderRadius:8,background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}
                  onClick={()=>del(svc.id)}>
                  <Trash2 size={14} color="#ef4444"/>
                </button>
                {svc.children.length>0&&(
                  <button style={{width:32,height:32,border:"1px solid var(--border-hard)",borderRadius:8,background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}
                    onClick={()=>toggle(svc.id)}>
                    {isExp?<ChevronDown size={14} color="var(--text-secondary)"/>:<ChevronRight size={14} color="var(--text-secondary)"/>}
                  </button>
                )}
              </div>

              {/* Expanded sub-items */}
              {isExp&&svc.children.length>0&&(
                <div style={{padding:"8px 14px 12px",borderTop:"1px solid var(--border-hard)"}}>
                  {svc.children.map(child=>(
                    <div key={child.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:"1px solid var(--border-subtle)"}}>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <div style={{width:6,height:6,borderRadius:3,background:color.icon,flexShrink:0}}/>
                        <span style={{fontSize:13,color:"var(--text-primary)",fontWeight:600}}>{child.name}</span>
                        {child.category&&<span style={{fontSize:10,fontWeight:700,color:"var(--text-muted)",background:"var(--bg-elevated)",border:"1px solid var(--border-hard)",borderRadius:20,padding:"1px 7px"}}>{child.category}</span>}
                        <span style={{fontSize:13,fontWeight:700,color:color.icon}}>₹{child.price}</span>
                      </div>
                      <div style={{display:"flex",gap:4}}>
                        <button style={{width:28,height:28,border:"1px solid var(--border-hard)",borderRadius:6,background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}
                          onClick={()=>{setForm({name:child.name,price:child.price?.toString()||"",parent_id:child.parent_id||"",category:child.category||"",description:child.description||""});setEditId(child.id);setShowForm(true);}}>
                          <Edit2 size={12} color="var(--text-secondary)"/>
                        </button>
                        <button style={{width:28,height:28,border:"1px solid var(--border-hard)",borderRadius:6,background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}
                          onClick={()=>del(child.id)}>
                          <Trash2 size={12} color="#ef4444"/>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showForm&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:16}} onClick={()=>setShowForm(false)}>
          <div style={{background:"var(--bg-card)",borderRadius:16,padding:24,width:"100%",maxWidth:400,border:"1px solid var(--border-hard)"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <h3 style={{margin:0,color:"var(--text-primary)",fontSize:17,fontWeight:800}}>{editId?"Edit":"Add"} Service</h3>
              <X size={20} style={{cursor:"pointer",color:"var(--text-secondary)"}} onClick={()=>setShowForm(false)}/>
            </div>
            {form.parent_id&&<div style={{background:"rgba(59,130,246,0.1)",color:"#3b82f6",fontSize:12,padding:"6px 12px",borderRadius:6,marginBottom:12,fontWeight:600}}>Adding sub-item</div>}
            <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:12,marginBottom:22}}>
              <div>
                <label style={{display:"block",fontSize:13,fontWeight:600,color:"var(--text-secondary)",marginBottom:6}}>Service Name <span style={{color:"#ef4444"}}>*</span></label>
                <input style={{width:"100%",padding:"10px 14px",border:"1px solid var(--border-hard)",borderRadius:8,fontSize:14,outline:"none",boxSizing:"border-box",background:"var(--bg-input)",color:"var(--text-primary)"}} placeholder="e.g. Steam Iron" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
              </div>
              <div>
                <label style={{display:"block",fontSize:13,fontWeight:600,color:"var(--text-secondary)",marginBottom:6}}>Price (₹)</label>
                <input style={{width:"100%",padding:"10px 14px",border:"1px solid var(--border-hard)",borderRadius:8,fontSize:14,outline:"none",boxSizing:"border-box",background:"var(--bg-input)",color:"var(--text-primary)"}} type="number" placeholder="0" value={form.price} onChange={e=>setForm({...form,price:e.target.value})}/>
              </div>
            </div>
            <div style={{marginBottom:22}}>
              <label style={{display:"block",fontSize:13,fontWeight:600,color:"var(--text-secondary)",marginBottom:6}}>Category <span style={{fontSize:11,fontWeight:400,color:"var(--text-muted)"}}>(optional — for POS filter)</span></label>
              <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}
                style={{width:"100%",padding:"10px 14px",border:"1px solid var(--border-hard)",borderRadius:8,fontSize:14,outline:"none",boxSizing:"border-box",background:"var(--bg-input)",color:"var(--text-primary)"}}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c || "— None —"}</option>)}
              </select>
            </div>
            {/* Description — appears for OTHERS so staff can explain what the service is */}
            {form.category==="OTHERS"&&(
              <div style={{marginBottom:22}}>
                <label style={{display:"block",fontSize:13,fontWeight:600,color:"var(--text-secondary)",marginBottom:6}}>Description <span style={{fontSize:11,fontWeight:400,color:"var(--text-muted)"}}>(optional)</span></label>
                <textarea rows={2} placeholder="e.g. Special handling / shoe cleaning / custom item" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}
                  style={{width:"100%",padding:"10px 14px",border:"1px solid var(--border-hard)",borderRadius:8,fontSize:14,outline:"none",boxSizing:"border-box",background:"var(--bg-input)",color:"var(--text-primary)",resize:"vertical"}}/>
              </div>
            )}
            <div style={{display:"flex",justifyContent:"flex-end",gap:10}}>
              <button onClick={()=>setShowForm(false)}
                style={{padding:"10px 22px",border:"1px solid var(--border-hard)",borderRadius:9,background:"transparent",fontSize:14,fontWeight:600,cursor:"pointer",color:"var(--text-secondary)"}}>
                Cancel
              </button>
              <button onClick={save} disabled={loading||!form.name}
                style={{padding:"10px 28px",border:"none",borderRadius:9,fontSize:14,fontWeight:700,cursor:loading||!form.name?"not-allowed":"pointer",background:loading||!form.name?"var(--bg-elevated)":"#2563eb",color:loading||!form.name?"var(--text-muted)":"#fff",opacity:loading||!form.name?0.6:1}}>
                {loading?"Saving...":"Save Service"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedLayout>
  );
}
