"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Users, ClipboardList, IndianRupee, PlusCircle, Truck, TrendingUp, CheckCircle2, Clock } from "lucide-react";
import api from "@/lib/api";
import ProtectedLayout from "@/components/ProtectedLayout";
import type { LaundryEntry, Customer } from "@/types";

const statusColor: Record<string,string> = { pending:"#f59e0b", in_delivery:"#3b82f6", delivered:"#10b981" };
const statusLabel: Record<string,string> = { pending:"Pending", in_delivery:"In Delivery", delivered:"Delivered" };

export default function Dashboard() {
  const router = useRouter();
  const [todayEntries, setTodayEntries]   = useState<LaundryEntry[]>([]);
  const [monthEntries, setMonthEntries]   = useState<LaundryEntry[]>([]);
  const [customers,    setCustomers]      = useState<Customer[]>([]);
  const [loading,      setLoading]        = useState(true);

  useEffect(() => {
    const today = new Date().toISOString().slice(0,10);
    const month = new Date().getMonth() + 1;
    const year  = new Date().getFullYear();
    Promise.all([
      api.get("/entries", { params: { entry_date: today } }),
      api.get("/entries", { params: { month, year } }),
      api.get("/customers"),
    ]).then(([t,m,c]) => {
      setTodayEntries(t.data); setMonthEntries(m.data); setCustomers(c.data);
    }).finally(() => setLoading(false));
  }, []);

  const todayTotal   = todayEntries.reduce((s,e) => s + Number(e.total_amount), 0);
  const monthTotal   = monthEntries.reduce((s,e) => s + Number(e.total_amount), 0);
  const pendingCount = monthEntries.filter(e => e.delivery_status === "pending").length;
  const deliveredCount = monthEntries.filter(e => e.delivery_status === "delivered").length;

  const dateStr = new Date().toLocaleDateString("en-IN", { weekday:"long", day:"numeric", month:"long", year:"numeric" });

  if (loading) return (
    <ProtectedLayout>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"60vh" }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:32, marginBottom:12 }}>⏳</div>
          <p style={{ color:"#94a3b8", fontSize:15 }}>Loading dashboard...</p>
        </div>
      </div>
    </ProtectedLayout>
  );

  return (
    <ProtectedLayout>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin:0, fontSize:26, fontWeight:800, color:"#0f172a" }}>Dashboard</h1>
        <p style={{ margin:"4px 0 0", color:"#64748b", fontSize:14 }}>{dateStr}</p>
      </div>

      {/* Stat Cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:16, marginBottom:28 }}>
        {[
          { icon:<IndianRupee size={22}/>, value:`₹${todayTotal.toLocaleString("en-IN")}`, label:"Today's Collection", color:"#1d4ed8", bg:"#eff6ff", border:"#bfdbfe" },
          { icon:<TrendingUp size={22}/>,  value:`₹${monthTotal.toLocaleString("en-IN")}`,  label:"Monthly Revenue",   color:"#059669", bg:"#f0fdf4", border:"#bbf7d0" },
          { icon:<Users size={22}/>,       value:customers.length,                          label:"Total Customers",   color:"#7c3aed", bg:"#f5f3ff", border:"#ddd6fe" },
          { icon:<Clock size={22}/>,       value:pendingCount,                              label:"Pending Deliveries",color:"#d97706", bg:"#fffbeb", border:"#fde68a" },
        ].map((stat,i) => (
          <div key={i} style={{
            background:"#fff", borderRadius:16, padding:"20px 22px",
            border:`1.5px solid ${stat.border}`,
            boxShadow:"0 2px 10px rgba(0,0,0,0.05)", transition:"all 0.2s"
          }}
            onMouseEnter={e => { e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="0 8px 24px rgba(0,0,0,0.1)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="0 2px 10px rgba(0,0,0,0.05)"; }}
          >
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div>
                <p style={{ margin:"0 0 8px", fontSize:13, color:"#64748b", fontWeight:500 }}>{stat.label}</p>
                <p style={{ margin:0, fontSize:26, fontWeight:800, color:stat.color }}>{stat.value}</p>
              </div>
              <div style={{ width:46, height:46, borderRadius:12, background:stat.bg, display:"flex", alignItems:"center", justifyContent:"center", color:stat.color }}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:28 }}>
        {/* Quick Actions */}
        <div style={{ background:"#fff", borderRadius:16, padding:22, boxShadow:"0 2px 10px rgba(0,0,0,0.05)", border:"1px solid #f1f5f9" }}>
          <h3 style={{ margin:"0 0 16px", fontSize:15, fontWeight:700, color:"#0f172a" }}>Quick Actions</h3>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {[
              { icon:<PlusCircle size={20}/>, label:"New Entry",    path:"/new-entry",   color:"#1d4ed8", bg:"#eff6ff" },
              { icon:<Users size={20}/>,      label:"Customers",    path:"/customers",   color:"#7c3aed", bg:"#f5f3ff" },
              { icon:<ClipboardList size={20}/>,label:"Entries",   path:"/entries",     color:"#059669", bg:"#f0fdf4" },
              { icon:<Truck size={20}/>,      label:"Deliveries",  path:"/deliveries",  color:"#d97706", bg:"#fffbeb" },
            ].map((a,i) => (
              <div key={i} onClick={() => router.push(a.path)} style={{
                display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
                gap:8, padding:"16px 10px", borderRadius:12, cursor:"pointer",
                background:a.bg, color:a.color, fontWeight:600, fontSize:13,
                border:"1.5px solid transparent", transition:"all 0.15s"
              }}
                onMouseEnter={e => { e.currentTarget.style.transform="scale(1.03)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform="none"; }}
              >
                {a.icon}<span>{a.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery Summary */}
        <div style={{ background:"#fff", borderRadius:16, padding:22, boxShadow:"0 2px 10px rgba(0,0,0,0.05)", border:"1px solid #f1f5f9" }}>
          <h3 style={{ margin:"0 0 16px", fontSize:15, fontWeight:700, color:"#0f172a" }}>This Month Summary</h3>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {[
              { label:"Total Entries",   value:monthEntries.length, color:"#1d4ed8", icon:<ClipboardList size={16}/> },
              { label:"Delivered",       value:deliveredCount,       color:"#059669", icon:<CheckCircle2 size={16}/> },
              { label:"Pending",         value:pendingCount,         color:"#d97706", icon:<Clock size={16}/> },
            ].map((row,i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 14px", background:"#f8fafc", borderRadius:10 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, color:"#64748b", fontSize:14 }}>
                  <span style={{ color:row.color }}>{row.icon}</span>{row.label}
                </div>
                <span style={{ fontWeight:700, color:row.color, fontSize:16 }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Today's Entries */}
      <div style={{ background:"#fff", borderRadius:16, padding:22, boxShadow:"0 2px 10px rgba(0,0,0,0.05)", border:"1px solid #f1f5f9" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <h3 style={{ margin:0, fontSize:15, fontWeight:700, color:"#0f172a" }}>
            Today&apos;s Entries
            <span style={{ marginLeft:8, background:"#eff6ff", color:"#1d4ed8", fontSize:12, fontWeight:700, padding:"2px 8px", borderRadius:20 }}>{todayEntries.length}</span>
          </h3>
          {todayEntries.length > 0 && (
            <button onClick={() => router.push("/entries")} style={{ background:"none", border:"none", color:"#3b82f6", fontSize:13, fontWeight:600, cursor:"pointer" }}>
              View all →
            </button>
          )}
        </div>

        {todayEntries.length === 0 ? (
          <div style={{ textAlign:"center", padding:"32px 0" }}>
            <div style={{ fontSize:36, marginBottom:8 }}>📋</div>
            <p style={{ color:"#94a3b8", fontSize:14, margin:0 }}>No entries today</p>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {todayEntries.slice(0,6).map(entry => (
              <div key={entry.id} style={{
                display:"flex", justifyContent:"space-between", alignItems:"center",
                padding:"12px 16px", background:"#f8fafc", borderRadius:12,
                border:"1px solid #f1f5f9", transition:"all 0.15s"
              }}
                onMouseEnter={e => { e.currentTarget.style.background="#eff6ff"; }}
                onMouseLeave={e => { e.currentTarget.style.background="#f8fafc"; }}
              >
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ width:36, height:36, borderRadius:10, background:"linear-gradient(135deg,#1d4ed8,#3b82f6)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:700, fontSize:13 }}>
                    {entry.customer?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight:700, fontSize:14, color:"#0f172a" }}>{entry.customer?.name}</div>
                    <div style={{ fontSize:12, color:"#94a3b8", marginTop:2 }}>
                      {entry.items?.slice(0,2).map(i => `${i.service_name} ×${i.quantity}`).join(" • ")}
                      {(entry.items?.length||0) > 2 && ` +${(entry.items?.length||0)-2} more`}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontWeight:800, fontSize:15, color:"#0f172a" }}>₹{Number(entry.total_amount).toLocaleString("en-IN")}</div>
                  <div style={{ fontSize:11, fontWeight:600, color:statusColor[entry.delivery_status], marginTop:2 }}>
                    {statusLabel[entry.delivery_status]}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProtectedLayout>
  );
}
