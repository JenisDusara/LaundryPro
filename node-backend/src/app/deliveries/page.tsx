"use client";
import { useState, useEffect, useCallback } from "react";
import { CheckCircle, Clock, RefreshCw, X, Truck, CalendarDays, ChevronRight, ChevronDown, Home, Package } from "lucide-react";
import api from "@/lib/api";
import { isEntryDelivered } from "@/lib/entry-status";
import { todayIST } from "@/lib/dates";
import ProtectedLayout from "@/components/ProtectedLayout";
import ItemDeliver from "@/components/ItemDeliver";
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
    // Fetch ALL entries (not just the current month) so overdue deliveries from
    // previous months stay visible here — otherwise they silently disappear and the
    // page looks "all clear" while the dashboard correctly flags them as overdue.
    const res = await api.get("/entries");
    setAllEntries(res.data);
    setLoading(false);
  }, []);

  // Preselect the tab when arriving from a dashboard card (e.g. /deliveries?filter=pending).
  // Read from window.location to avoid the Suspense requirement that useSearchParams adds.
  useEffect(() => {
    const f = new URLSearchParams(window.location.search).get("filter");
    if (f === "pending" || f === "delivered" || f === "all") setFilter(f);
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

  const entries = filter === "all"       ? dateFiltered
    : filter === "delivered" ? dateFiltered.filter(isEntryDelivered)
    :                          dateFiltered.filter(e => !isEntryDelivered(e)); // pending

  const pendingCount   = dateFiltered.filter(e => !isEntryDelivered(e)).length;
  const deliveredCount = dateFiltered.filter(isEntryDelivered).length;

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
        @media (max-width: 768px) {
          /* Phone: keep the customer details readable and move the status + amount to their
             own line instead of crowding/overlapping the name. */
          .del-info { min-width: 60% !important; }
          .del-right { width: 100%; justify-content: flex-end; margin-top: 8px; }
        }
      `}</style>

      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
        <div>
          <div style={{fontSize:11,fontWeight:700,color:"var(--text-secondary)",textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:4}}>Fulfilment</div>
          <h2 style={{color:"var(--text-primary)",margin:"0 0 4px",fontSize:26,fontWeight:900,letterSpacing:-0.5}}>Deliveries</h2>
          <p style={{color:"var(--text-muted)",fontSize:13,margin:0}}>
            {selectedDate ? fmtDate(selectedDate) : "All time"} · {pendingCount} pending · {deliveredCount} delivered
          </p>
        </div>
        <button onClick={load} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 18px",border:"1px solid var(--border-hard)",borderRadius:10,background:"var(--bg-card)",color:"var(--text-secondary)",fontSize:13,fontWeight:600,cursor:"pointer"}}>
          <RefreshCw size={14}/> Refresh
        </button>
      </div>

      {/* Filters row */}
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
        {/* Pill tabs */}
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {[
            {key:"all",       label:"All",       g:"b" as const},
            {key:"pending",   label:"Pending",   count:pendingCount,   g:"c" as const},
            {key:"delivered", label:"Delivered", count:deliveredCount, g:"a" as const},
          ].map(({key,label,count,g})=>{
            const active = filter===key;
            return (
              <button key={key} onClick={()=>setFilter(key)}
                style={{display:"flex",alignItems:"center",gap:6,padding:"8px 16px",borderRadius:20,cursor:"pointer",fontWeight:700,fontSize:13,transition:"all 0.15s",
                  background:active?`var(--grade-${g}-bg)`:"var(--bg-input)",
                  color:active?`var(--grade-${g}-text)`:"var(--text-secondary)",
                  border:`1px solid ${active?`var(--grade-${g}-border)`:"transparent"}`}}>
                {label}
                {count!=null&&count>0&&(
                  <span style={{fontSize:11,fontWeight:800,padding:"1px 7px",borderRadius:10,
                    background:active?`var(--grade-${g}-border)`:"var(--bg-elevated)",
                    color:active?`var(--grade-${g}-text)`:"var(--text-secondary)"}}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Date picker */}
        <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:0,background:"var(--bg-card)",border:"1px solid var(--border-hard)",borderRadius:20,overflow:"hidden"}}>
          <span style={{padding:"7px 10px 7px 14px",display:"flex",alignItems:"center"}}>
            <CalendarDays size={14} color="var(--grade-b-text)"/>
          </span>
          <input type="date" value={selectedDate}
            onChange={e=>{setSelectedDate(e.target.value);setExpandedCustomer(null);}}
            style={{padding:"7px 10px 7px 0",border:"none",outline:"none",fontSize:13,background:"transparent",color:selectedDate?"var(--text-primary)":"var(--text-muted)",cursor:"pointer",width:120}}/>
          {selectedDate&&(
            <button onClick={()=>setSelectedDate("")}
              style={{padding:"7px 10px",background:"var(--grade-f-bg)",border:"none",borderLeft:"1px solid var(--border-hard)",cursor:"pointer",display:"flex",alignItems:"center"}}>
              <X size={13} color="var(--grade-f-text)"/>
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
            {pickupCount>0&&<span style={{fontSize:12,fontWeight:600,background:"var(--grade-b-bg)",color:"var(--grade-b-text)",padding:"4px 12px",borderRadius:20,border:"1px solid var(--grade-b-border)"}}>Pickup · {pickupCount}</span>}
            {deliveryCount>0&&<span style={{fontSize:12,fontWeight:600,background:"var(--grade-a-bg)",color:"var(--grade-a-text)",padding:"4px 12px",borderRadius:20,border:"1px solid var(--grade-a-border)"}}>Delivery · {deliveryCount}</span>}
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
            const custTotal   = cust.entries.reduce((s,e)=>s+Number(e.total_amount),0);
            const allItems    = cust.entries.flatMap(e=>e.items||[]);
            const doneItems   = allItems.filter(i=>i.item_status==="delivered").length;
            const allDel      = allItems.length>0 && doneItems===allItems.length;
            const isOpen      = expandedCustomer===cid;
            return (
              <div key={cid} style={{background:"var(--bg-card)",borderRadius:14,border:"1px solid var(--border-hard)",overflow:"hidden",animation:`fadeUp 0.3s ease ${ci*0.04}s both`}}>
                {/* Customer row */}
                <div className="del-card" onClick={()=>setExpandedCustomer(isOpen?null:cid)}
                  style={{padding:"14px 16px",display:"flex",alignItems:"center",flexWrap:"wrap",gap:12,cursor:"pointer"}}>
                  {/* Avatar box */}
                  <div style={{width:40,height:40,borderRadius:10,flexShrink:0,background:"var(--bg-elevated)",border:"1px solid var(--border-hard)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <Home size={17} color="var(--text-secondary)"/>
                  </div>
                  <div className="del-info" style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:700,fontSize:15,color:"var(--text-primary)",marginBottom:3}}>{cust.name}</div>
                    <div style={{display:"flex",alignItems:"center",gap:8,fontSize:12,color:"var(--text-muted)",flexWrap:"wrap"}}>
                      {(cust.flat||cust.society)&&(
                        <span style={{display:"flex",alignItems:"center",gap:4}}>
                          <span style={{fontSize:12}}>🏠</span>
                          {cust.flat}{cust.society&&` · ${cust.society}`}
                        </span>
                      )}
                      {cust.phone&&(
                        <span style={{display:"flex",alignItems:"center",gap:4,color:"var(--accent-warning)"}}>
                          <span style={{fontSize:12}}>📞</span>{cust.phone}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="del-right" style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
                    <span style={{display:"inline-flex",alignItems:"center",gap:5,padding:"5px 12px",borderRadius:20,fontSize:12,fontWeight:700,
                      background:allDel?"var(--grade-a-bg)":"var(--grade-c-bg)",
                      color:allDel?"var(--grade-a-text)":"var(--grade-c-text)",
                      border:`1px solid ${allDel?"var(--grade-a-border)":"var(--grade-c-border)"}`}}>
                      {allDel?<CheckCircle size={13}/>:<Package size={13}/>}
                      {allDel?"All delivered":`${doneItems}/${allItems.length} done`}
                    </span>
                    <span style={{fontWeight:800,fontSize:15,color:"var(--text-primary)"}}>₹{custTotal}</span>
                    {isOpen?<ChevronDown size={16} color="var(--text-muted)"/>:<ChevronRight size={16} color="var(--text-muted)"/>}
                  </div>
                </div>

                {/* Expanded entries — one horizontal row per entry */}
                {isOpen&&cust.entries.map((entry,ei)=>{
                  const delivered  = isEntryDelivered(entry);
                  const isDueToday = entry.delivery_date===today&&!delivered;
                  return (
                    <div key={entry.id} style={{display:"flex",alignItems:"center",gap:14,rowGap:8,padding:"12px 16px",borderTop:"1px solid var(--border-hard)",background:"var(--bg-elevated)",flexWrap:"wrap"}}>
                      {/* Item pills — tap to set how many delivered (partial) */}
                      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                        {entry.items?.map(item=>(
                          <ItemDeliver key={item.id} entryId={entry.id} item={item} onChanged={load} />
                        ))}
                      </div>
                      {/* Pickup date */}
                      <span style={{fontSize:12,color:"var(--text-muted)",display:"flex",alignItems:"center",gap:4,whiteSpace:"nowrap"}}>
                        <Clock size={12}/> Pickup {fmtDate(entry.entry_date)}
                      </span>
                      {/* Due date */}
                      {entry.delivery_date?(
                        <span style={{fontSize:12,fontWeight:700,display:"flex",alignItems:"center",gap:4,whiteSpace:"nowrap",
                          color:isDueToday?"var(--grade-c-text)":"var(--grade-b-text)"}}>
                          <Truck size={12}/> {isDueToday?"Due today":`Due ${fmtDate(entry.delivery_date)}`}
                        </span>
                      ):(
                        <span style={{fontSize:12,color:"var(--text-muted)",fontStyle:"italic"}}>No delivery date</span>
                      )}
                      {/* Amount */}
                      <span style={{marginLeft:"auto",fontWeight:800,fontSize:14,color:"var(--text-primary)",whiteSpace:"nowrap"}}>₹{entry.total_amount}</span>
                      {/* Action button */}
                      {delivered ? (
                        <button onClick={()=>updateStatus(entry.id,"pending")}
                          style={{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:9,cursor:"pointer",fontSize:12,fontWeight:700,whiteSpace:"nowrap",transition:"all 0.15s",
                            background:"var(--grade-a-bg)",color:"var(--grade-a-text)",border:"1px solid var(--grade-a-border)"}}>
                          <CheckCircle size={14}/> Delivered
                        </button>
                      ) : (
                        <button onClick={()=>updateStatus(entry.id,"delivered")}
                          style={{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:9,cursor:"pointer",fontSize:12,fontWeight:700,whiteSpace:"nowrap",transition:"all 0.15s",
                            background:"var(--bg-card)",color:"var(--text-secondary)",border:"1px solid var(--border-hard)"}}>
                          <Package size={14}/> Mark delivered
                        </button>
                      )}
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
