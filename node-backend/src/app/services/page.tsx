"use client";
import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, X, ChevronDown, ChevronRight, Tag, IndianRupee } from "lucide-react";
import api from "@/lib/api";
import ProtectedLayout from "@/components/ProtectedLayout";
import type { Service } from "@/types";

const COLORS = [
  {bg:"#eff6ff",border:"#bfdbfe",icon:"#3b82f6"},{bg:"#f0fdf4",border:"#bbf7d0",icon:"#22c55e"},
  {bg:"#fdf4ff",border:"#e9d5ff",icon:"#a855f7"},{bg:"#fff7ed",border:"#fed7aa",icon:"#f97316"},
  {bg:"#fef2f2",border:"#fecaca",icon:"#ef4444"},{bg:"#f0fdfa",border:"#99f6e4",icon:"#14b8a6"},
  {bg:"#fefce8",border:"#fef08a",icon:"#eab308"},{bg:"#f8fafc",border:"#e2e8f0",icon:"#64748b"},
];

export default function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({name:"",price:"",parent_id:""});
  const [editId, setEditId] = useState<string|null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => { const res = await api.get("/services"); setServices(res.data); };
  useEffect(()=>{load();},[]);

  const toggle = (id:string) => { const s=new Set(expanded); s.has(id)?s.delete(id):s.add(id); setExpanded(s); };

  const save = async () => {
    setLoading(true);
    try {
      const body: any={name:form.name};
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
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24}}>
        <div>
          <h2 style={{color:"#1e3a8a",margin:0,fontSize:22}}>Services & Pricing</h2>
          <p style={{color:"#94a3b8",fontSize:13,margin:"4px 0 0"}}>{services.length} services</p>
        </div>
        <button onClick={()=>{setForm({name:"",price:"",parent_id:""});setEditId(null);setShowForm(true);}} style={{display:"flex",alignItems:"center",gap:6,background:"#1e40af",color:"#fff",border:"none",borderRadius:10,padding:"10px 18px",fontSize:14,fontWeight:600,cursor:"pointer"}}>
          <Plus size={18}/> Add Service
        </button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:16}}>
        {services.map((svc,idx) => {
          const color=COLORS[idx%COLORS.length];
          const isExp=expanded.has(svc.id);
          return (
            <div key={svc.id} style={{background:"#fff",borderRadius:12,padding:16,boxShadow:"0 2px 8px rgba(0,0,0,0.06)",borderTop:`3px solid ${color.icon}`}}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:42,height:42,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",background:color.bg,border:`1px solid ${color.border}`}}><Tag size={18} color={color.icon}/></div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:15,color:"#1e293b"}}>{svc.name}</div>
                  {svc.price!==null?<div style={{display:"flex",alignItems:"center",gap:2,fontWeight:700,fontSize:14,color:color.icon}}><IndianRupee size={12}/>{svc.price}</div>:<div style={{fontSize:12,color:"#94a3b8"}}>{svc.children.length} sub-items</div>}
                </div>
                <div style={{display:"flex",gap:4}}>
                  {svc.children.length>0&&<button style={{width:28,height:28,border:"none",borderRadius:6,background:"#f8fafc",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>{setForm({name:"",price:"",parent_id:svc.id});setEditId(null);setShowForm(true);}}><Plus size={15} color="#3b82f6"/></button>}
                  <button style={{width:28,height:28,border:"none",borderRadius:6,background:"#f8fafc",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>{setForm({name:svc.name,price:svc.price?.toString()||"",parent_id:svc.parent_id||""});setEditId(svc.id);setShowForm(true);}}><Edit2 size={15} color="#64748b"/></button>
                  <button style={{width:28,height:28,border:"none",borderRadius:6,background:"#f8fafc",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>del(svc.id)}><Trash2 size={15} color="#ef4444"/></button>
                  {svc.children.length>0&&<button style={{width:28,height:28,border:"none",borderRadius:6,background:color.bg,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>toggle(svc.id)}>{isExp?<ChevronDown size={15} color={color.icon}/>:<ChevronRight size={15} color={color.icon}/>}</button>}
                </div>
              </div>
              {isExp&&svc.children.length>0&&(
                <div style={{marginTop:12,borderTop:"1px solid #f1f5f9",paddingTop:10}}>
                  {svc.children.map(child=>(
                    <div key={child.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0"}}>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <div style={{width:6,height:6,borderRadius:3,background:color.icon}}/>
                        <span style={{fontSize:13,color:"#475569",fontWeight:500}}>{child.name}</span>
                        <span style={{fontSize:13,fontWeight:700,color:color.icon}}>₹{child.price}</span>
                      </div>
                      <div style={{display:"flex",gap:4}}>
                        <button style={{width:28,height:28,border:"none",borderRadius:6,background:"#f8fafc",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>{setForm({name:child.name,price:child.price?.toString()||"",parent_id:child.parent_id||""});setEditId(child.id);setShowForm(true);}}><Edit2 size={13} color="#64748b"/></button>
                        <button style={{width:28,height:28,border:"none",borderRadius:6,background:"#f8fafc",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>del(child.id)}><Trash2 size={13} color="#ef4444"/></button>
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
          <div style={{background:"#fff",borderRadius:16,padding:24,width:"100%",maxWidth:400}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <h3 style={{margin:0,color:"#1e3a8a"}}>{editId?"✏️ Edit":"➕ Add"} Service</h3>
              <X size={20} style={{cursor:"pointer",color:"#64748b"}} onClick={()=>setShowForm(false)}/>
            </div>
            {form.parent_id&&<div style={{background:"#eff6ff",color:"#3b82f6",fontSize:12,padding:"6px 12px",borderRadius:6,marginBottom:12}}>Adding sub-item</div>}
            <label style={{display:"block",fontSize:13,fontWeight:600,color:"#475569",marginBottom:6}}>Service Name</label>
            <input style={{width:"100%",padding:"10px 14px",border:"1px solid #e2e8f0",borderRadius:8,marginBottom:14,fontSize:14,outline:"none",boxSizing:"border-box"}} placeholder="e.g. Steam Iron" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
            <label style={{display:"block",fontSize:13,fontWeight:600,color:"#475569",marginBottom:6}}>Price (₹)</label>
            <input style={{width:"100%",padding:"10px 14px",border:"1px solid #e2e8f0",borderRadius:8,marginBottom:14,fontSize:14,outline:"none",boxSizing:"border-box"}} type="number" placeholder="e.g. 15" value={form.price} onChange={e=>setForm({...form,price:e.target.value})}/>
            <button style={{width:"100%",padding:12,background:"#1e40af",color:"#fff",border:"none",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer",opacity:!form.name?0.5:1}} onClick={save} disabled={loading||!form.name}>{loading?"Saving...":"Save Service"}</button>
          </div>
        </div>
      )}
    </ProtectedLayout>
  );
}
