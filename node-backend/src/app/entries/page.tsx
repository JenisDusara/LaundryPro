"use client";
import { useState, useEffect } from "react";
import { Calendar, Filter, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import api from "@/lib/api";
import ProtectedLayout from "@/components/ProtectedLayout";
import type { LaundryEntry } from "@/types";

const STATUS_COLORS: Record<string,{bg:string;color:string}> = { pending:{bg:"#fef3c7",color:"#d97706"}, delivered:{bg:"#dcfce7",color:"#16a34a"} };

export default function Entries() {
  const [entries, setEntries] = useState<LaundryEntry[]>([]);
  const [filterType, setFilterType] = useState<"date"|"month">("month");
  const [dateVal, setDateVal] = useState(new Date().toISOString().slice(0,10));
  const [monthVal, setMonthVal] = useState(()=>{ const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; });
  const [expandedCustomer, setExpandedCustomer] = useState<string|null>(null);
  const [expandedDate, setExpandedDate] = useState<string|null>(null);
  const [loading, setLoading] = useState(false);
  const [emailEntry, setEmailEntry] = useState<{cid:string;name:string;email:string;dateStr:string}|null>(null);
  const [emailSending, setEmailSending] = useState(false);
  const [emailMsg, setEmailMsg] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const params: any={};
      if(filterType==="date") params.entry_date=dateVal;
      else { const [y,m]=monthVal.split("-"); params.year=parseInt(y); params.month=parseInt(m); }
      const res=await api.get("/entries",{params}); setEntries(res.data);
    } finally { setLoading(false); }
  };

  useEffect(()=>{load();},[filterType,dateVal,monthVal]);

  const del = async (id:string) => { if(!confirm("Delete?"))return; await api.delete(`/entries/${id}`); load(); };

  const sendEntryInvoice = async () => {
    if(!emailEntry)return;
    setEmailSending(true); setEmailMsg("");
    try { const [y,m]=emailEntry.dateStr.split("-"); await api.post(`/invoices/${emailEntry.cid}/email`,null,{params:{month:parseInt(m),year:parseInt(y)}}); setEmailMsg("✅ Sent!"); }
    catch(e:any){ setEmailMsg(`❌ ${e.response?.data?.detail||"Failed"}`); }
    finally { setEmailSending(false); }
  };

  const customerMap = new Map<string,{name:string;phone:string;flat:string;society:string;entries:LaundryEntry[]}>();
  entries.forEach(e=>{ if(!customerMap.has(e.customer_id)) customerMap.set(e.customer_id,{name:e.customer?.name||"Unknown",phone:e.customer?.phone||"",flat:e.customer?.flat_number||"",society:e.customer?.society_name||"",entries:[]}); customerMap.get(e.customer_id)!.entries.push(e); });
  const customers=Array.from(customerMap.entries());
  const totalAmount=entries.reduce((s,e)=>s+Number(e.total_amount),0);

  return (
    <ProtectedLayout>
      <h2 style={{color:"#1e3a8a",margin:"0 0 16px",fontSize:22,fontWeight:800}}>Entries</h2>
      <div style={{display:"flex",gap:12,marginBottom:12,flexWrap:"wrap",alignItems:"center"}}>
        <div style={{display:"flex",background:"#fff",borderRadius:8,border:"1px solid #e2e8f0",overflow:"hidden"}}>
          {(["date","month"] as const).map(t=><div key={t} onClick={()=>setFilterType(t)} style={{display:"flex",alignItems:"center",gap:4,padding:"8px 14px",cursor:"pointer",fontSize:13,background:filterType===t?"#1e40af":"transparent",color:filterType===t?"#fff":"#64748b"}}>{t==="date"?<><Calendar size={14}/>Date</>:<><Filter size={14}/>Month</>}</div>)}
        </div>
        {filterType==="date"?<input type="date" style={{padding:"8px 12px",border:"1px solid #e2e8f0",borderRadius:8,fontSize:14,outline:"none"}} value={dateVal} onChange={e=>setDateVal(e.target.value)}/>:<input type="month" style={{padding:"8px 12px",border:"1px solid #e2e8f0",borderRadius:8,fontSize:14,outline:"none"}} value={monthVal} onChange={e=>setMonthVal(e.target.value)}/>}
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",background:"#fff",borderRadius:10,marginBottom:12,fontSize:14,color:"#475569",boxShadow:"0 1px 4px rgba(0,0,0,0.05)"}}>
        <span>{customers.length} customers • {entries.length} entries</span>
        <span style={{fontWeight:700,color:"#1e3a8a",fontSize:16}}>Total: ₹{totalAmount}</span>
      </div>
      {loading&&<p style={{textAlign:"center",color:"#94a3b8"}}>Loading...</p>}
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {customers.length===0&&!loading&&<p style={{textAlign:"center",color:"#94a3b8",padding:32}}>No entries found</p>}
        {customers.map(([cid,cust])=>{
          const custOpen=expandedCustomer===cid;
          const custTotal=cust.entries.reduce((s,e)=>s+Number(e.total_amount),0);
          const allItems=cust.entries.flatMap(e=>e.items);
          const custAllDel=allItems.length>0&&allItems.every(i=>i.item_status==="delivered");
          const dateMap=new Map<string,LaundryEntry[]>();
          cust.entries.forEach(e=>{ if(!dateMap.has(e.entry_date)) dateMap.set(e.entry_date,[]); dateMap.get(e.entry_date)!.push(e); });
          const dates=[...dateMap.entries()].sort((a,b)=>b[0].localeCompare(a[0]));
          return (
            <div key={cid} style={{background:"#fff",borderRadius:14,overflow:"hidden",boxShadow:"0 2px 10px rgba(0,0,0,0.07)"}}>
              <div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",cursor:"pointer",borderBottom:"1px solid #f1f5f9"}} onClick={()=>{setExpandedCustomer(custOpen?null:cid);setExpandedDate(null);}}>
                <div style={{width:44,height:44,borderRadius:"50%",background:"linear-gradient(135deg,#1e40af,#3b82f6)",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:18,flexShrink:0}}>{cust.name[0].toUpperCase()}</div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:15,color:"#1e293b"}}>{cust.name}</div>
                  {(cust.flat||cust.society)&&<div style={{fontSize:12,color:"#64748b",marginTop:2}}>🏠 {cust.flat}{cust.society&&` • ${cust.society}`}</div>}
                  <div style={{fontSize:12,color:"#64748b",marginTop:2}}>📞 {cust.phone}</div>
                </div>
                <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4,flexShrink:0}}>
                  <div style={{fontWeight:800,fontSize:17,color:"#1e3a8a"}}>₹{custTotal}</div>
                  <div style={{padding:"2px 8px",borderRadius:12,fontSize:11,fontWeight:700,background:custAllDel?"#dcfce7":"#fef3c7",color:custAllDel?"#16a34a":"#d97706"}}>{custAllDel?"All Delivered":"Pending"}</div>
                  <button style={{padding:"4px 8px",background:"#eff6ff",color:"#1e40af",border:"1px solid #bfdbfe",borderRadius:6,cursor:"pointer",fontSize:12,fontWeight:600}} onClick={e=>{e.stopPropagation();const now=new Date();window.open(`/api/invoices/${cid}?month=${now.getMonth()+1}&year=${now.getFullYear()}&token=${localStorage.getItem("token")}`,"_blank");}}>📄 Invoice</button>
                  {custOpen?<ChevronUp size={16} color="#94a3b8"/>:<ChevronDown size={16} color="#94a3b8"/>}
                </div>
              </div>
              {custOpen&&(
                <div>
                  {dates.map(([dateStr,dateEntries])=>{
                    const dateKey=`${cid}-${dateStr}`;
                    const dateOpen=expandedDate===dateKey;
                    const dateTotal=dateEntries.reduce((s,e)=>s+Number(e.total_amount),0);
                    const allDateItems=dateEntries.flatMap(e=>e.items);
                    const dateAllDel=allDateItems.length>0&&allDateItems.every(i=>i.item_status==="delivered");
                    return (
                      <div key={dateStr} style={{borderTop:"1px solid #f1f5f9"}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",cursor:"pointer",background:"#fafafa"}} onClick={()=>setExpandedDate(dateOpen?null:dateKey)}>
                          <div>
                            <div style={{fontWeight:600,fontSize:13,color:"#334155"}}>📅 {new Date(dateStr+"T00:00:00").toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</div>
                            <div style={{fontSize:12,color:"#94a3b8",marginTop:2}}>{allDateItems.length} items</div>
                          </div>
                          <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
                            <span style={{fontWeight:700,fontSize:14,color:"#1e40af"}}>₹{dateTotal}</span>
                            <div style={{padding:"2px 8px",borderRadius:12,fontSize:10,fontWeight:700,background:dateAllDel?"#dcfce7":"#fef3c7",color:dateAllDel?"#16a34a":"#d97706"}}>{dateAllDel?"Delivered":"Pending"}</div>
                            <button style={{padding:"4px 8px",background:"#eff6ff",color:"#1e40af",border:"1px solid #bfdbfe",borderRadius:6,cursor:"pointer",fontSize:12}} onClick={e=>{e.stopPropagation();const [y,m]=dateStr.split("-");window.open(`/api/invoices/${cid}?month=${m}&year=${y}&entry_date=${dateStr}&token=${localStorage.getItem("token")}`,"_blank");}}>📄</button>
                            <button style={{padding:"4px 8px",background:"#f0fdf4",color:"#16a34a",border:"1px solid #bbf7d0",borderRadius:6,cursor:"pointer",fontSize:12}} onClick={e=>{e.stopPropagation();const email=entries.find(en=>en.customer_id===cid)?.customer?.email||"";if(!email){alert("No email");return;}setEmailEntry({cid,name:cust.name,email,dateStr});setEmailMsg("");}}>✉️</button>
                            <Trash2 size={15} color="#ef4444" style={{cursor:"pointer"}} onClick={e=>{e.stopPropagation();dateEntries.forEach(en=>del(en.id));}}/>
                            {dateOpen?<ChevronUp size={14} color="#94a3b8"/>:<ChevronDown size={14} color="#94a3b8"/>}
                          </div>
                        </div>
                        {dateOpen&&(
                          <div style={{padding:"8px 12px 12px",background:"#f8fafc"}}>
                            {dateEntries.map(entry=>(
                              <div key={entry.id}>
                                {entry.notes&&<div style={{fontSize:12,color:"#64748b",padding:"2px 0 6px"}}>📝 {entry.notes}</div>}
                                {entry.items.map(item=>{
                                  const del2=item.item_status==="delivered";
                                  return (
                                    <div key={item.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 10px",marginBottom:6,borderRadius:10,background:del2?"#f0fdf4":"#fff",border:`1px solid ${del2?"#bbf7d0":"#e2e8f0"}`}}>
                                      <div style={{display:"flex",alignItems:"center",gap:8,flex:1}}>
                                        <div style={{width:8,height:8,borderRadius:"50%",background:del2?"#16a34a":"#f59e0b"}}/>
                                        <div>
                                          <div style={{fontWeight:600,fontSize:13,color:"#1e293b"}}>{item.service_name}</div>
                                          <div style={{fontSize:11,color:"#94a3b8"}}>₹{item.price_per_unit} × {item.quantity}</div>
                                        </div>
                                      </div>
                                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                                        <span style={{fontWeight:700,fontSize:13,color:"#1e40af"}}>₹{item.subtotal}</span>
                                        <select style={{padding:"3px 6px",borderRadius:20,fontSize:11,fontWeight:600,outline:"none",cursor:"pointer",border:`1px solid ${del2?"#bbf7d0":"#fde68a"}`,background:del2?"#dcfce7":"#fef3c7",color:del2?"#16a34a":"#d97706"}} value={item.item_status||"pending"} onChange={async e=>{await api.patch(`/entries/${entry.id}/items/${item.id}/status`,null,{params:{status:e.target.value}});load();}}>
                                          <option value="pending">Pending</option>
                                          <option value="delivered">Delivered</option>
                                        </select>
                                      </div>
                                    </div>
                                  );
                                })}
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
