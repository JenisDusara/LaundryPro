"use client";
import { useState, useEffect, useCallback } from "react";
import { CheckCircle, Clock, RefreshCw, X, Truck, CalendarDays } from "lucide-react";
import api from "@/lib/api";
import ProtectedLayout from "@/components/ProtectedLayout";
import type { LaundryEntry } from "@/types";

const ST: Record<string,{bg:string;color:string;border:string}> = {
  pending:   { bg:"#fef3c7", color:"#d97706", border:"#fde68a" },
  delivered: { bg:"#dcfce7", color:"#16a34a", border:"#bbf7d0" },
};

function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" });
}

export default function Deliveries() {
  const today = new Date().toISOString().slice(0, 10);
  const [allEntries,       setAllEntries]       = useState<LaundryEntry[]>([]);
  const [filter,           setFilter]           = useState("all");
  const [loading,          setLoading]          = useState(true);
  const [expandedCustomer, setExpandedCustomer] = useState<string|null>(null);
  const [selectedDate,     setSelectedDate]     = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    // Always load all entries so we can filter by both pickup and delivery date
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

  // Filter by selected date: entry_date OR delivery_date matches
  const dateFiltered = selectedDate
    ? allEntries.filter(e => e.entry_date === selectedDate || e.delivery_date === selectedDate)
    : allEntries;

  // Filter by delivery status
  const entries = filter === "all" ? dateFiltered : dateFiltered.filter(e => e.delivery_status === filter);

  const pendingCount   = dateFiltered.filter(e => e.delivery_status !== "delivered").length;
  const deliveredCount = dateFiltered.filter(e => e.delivery_status === "delivered").length;

  // Group by customer
  const customerMap = new Map<string,{name:string;phone:string;flat:string;society:string;entries:LaundryEntry[]}>();
  entries.forEach(e => {
    if (!customerMap.has(e.customer_id))
      customerMap.set(e.customer_id, { name:e.customer?.name||"Unknown", phone:e.customer?.phone||"", flat:e.customer?.flat_number||"", society:e.customer?.society_name||"", entries:[] });
    customerMap.get(e.customer_id)!.entries.push(e);
  });
  const customers = Array.from(customerMap.entries());

  return (
    <ProtectedLayout>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div>
          <h2 style={{ color:"#1e3a8a", margin:0, fontSize:22, fontWeight:800 }}>Deliveries</h2>
          <p style={{ margin:"2px 0 0", fontSize:12, color:"#94a3b8" }}>
            {selectedDate ? fmtDate(selectedDate) : "This month"} · {pendingCount} pending · {deliveredCount} delivered
          </p>
        </div>
        <button onClick={load} style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 14px", background:"#eff6ff", color:"#1d4ed8", border:"1px solid #bfdbfe", borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer" }}>
          <RefreshCw size={14}/> Refresh
        </button>
      </div>

      {/* Status Filter + Date Picker — single row */}
      <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap", alignItems:"center" }}>
        {["all","pending","delivered"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding:"7px 16px", borderRadius:20, border:"none", cursor:"pointer", fontSize:13, fontWeight:600,
              background: filter === f ? "#1e40af" : "#e2e8f0",
              color:      filter === f ? "#fff"    : "#475569" }}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === "pending"   && pendingCount   > 0 && <span style={{ marginLeft:6, background:"#fde68a", color:"#92400e", fontSize:10, padding:"1px 6px", borderRadius:10 }}>{pendingCount}</span>}
            {f === "delivered" && deliveredCount > 0 && <span style={{ marginLeft:6, background:"#bbf7d0", color:"#14532d", fontSize:10, padding:"1px 6px", borderRadius:10 }}>{deliveredCount}</span>}
          </button>
        ))}

        {/* Date picker inline at end */}
        <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:6 }}>
          <div style={{ display:"flex", alignItems:"center", gap:0, background:"#fff", border:"1.5px solid #e2e8f0", borderRadius:20, overflow:"hidden" }}>
            <span style={{ padding:"6px 10px 6px 12px", display:"flex", alignItems:"center" }}>
              <CalendarDays size={14} color="#1d4ed8"/>
            </span>
            <input
              type="date"
              value={selectedDate}
              onChange={e => { setSelectedDate(e.target.value); setExpandedCustomer(null); }}
              style={{ padding:"6px 10px 6px 0", border:"none", outline:"none", fontSize:13, background:"transparent", color: selectedDate ? "#1e293b" : "#94a3b8", cursor:"pointer", width:130 }}
            />
            {selectedDate && (
              <button onClick={() => setSelectedDate("")}
                style={{ padding:"6px 10px", background:"#fef2f2", border:"none", borderLeft:"1px solid #fecaca", cursor:"pointer", display:"flex", alignItems:"center" }}>
                <X size={13} color="#dc2626"/>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Date result summary badges */}
      {selectedDate && (() => {
        const pickupCount   = allEntries.filter(e => e.entry_date === selectedDate).length;
        const deliveryCount = allEntries.filter(e => e.delivery_date === selectedDate).length;
        return (
          <div style={{ display:"flex", gap:8, marginBottom:12, flexWrap:"wrap" }}>
            {pickupCount > 0 && <span style={{ fontSize:12, fontWeight:600, background:"#eff6ff", color:"#1d4ed8", padding:"4px 12px", borderRadius:20, border:"1px solid #bfdbfe" }}>📅 {pickupCount} pickup{pickupCount>1?"s":""}</span>}
            {deliveryCount > 0 && <span style={{ fontSize:12, fontWeight:600, background:"#f5f3ff", color:"#7c3aed", padding:"4px 12px", borderRadius:20, border:"1px solid #ddd6fe" }}>🚚 {deliveryCount} deliver{deliveryCount>1?"ies":"y"}</span>}
            {pickupCount === 0 && deliveryCount === 0 && <span style={{ fontSize:12, color:"#94a3b8" }}>No entries on {fmtDate(selectedDate)}</span>}
          </div>
        );
      })()}

      {loading ? (
        <p style={{ color:"#94a3b8", textAlign:"center", marginTop:40 }}>Loading...</p>
      ) : customers.length === 0 ? (
        <div style={{ textAlign:"center", padding:"60px 16px", color:"#94a3b8" }}>
          <div style={{ fontSize:40, marginBottom:10 }}>📦</div>
          <div style={{ fontSize:15, fontWeight:600 }}>No entries found</div>
          <div style={{ fontSize:13, marginTop:4 }}>
            {selectedDate ? `No pickup or delivery on ${fmtDate(selectedDate)}` : "No entries this month"}
          </div>
        </div>
      ) : (
        customers.map(([cid, cust], ci) => {
          const custTotal = cust.entries.reduce((s,e) => s + Number(e.total_amount), 0);
          const allDel    = cust.entries.every(e => e.delivery_status === "delivered");
          const custSt    = allDel ? ST.delivered : ST.pending;
          const isOpen    = expandedCustomer === cid;
          return (
            <div key={cid} style={{ background:"#fff", borderRadius:14, marginBottom:12, boxShadow:"0 2px 10px rgba(0,0,0,0.07)", overflow:"hidden", animation:`fadeUp 0.3s ease ${ci*0.04}s both` }}>
              {/* Customer Header */}
              <div onClick={() => setExpandedCustomer(isOpen ? null : cid)}
                style={{ padding:"14px 16px", background:"#fafafa", borderBottom:"1px solid #f1f5f9", display:"flex", justifyContent:"space-between", alignItems:"center", cursor:"pointer" }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:15, color:"#1e293b" }}>{cust.name}</div>
                  {(cust.flat || cust.society) && <div style={{ fontSize:12, color:"#64748b", marginTop:2 }}>🏠 {cust.flat}{cust.society && ` • ${cust.society}`}</div>}
                  <div style={{ fontSize:12, color:"#64748b", marginTop:2 }}>📞 {cust.phone}</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontWeight:800, fontSize:16, color:"#1e3a8a" }}>₹{custTotal}</div>
                  <div style={{ display:"inline-flex", alignItems:"center", gap:4, marginTop:4, padding:"2px 10px", borderRadius:20, fontSize:11, fontWeight:700, background:custSt.bg, color:custSt.color, border:`1px solid ${custSt.border}` }}>
                    {allDel ? <CheckCircle size={12}/> : <Clock size={12}/>}
                    {allDel ? "All Delivered" : `${cust.entries.filter(e=>e.delivery_status!=="delivered").length} Pending`}
                  </div>
                  <div style={{ fontSize:11, color:"#94a3b8", marginTop:3 }}>{isOpen?"▲":"▼"} {cust.entries.length} entr{cust.entries.length>1?"ies":"y"}</div>
                </div>
              </div>

              {/* Entries */}
              {isOpen && cust.entries.map(entry => {
                const st = ST[entry.delivery_status] || ST.pending;
                const isPickupDay   = selectedDate && entry.entry_date    === selectedDate;
                const isDeliveryDay = selectedDate && entry.delivery_date === selectedDate;
                const isOverdue     = entry.delivery_date && entry.delivery_date < today && entry.delivery_status !== "delivered";
                const isDueToday    = entry.delivery_date === today && entry.delivery_status !== "delivered";
                return (
                  <div key={entry.id} style={{ padding:"14px 16px", borderBottom:"1px solid #f8fafc" }}>

                    {/* Match badges */}
                    {(isPickupDay || isDeliveryDay) && (
                      <div style={{ display:"flex", gap:6, marginBottom:8 }}>
                        {isPickupDay   && <span style={{ fontSize:11, fontWeight:700, background:"#eff6ff", color:"#1d4ed8", padding:"3px 10px", borderRadius:20, border:"1px solid #bfdbfe" }}>📅 Pickup Day</span>}
                        {isDeliveryDay && <span style={{ fontSize:11, fontWeight:700, background:"#f5f3ff", color:"#7c3aed", padding:"3px 10px", borderRadius:20, border:"1px solid #ddd6fe" }}>🚚 Delivery Day</span>}
                      </div>
                    )}

                    {/* Dates row */}
                    <div style={{ display:"flex", gap:10, marginBottom:10, flexWrap:"wrap", alignItems:"center" }}>
                      <span style={{ fontSize:12, color:"#64748b" }}>📅 Pickup: <b>{fmtDate(entry.entry_date)}</b></span>
                      {entry.delivery_date ? (
                        <span style={{ fontSize:12, fontWeight:600, display:"flex", alignItems:"center", gap:4,
                          color: isOverdue ? "#dc2626" : isDueToday ? "#d97706" : "#7c3aed",
                          background: isOverdue ? "#fef2f2" : isDueToday ? "#fffbeb" : "#f5f3ff",
                          padding:"2px 8px", borderRadius:8, border:`1px solid ${isOverdue?"#fecaca":isDueToday?"#fde68a":"#ddd6fe"}` }}>
                          <Truck size={11}/>
                          Delivery: {fmtDate(entry.delivery_date)}
                          {isOverdue  && " ⚠️"}
                          {isDueToday && " • Today!"}
                        </span>
                      ) : (
                        <span style={{ fontSize:11, color:"#cbd5e1" }}>No delivery date set</span>
                      )}
                      <span style={{ marginLeft:"auto", fontWeight:800, fontSize:14, color:"#1e40af" }}>₹{entry.total_amount}</span>
                    </div>

                    {/* Items */}
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:10 }}>
                      {entry.items?.map((item, i) => (
                        <span key={i} style={{ background:"#eff6ff", color:"#1e40af", fontSize:11, padding:"3px 10px", borderRadius:20, fontWeight:600 }}>
                          {item.service_name} × {item.quantity}
                        </span>
                      ))}
                    </div>

                    {/* Status buttons */}
                    <div style={{ display:"flex", gap:8 }}>
                      {["pending","delivered"].map(val => {
                        const active = entry.delivery_status === val;
                        const bs = ST[val];
                        return (
                          <button key={val} onClick={() => updateStatus(entry.id, val)}
                            style={{ flex:1, padding:"8px 4px", borderRadius:8, cursor:"pointer", fontSize:12, fontWeight:700,
                              border:`1.5px solid ${active ? bs.border : "#e2e8f0"}`,
                              background: active ? bs.bg : "#f8fafc",
                              color: active ? bs.color : "#94a3b8" }}>
                            {val === "pending" ? "⏳ Pending" : "✅ Delivered"}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })
      )}
    </ProtectedLayout>
  );
}
