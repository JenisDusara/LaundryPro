"use client";
import { useState, useEffect, useCallback } from "react";
import { CheckCircle, Clock, RefreshCw, X, Truck, CalendarDays, ChevronRight, ChevronDown, Home, Package, Search } from "lucide-react";
import api from "@/lib/api";
import { isEntryDelivered } from "@/lib/entry-status";
import { todayIST } from "@/lib/dates";
import ProtectedLayout from "@/components/ProtectedLayout";
import EmptyState from "@/components/EmptyState";
import { FilterPanel } from "@/components/Filters";
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
  const [from,             setFrom]             = useState("");
  const [to,               setTo]               = useState("");
  const [fName,            setFName]            = useState("");
  const [fPhone,           setFPhone]           = useState("");
  const [societyFilter,    setSocietyFilter]    = useState("all");
  const [focusCustomer,    setFocusCustomer]    = useState<string|null>(null);
  const applyFilters = (v: Record<string,string>) => {
    setFilter(v.status || "all"); setFrom(v.from || ""); setTo(v.to || "");
    setSocietyFilter(v.society || "all"); setFName(v.name || ""); setFPhone(v.phone || "");
  };

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
    const q = new URLSearchParams(window.location.search);
    const f = q.get("filter");
    if (f === "pending" || f === "delivered" || f === "all") setFilter(f);
    // Deep-link from the alerts bell: /deliveries?customer=<id> — focus + open that customer.
    const cust = q.get("customer");
    if (cust) { setFocusCustomer(cust); setExpandedCustomer(cust); }
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

  const inRange = (d?: string | null) => !!d && d >= from && d <= to;
  const dateFiltered = (from && to)
    ? allEntries.filter(e => inRange(e.entry_date) || inRange(e.delivery_date))
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
  const societyOptions = Array.from(new Set(allEntries.map(e => e.customer?.society_name).filter(Boolean) as string[])).sort();
  const customers = Array.from(customerMap.entries()).filter(([cid, c]) => {
    if (focusCustomer) return cid === focusCustomer;   // deep-link: show only that customer
    if (societyFilter !== "all" && c.society !== societyFilter) return false;
    if (fName  && !c.name.toLowerCase().includes(fName.toLowerCase())) return false;
    if (fPhone && !c.phone.includes(fPhone)) return false;
    return true;
  });
  const focusName = focusCustomer ? customerMap.get(focusCustomer)?.name : null;

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
            {(from && to) ? `${fmtDate(from)} – ${fmtDate(to)}` : "All time"} · {pendingCount} pending · {deliveredCount} delivered
          </p>
        </div>
        <button onClick={load} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 18px",border:"1px solid var(--border-hard)",borderRadius:10,background:"var(--bg-card)",color:"var(--text-secondary)",fontSize:13,fontWeight:600,cursor:"pointer"}}>
          <RefreshCw size={14}/> Refresh
        </button>
      </div>

      {/* Filters (MyUniclean-style) */}
      <FilterPanel
        initial={{ status: filter, society: societyFilter, from, to, name: fName, phone: fPhone }}
        onApply={applyFilters}
        dateRange
        selects={[
          { key:"status",  label:"Status",  options:[{value:"all",label:"All"},{value:"pending",label:"Pending"},{value:"delivered",label:"Delivered"}] },
          { key:"society", label:"Society", options:[{value:"all",label:"All societies"}, ...societyOptions.map(s=>({value:s,label:s}))] },
        ]}
        texts={[
          { key:"name",  label:"Search by name",  placeholder:"Customer name" },
          { key:"phone", label:"Search by phone", placeholder:"Phone number" },
        ]}
      />

      {/* Focused on one customer (from the alerts bell) */}
      {focusCustomer && (
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,flexWrap:"wrap",background:"var(--grade-b-bg)",border:"1px solid var(--grade-b-border)",borderRadius:10,padding:"10px 14px",marginBottom:14}}>
          <span style={{fontSize:13,fontWeight:700,color:"var(--grade-b-text)"}}>Showing {focusName || "customer"}&apos;s deliveries</span>
          <button onClick={()=>{ setFocusCustomer(null); setExpandedCustomer(null); }}
            style={{padding:"6px 14px",borderRadius:8,border:"1px solid var(--grade-b-border)",background:"var(--bg-card)",color:"var(--grade-b-text)",fontSize:12.5,fontWeight:700,cursor:"pointer"}}>
            Show all deliveries
          </button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div style={{textAlign:"center",padding:"60px 16px",color:"var(--text-muted)"}}>
          <RefreshCw size={28} style={{margin:"0 auto 12px",display:"block",opacity:0.3}}/>
          <div style={{fontWeight:600}}>Loading...</div>
        </div>
      ) : customers.length === 0 ? (
        <EmptyState title="No entries found" subtitle={(from&&to)?`No entries in ${fmtDate(from)} – ${fmtDate(to)}`:"No entries yet"}/>
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
