"use client";
import { useState, useEffect } from "react";
import { Search, Trash2, Check, ChevronDown, ChevronUp } from "lucide-react";
import api from "@/lib/api";
import ProtectedLayout from "@/components/ProtectedLayout";
import type { Customer, Service } from "@/types";

interface ManualItem { id:string; service_id:string; service_name:string; item_name:string; price:number; quantity:number; }
const COLORS=[{bg:"#eff6ff",border:"#bfdbfe",text:"#1e40af"},{bg:"#f0fdf4",border:"#bbf7d0",text:"#166534"},{bg:"#fdf4ff",border:"#e9d5ff",text:"#7e22ce"},{bg:"#fff7ed",border:"#fed7aa",text:"#9a3412"},{bg:"#f0fdfa",border:"#99f6e4",text:"#134e4a"},{bg:"#fefce8",border:"#fef08a",text:"#854d0e"}];

export default function NewEntry() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer|null>(null);
  const [items, setItems] = useState<ManualItem[]>([]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  useEffect(()=>{ api.get("/customers").then(r=>setCustomers(r.data)); api.get("/services").then(r=>setServices(r.data)); },[]);

  const filtered = search.length>0 ? customers.filter(c=>c.flat_number?.toLowerCase().includes(search.toLowerCase())||c.society_name?.toLowerCase().includes(search.toLowerCase())||c.name?.toLowerCase().includes(search.toLowerCase())) : [];

  const addItem = (svc:Service) => setItems(prev=>[...prev,{id:Math.random().toString(),service_id:svc.id,service_name:svc.name,item_name:"",price:Number(svc.price)||0,quantity:1}]);
  const updateItem = (id:string,field:keyof ManualItem,value:string|number) => setItems(prev=>prev.map(item=>item.id===id?{...item,[field]:value}:item));
  const removeItem = (id:string) => setItems(prev=>prev.filter(item=>item.id!==id));
  const toggleGroup = (id:string) => { const s=new Set(expandedGroups); s.has(id)?s.delete(id):s.add(id); setExpandedGroups(s); };

  const total = items.reduce((s,i)=>s+(Number(i.price)*Number(i.quantity)),0);

  const save = async () => {
    if(!selectedCustomer||items.length===0)return;
    setSaving(true);
    try {
      await api.post("/entries",{customer_id:selectedCustomer.id,notes,items:items.map(i=>({service_id:i.service_id,service_name:i.item_name?`${i.service_name} - ${i.item_name}`:i.service_name,quantity:Number(i.quantity),price_per_unit:Number(i.price)}))});
      setSuccess(true); setItems([]); setNotes(""); setSelectedCustomer(null); setSearch("");
      setTimeout(()=>setSuccess(false),3000);
    } finally { setSaving(false); }
  };

  const topServices = services.filter(s=>!s.parent_id);
  const getChildren = (pid:string) => services.filter(s=>s.parent_id===pid);
  const hasChildren = (id:string) => services.some(s=>s.parent_id===id);

  return (
    <ProtectedLayout>
      <style>{`.svc-btn:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(0,0,0,0.1);}`}</style>
      <h2 style={{color:"#0f172a",marginBottom:4,fontSize:22,fontWeight:700}}>New Laundry Entry</h2>
      <p style={{color:"#64748b",fontSize:13,marginBottom:20}}>Fill in customer and services below</p>

      {success&&<div style={{background:"#f0fdf4",color:"#16a34a",padding:"12px 16px",borderRadius:10,marginBottom:16,fontWeight:600,display:"flex",alignItems:"center",gap:8}}><Check size={18}/> Entry saved!</div>}

      <div style={{background:"#fff",borderRadius:12,padding:"16px 18px",marginBottom:14,boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
        <div style={{fontWeight:700,fontSize:13,color:"#475569",marginBottom:12,textTransform:"uppercase",letterSpacing:"0.05em"}}>👤 Customer</div>
        <div style={{position:"relative"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,border:"1.5px solid #e2e8f0",borderRadius:10,padding:"10px 14px",background:"#f8fafc"}}>
            <Search size={15} color="#94a3b8"/>
            <input style={{flex:1,border:"none",outline:"none",fontSize:14,background:"transparent"}} placeholder="Search by Flat name, number or Name..." value={search} onChange={e=>{setSearch(e.target.value);setSelectedCustomer(null);}}/>
          </div>
          {filtered.length>0&&!selectedCustomer&&(
            <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,right:0,background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,zIndex:100,boxShadow:"0 8px 24px rgba(0,0,0,0.12)",maxHeight:220,overflowY:"auto"}}>
              {filtered.map(c=>(
                <div key={c.id} style={{padding:"10px 16px",cursor:"pointer",borderBottom:"1px solid #f8fafc"}} onClick={()=>{setSelectedCustomer(c);setSearch(`${c.name} - ${c.flat_number}`);}}>
                  <div style={{fontWeight:600,fontSize:14}}>{c.name}</div>
                  <div style={{fontSize:12,color:"#64748b"}}>🏠 {c.flat_number} • {c.society_name} • 📞 {c.phone}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        {selectedCustomer&&<div style={{display:"flex",alignItems:"center",gap:8,marginTop:10,padding:"8px 14px",background:"#f0fdf4",borderRadius:8,fontSize:13,color:"#15803d",flexWrap:"wrap"}}><Check size={15} color="#16a34a"/><span style={{fontWeight:600}}>{selectedCustomer.name}</span><span style={{color:"#64748b"}}>Flat: {selectedCustomer.flat_number}</span><span style={{color:"#64748b"}}>{selectedCustomer.society_name}</span></div>}
      </div>

      <div style={{background:"#fff",borderRadius:12,padding:"16px 18px",marginBottom:14,boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
        <div style={{fontWeight:700,fontSize:13,color:"#475569",marginBottom:12,textTransform:"uppercase",letterSpacing:"0.05em"}}>🧺 Select Services</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
          {topServices.map((svc,idx)=>{
            const color=COLORS[idx%COLORS.length];
            if(!hasChildren(svc.id)) return <button key={svc.id} className="svc-btn" onClick={()=>addItem(svc)} style={{padding:"8px 16px",background:color.bg,color:color.text,border:`1.5px solid ${color.border}`,borderRadius:20,cursor:"pointer",fontSize:13,fontWeight:600,transition:"all 0.15s"}}>+ {svc.name}</button>;
            return (
              <div key={svc.id} style={{background:color.bg,border:`1.5px solid ${color.border}`,borderRadius:12,overflow:"hidden"}}>
                <button className="svc-btn" onClick={()=>toggleGroup(svc.id)} style={{padding:"8px 14px",background:"transparent",color:color.text,border:"none",cursor:"pointer",fontSize:13,fontWeight:700,display:"flex",alignItems:"center",gap:6}}>
                  {svc.name}{expandedGroups.has(svc.id)?<ChevronUp size={14}/>:<ChevronDown size={14}/>}
                </button>
                {expandedGroups.has(svc.id)&&(
                  <div style={{display:"flex",flexWrap:"wrap",gap:6,padding:"6px 10px 10px"}}>
                    {getChildren(svc.id).map(child=><button key={child.id} className="svc-btn" onClick={()=>addItem(child)} style={{padding:"6px 12px",background:"#fff",color:color.text,border:`1px solid ${color.border}`,borderRadius:16,cursor:"pointer",fontSize:12,fontWeight:600}}>+ {child.name} <span style={{opacity:0.7}}>₹{child.price}</span></button>)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {items.length>0&&(
        <div style={{background:"#fff",borderRadius:12,padding:"16px 18px",marginBottom:14,boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
          <div style={{fontWeight:700,fontSize:13,color:"#475569",marginBottom:12,textTransform:"uppercase",letterSpacing:"0.05em"}}>📦 Items ({items.length})</div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {items.map(item=>(
              <div key={item.id} style={{background:"#f8fafc",borderRadius:10,padding:"12px 14px",border:"1px solid #e2e8f0"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <span style={{fontWeight:700,fontSize:13,color:"#1e40af",background:"#eff6ff",padding:"3px 10px",borderRadius:12}}>{item.service_name}</span>
                  <button onClick={()=>removeItem(item.id)} style={{background:"#fef2f2",border:"none",borderRadius:6,padding:"4px 8px",cursor:"pointer"}}><Trash2 size={14} color="#ef4444"/></button>
                </div>
                <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,background:"#fff",border:"1px solid #e2e8f0",borderRadius:8,padding:"4px 8px"}}>
                    <span style={{fontSize:12,color:"#94a3b8",fontWeight:600}}>Qty</span>
                    <input type="number" style={{width:80,border:"none",outline:"none",fontSize:16,fontWeight:600,textAlign:"right"}} value={item.quantity} min={1} onChange={e=>updateItem(item.id,"quantity",e.target.value)}/>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:6,background:"#fff",border:"1px solid #e2e8f0",borderRadius:8,padding:"4px 8px"}}>
                    <span style={{fontSize:12,color:"#94a3b8",fontWeight:600}}>Rs.</span>
                    <input type="number" style={{width:64,border:"none",outline:"none",fontSize:14,fontWeight:600,textAlign:"right"}} value={item.price} min={0} onChange={e=>updateItem(item.id,"price",e.target.value)}/>
                  </div>
                  <div style={{fontWeight:800,fontSize:15,color:"#059669",minWidth:70,textAlign:"right"}}>₹{(Number(item.price)*Number(item.quantity)).toFixed(0)}</div>
                  <input style={{flex:1,minWidth:120,padding:"6px 10px",border:"1px solid #e2e8f0",borderRadius:8,fontSize:13,outline:"none",background:"#fff",color:"#64748b"}} placeholder="Description (optional)" value={item.item_name} onChange={e=>updateItem(item.id,"item_name",e.target.value)}/>
                </div>
              </div>
            ))}
          </div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 4px 0",borderTop:"2px dashed #e2e8f0",marginTop:12}}>
            <span style={{color:"#64748b",fontWeight:600}}>Total Amount</span>
            <span style={{fontWeight:800,fontSize:22,color:"#1e40af"}}>₹{total.toFixed(0)}</span>
          </div>
        </div>
      )}

      <div style={{background:"#fff",borderRadius:12,padding:"16px 18px",marginBottom:14,boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
        <div style={{fontWeight:700,fontSize:13,color:"#475569",marginBottom:12,textTransform:"uppercase",letterSpacing:"0.05em"}}>📝 Notes (optional)</div>
        <textarea style={{width:"100%",padding:"10px 12px",border:"1px solid #e2e8f0",borderRadius:8,fontSize:14,outline:"none",resize:"vertical",boxSizing:"border-box",fontFamily:"inherit"}} placeholder="Any special instructions..." value={notes} onChange={e=>setNotes(e.target.value)} rows={2}/>
      </div>

      <button style={{width:"100%",padding:"15px",background:!selectedCustomer||items.length===0?"#94a3b8":"#1e40af",color:"#fff",border:"none",borderRadius:12,fontSize:16,fontWeight:700,cursor:!selectedCustomer||items.length===0?"not-allowed":"pointer"}} onClick={save} disabled={!selectedCustomer||items.length===0||saving}>
        {saving?"Saving...":"💾 Save Entry"}
      </button>
    </ProtectedLayout>
  );
}
