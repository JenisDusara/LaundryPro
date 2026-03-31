"use client";
import { useState, useEffect } from "react";
import { Search, Trash2, Check, ChevronDown, ChevronUp, Clock, CheckCircle2, Truck, User, Phone } from "lucide-react";
import api from "@/lib/api";
import ProtectedLayout from "@/components/ProtectedLayout";
import type { Customer, Service, LaundryEntry } from "@/types";

interface ManualItem { id:string; service_id:string; service_name:string; item_name:string; price:number; quantity:number; }
const COLORS=[{bg:"#eff6ff",border:"#bfdbfe",text:"#1e40af"},{bg:"#f0fdf4",border:"#bbf7d0",text:"#166534"},{bg:"#fdf4ff",border:"#e9d5ff",text:"#7e22ce"},{bg:"#fff7ed",border:"#fed7aa",text:"#9a3412"},{bg:"#f0fdfa",border:"#99f6e4",text:"#134e4a"},{bg:"#fefce8",border:"#fef08a",text:"#854d0e"}];

const statusConfig: Record<string,{color:string;bg:string;border:string;label:string;icon:React.ReactNode}> = {
  pending:     { color:"#d97706", bg:"#fffbeb", border:"#fde68a", label:"Pending",     icon:<Clock size={12}/> },
  in_delivery: { color:"#2563eb", bg:"#eff6ff", border:"#bfdbfe", label:"In Delivery", icon:<Truck size={12}/> },
  delivered:   { color:"#16a34a", bg:"#f0fdf4", border:"#bbf7d0", label:"Delivered",   icon:<CheckCircle2 size={12}/> },
};

export default function NewEntry() {
  const [customers,        setCustomers]        = useState<Customer[]>([]);
  const [services,         setServices]         = useState<Service[]>([]);
  const [search,           setSearch]           = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer|null>(null);
  const [items,            setItems]            = useState<ManualItem[]>([]);
  const [notes,            setNotes]            = useState("");
  const [saving,           setSaving]           = useState(false);
  const [success,          setSuccess]          = useState(false);
  const [expandedGroups,   setExpandedGroups]   = useState<Set<string>>(new Set());
  const [pastEntries,      setPastEntries]      = useState<LaundryEntry[]>([]);
  const [pastLoading,      setPastLoading]      = useState(false);
  const [showDropdown,     setShowDropdown]     = useState(false);
  const [updatingId,       setUpdatingId]       = useState<string|null>(null);

  useEffect(() => {
    api.get("/customers").then(r=>setCustomers(r.data));
    api.get("/services").then(r=>setServices(r.data));
  }, []);

  // Search: name, flat, society, phone number
  const filtered = search.length > 0
    ? customers.filter(c =>
        c.flat_number?.toLowerCase().includes(search.toLowerCase()) ||
        c.society_name?.toLowerCase().includes(search.toLowerCase()) ||
        c.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.phone?.includes(search)
      )
    : [];

  const selectCustomer = async (c: Customer) => {
    setSelectedCustomer(c);
    setSearch(`${c.name} — ${c.flat_number} — ${c.phone}`);
    setShowDropdown(false);
    // Fetch past entries
    setPastLoading(true);
    try {
      const res = await api.get("/entries", { params: { customer_id: c.id } });
      setPastEntries(res.data);
    } catch { setPastEntries([]); }
    finally { setPastLoading(false); }
  };

  const clearCustomer = () => {
    setSelectedCustomer(null); setSearch(""); setPastEntries([]); setShowDropdown(false);
  };

  const addItem      = (svc:Service) => setItems(prev=>[...prev,{id:Math.random().toString(),service_id:svc.id,service_name:svc.name,item_name:"",price:Number(svc.price)||0,quantity:1}]);
  const updateItem   = (id:string,field:keyof ManualItem,value:string|number) => setItems(prev=>prev.map(item=>item.id===id?{...item,[field]:value}:item));
  const removeItem   = (id:string) => setItems(prev=>prev.filter(item=>item.id!==id));
  const toggleGroup  = (id:string) => { const s=new Set(expandedGroups); s.has(id)?s.delete(id):s.add(id); setExpandedGroups(s); };

  const total = items.reduce((s,i)=>s+(Number(i.price)*Number(i.quantity)),0);

  const save = async () => {
    if(!selectedCustomer||items.length===0) return;
    setSaving(true);
    try {
      await api.post("/entries",{customer_id:selectedCustomer.id,notes,items:items.map(i=>({service_id:i.service_id,service_name:i.item_name?`${i.service_name} - ${i.item_name}`:i.service_name,quantity:Number(i.quantity),price_per_unit:Number(i.price)}))});
      setSuccess(true); setItems([]); setNotes("");
      // Refresh past entries
      const res = await api.get("/entries", { params: { customer_id: selectedCustomer.id } });
      setPastEntries(res.data);
      setTimeout(()=>setSuccess(false), 3000);
    } finally { setSaving(false); }
  };

  const topServices = services;

  const pendingEntries = pastEntries.filter(e => e.delivery_status !== "delivered");

  const markDelivered = async (entryId: string) => {
    setUpdatingId(entryId);
    try {
      await api.patch(`/entries/${entryId}/status`, null, { params: { status: "delivered" } });
      setPastEntries(prev => prev.map(e => e.id === entryId ? { ...e, delivery_status: "delivered" } : e));
    } finally { setUpdatingId(null); }
  };

  return (
    <ProtectedLayout>
      <style>{`.svc-btn:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(0,0,0,0.1);} .entry-row:hover{background:#f0f9ff!important;}`}</style>

      <h2 style={{color:"#0f172a",marginBottom:4,fontSize:22,fontWeight:700}}>New Laundry Entry</h2>
      <p style={{color:"#64748b",fontSize:13,marginBottom:20}}>Fill in customer and services below</p>

      {success && (
        <div style={{background:"#f0fdf4",color:"#16a34a",padding:"12px 16px",borderRadius:10,marginBottom:16,fontWeight:600,display:"flex",alignItems:"center",gap:8,border:"1px solid #bbf7d0"}}>
          <Check size={18}/> Entry saved successfully!
        </div>
      )}

      {/* ── Customer Search ── */}
      <div style={{background:"#fff",borderRadius:14,padding:"18px 20px",marginBottom:14,boxShadow:"0 2px 8px rgba(0,0,0,0.06)",border:"1px solid #f1f5f9"}}>
        <div style={{fontWeight:700,fontSize:13,color:"#475569",marginBottom:12,textTransform:"uppercase",letterSpacing:"0.05em"}}>👤 Customer</div>
        <div style={{position:"relative"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,border:"1.5px solid #e2e8f0",borderRadius:10,padding:"11px 14px",background:"#f8fafc"}}>
            <Search size={15} color="#94a3b8"/>
            <input
              style={{flex:1,border:"none",outline:"none",fontSize:14,background:"transparent",color:"#1e293b"}}
              placeholder="Search by Name, Phone, Flat or Society..."
              value={search}
              onChange={e=>{ setSearch(e.target.value); setSelectedCustomer(null); setPastEntries([]); setShowDropdown(true); }}
              onFocus={()=>search.length>0&&setShowDropdown(true)}
            />
            {search && (
              <button onClick={clearCustomer} style={{background:"none",border:"none",cursor:"pointer",color:"#94a3b8",padding:2,display:"flex"}}>✕</button>
            )}
          </div>

          {/* Suggestions dropdown */}
          {showDropdown && filtered.length>0 && !selectedCustomer && (
            <div style={{position:"absolute",top:"calc(100% + 6px)",left:0,right:0,background:"#fff",border:"1px solid #e2e8f0",borderRadius:12,zIndex:100,boxShadow:"0 12px 32px rgba(0,0,0,0.12)",maxHeight:260,overflowY:"auto"}}>
              {filtered.map(c=>(
                <div key={c.id}
                  style={{padding:"12px 16px",cursor:"pointer",borderBottom:"1px solid #f8fafc",transition:"background 0.1s"}}
                  onMouseEnter={e=>e.currentTarget.style.background="#f0f9ff"}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                  onClick={()=>selectCustomer(c)}
                >
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,#1d4ed8,#3b82f6)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:14,flexShrink:0}}>
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{fontWeight:700,fontSize:14,color:"#1e293b"}}>{c.name}</div>
                      <div style={{fontSize:12,color:"#64748b",display:"flex",gap:10,marginTop:2,flexWrap:"wrap"}}>
                        <span style={{display:"flex",alignItems:"center",gap:3}}><Phone size={10}/> {c.phone}</span>
                        {c.flat_number&&<span>🏠 {c.flat_number}</span>}
                        {c.society_name&&<span>🏘️ {c.society_name}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected customer chip */}
        {selectedCustomer && (
          <div style={{marginTop:12,padding:"10px 14px",background:"#f0fdf4",borderRadius:10,border:"1px solid #bbf7d0",display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:34,height:34,borderRadius:9,background:"linear-gradient(135deg,#059669,#10b981)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:14}}>
              {selectedCustomer.name.charAt(0).toUpperCase()}
            </div>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,fontSize:14,color:"#15803d"}}>{selectedCustomer.name}</div>
              <div style={{fontSize:12,color:"#16a34a",display:"flex",gap:8,marginTop:1}}>
                <span><Phone size={10}/> {selectedCustomer.phone}</span>
                {selectedCustomer.flat_number&&<span>🏠 {selectedCustomer.flat_number}, {selectedCustomer.society_name}</span>}
              </div>
            </div>
            <Check size={18} color="#16a34a"/>
          </div>
        )}
      </div>

      {/* ── Past History ── */}
      {selectedCustomer && (
        <div style={{background:"#fff",borderRadius:14,padding:"18px 20px",marginBottom:14,boxShadow:"0 2px 8px rgba(0,0,0,0.06)",border:"1px solid #f1f5f9"}}>
          <div style={{fontWeight:700,fontSize:13,color:"#475569",marginBottom:14,textTransform:"uppercase",letterSpacing:"0.05em"}}>
            📋 Past History — {selectedCustomer.name}
          </div>

          {pastLoading ? (
            <p style={{color:"#94a3b8",fontSize:13,textAlign:"center",padding:"12px 0"}}>Loading history...</p>
          ) : pendingEntries.length === 0 ? (
            <div style={{textAlign:"center",padding:"16px 0",color:"#94a3b8",fontSize:13}}>
              <div style={{fontSize:28,marginBottom:6}}>✅</div>
              {pastEntries.length === 0 ? "New customer — no past entries" : "All deliveries completed!"}
            </div>
          ) : (
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {pendingEntries.map(e => {
                const sc = statusConfig[e.delivery_status];
                const isUpdating = updatingId === e.id;
                return (
                  <div key={e.id} style={{background: e.delivery_status==="in_delivery"?"#eff6ff":"#fffbeb", borderRadius:12, padding:"12px 14px", border:`1px solid ${e.delivery_status==="in_delivery"?"#bfdbfe":"#fde68a"}`}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10}}>
                      <div style={{flex:1}}>
                        {/* Date + status */}
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                          <span style={{fontSize:12,fontWeight:700,color: e.delivery_status==="in_delivery"?"#1d4ed8":"#92400e"}}>
                            {new Date(e.entry_date).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}
                          </span>
                          <span style={{display:"flex",alignItems:"center",gap:3,fontSize:11,fontWeight:600,color:sc.color,background:sc.bg,border:`1px solid ${sc.border}`,borderRadius:20,padding:"2px 8px"}}>
                            {sc.icon} {sc.label}
                          </span>
                        </div>
                        {/* Items */}
                        <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:8}}>
                          {e.items?.map((item,idx)=>(
                            <span key={idx} style={{background:"#fff",border:`1px solid ${e.delivery_status==="in_delivery"?"#bfdbfe":"#fde68a"}`,borderRadius:12,padding:"3px 10px",fontSize:12,fontWeight:600,color:e.delivery_status==="in_delivery"?"#1d4ed8":"#92400e"}}>
                              {item.service_name} ×{item.quantity}
                            </span>
                          ))}
                        </div>
                        {/* Amount */}
                        <div style={{fontWeight:800,color:"#0f172a",fontSize:15}}>₹{Number(e.total_amount).toLocaleString("en-IN")}</div>
                      </div>
                      {/* Deliver button */}
                      <button
                        onClick={() => markDelivered(e.id)}
                        disabled={isUpdating}
                        style={{
                          display:"flex",alignItems:"center",gap:6,padding:"8px 14px",
                          background: isUpdating ? "#e2e8f0" : "linear-gradient(135deg,#059669,#10b981)",
                          color: isUpdating ? "#94a3b8" : "#fff",
                          border:"none",borderRadius:10,fontSize:12,fontWeight:700,
                          cursor: isUpdating ? "not-allowed" : "pointer",
                          whiteSpace:"nowrap",flexShrink:0,
                          boxShadow: isUpdating ? "none" : "0 2px 8px rgba(16,185,129,0.35)"
                        }}
                      >
                        <CheckCircle2 size={14}/>
                        {isUpdating ? "..." : "Mark Delivered"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Select Services ── */}
      <div style={{background:"#fff",borderRadius:14,padding:"18px 20px",marginBottom:14,boxShadow:"0 2px 8px rgba(0,0,0,0.06)",border:"1px solid #f1f5f9"}}>
        <div style={{fontWeight:700,fontSize:13,color:"#475569",marginBottom:14,textTransform:"uppercase",letterSpacing:"0.05em"}}>🧺 Select Services</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:12}}>
          {topServices.map((svc,idx)=>{
            const color=COLORS[idx%COLORS.length];
            const children = svc.children || [];
            if(children.length === 0) return (
              <button key={svc.id} className="svc-btn" onClick={()=>addItem(svc)}
                style={{padding:"14px 12px",background:color.bg,color:color.text,border:`2px solid ${color.border}`,borderRadius:14,cursor:"pointer",fontSize:14,fontWeight:700,transition:"all 0.15s",textAlign:"center",width:"100%"}}>
                + {svc.name}
              </button>
            );
            return (
              <div key={svc.id} style={{background:color.bg,border:`2px solid ${color.border}`,borderRadius:14,overflow:"hidden",display:"flex",flexDirection:"column"}}>
                <div style={{padding:"10px 12px 6px",fontWeight:700,fontSize:13,color:color.text,borderBottom:`1px solid ${color.border}`}}>
                  {svc.name}
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:4,padding:"8px 10px 10px"}}>
                  {children.map(child=>(
                    <button key={child.id} className="svc-btn" onClick={()=>addItem(child)}
                      style={{padding:"7px 10px",background:"#fff",color:color.text,border:`1.5px solid ${color.border}`,borderRadius:10,cursor:"pointer",fontSize:12,fontWeight:600,display:"flex",justifyContent:"space-between",alignItems:"center",width:"100%",transition:"all 0.15s"}}>
                      <span>+ {child.name}</span>
                      <span style={{opacity:0.7,fontSize:11}}>₹{child.price}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Items ── */}
      {items.length>0&&(
        <div style={{background:"#fff",borderRadius:14,padding:"18px 20px",marginBottom:14,boxShadow:"0 2px 8px rgba(0,0,0,0.06)",border:"1px solid #f1f5f9"}}>
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
                    <input type="number" style={{width:60,border:"none",outline:"none",fontSize:16,fontWeight:600,textAlign:"right"}} value={item.quantity} min={1} onChange={e=>updateItem(item.id,"quantity",e.target.value)}/>
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

      {/* ── Notes ── */}
      <div style={{background:"#fff",borderRadius:14,padding:"18px 20px",marginBottom:14,boxShadow:"0 2px 8px rgba(0,0,0,0.06)",border:"1px solid #f1f5f9"}}>
        <div style={{fontWeight:700,fontSize:13,color:"#475569",marginBottom:10,textTransform:"uppercase",letterSpacing:"0.05em"}}>📝 Notes (optional)</div>
        <textarea style={{width:"100%",padding:"10px 12px",border:"1px solid #e2e8f0",borderRadius:8,fontSize:14,outline:"none",resize:"vertical",boxSizing:"border-box",fontFamily:"inherit"}} placeholder="Any special instructions..." value={notes} onChange={e=>setNotes(e.target.value)} rows={2}/>
      </div>

      <button
        style={{width:"100%",padding:"15px",background:!selectedCustomer||items.length===0?"#cbd5e1":"linear-gradient(135deg,#1e40af,#3b82f6)",color:"#fff",border:"none",borderRadius:12,fontSize:16,fontWeight:700,cursor:!selectedCustomer||items.length===0?"not-allowed":"pointer",boxShadow:!selectedCustomer||items.length===0?"none":"0 4px 16px rgba(59,130,246,0.35)"}}
        onClick={save}
        disabled={!selectedCustomer||items.length===0||saving}
      >
        {saving ? "Saving..." : "💾 Save Entry"}
      </button>
    </ProtectedLayout>
  );
}
