"use client";
import { useState, useEffect, useCallback } from "react";
import { CheckCircle, Clock, RefreshCw, X, Truck, CalendarDays, ChevronRight, ChevronDown } from "lucide-react";
import api from "@/lib/api";
import { isEntryDelivered } from "@/lib/entry-status";
import { todayIST } from "@/lib/dates";
import ProtectedLayout from "@/components/ProtectedLayout";
import type { LaundryEntry } from "@/types";

function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" });
}

export default function Deliveries() {
  const today = todayIST();
  const [allEntries,       setAllEntries]       = useState<LaundryEntry[]>([]);
  const [filter,           setFilter]           = useState("all");
  const [loading,          setLoading]          = useState(true);
  const [expandedCustomer, setExpandedCustomer] = useState<string|null>(null);
  const [selectedDate,     setSelectedDate]     = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const d = new Date();
    const res = await api.get("/entries", { params: { month: d.getMonth()+1, year: d.getFullYear() } });
    setAllEntries(res.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const onVisible = () => { if (document.visibilityState === "visible") load(); };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", load);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", load);
    };
  }, [load]);

  const updateStatus = async (id: string, status: string) => {
    await api.patch(`/entries/${id}/status`, null, { params: { status } });
    load();
  };

  const dateFiltered = selectedDate
    ? allEntries.filter(e => e.entry_date === selectedDate || e.delivery_date === selectedDate)
    : allEntries;

  const entries = filter === "all" ? dateFiltered : dateFiltered.filter(e => e.delivery_status === filter);

  const pendingCount   = dateFiltered.filter(e => e.delivery_status !== "delivered").length;
  const deliveredCount = dateFiltered.filter(e => e.delivery_status === "delivered").length;

  const customerMap = new Map<string,{name:string;phone:string;flat:string;society:string;entries:LaundryEntry[]}>();
  entries.forEach(e => {
    if (!customerMap.has(e.customer_id))
      customerMap.set(e.customer_id, { name:e.customer?.name||"Unknown", phone:e.customer?.phone||"", flat:e.customer?.flat_number||"", society:e.customer?.society_name||"", entries:[] });
    customerMap.get(e.customer_id)!.entries.push(e);
  });
  const customers = Array.from(customerMap.entries());

  return (
    <ProtectedLayout>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .del-card:hover{background:var(--pressed)!important}
      `}</style>

      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
        <div>
          <div style={{fontSize:11,fontWeight:700,color:"var(--text-secondary)",textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:4}}>Fulfilment</div>
          <h2 style={{color:"var(--text-primary)",margin:"0 0 4px",fontSize:26,fontWeight:900,letterSpacing:-0.5}}>Deliveries</h2>
          <p style={{color:"var(--text-muted)",fontSize:13,margin:0}}>
            {selectedDate ? fmtDate(selectedDate) : "This month"} · {pendingCount} pending · {deliveredCount} delivered
          </p>
        </div>
        <button onClick={load} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 18px",border:"1px solid var(--border-hard)",borderRadius:10,background:"var(--bg-card)",color:"var(--text-secondary)",fontSize:13,fontWeight:600,cursor:"pointer"}}>
          <RefreshCw size={14}/> Refresh
        </button>
      </div>

      {/* Filters row */}
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
        {/* Pill tabs */}
        <div style={{display:"flex",gap:6}}>
          {[
            {key:"all",      label:"All"},
            {key:"pending",  label:"Pending",   count:pendingCount},
            {key:"delivered",label:"Delivered", count:deliveredCount},
          ].map(({key,label,count})=>(
            <button key={key} onClick={()=>setFilter(key)}
              style={{display:"flex",alignItems:"center",gap:5,padding:"8px 16px",border:"none",borderRadius:20,cursor:"pointer",fontWeight:700,fontSize:13,transition:"all 0.15s",
                background:filter===key?"#2563eb":"var(--bg-input)",
                color:filter===key?"#fff":"var(--text-secondary)"}}>
              {label}
              {count!=null&&count>0&&(
                <span style={{fontSize:11,fontWeight:800,padding:"1px 7px",borderRadius:10,
                  background:filter===key?"rgba(255,255,255,0.25)":"var(--bg-elevated)",
                  color:filter===key?"#fff":"var(--text-secondary)"}}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Date picker */}
        <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:0,background:"var(--bg-card)",border:"1px solid var(--border-hard)",borderRadius:20,overflow:"hidden"}}>
          <span style={{padding:"7px 10px 7px 14px",display:"flex",alignItems:"center"}}>
            <CalendarDays size={14} color="#2563eb"/>
          </span>
          <input type="date" value={selectedDate}
            onChange={e=>{setSelectedDate(e.target.value);setExpandedCustomer(null);}}
            style={{padding:"7px 10px 7px 0",border:"none",outline:"none",fontSize:13,background:"transparent",color:selectedDate?"var(--text-primary)":"var(--text-muted)",cursor:"pointer",width:120}}/>
          {selectedDate&&(
            <button onClick={()=>setSelectedDate("")}
              style={{padding:"7px 10px",background:"rgba(239,68,68,0.1)",border:"none",borderLeft:"1px solid var(--border-hard)",cursor:"pointer",display:"flex",alignItems:"center"}}>
              <X size={13} color="#ef4444"/>
            </button>
          )}
        </div>
      </div>

      {/* Date summary badges */}
      {selectedDate&&(()=>{
        const pickupCount   = allEntries.filter(e=>e.entry_date===selectedDate).length;
        const deliveryCount = allEntries.filter(e=>e.delivery_date===selectedDate).length;
        return (
          <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
            {pickupCount>0&&<span style={{fontSize:12,fontWeight:600,background:"rgba(37,99,235,0.1)",color:"#3b82f6",padding:"4px 12px",borderRadius:20,border:"1px solid rgba(37,99,235,0.2)"}}>Pickup · {pickupCount}</span>}
            {deliveryCount>0&&<span style={{fontSize:12,fontWeight:600,background:"rgba(109,40,217,0.1)",color:"#8b5cf6",padding:"4px 12px",borderRadius:20,border:"1px solid rgba(109,40,217,0.2)"}}>Delivery · {deliveryCount}</span>}
            {pickupCount===0&&deliveryCount===0&&<span style={{fontSize:12,color:"var(--text-muted)"}}>No entries on {fmtDate(selectedDate)}</span>}
          </div>
        );
      })()}

      {/* Content */}
      {loading ? (
        <div style={{textAlign:"center",padding:"60px 16px",color:"var(--text-muted)"}}>
          <RefreshCw size={28} style={{margin:"0 auto 12px",display:"block",opacity:0.3}}/>
          <div style={{fontWeight:600}}>Loading...</div>
        </div>
      ) : customers.length === 0 ? (
        <div style={{textAlign:"center",padding:"60px 16px",color:"var(--text-muted)"}}>
          <div style={{width:52,height:52,borderRadius:14,background:"var(--bg-elevated)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px"}}>
            <Truck size={24} color="var(--text-muted)"/>
          </div>
          <div style={{fontSize:15,fontWeight:700,marginBottom:4}}>No entries found</div>
          <div style={{fontSize:13}}>{selectedDate?`No entries on ${fmtDate(selectedDate)}`:"No entries this month"}</div>
        </div>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {customers.map(([cid,cust],ci)=>{
            const custTotal = cust.entries.reduce((s,e)=>s+Number(e.total_amount),0);
            const allDel    = cust.entries.every(isEntryDelivered);
            const isOpen    = expandedCustomer===cid;
            return (
              <div key={cid} style={{background:"var(--bg-card)",borderRadius:14,border:"1px solid var(--border-hard)",overflow:"hidden",animation:`fadeUp 0.3s ease ${ci*0.04}s both`}}>
                {/* Customer row */}
                <div className="del-card" onClick={()=>setExpandedCustomer(isOpen?null:cid)}
                  style={{padding:"14px 16px",display:"flex",alignItems:"center",gap:12,cursor:"pointer"}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:700,fontSize:15,color:"var(--text-primary)",marginBottom:3}}>{cust.name}</div>
                    <div style={{display:"flex",alignItems:"center",gap:8,fontSize:12,color:"var(--text-muted)",flexWrap:"wrap"}}>
                      {(cust.flat||cust.society)&&(
                        <span style={{display:"flex",alignItems:"center",gap:4}}>
                          <span style={{fontSize:12}}>🏠</span>
                          {cust.flat}{cust.society&&` · ${cust.society}`}
                        </span>
                      )}
                      {cust.phone&&(
                        <span style={{display:"flex",alignItems:"center",gap:4,color:"#f97316"}}>
                          <span style={{fontSize:12}}>📞</span>{cust.phone}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
                    <span style={{display:"inline-flex",alignItems:"center",gap:5,padding:"5px 12px",borderRadius:20,fontSize:12,fontWeight:700,
                      background:allDel?"rgba(5,150,105,0.12)":"rgba(245,158,11,0.12)",
                      color:allDel?"#10b981":"#f59e0b",
                      border:`1px solid ${allDel?"rgba(5,150,105,0.3)":"rgba(245,158,11,0.3)"}`}}>
                      {allDel?<CheckCircle size={13}/>:<Clock size={13}/>}
                      {allDel?"All delivered":`${cust.entries.filter(e=>!isEntryDelivered(e)).length} Pending`}
                    </span>
                    <span style={{fontWeight:800,fontSize:15,color:"var(--text-primary)"}}>₹{custTotal}</span>
                    {isOpen?<ChevronDown size={16} color="var(--text-muted)"/>:<ChevronRight size={16} color="var(--text-muted)"/>}
                  </div>
                </div>

                {/* Expanded entries */}
                {isOpen&&cust.entries.map((entry,ei)=>{
                  const isPickupDay   = selectedDate&&entry.entry_date===selectedDate;
                  const isDeliveryDay = selectedDate&&entry.delivery_date===selectedDate;
                  const delivered     = isEntryDelivered(entry);
                  const isOverdue     = entry.delivery_date&&entry.delivery_date<today&&!delivered;
                  const isDueToday    = entry.delivery_date===today&&!delivered;
                  return (
                    <div key={entry.id} style={{padding:"14px 16px",borderTop:"1px solid var(--border-hard)",background:"var(--bg-elevated)"}}>
                      {(isPickupDay||isDeliveryDay)&&(
                        <div style={{display:"flex",gap:6,marginBottom:8}}>
                          {isPickupDay&&<span style={{fontSize:11,fontWeight:700,background:"rgba(37,99,235,0.1)",color:"#3b82f6",padding:"3px 10px",borderRadius:20,border:"1px solid rgba(37,99,235,0.2)"}}>Pickup Day</span>}
                          {isDeliveryDay&&<span style={{fontSize:11,fontWeight:700,background:"rgba(109,40,217,0.1)",color:"#8b5cf6",padding:"3px 10px",borderRadius:20,border:"1px solid rgba(109,40,217,0.2)"}}>Delivery Day</span>}
                        </div>
                      )}
                      <div style={{display:"flex",gap:10,marginBottom:10,flexWrap:"wrap",alignItems:"center"}}>
                        <span style={{fontSize:12,color:"var(--text-muted)"}}>Pickup: <b style={{color:"var(--text-secondary)"}}>{fmtDate(entry.entry_date)}</b></span>
                        {entry.delivery_date?(
                          <span style={{fontSize:12,fontWeight:600,display:"flex",alignItems:"center",gap:4,
                            color:isOverdue?"#ef4444":isDueToday?"#f59e0b":"#8b5cf6",
                            background:isOverdue?"rgba(239,68,68,0.1)":isDueToday?"rgba(245,158,11,0.1)":"rgba(109,40,217,0.1)",
                            padding:"3px 8px",borderRadius:8,border:`1px solid ${isOverdue?"rgba(239,68,68,0.25)":isDueToday?"rgba(245,158,11,0.25)":"rgba(109,40,217,0.25)"}`}}>
                            <Truck size={11}/>
                            {fmtDate(entry.delivery_date)}
                            {isOverdue&&" ⚠️"}{isDueToday&&" · Today!"}
                          </span>
                        ):(
                          <span style={{fontSize:11,color:"var(--text-muted)"}}>No delivery date set</span>
                        )}
                        <span style={{marginLeft:"auto",fontWeight:800,fontSize:14,color:"var(--text-primary)"}}>₹{entry.total_amount}</span>
                      </div>
                      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
                        {entry.items?.map((item,i)=>(
                          <span key={i} style={{background:"rgba(37,99,235,0.1)",color:"#3b82f6",fontSize:11,padding:"3px 10px",borderRadius:20,fontWeight:600,border:"1px solid rgba(37,99,235,0.2)"}}>
                            {item.service_name} × {item.quantity}
                          </span>
                        ))}
                      </div>
                      <div style={{display:"flex",gap:8}}>
                        {["pending","delivered"].map(val=>{
                          const active = entry.delivery_status===val;
                          return (
                            <button key={val} onClick={()=>updateStatus(entry.id,val)}
                              style={{flex:1,padding:"8px 4px",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:700,transition:"all 0.15s",
                                border:`1px solid ${active?val==="delivered"?"rgba(5,150,105,0.4)":"rgba(245,158,11,0.4)":"var(--border-hard)"}`,
                                background:active?val==="delivered"?"rgba(5,150,105,0.12)":"rgba(245,158,11,0.12)":"transparent",
                                color:active?val==="delivered"?"#10b981":"#f59e0b":"var(--text-muted)"}}>
                              {val==="pending"?"Pending":"Delivered"}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </ProtectedLayout>
  );
}
