"use client";
import { useState, useEffect } from "react";
import { Calendar, Filter, Trash2, ChevronDown, ChevronUp, Pencil, X, Plus, FileText, Search } from "lucide-react";
import api from "@/lib/api";
import ProtectedLayout from "@/components/ProtectedLayout";
import type { LaundryEntry, Service } from "@/types";

interface EditItem { localId:string; service_id:string; service_name:string; price_per_unit:number; quantity:number; item_status:string; }
const COLORS=[{bg:"#eff6ff",border:"#bfdbfe",text:"#1e40af"},{bg:"#f0fdf4",border:"#bbf7d0",text:"#166534"},{bg:"#fdf4ff",border:"#e9d5ff",text:"#7e22ce"},{bg:"#fff7ed",border:"#fed7aa",text:"#9a3412"},{bg:"#f0fdfa",border:"#99f6e4",text:"#134e4a"},{bg:"#fefce8",border:"#fef08a",text:"#854d0e"}];
const WA_ICON = <svg width="13" height="13" viewBox="0 0 24 24" fill="#16a34a"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>;
const openWA = (phone: string) => {
  const a = document.createElement("a");
  a.href = `whatsapp://send?phone=91${phone.replace(/\D/g,"").slice(-10)}`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
};

export default function Entries() {
  const [entries,          setEntries]          = useState<LaundryEntry[]>([]);
  const [filterType,       setFilterType]       = useState<"date"|"month">("month");
  const [dateVal,          setDateVal]          = useState(new Date().toISOString().slice(0,10));
  const [monthVal,         setMonthVal]         = useState(()=>{ const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; });
  const [expandedCustomer, setExpandedCustomer] = useState<string|null>(null);
  const [expandedDate,     setExpandedDate]     = useState<string|null>(null);
  const [loading,          setLoading]          = useState(false);
  const [loadError,        setLoadError]        = useState("");
  const [search,           setSearch]           = useState("");
  const [services,         setServices]         = useState<Service[]>([]);
  const [editEntry,        setEditEntry]        = useState<LaundryEntry|null>(null);
  const [editItems,        setEditItems]        = useState<EditItem[]>([]);
  const [editNotes,        setEditNotes]        = useState("");
  const [editSaving,       setEditSaving]       = useState(false);
  const [emailEntry,       setEmailEntry]       = useState<{cid:string;name:string;email:string;dateStr:string}|null>(null);
  const [emailSending,     setEmailSending]     = useState(false);
  const [emailMsg,         setEmailMsg]         = useState("");

  const load = async () => {
    setLoading(true); setLoadError("");
    try {
      const params:any={};
      if(filterType==="date") params.entry_date=dateVal;
      else { const [y,m]=monthVal.split("-"); params.year=parseInt(y); params.month=parseInt(m); }
      const res=await api.get("/entries",{params}); setEntries(res.data);
    } catch(e:any) { setLoadError(e?.response?.data?.detail||"Failed to load entries."); }
    finally { setLoading(false); }
  };

  useEffect(()=>{ load(); },[filterType,dateVal,monthVal]);
  useEffect(()=>{ api.get("/services").then(r=>setServices(r.data)).catch(()=>{}); },[]);

  const del = async (id:string) => { if(!confirm("Delete?"))return; await api.delete(`/entries/${id}`); load(); };

  const openEdit = (entry:LaundryEntry) => {
    setEditEntry(entry); setEditNotes(entry.notes||"");
    setEditItems(entry.items.map(i=>({ localId:i.id, service_id:(i as any).service_id||"", service_name:i.service_name, price_per_unit:Number(i.price_per_unit), quantity:i.quantity, item_status:i.item_status||"pending" })));
  };
  const addEditItem   = (svc:Service) => setEditItems(prev=>[...prev,{ localId:Math.random().toString(), service_id:svc.id, service_name:svc.name, price_per_unit:Number(svc.price)||0, quantity:1, item_status:"pending" }]);
  const updateEditItem = (id:string, f:keyof EditItem, v:string|number) => setEditItems(prev=>prev.map(i=>i.localId===id?{...i,[f]:v}:i));
  const removeEditItem = (id:string) => setEditItems(prev=>prev.filter(i=>i.localId!==id));
  const saveEdit = async () => {
    if(!editEntry||editItems.length===0) return;
    setEditSaving(true);
    try {
      await api.put(`/entries/${editEntry.id}`,{ notes:editNotes, items:editItems.map(i=>({ service_id:i.service_id, service_name:i.service_name, price_per_unit:Number(i.price_per_unit), quantity:Number(i.quantity), item_status:i.item_status })) });
      setEditEntry(null); load();
    } finally { setEditSaving(false); }
  };

  const sendEntryInvoice = async () => {
    if(!emailEntry) return;
    setEmailSending(true); setEmailMsg("");
    try { const [y,m]=emailEntry.dateStr.split("-"); await api.post(`/invoices/${emailEntry.cid}/email`,null,{params:{month:parseInt(m),year:parseInt(y)}}); setEmailMsg("✅ Sent!"); }
    catch(e:any){ setEmailMsg(`❌ ${e.response?.data?.detail||"Failed"}`); }
    finally { setEmailSending(false); }
  };

  const customerMap = new Map<string,{name:string;phone:string;flat:string;society:string;entries:LaundryEntry[]}>();
  entries.forEach(e=>{ if(!customerMap.has(e.customer_id)) customerMap.set(e.customer_id,{name:e.customer?.name||"Unknown",phone:e.customer?.phone||"",flat:e.customer?.flat_number||"",society:e.customer?.society_name||"",entries:[]}); customerMap.get(e.customer_id)!.entries.push(e); });

  const filteredCustomers = Array.from(customerMap.entries()).filter(([,c])=>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search) || c.flat.toLowerCase().includes(search.toLowerCase())
  );

  const editTotal   = editItems.reduce((s,i)=>s+Number(i.price_per_unit)*Number(i.quantity),0);
  const monthLabel  = filterType==="month" ? new Date(monthVal+"-01").toLocaleString("en-IN",{month:"long",year:"numeric"}) : new Date(dateVal).toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"});

  const AVATAR_COLORS = ["#1e40af","#059669","#7c3aed","#d97706","#dc2626","#0891b2","#be185d","#0f766e"];

  return (
    <ProtectedLayout>
      <style>{`
        .cust-card:hover { box-shadow: 0 6px 24px rgba(0,0,0,0.12) !important; }
        .date-row:hover { background: #f0f9ff !important; }
        .item-row:hover { background: #f8fafc !important; }
      `}</style>

      {/* ── Header ── */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18,flexWrap:"wrap",gap:10}}>
        <div>
          <h2 style={{color:"#0f172a",margin:"0 0 2px",fontSize:22,fontWeight:800}}>Entries</h2>
          <p style={{color:"#94a3b8",fontSize:12,margin:0}}>{monthLabel}</p>
        </div>
        {/* Filter bar */}
        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
          <div style={{display:"flex",background:"#f1f5f9",borderRadius:10,padding:3,gap:2}}>
            {(["date","month"] as const).map(t=>(
              <button key={t} onClick={()=>setFilterType(t)}
                style={{display:"flex",alignItems:"center",gap:4,padding:"7px 14px",borderRadius:8,border:"none",cursor:"pointer",fontSize:12,fontWeight:700,
                  background:filterType===t?"#1e40af":"transparent",color:filterType===t?"#fff":"#64748b",
                  boxShadow:filterType===t?"0 2px 6px rgba(30,64,175,0.3)":"none"}}>
                {t==="date"?<><Calendar size={12}/>Date</>:<><Filter size={12}/>Month</>}
              </button>
            ))}
          </div>
          {filterType==="date"
            ? <input type="date" value={dateVal} onChange={e=>setDateVal(e.target.value)} style={{padding:"8px 12px",border:"1.5px solid #e2e8f0",borderRadius:10,fontSize:13,outline:"none",background:"#fff"}}/>
            : <input type="month" value={monthVal} onChange={e=>setMonthVal(e.target.value)} style={{padding:"8px 12px",border:"1.5px solid #e2e8f0",borderRadius:10,fontSize:13,outline:"none",background:"#fff"}}/>
          }
        </div>
      </div>

      {/* ── Search ── */}
      <div style={{display:"flex",alignItems:"center",gap:8,background:"#fff",border:"1.5px solid #e2e8f0",borderRadius:10,padding:"9px 14px",marginBottom:14}}>
        <Search size={14} color="#94a3b8"/>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name, phone or flat..."
          style={{flex:1,border:"none",outline:"none",fontSize:13,background:"transparent",color:"#1e293b"}}/>
        {search&&<button onClick={()=>setSearch("")} style={{background:"none",border:"none",cursor:"pointer",color:"#94a3b8",fontSize:16}}>×</button>}
      </div>

      {loading&&<div style={{textAlign:"center",padding:32,color:"#94a3b8"}}>Loading...</div>}
      {loadError&&(
        <div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:10,padding:"12px 16px",marginBottom:12,display:"flex",alignItems:"center",gap:10}}>
          <span>⚠️</span>
          <div style={{flex:1}}><div style={{fontWeight:700,fontSize:13,color:"#dc2626"}}>Database waking up</div><div style={{fontSize:12,color:"#ef4444"}}>{loadError}</div></div>
          <button onClick={load} style={{padding:"6px 14px",background:"#dc2626",color:"#fff",border:"none",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer"}}>Retry</button>
        </div>
      )}

      {/* ── Customer Cards ── */}
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {filteredCustomers.length===0&&!loading&&<div style={{textAlign:"center",padding:40,color:"#94a3b8"}}>No entries found</div>}
        {filteredCustomers.map(([cid,cust],ci)=>{
          const custOpen   = expandedCustomer===cid;
          const custTotal  = cust.entries.reduce((s,e)=>s+Number(e.total_amount),0);
          const allItems   = cust.entries.flatMap(e=>e.items);
          const custAllDel = allItems.length>0&&allItems.every(i=>i.item_status==="delivered");
          const pendingCnt = allItems.filter(i=>i.item_status!=="delivered").length;
          const dateMap    = new Map<string,LaundryEntry[]>();
          cust.entries.forEach(e=>{ if(!dateMap.has(e.entry_date)) dateMap.set(e.entry_date,[]); dateMap.get(e.entry_date)!.push(e); });
          const dates      = [...dateMap.entries()].sort((a,b)=>b[0].localeCompare(a[0]));
          const avatarColor= AVATAR_COLORS[ci%AVATAR_COLORS.length];

          return (
            <div key={cid} className="cust-card" style={{background:"#fff",borderRadius:16,overflow:"hidden",boxShadow:"0 2px 10px rgba(0,0,0,0.07)",border:"1px solid #f1f5f9",transition:"box-shadow 0.2s"}}>
              {/* Customer header */}
              <div style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",cursor:"pointer"}} onClick={()=>{setExpandedCustomer(custOpen?null:cid);setExpandedDate(null);}}>
                {/* Avatar */}
                <div style={{width:46,height:46,borderRadius:13,background:avatarColor,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:19,flexShrink:0}}>
                  {cust.name[0].toUpperCase()}
                </div>
                {/* Info */}
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:15,color:"#1e293b",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{cust.name}</div>
                  <div style={{fontSize:12,color:"#94a3b8",marginTop:2,display:"flex",gap:10,flexWrap:"wrap"}}>
                    {cust.phone&&<span>📞 {cust.phone}</span>}
                    {(cust.flat||cust.society)&&<span>🏠 {cust.flat}{cust.society&&` · ${cust.society}`}</span>}
                  </div>
                </div>
                {/* Right side */}
                <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:5,flexShrink:0}}>
                  <div style={{fontWeight:800,fontSize:18,color:"#0f172a"}}>₹{custTotal.toLocaleString("en-IN")}</div>
                  <div style={{display:"flex",gap:6,alignItems:"center"}}>
                    <span style={{fontSize:11,fontWeight:700,padding:"2px 9px",borderRadius:20,
                      background:custAllDel?"#dcfce7":"#fef3c7",
                      color:custAllDel?"#16a34a":"#d97706"}}>
                      {custAllDel?"✓ Delivered":`${pendingCnt} pending`}
                    </span>
                    <button style={{display:"flex",alignItems:"center",gap:3,padding:"4px 9px",background:"#f0fdf4",color:"#16a34a",border:"1px solid #86efac",borderRadius:8,cursor:"pointer",fontSize:11,fontWeight:600}}
                      onClick={e=>{e.stopPropagation();if(cust.phone)openWA(cust.phone);}} title="Open WhatsApp">
                      {WA_ICON}
                    </button>
                    <button style={{display:"flex",alignItems:"center",gap:3,padding:"4px 9px",background:"#f8fafc",color:"#1e40af",border:"1px solid #e2e8f0",borderRadius:8,cursor:"pointer",fontSize:11,fontWeight:600}}
                      onClick={e=>{e.stopPropagation();const now=new Date();window.open(`/api/invoices/${cid}?month=${now.getMonth()+1}&year=${now.getFullYear()}&token=${localStorage.getItem("token")}`,"_blank");}}>
                      <FileText size={11}/>Invoice
                    </button>
                  </div>
                  {custOpen?<ChevronUp size={15} color="#cbd5e1"/>:<ChevronDown size={15} color="#cbd5e1"/>}
                </div>
              </div>

              {/* Date rows */}
              {custOpen&&(
                <div style={{borderTop:"1px solid #f1f5f9"}}>
                  {dates.map(([dateStr,dateEntries])=>{
                    const dateKey      = `${cid}-${dateStr}`;
                    const dateOpen     = expandedDate===dateKey;
                    const dateTotal    = dateEntries.reduce((s,e)=>s+Number(e.total_amount),0);
                    const allDateItems = dateEntries.flatMap(e=>e.items);
                    const dateAllDel   = allDateItems.length>0&&allDateItems.every(i=>i.item_status==="delivered");
                    const datePending  = allDateItems.filter(i=>i.item_status!=="delivered").length;

                    return (
                      <div key={dateStr}>
                        <div className="date-row" style={{display:"flex",alignItems:"center",padding:"10px 16px",cursor:"pointer",background:"#fafafa",transition:"background 0.1s"}} onClick={()=>setExpandedDate(dateOpen?null:dateKey)}>
                          {/* Date info */}
                          <div style={{flex:1}}>
                            <div style={{fontWeight:600,fontSize:13,color:"#334155"}}>
                              {new Date(dateStr+"T00:00:00").toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short"})}
                            </div>
                            <div style={{fontSize:11,color:"#94a3b8",marginTop:1}}>{allDateItems.length} items</div>
                          </div>
                          {/* Actions */}
                          <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
                            <span style={{fontWeight:700,fontSize:14,color:"#1e40af"}}>₹{dateTotal}</span>
                            <span style={{fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:20,
                              background:dateAllDel?"#dcfce7":"#fef3c7",
                              color:dateAllDel?"#16a34a":"#d97706"}}>
                              {dateAllDel?"Done":`${datePending} left`}
                            </span>
                            <button style={{padding:"3px 8px",background:"#f8fafc",color:"#64748b",border:"1px solid #e2e8f0",borderRadius:7,cursor:"pointer",fontSize:11}} onClick={e=>{e.stopPropagation();const [y,m]=dateStr.split("-");window.open(`/api/invoices/${cid}?month=${m}&year=${y}&entry_date=${dateStr}&token=${localStorage.getItem("token")}`,"_blank");}}>📄</button>
                            <button style={{display:"flex",alignItems:"center",gap:3,padding:"3px 8px",background:"#eff6ff",color:"#1e40af",border:"1px solid #bfdbfe",borderRadius:7,cursor:"pointer",fontSize:11,fontWeight:600}}
                              onClick={e=>{e.stopPropagation();openEdit(dateEntries[0]);}}>
                              <Pencil size={10}/>Edit
                            </button>
                            <button onClick={e=>{e.stopPropagation();dateEntries.forEach(en=>del(en.id));}} style={{background:"none",border:"none",cursor:"pointer",padding:4,display:"flex",alignItems:"center"}}>
                              <Trash2 size={13} color="#f87171"/>
                            </button>
                            {dateOpen?<ChevronUp size={13} color="#cbd5e1"/>:<ChevronDown size={13} color="#cbd5e1"/>}
                          </div>
                        </div>

                        {/* Items */}
                        {dateOpen&&(
                          <div style={{padding:"8px 12px 12px 12px",background:"#f8fafc",borderTop:"1px solid #f1f5f9"}}>
                            {dateEntries.map(entry=>(
                              <div key={entry.id}>
                                {entry.notes&&<div style={{fontSize:12,color:"#64748b",padding:"4px 4px 8px",display:"flex",alignItems:"center",gap:4}}>📝 <span>{entry.notes}</span></div>}
                                <div style={{display:"flex",flexDirection:"column",gap:5}}>
                                  {entry.items.map(item=>{
                                    const isDel=item.item_status==="delivered";
                                    return (
                                      <div key={item.id} className="item-row" style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:10,background:isDel?"#f0fdf4":"#fff",border:`1px solid ${isDel?"#bbf7d0":"#e8ecf0"}`,transition:"background 0.1s"}}>
                                        <div style={{width:8,height:8,borderRadius:"50%",background:isDel?"#22c55e":"#fbbf24",flexShrink:0}}/>
                                        <div style={{flex:1}}>
                                          <span style={{fontWeight:600,fontSize:13,color:"#1e293b"}}>{item.service_name}</span>
                                          <span style={{fontSize:11,color:"#94a3b8",marginLeft:6}}>×{item.quantity} · ₹{item.price_per_unit}</span>
                                        </div>
                                        <span style={{fontWeight:700,fontSize:13,color:"#1e40af"}}>₹{item.subtotal}</span>
                                        <select value={item.item_status||"pending"} onChange={async e=>{await api.patch(`/entries/${entry.id}/items/${item.id}/status`,null,{params:{status:e.target.value}});load();}}
                                          style={{padding:"3px 7px",borderRadius:20,fontSize:11,fontWeight:700,outline:"none",cursor:"pointer",border:"none",
                                            background:isDel?"#dcfce7":"#fef3c7",color:isDel?"#16a34a":"#d97706"}}>
                                          <option value="pending">Pending</option>
                                          <option value="delivered">Delivered</option>
                                        </select>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Edit Modal ── */}
      {editEntry&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:300}} onClick={()=>setEditEntry(null)}>
          <div style={{background:"#fff",borderRadius:"20px 20px 0 0",width:"100%",maxWidth:600,maxHeight:"90vh",display:"flex",flexDirection:"column",overflow:"hidden"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"18px 20px",borderBottom:"1px solid #f1f5f9",flexShrink:0}}>
              <div>
                <div style={{fontWeight:800,fontSize:16,color:"#1e293b"}}>✏️ Edit Entry</div>
                <div style={{fontSize:12,color:"#94a3b8",marginTop:2}}>{new Date(editEntry.entry_date+"T00:00:00").toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</div>
              </div>
              <button onClick={()=>setEditEntry(null)} style={{background:"#f1f5f9",border:"none",borderRadius:"50%",width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><X size={16} color="#64748b"/></button>
            </div>
            <div style={{overflowY:"auto",flex:1,padding:"16px 20px"}}>
              <div style={{marginBottom:16}}>
                <div style={{fontWeight:700,fontSize:12,color:"#64748b",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:10}}>Add Service</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:8}}>
                  {services.map((svc,idx)=>{
                    const color=COLORS[idx%COLORS.length];
                    const children=svc.children||[];
                    if(children.length===0) return (
                      <button key={svc.id} onClick={()=>addEditItem(svc)} style={{padding:"10px",background:color.bg,color:color.text,border:`2px solid ${color.border}`,borderRadius:12,cursor:"pointer",fontSize:12,fontWeight:700,display:"flex",alignItems:"center",gap:4,justifyContent:"center"}}>
                        <Plus size={12}/>{svc.name}
                      </button>
                    );
                    return (
                      <div key={svc.id} style={{background:color.bg,border:`2px solid ${color.border}`,borderRadius:12,overflow:"hidden"}}>
                        <div style={{padding:"6px 10px",fontWeight:700,fontSize:11,color:color.text,borderBottom:`1px solid ${color.border}`}}>{svc.name}</div>
                        <div style={{display:"flex",flexDirection:"column",gap:3,padding:"6px 8px"}}>
                          {children.map(child=>(
                            <button key={child.id} onClick={()=>addEditItem(child)} style={{padding:"5px 8px",background:"#fff",color:color.text,border:`1px solid ${color.border}`,borderRadius:8,cursor:"pointer",fontSize:11,fontWeight:600,display:"flex",justifyContent:"space-between"}}>
                              <span><Plus size={10}/> {child.name}</span><span style={{opacity:0.7}}>₹{child.price}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div style={{marginBottom:14}}>
                <div style={{fontWeight:700,fontSize:12,color:"#64748b",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:10}}>Items ({editItems.length})</div>
                {editItems.length===0&&<div style={{textAlign:"center",padding:"20px 0",color:"#94a3b8",fontSize:13}}>No items — add from above</div>}
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {editItems.map(item=>(
                    <div key={item.localId} style={{background:"#f8fafc",borderRadius:10,padding:"10px 12px",border:"1px solid #e2e8f0"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                        <span style={{fontWeight:700,fontSize:13,color:"#1e40af",background:"#eff6ff",padding:"2px 8px",borderRadius:10}}>{item.service_name}</span>
                        <button onClick={()=>removeEditItem(item.localId)} style={{background:"none",border:"none",cursor:"pointer",display:"flex"}}><X size={14} color="#ef4444"/></button>
                      </div>
                      <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                        <div style={{display:"flex",alignItems:"center",gap:4,background:"#fff",border:"1px solid #e2e8f0",borderRadius:8,padding:"4px 8px"}}>
                          <span style={{fontSize:11,color:"#94a3b8",fontWeight:600}}>Qty</span>
                          <input type="number" min={1} value={item.quantity} onChange={e=>updateEditItem(item.localId,"quantity",e.target.value)} style={{width:48,border:"none",outline:"none",fontSize:14,fontWeight:600,textAlign:"right"}}/>
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:4,background:"#fff",border:"1px solid #e2e8f0",borderRadius:8,padding:"4px 8px"}}>
                          <span style={{fontSize:11,color:"#94a3b8",fontWeight:600}}>₹</span>
                          <input type="number" min={0} value={item.price_per_unit} onChange={e=>updateEditItem(item.localId,"price_per_unit",e.target.value)} style={{width:56,border:"none",outline:"none",fontSize:14,fontWeight:600,textAlign:"right"}}/>
                        </div>
                        <span style={{fontWeight:800,fontSize:14,color:"#059669"}}>= ₹{(Number(item.price_per_unit)*Number(item.quantity)).toFixed(0)}</span>
                        <select value={item.item_status} onChange={e=>updateEditItem(item.localId,"item_status",e.target.value)} style={{marginLeft:"auto",padding:"4px 6px",borderRadius:8,fontSize:11,fontWeight:600,outline:"none",cursor:"pointer",border:"1px solid #e2e8f0",background:item.item_status==="delivered"?"#dcfce7":"#fef3c7",color:item.item_status==="delivered"?"#16a34a":"#d97706"}}>
                          <option value="pending">Pending</option>
                          <option value="delivered">Delivered</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{marginBottom:14}}>
                <div style={{fontWeight:700,fontSize:12,color:"#64748b",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:8}}>Notes</div>
                <textarea value={editNotes} onChange={e=>setEditNotes(e.target.value)} rows={2} placeholder="Any special instructions..." style={{width:"100%",padding:"10px 12px",border:"1px solid #e2e8f0",borderRadius:8,fontSize:13,outline:"none",resize:"vertical",boxSizing:"border-box",fontFamily:"inherit"}}/>
              </div>
            </div>
            <div style={{padding:"14px 20px",borderTop:"1px solid #f1f5f9",display:"flex",alignItems:"center",gap:12,flexShrink:0,background:"#fff"}}>
              <div style={{flex:1}}><span style={{fontSize:12,color:"#64748b"}}>Total: </span><span style={{fontWeight:800,fontSize:18,color:"#1e40af"}}>₹{editTotal.toFixed(0)}</span></div>
              <button onClick={()=>setEditEntry(null)} style={{padding:"10px 20px",background:"#f1f5f9",color:"#64748b",border:"none",borderRadius:10,fontSize:14,fontWeight:600,cursor:"pointer"}}>Cancel</button>
              <button onClick={saveEdit} disabled={editSaving||editItems.length===0} style={{padding:"10px 24px",background:editItems.length===0?"#cbd5e1":"linear-gradient(135deg,#1e40af,#3b82f6)",color:"#fff",border:"none",borderRadius:10,fontSize:14,fontWeight:700,cursor:editItems.length===0?"not-allowed":"pointer"}}>
                {editSaving?"Saving...":"💾 Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Email Modal ── */}
      {emailEntry&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:16}} onClick={()=>setEmailEntry(null)}>
          <div style={{background:"#fff",borderRadius:12,padding:24,width:"100%",maxWidth:400}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><h3 style={{margin:0}}>Send Invoice</h3><span style={{cursor:"pointer",fontSize:18}} onClick={()=>setEmailEntry(null)}>✕</span></div>
            <p style={{color:"#64748b",fontSize:14,margin:"0 0 16px"}}>Send to <strong>{emailEntry.name}</strong> at <strong>{emailEntry.email}</strong></p>
            {emailMsg&&<div style={{padding:"10px 14px",borderRadius:8,marginBottom:12,fontSize:13,background:emailMsg.startsWith("✅")?"#f0fdf4":"#fef2f2",color:emailMsg.startsWith("✅")?"#16a34a":"#dc2626"}}>{emailMsg}</div>}
            <button style={{width:"100%",padding:12,background:"#10b981",color:"#fff",border:"none",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer"}} onClick={sendEntryInvoice} disabled={emailSending}>{emailSending?"Sending...":"📧 Send Invoice"}</button>
          </div>
        </div>
      )}
    </ProtectedLayout>
  );
}
