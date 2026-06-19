"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Users, PlusCircle, ClipboardList, Truck,
  Bell, BellOff, AlertTriangle, Wallet, Hammer,
  TrendingUp, CheckCircle2, ChevronRight, Package
} from "lucide-react";
import api from "@/lib/api";
import ProtectedLayout from "@/components/ProtectedLayout";
import type { LaundryEntry, Customer } from "@/types";

const statusColor: Record<string,string> = { pending:"#f59e0b", in_delivery:"#3b82f6", delivered:"#10b981", ready:"#8b5cf6" };
const statusLabel: Record<string,string> = { pending:"Pending", in_delivery:"On the way", delivered:"Delivered", ready:"Ready" };

function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function Dashboard() {
  const router = useRouter();
  const [todayEntries,  setTodayEntries]  = useState<LaundryEntry[]>([]);
  const [monthEntries,  setMonthEntries]  = useState<LaundryEntry[]>([]);
  const [customers,     setCustomers]     = useState<Customer[]>([]);
  const [allPending,    setAllPending]    = useState<LaundryEntry[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [notifPerm,     setNotifPerm]     = useState<NotificationPermission>("default");
  const [notifSent,     setNotifSent]     = useState(false);
  const [profile,       setProfile]       = useState<{ name: string; shop_name: string } | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  const loadData = useCallback(() => {
    const month = new Date().getMonth() + 1;
    const year  = new Date().getFullYear();
    Promise.all([
      api.get("/entries", { params: { entry_date: today } }),
      api.get("/entries", { params: { month, year } }),
      api.get("/customers"),
      api.get("/entries"),
      api.get("/auth/me"),
    ]).then(([t, m, c, all, me]) => {
      setTodayEntries(t.data);
      setMonthEntries(m.data);
      setCustomers(c.data);
      setProfile(me.data);
      setAllPending(all.data.filter((e: LaundryEntry) => e.delivery_status !== "delivered" && e.delivery_date));
    }).finally(() => setLoading(false));
  }, [today]);

  useEffect(() => {
    loadData();
    if (typeof Notification !== "undefined") setNotifPerm(Notification.permission);
  }, [loadData]);

  const overdueEntries  = allPending.filter(e => e.delivery_date! < today);
  const dueTodayEntries = allPending.filter(e => e.delivery_date === today);
  const upcomingEntries = allPending.filter(e => e.delivery_date! > today);

  useEffect(() => {
    if (notifSent || notifPerm !== "granted" || loading) return;
    const total = overdueEntries.length + dueTodayEntries.length;
    if (total === 0) return;
    if (overdueEntries.length > 0) new Notification("⚠️ Overdue Deliveries", { body: `${overdueEntries.length} order(s) overdue!` });
    if (dueTodayEntries.length > 0) new Notification("🚚 Today's Deliveries", { body: `${dueTodayEntries.length} order(s) to deliver today.` });
    setNotifSent(true);
  }, [notifPerm, overdueEntries.length, dueTodayEntries.length, notifSent, loading]);

  const requestNotif = async () => {
    if (typeof Notification === "undefined") return;
    const perm = await Notification.requestPermission();
    setNotifPerm(perm);
  };

  const todayTotal     = todayEntries.reduce((s, e) => s + Number(e.total_amount), 0);
  const monthTotal     = monthEntries.reduce((s, e) => s + Number(e.total_amount), 0);
  const deliveredCount = monthEntries.filter(e => e.delivery_status === "delivered").length;
  const pendingCount   = monthEntries.filter(e => e.delivery_status !== "delivered").length;
  const deliveryRate   = monthEntries.length > 0 ? Math.round((deliveredCount / monthEntries.length) * 100) : 0;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";
  const dateStr = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  if (loading) return (
    <ProtectedLayout>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "70vh", flexDirection: "column", gap: 16 }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg,#1e3a8a,#1d4ed8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>👔</div>
        <p style={{ color: "#94a3b8", fontSize: 14, margin: 0, fontWeight: 500 }}>Loading dashboard...</p>
      </div>
    </ProtectedLayout>
  );

  return (
    <ProtectedLayout>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:.5} }
        @keyframes shimmer{ 0%{background-position:200% center} 100%{background-position:-200% center} }
        .d-card { animation: fadeUp 0.4s ease both; }
        .act-btn { transition: all 0.18s ease; }
        .act-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.12)!important; }
        .act-btn:active { transform: scale(0.97); }
        .entry-row { transition: all 0.15s ease; cursor: pointer; }
        .entry-row:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.09)!important; transform: translateY(-1px); }
      `}</style>

      {/* ── Hero Header ── */}
      <div className="d-card" style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 45%, #1d4ed8 100%)",
        borderRadius: 22, padding: "28px 24px", marginBottom: 20,
        position: "relative", overflow: "hidden",
        boxShadow: "0 8px 32px rgba(29,78,216,0.3)"
      }}>
        {/* decorative circles */}
        <div style={{ position:"absolute", top:-40, right:-40, width:160, height:160, borderRadius:"50%", background:"rgba(255,255,255,0.04)" }} />
        <div style={{ position:"absolute", bottom:-30, right:80, width:100, height:100, borderRadius:"50%", background:"rgba(255,255,255,0.04)" }} />
        <div style={{ position:"absolute", top:20, right:140, width:50, height:50, borderRadius:"50%", background:"rgba(255,255,255,0.06)" }} />

        {/* Top row */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom: 22 }}>
          <div>
            <p style={{ margin:"0 0 4px", fontSize:12, color:"rgba(255,255,255,0.45)", fontWeight:500, letterSpacing:"0.04em" }}>{dateStr}</p>
            <h1 style={{ margin:0, fontSize:22, fontWeight:800, color:"#fff", letterSpacing:-0.3 }}>
              {greeting}{profile?.name ? `, ${profile.name.split(" ")[0]}` : ""} 👋
            </h1>
            {profile?.shop_name && (
              <p style={{ margin:"4px 0 0", fontSize:12, color:"rgba(255,255,255,0.4)", fontWeight:500 }}>
                {profile.shop_name}
              </p>
            )}
          </div>
          <button
            onClick={notifPerm === "granted" ? undefined : requestNotif}
            style={{ background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:12, padding:"9px 13px", cursor: notifPerm==="granted" ? "default" : "pointer", display:"flex", alignItems:"center", gap:6, color:"#fff", position:"relative", flexShrink: 0 }}>
            {notifPerm === "granted" ? <Bell size={17} /> : <BellOff size={17} />}
            {notifPerm !== "granted" && <span style={{ fontSize:10, fontWeight:700 }}>Enable</span>}
            {(overdueEntries.length + dueTodayEntries.length) > 0 && (
              <span style={{ position:"absolute", top:-5, right:-5, width:18, height:18, borderRadius:"50%", background:"#ef4444", fontSize:9, fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center", animation:"pulse 1.5s infinite", border:"2px solid #1d4ed8" }}>
                {overdueEntries.length + dueTodayEntries.length}
              </span>
            )}
          </button>
        </div>

        {/* Revenue Cards */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <div style={{ background:"rgba(255,255,255,0.1)", borderRadius:16, padding:"16px 18px", backdropFilter:"blur(10px)", border:"1px solid rgba(255,255,255,0.12)" }}>
            <p style={{ margin:"0 0 8px", fontSize:11, color:"rgba(255,255,255,0.55)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em" }}>Today's Revenue</p>
            <p style={{ margin:"0 0 4px", fontSize:26, fontWeight:900, color:"#fff", letterSpacing:-0.5 }}>₹{todayTotal.toLocaleString("en-IN")}</p>
            <p style={{ margin:0, fontSize:12, color:"rgba(255,255,255,0.45)", fontWeight:500 }}>
              {todayEntries.length} pickup{todayEntries.length !== 1 ? "s" : ""} today
            </p>
          </div>
          <div style={{ background:"rgba(255,255,255,0.1)", borderRadius:16, padding:"16px 18px", backdropFilter:"blur(10px)", border:"1px solid rgba(255,255,255,0.12)" }}>
            <p style={{ margin:"0 0 8px", fontSize:11, color:"rgba(255,255,255,0.55)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em" }}>Monthly Revenue</p>
            <p style={{ margin:"0 0 4px", fontSize:26, fontWeight:900, color:"#fff", letterSpacing:-0.5 }}>₹{monthTotal.toLocaleString("en-IN")}</p>
            <p style={{ margin:0, fontSize:12, color:"rgba(255,255,255,0.45)", fontWeight:500 }}>
              {monthEntries.length} entries this month
            </p>
          </div>
        </div>
      </div>

      {/* ── Overdue Alert ── */}
      {overdueEntries.length > 0 && (
        <div className="d-card" style={{ animationDelay:"0.04s", background:"linear-gradient(135deg,#7f1d1d,#dc2626)", borderRadius:16, padding:"14px 20px", marginBottom:16, display:"flex", alignItems:"center", gap:14, cursor:"pointer", boxShadow:"0 4px 16px rgba(220,38,38,0.3)" }}
          onClick={() => router.push("/deliveries")}>
          <div style={{ width:40, height:40, borderRadius:11, background:"rgba(255,255,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, animation:"pulse 1.5s infinite" }}>
            <AlertTriangle size={20} color="#fff" />
          </div>
          <div style={{ flex:1 }}>
            <div style={{ color:"#fff", fontWeight:800, fontSize:14 }}>
              {overdueEntries.length} Overdue Deliver{overdueEntries.length > 1 ? "ies" : "y"}
            </div>
            <div style={{ color:"rgba(255,255,255,0.65)", fontSize:12, marginTop:2 }}>
              These orders have passed their delivery date — action required
            </div>
          </div>
          <ChevronRight size={18} color="rgba(255,255,255,0.5)" />
        </div>
      )}

      {/* ── 4 Stat Cards ── */}
      <div className="d-card" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20, animationDelay:"0.06s" }}>
        {[
          { icon:<Users size={18}/>,       label:"Customers",  value: customers.length,  color:"#7c3aed", bg:"#f5f3ff", border:"#e9d5ff" },
          { icon:<Package size={18}/>,     label:"Pending",    value: pendingCount,       color:"#d97706", bg:"#fffbeb", border:"#fde68a" },
          { icon:<CheckCircle2 size={18}/>,label:"Delivered",  value: deliveredCount,     color:"#059669", bg:"#f0fdf4", border:"#a7f3d0" },
          { icon:<TrendingUp size={18}/>,  label:"Delivery %", value:`${deliveryRate}%`,  color:"#1d4ed8", bg:"#eff6ff", border:"#bfdbfe" },
        ].map((s, i) => (
          <div key={i} style={{ background:s.bg, borderRadius:16, padding:"16px 12px", display:"flex", flexDirection:"column", alignItems:"center", gap:6, border:`1.5px solid ${s.border}`, boxShadow:"0 2px 8px rgba(0,0,0,0.04)" }}>
            <div style={{ width:38, height:38, borderRadius:11, background:"#fff", display:"flex", alignItems:"center", justifyContent:"center", color:s.color, boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
              {s.icon}
            </div>
            <p style={{ margin:0, fontSize:22, fontWeight:900, color:"#0f172a", lineHeight:1 }}>{s.value}</p>
            <p style={{ margin:0, fontSize:11, color:"#94a3b8", fontWeight:600 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Quick Actions ── */}
      <div className="d-card" style={{ marginBottom:20, animationDelay:"0.09s" }}>
        <p style={{ margin:"0 0 14px", fontSize:11, fontWeight:800, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.1em" }}>Quick Actions</p>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:10 }}>
          {[
            { icon:<PlusCircle size={20}/>,    label:"New Entry",   path:"/new-entry",   color:"#1d4ed8", bg:"#eff6ff" },
            { icon:<Truck size={20}/>,         label:"Deliveries",  path:"/deliveries",  color:"#d97706", bg:"#fffbeb" },
            { icon:<ClipboardList size={20}/>, label:"Entries",     path:"/entries",     color:"#059669", bg:"#f0fdf4" },
            { icon:<Users size={20}/>,         label:"Customers",   path:"/customers",   color:"#7c3aed", bg:"#f5f3ff" },
            { icon:<Wallet size={20}/>,        label:"Accounting",  path:"/accounting",  color:"#be185d", bg:"#fdf2f8" },
            { icon:<Hammer size={20}/>,        label:"Labour",      path:"/labour",      color:"#0891b2", bg:"#ecfeff" },
          ].map((a, i) => (
            <div key={i} className="act-btn" onClick={() => router.push(a.path)}
              style={{ background:"#fff", border:`1.5px solid #f1f5f9`, borderRadius:16, padding:"16px 8px", display:"flex", flexDirection:"column", alignItems:"center", gap:8, cursor:"pointer", boxShadow:"0 2px 8px rgba(0,0,0,0.05)" }}
              onMouseEnter={e => { e.currentTarget.style.background=a.bg; e.currentTarget.style.borderColor=a.color+"44"; }}
              onMouseLeave={e => { e.currentTarget.style.background="#fff"; e.currentTarget.style.borderColor="#f1f5f9"; }}
            >
              <div style={{ width:42, height:42, borderRadius:12, background:a.bg, display:"flex", alignItems:"center", justifyContent:"center", color:a.color }}>
                {a.icon}
              </div>
              <span style={{ fontSize:10, fontWeight:700, color:"#475569", textAlign:"center", lineHeight:1.3 }}>{a.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Due Today ── */}
      {dueTodayEntries.length > 0 && (
        <DeliverySection title="Deliver Today" emoji="🚚" entries={dueTodayEntries} accentColor="#d97706" bgColor="#fffbeb" borderColor="#fde68a" router={router} />
      )}

      {/* ── Overdue ── */}
      {overdueEntries.length > 0 && (
        <DeliverySection title="Overdue" emoji="⚠️" entries={overdueEntries} accentColor="#dc2626" bgColor="#fef2f2" borderColor="#fecaca" router={router} showDaysOverdue today={today} />
      )}

      {/* ── Upcoming ── */}
      {upcomingEntries.length > 0 && (
        <DeliverySection title="Upcoming" emoji="📅" entries={upcomingEntries.slice(0,4)} accentColor="#2563eb" bgColor="#eff6ff" borderColor="#bfdbfe" router={router} />
      )}

      {/* ── Today's Pickups ── */}
      <div className="d-card" style={{ animationDelay:"0.17s" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:32, height:32, borderRadius:9, background:"#eff6ff", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Package size={16} color="#1d4ed8" />
            </div>
            <p style={{ margin:0, fontWeight:800, fontSize:15, color:"#0f172a" }}>
              Today&apos;s Pickups
              {todayEntries.length > 0 && (
                <span style={{ marginLeft:8, background:"#1d4ed8", color:"#fff", fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:20 }}>
                  {todayEntries.length}
                </span>
              )}
            </p>
          </div>
          {todayEntries.length > 4 && (
            <button onClick={() => router.push("/entries")} style={{ background:"none", border:"none", color:"#3b82f6", fontSize:13, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:4 }}>
              See all <ChevronRight size={14} />
            </button>
          )}
        </div>

        {todayEntries.length === 0 ? (
          <div style={{ background:"#f8fafc", borderRadius:16, padding:"40px 20px", textAlign:"center", border:"1.5px dashed #e2e8f0" }}>
            <div style={{ fontSize:40, marginBottom:12 }}>📋</div>
            <p style={{ color:"#94a3b8", fontSize:14, margin:"0 0 16px", fontWeight:500 }}>No pickups today</p>
            <button onClick={() => router.push("/new-entry")}
              style={{ background:"linear-gradient(135deg,#1e3a8a,#1d4ed8)", color:"#fff", border:"none", borderRadius:12, padding:"11px 24px", fontSize:13, fontWeight:700, cursor:"pointer", boxShadow:"0 4px 12px rgba(29,78,216,0.3)" }}>
              + New Entry
            </button>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {todayEntries.slice(0,5).map((entry, i) => {
              const colors = [["#1d4ed8","#3b82f6"],["#7c3aed","#a855f7"],["#059669","#10b981"],["#d97706","#f59e0b"],["#be185d","#ec4899"]];
              const [c1,c2] = colors[i % 5];
              return (
                <div key={entry.id} className="entry-row"
                  style={{ background:"#fff", borderRadius:14, padding:"14px 18px", display:"flex", justifyContent:"space-between", alignItems:"center", border:"1.5px solid #f1f5f9", boxShadow:"0 2px 6px rgba(0,0,0,0.04)" }}
                  onClick={() => router.push("/new-entry")}
                >
                  <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                    <div style={{ width:42, height:42, borderRadius:13, background:`linear-gradient(135deg,${c1},${c2})`, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:800, fontSize:17, flexShrink:0, boxShadow:`0 4px 10px ${c1}44` }}>
                      {entry.customer?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p style={{ margin:0, fontWeight:700, fontSize:14, color:"#0f172a" }}>{entry.customer?.name}</p>
                      <p style={{ margin:"3px 0 0", fontSize:11, color:"#94a3b8" }}>
                        {entry.items?.slice(0,2).map(it => it.service_name).join(" · ")}
                        {(entry.items?.length||0) > 2 && <span style={{ color:"#cbd5e1" }}> +{(entry.items?.length||0)-2} more</span>}
                      </p>
                    </div>
                  </div>
                  <div style={{ textAlign:"right", flexShrink:0 }}>
                    <p style={{ margin:0, fontWeight:800, fontSize:15, color:"#0f172a" }}>₹{Number(entry.total_amount).toLocaleString("en-IN")}</p>
                    <p style={{ margin:"4px 0 0", fontSize:11, fontWeight:600, color:statusColor[entry.delivery_status] }}>
                      ● {statusLabel[entry.delivery_status] ?? entry.delivery_status}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ProtectedLayout>
  );
}

function DeliverySection({ title, emoji, entries, accentColor, bgColor, borderColor, router, showDaysOverdue, today }: {
  title: string; emoji: string; entries: LaundryEntry[]; accentColor: string; bgColor: string;
  borderColor: string; router: ReturnType<typeof useRouter>;
  showDaysOverdue?: boolean; today?: string;
}) {
  const daysOverdue = (date: string) => {
    const diff = new Date(today!).getTime() - new Date(date + "T00:00:00").getTime();
    return Math.floor(diff / 86400000);
  };

  return (
    <div className="d-card" style={{ marginBottom:16 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:16 }}>{emoji}</span>
          <span style={{ fontWeight:800, fontSize:14, color:"#0f172a" }}>{title}</span>
          <span style={{ background:accentColor, color:"#fff", fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:20 }}>
            {entries.length}
          </span>
        </div>
        <button onClick={() => router.push("/deliveries")}
          style={{ background:"none", border:"none", color:accentColor, fontSize:12, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:3 }}>
          Manage <ChevronRight size={13} />
        </button>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {entries.map(entry => (
          <div key={entry.id} onClick={() => router.push("/deliveries")}
            style={{ background:bgColor, borderRadius:14, padding:"13px 16px", border:`1.5px solid ${borderColor}`, cursor:"pointer", display:"flex", alignItems:"center", gap:12, transition:"opacity 0.15s" }}>
            <div style={{ width:38, height:38, borderRadius:10, background:accentColor+"20", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <Truck size={17} color={accentColor} />
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:700, fontSize:14, color:"#0f172a" }}>{entry.customer?.name}</div>
              <div style={{ fontSize:11, color:"#64748b", marginTop:2 }}>
                {entry.items?.slice(0,2).map(it => it.service_name).join(" · ")}
                {(entry.items?.length||0) > 2 && ` +${(entry.items?.length||0)-2}`}
              </div>
            </div>
            <div style={{ textAlign:"right", flexShrink:0 }}>
              <div style={{ fontWeight:800, fontSize:13, color:accentColor }}>
                {showDaysOverdue ? `${daysOverdue(entry.delivery_date!)}d late` : fmtDate(entry.delivery_date!)}
              </div>
              <div style={{ fontSize:11, color:"#94a3b8", marginTop:2 }}>₹{Number(entry.total_amount).toLocaleString("en-IN")}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
