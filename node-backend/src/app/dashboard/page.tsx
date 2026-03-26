"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Users, Clock, PlusCircle, ClipboardList, Truck, BarChart3 } from "lucide-react";
import api from "@/lib/api";
import ProtectedLayout from "@/components/ProtectedLayout";
import type { LaundryEntry, Customer } from "@/types";

const statusColor: Record<string,string> = { pending:"#f59e0b", in_delivery:"#3b82f6", delivered:"#10b981" };
const statusLabel: Record<string,string> = { pending:"Pending", in_delivery:"On the way", delivered:"Delivered" };

export default function Dashboard() {
  const router = useRouter();
  const [todayEntries,  setTodayEntries]  = useState<LaundryEntry[]>([]);
  const [monthEntries,  setMonthEntries]  = useState<LaundryEntry[]>([]);
  const [customers,     setCustomers]     = useState<Customer[]>([]);
  const [loading,       setLoading]       = useState(true);

  useEffect(() => {
    const today = new Date().toISOString().slice(0,10);
    const month = new Date().getMonth()+1;
    const year  = new Date().getFullYear();
    Promise.all([
      api.get("/entries", { params:{ entry_date:today } }),
      api.get("/entries", { params:{ month, year } }),
      api.get("/customers"),
    ]).then(([t,m,c]) => {
      setTodayEntries(t.data); setMonthEntries(m.data); setCustomers(c.data);
    }).finally(() => setLoading(false));
  }, []);

  const todayTotal   = todayEntries.reduce((s,e) => s+Number(e.total_amount), 0);
  const monthTotal   = monthEntries.reduce((s,e) => s+Number(e.total_amount), 0);
  const pendingCount = monthEntries.filter(e => e.delivery_status !== "delivered").length;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";
  const dateStr = new Date().toLocaleDateString("en-IN", { weekday:"long", day:"numeric", month:"long" });

  if (loading) return (
    <ProtectedLayout>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"70vh", flexDirection:"column", gap:12 }}>
        <div style={{ fontSize:40 }}>👔</div>
        <p style={{ color:"#94a3b8", fontSize:14, margin:0 }}>Loading...</p>
      </div>
    </ProtectedLayout>
  );

  return (
    <ProtectedLayout>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .dash-card { animation: fadeUp 0.4s ease both; }
        .action-btn:active { transform: scale(0.95); }
        .entry-card:active { transform: scale(0.98); }
      `}</style>

      {/* ── Hero Header ── */}
      <div className="dash-card" style={{
        background:"linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #1d4ed8 100%)",
        borderRadius:20, padding:"24px 20px 28px", marginBottom:20,
        position:"relative", overflow:"hidden"
      }}>
        {/* decorative circles */}
        <div style={{ position:"absolute", top:-30, right:-30, width:120, height:120, borderRadius:"50%", background:"rgba(255,255,255,0.05)" }}/>
        <div style={{ position:"absolute", bottom:-20, right:40, width:80, height:80, borderRadius:"50%", background:"rgba(255,255,255,0.04)" }}/>

        <p style={{ margin:"0 0 4px", fontSize:12, color:"rgba(255,255,255,0.5)", fontWeight:500 }}>{dateStr}</p>
        <h1 style={{ margin:"0 0 20px", fontSize:26, fontWeight:800, color:"#fff" }}>{greeting} 👋</h1>

        {/* 2 stat pills */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          <div style={{ background:"rgba(255,255,255,0.12)", borderRadius:14, padding:"14px 16px", backdropFilter:"blur(8px)" }}>
            <p style={{ margin:"0 0 6px", fontSize:11, color:"rgba(255,255,255,0.6)", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em" }}>Today</p>
            <p style={{ margin:"0 0 2px", fontSize:22, fontWeight:800, color:"#fff" }}>₹{todayTotal.toLocaleString("en-IN")}</p>
            <p style={{ margin:0, fontSize:11, color:"rgba(255,255,255,0.5)" }}>{todayEntries.length} entries</p>
          </div>
          <div style={{ background:"rgba(255,255,255,0.12)", borderRadius:14, padding:"14px 16px", backdropFilter:"blur(8px)" }}>
            <p style={{ margin:"0 0 6px", fontSize:11, color:"rgba(255,255,255,0.6)", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em" }}>This Month</p>
            <p style={{ margin:"0 0 2px", fontSize:22, fontWeight:800, color:"#fff" }}>₹{monthTotal.toLocaleString("en-IN")}</p>
            <p style={{ margin:0, fontSize:11, color:"rgba(255,255,255,0.5)" }}>{monthEntries.length} entries</p>
          </div>
        </div>
      </div>

      {/* ── Small stat row ── */}
      <div className="dash-card" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:20, animationDelay:"0.05s" }}>
        <div style={{ background:"#fff", borderRadius:16, padding:"16px", display:"flex", alignItems:"center", gap:12, boxShadow:"0 2px 8px rgba(0,0,0,0.06)", border:"1px solid #f1f5f9" }}>
          <div style={{ width:44, height:44, borderRadius:12, background:"#f5f3ff", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <Users size={20} color="#7c3aed"/>
          </div>
          <div>
            <p style={{ margin:0, fontSize:22, fontWeight:800, color:"#0f172a" }}>{customers.length}</p>
            <p style={{ margin:0, fontSize:12, color:"#94a3b8", fontWeight:500 }}>Customers</p>
          </div>
        </div>
        <div style={{ background:"#fff", borderRadius:16, padding:"16px", display:"flex", alignItems:"center", gap:12, boxShadow:"0 2px 8px rgba(0,0,0,0.06)", border:"1px solid #f1f5f9" }}>
          <div style={{ width:44, height:44, borderRadius:12, background:"#fffbeb", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <Clock size={20} color="#d97706"/>
          </div>
          <div>
            <p style={{ margin:0, fontSize:22, fontWeight:800, color:"#0f172a" }}>{pendingCount}</p>
            <p style={{ margin:0, fontSize:12, color:"#94a3b8", fontWeight:500 }}>Pending</p>
          </div>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="dash-card" style={{ marginBottom:20, animationDelay:"0.1s" }}>
        <p style={{ margin:"0 0 12px", fontSize:12, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.08em" }}>Quick Actions</p>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8 }}>
          {[
            { icon:<PlusCircle size={20}/>,   label:"New",       path:"/new-entry",  color:"#1d4ed8", bg:"#eff6ff" },
            { icon:<Truck size={20}/>,         label:"Delivery",  path:"/deliveries", color:"#d97706", bg:"#fffbeb" },
            { icon:<ClipboardList size={20}/>, label:"Entries",   path:"/entries",    color:"#059669", bg:"#f0fdf4" },
            { icon:<BarChart3 size={20}/>,     label:"Reports",   path:"/reports",    color:"#7c3aed", bg:"#f5f3ff" },
          ].map((a,i) => (
            <div key={i} className="action-btn" onClick={() => router.push(a.path)} style={{
              background:"#fff", border:`1.5px solid #f1f5f9`, borderRadius:14,
              padding:"14px 6px", display:"flex", flexDirection:"column",
              alignItems:"center", gap:7, cursor:"pointer",
              transition:"all 0.15s", boxShadow:"0 1px 4px rgba(0,0,0,0.05)"
            }}
              onMouseEnter={e => { e.currentTarget.style.background=a.bg; e.currentTarget.style.borderColor=a.color+"55"; }}
              onMouseLeave={e => { e.currentTarget.style.background="#fff"; e.currentTarget.style.borderColor="#f1f5f9"; }}
            >
              <div style={{ width:38, height:38, borderRadius:10, background:a.bg, display:"flex", alignItems:"center", justifyContent:"center", color:a.color }}>
                {a.icon}
              </div>
              <span style={{ fontSize:11, fontWeight:700, color:"#475569" }}>{a.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Today's Entries ── */}
      <div className="dash-card" style={{ animationDelay:"0.15s" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
          <p style={{ margin:0, fontSize:12, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.08em" }}>
            Today&apos;s Entries
            {todayEntries.length > 0 && (
              <span style={{ marginLeft:8, background:"#1d4ed8", color:"#fff", fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:20 }}>
                {todayEntries.length}
              </span>
            )}
          </p>
          {todayEntries.length > 4 && (
            <button onClick={() => router.push("/entries")} style={{ background:"none", border:"none", color:"#3b82f6", fontSize:12, fontWeight:700, cursor:"pointer" }}>
              See all →
            </button>
          )}
        </div>

        {todayEntries.length === 0 ? (
          <div style={{ background:"#fff", borderRadius:16, padding:"36px 16px", textAlign:"center", border:"1.5px dashed #e2e8f0" }}>
            <div style={{ fontSize:36, marginBottom:10 }}>📋</div>
            <p style={{ color:"#94a3b8", fontSize:14, margin:"0 0 14px", fontWeight:500 }}>No entries today</p>
            <button onClick={() => router.push("/new-entry")} style={{ background:"#1d4ed8", color:"#fff", border:"none", borderRadius:10, padding:"10px 20px", fontSize:13, fontWeight:700, cursor:"pointer" }}>
              + Add Entry
            </button>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {todayEntries.slice(0,4).map((entry,i) => (
              <div key={entry.id} className="entry-card" style={{
                background:"#fff", borderRadius:14, padding:"14px 16px",
                display:"flex", justifyContent:"space-between", alignItems:"center",
                border:"1px solid #f1f5f9", boxShadow:"0 1px 4px rgba(0,0,0,0.04)",
                cursor:"pointer", transition:"all 0.15s",
                animationDelay:`${0.15 + i*0.05}s`
              }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,0.08)"; e.currentTarget.style.transform="translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,0.04)"; e.currentTarget.style.transform="none"; }}
              >
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{
                    width:40, height:40, borderRadius:12, flexShrink:0,
                    background:`linear-gradient(135deg, ${["#1d4ed8","#7c3aed","#059669","#d97706"][i%4]}, ${["#3b82f6","#a855f7","#10b981","#f59e0b"][i%4]})`,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    color:"#fff", fontWeight:800, fontSize:16
                  }}>
                    {entry.customer?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ margin:0, fontWeight:700, fontSize:14, color:"#0f172a" }}>{entry.customer?.name}</p>
                    <p style={{ margin:"3px 0 0", fontSize:11, color:"#94a3b8" }}>
                      {entry.items?.slice(0,2).map(i => i.service_name).join(" • ")}
                      {(entry.items?.length||0) > 2 && ` +${(entry.items?.length||0)-2}`}
                    </p>
                  </div>
                </div>
                <div style={{ textAlign:"right", flexShrink:0 }}>
                  <p style={{ margin:0, fontWeight:800, fontSize:15, color:"#0f172a" }}>₹{Number(entry.total_amount).toLocaleString("en-IN")}</p>
                  <p style={{ margin:"3px 0 0", fontSize:11, fontWeight:600, color:statusColor[entry.delivery_status] }}>
                    ● {statusLabel[entry.delivery_status]}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProtectedLayout>
  );
}
