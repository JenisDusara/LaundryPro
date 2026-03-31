"use client";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, PlusCircle, Users, ClipboardList, Truck,
  BarChart3, Wrench, Hammer, LogOut, X, MoreHorizontal, User, Key, Eye, EyeOff
} from "lucide-react";
import api from "@/lib/api";

const navItems = [
  { path: "/dashboard",  label: "Dashboard",  icon: LayoutDashboard },
  { path: "/new-entry",  label: "New Entry",   icon: PlusCircle },
  { path: "/customers",  label: "Customers",   icon: Users },
  { path: "/entries",    label: "Entries",     icon: ClipboardList },
  { path: "/deliveries", label: "Deliveries",  icon: Truck },
  { path: "/reports",    label: "Reports",     icon: BarChart3 },
  { path: "/services",   label: "Services",    icon: Wrench },
  { path: "/labour",     label: "Labour",      icon: Hammer },
];

const mobileNav = [
  { path: "/dashboard",  label: "Home",      icon: LayoutDashboard },
  { path: "/new-entry",  label: "New",       icon: PlusCircle },
  { path: "/customers",  label: "Customers", icon: Users },
  { path: "/entries",    label: "Entries",   icon: ClipboardList },
];

const moreItems = [
  { path: "/reports",   label: "Reports",   icon: BarChart3 },
  { path: "/services",  label: "Services",  icon: Wrench },
  { path: "/labour",    label: "Labour",    icon: Hammer },
  { path: "/customers", label: "Customers", icon: Users },
];

export default function Sidebar({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [showMore, setShowMore] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [profile, setProfile] = useState<{name:string;username:string}|null>(null);
  const [oldPass, setOldPass] = useState(""); const [newPass, setNewPass] = useState(""); const [confirmPass, setConfirmPass] = useState("");
  const [showOld, setShowOld] = useState(false); const [showNew, setShowNew] = useState(false);
  const [passMsg, setPassMsg] = useState<{text:string;ok:boolean}|null>(null); const [passLoading, setPassLoading] = useState(false);

  useEffect(() => {
    api.get("/auth/me").then(r => setProfile(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setShowProfile(false);
    setShowMore(false);
  }, [pathname]);

  const logout = () => { localStorage.removeItem("token"); router.push("/login"); };
  const goTo   = (path: string) => { router.push(path); setShowMore(false); };

  const changePassword = async () => {
    if (!oldPass || !newPass || !confirmPass) { setPassMsg({text:"Please fill all fields",ok:false}); return; }
    if (newPass !== confirmPass) { setPassMsg({text:"New passwords do not match",ok:false}); return; }
    if (newPass.length < 6) { setPassMsg({text:"Password must be at least 6 characters",ok:false}); return; }
    setPassLoading(true);
    try {
      await api.post("/admin/change-password", {old_password:oldPass, new_password:newPass});
      setPassMsg({text:"Password changed successfully!",ok:true});
      setOldPass(""); setNewPass(""); setConfirmPass("");
    } catch(e:any) { setPassMsg({text:e.response?.data?.detail||"Something went wrong",ok:false}); }
    finally { setPassLoading(false); setTimeout(()=>setPassMsg(null), 4000); }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f0f4f8" }}>

      {/* ── Desktop Sidebar ── */}
      <aside className="sidebar" style={{
        width: 230, position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 50,
        background: "linear-gradient(180deg, #0f172a 0%, #1e3a8a 60%, #1d4ed8 100%)",
        display: "flex", flexDirection: "column", boxShadow: "4px 0 24px rgba(0,0,0,0.18)"
      }}>
        {/* Brand */}
        <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: "linear-gradient(135deg,#3b82f6,#60a5fa)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, boxShadow: "0 4px 12px rgba(59,130,246,0.4)"
            }}>👔</div>
            <div>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 17, letterSpacing: -0.3 }}>LaundryPro</div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>Management System</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 10px", overflowY: "auto" }}>
          {navItems.map(item => {
            const active = pathname === item.path;
            return (
              <div key={item.path}
                onClick={() => router.push(item.path)}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "11px 14px", borderRadius: 10, marginBottom: 2,
                  cursor: "pointer", transition: "all 0.15s",
                  background: active ? "rgba(255,255,255,0.15)" : "transparent",
                  color: active ? "#fff" : "rgba(255,255,255,0.55)",
                  fontWeight: active ? 700 : 500, fontSize: 14,
                  boxShadow: active ? "0 2px 8px rgba(0,0,0,0.2)" : "none",
                }}
                onMouseEnter={e => { if(!active) e.currentTarget.style.background="rgba(255,255,255,0.08)"; e.currentTarget.style.color="#fff"; }}
                onMouseLeave={e => { if(!active) { e.currentTarget.style.background="transparent"; e.currentTarget.style.color="rgba(255,255,255,0.55)"; } }}
              >
                {active && <div style={{ position:"absolute", left:0, width:3, height:32, borderRadius:"0 4px 4px 0", background:"#60a5fa" }}/>}
                <item.icon size={18} />
                <span>{item.label}</span>
              </div>
            );
          })}
        </nav>

        {/* Profile Card (clickable) */}
        <div style={{ padding: "12px 10px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          {profile && (
            <div
              onClick={() => setShowProfile(true)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", borderRadius: 12,
                background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)",
                cursor: "pointer", transition: "all 0.15s"
              }}
              onMouseEnter={e => { e.currentTarget.style.background="rgba(255,255,255,0.13)"; }}
              onMouseLeave={e => { e.currentTarget.style.background="rgba(255,255,255,0.07)"; }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: "linear-gradient(135deg,#3b82f6,#60a5fa)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 800, fontSize: 15, color: "#fff",
                boxShadow: "0 2px 8px rgba(59,130,246,0.4)"
              }}>
                {profile.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {profile.name}
                </div>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>@{profile.username}</div>
              </div>
              <User size={14} color="rgba(255,255,255,0.35)" />
            </div>
          )}
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="main-content" style={{
        flex: 1, marginLeft: 230, padding: 28, paddingBottom: 90,
        width: "calc(100% - 230px)", minHeight: "100vh"
      }}>
        {children}
      </main>

      {/* ── Mobile Bottom Bar ── */}
      <nav className="bottom-bar" style={{
        display: "none", position: "fixed", bottom: 0, left: 0, right: 0,
        background: "#fff", borderTop: "1px solid #e2e8f0",
        justifyContent: "space-around", padding: "8px 0 14px", zIndex: 100,
        boxShadow: "0 -4px 16px rgba(0,0,0,0.06)"
      }}>
        {mobileNav.map(item => {
          const active = pathname === item.path;
          return (
            <div key={item.path}
              onClick={() => goTo(item.path)}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer", color: active ? "#1d4ed8" : "#94a3b8" }}>
              <item.icon size={22} />
              <span style={{ fontSize: 10, fontWeight: active ? 700 : 500 }}>{item.label}</span>
            </div>
          );
        })}
        <div
          onClick={() => setShowMore(v => !v)}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer", color: showMore ? "#1d4ed8" : "#94a3b8" }}>
          <MoreHorizontal size={22} />
          <span style={{ fontSize: 10 }}>More</span>
        </div>
      </nav>

      {/* ── Profile Modal ── */}
      {showProfile && profile && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:300, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}
          onClick={() => setShowProfile(false)}>
          <div style={{ background:"#fff", borderRadius:20, width:"100%", maxWidth:360, boxShadow:"0 20px 60px rgba(0,0,0,0.25)", maxHeight:"90vh", overflowY:"auto" }}
            onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div style={{ background:"linear-gradient(135deg,#0f172a,#1e3a8a)", padding:"28px 24px 24px", position:"relative" }}>
              <button onClick={() => setShowProfile(false)} style={{ position:"absolute", top:14, right:14, background:"rgba(255,255,255,0.1)", border:"none", borderRadius:8, padding:6, cursor:"pointer", display:"flex" }}>
                <X size={16} color="#fff" />
              </button>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
                <div style={{ width:70, height:70, borderRadius:20, background:"linear-gradient(135deg,#3b82f6,#60a5fa)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:30, color:"#fff", boxShadow:"0 4px 16px rgba(59,130,246,0.5)" }}>
                  {profile.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ textAlign:"center" }}>
                  <div style={{ color:"#fff", fontWeight:800, fontSize:18 }}>{profile.name}</div>
                  <div style={{ color:"rgba(255,255,255,0.5)", fontSize:13, marginTop:2 }}>@{profile.username}</div>
                </div>
              </div>
            </div>

            <div style={{ padding:"20px" }}>
              {/* Change Password Section */}
              <div style={{ marginBottom:18 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
                  <div style={{ width:32, height:32, borderRadius:8, background:"#eff6ff", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <Key size={15} color="#1d4ed8" />
                  </div>
                  <span style={{ fontWeight:700, fontSize:14, color:"#1e293b" }}>Change Password</span>
                </div>

                {/* Old Password */}
                <div style={{ position:"relative", marginBottom:10 }}>
                  <input
                    type={showOld?"text":"password"}
                    placeholder="Current Password"
                    value={oldPass}
                    onChange={e=>setOldPass(e.target.value)}
                    style={{ width:"100%", padding:"10px 40px 10px 12px", border:"1.5px solid #e2e8f0", borderRadius:10, fontSize:14, outline:"none", boxSizing:"border-box", background:"#f8fafc" }}
                  />
                  <button onClick={()=>setShowOld(v=>!v)} style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", display:"flex", padding:2 }}>
                    {showOld?<EyeOff size={16} color="#94a3b8"/>:<Eye size={16} color="#94a3b8"/>}
                  </button>
                </div>

                {/* New Password */}
                <div style={{ position:"relative", marginBottom:10 }}>
                  <input
                    type={showNew?"text":"password"}
                    placeholder="New Password"
                    value={newPass}
                    onChange={e=>setNewPass(e.target.value)}
                    style={{ width:"100%", padding:"10px 40px 10px 12px", border:"1.5px solid #e2e8f0", borderRadius:10, fontSize:14, outline:"none", boxSizing:"border-box", background:"#f8fafc" }}
                  />
                  <button onClick={()=>setShowNew(v=>!v)} style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", display:"flex", padding:2 }}>
                    {showNew?<EyeOff size={16} color="#94a3b8"/>:<Eye size={16} color="#94a3b8"/>}
                  </button>
                </div>

                {/* Confirm Password */}
                <div style={{ marginBottom:12 }}>
                  <input
                    type="password"
                    placeholder="Confirm New Password"
                    value={confirmPass}
                    onChange={e=>setConfirmPass(e.target.value)}
                    style={{ width:"100%", padding:"10px 12px", border:`1.5px solid ${confirmPass && confirmPass!==newPass?"#fca5a5":"#e2e8f0"}`, borderRadius:10, fontSize:14, outline:"none", boxSizing:"border-box", background:"#f8fafc" }}
                  />
                </div>

                {passMsg && (
                  <div style={{ padding:"9px 12px", borderRadius:8, marginBottom:12, fontSize:13, fontWeight:600, background:passMsg.ok?"#f0fdf4":"#fef2f2", color:passMsg.ok?"#16a34a":"#dc2626", border:`1px solid ${passMsg.ok?"#bbf7d0":"#fecaca"}` }}>
                    {passMsg.text}
                  </div>
                )}

                <button
                  onClick={changePassword}
                  disabled={passLoading}
                  style={{ width:"100%", padding:"11px", border:"none", borderRadius:10, cursor:passLoading?"not-allowed":"pointer", background:"linear-gradient(135deg,#1e3a8a,#1d4ed8)", color:"#fff", fontWeight:700, fontSize:14, display:"flex", alignItems:"center", justifyContent:"center", gap:8, opacity:passLoading?0.7:1 }}>
                  <Key size={15}/> {passLoading?"Saving...":"Change Password"}
                </button>
              </div>

              {/* Divider */}
              <div style={{ borderTop:"1px solid #f1f5f9", marginBottom:16 }}/>

              {/* Logout */}
              <button
                onClick={() => { setShowProfile(false); logout(); }}
                style={{ width:"100%", padding:"11px", border:"none", borderRadius:10, cursor:"pointer", background:"linear-gradient(135deg,#ef4444,#dc2626)", color:"#fff", fontWeight:700, fontSize:14, display:"flex", alignItems:"center", justifyContent:"center", gap:8, boxShadow:"0 4px 12px rgba(239,68,68,0.3)" }}>
                <LogOut size={15}/> Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── More Overlay ── */}
      {showMore && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 200, display: "flex", alignItems: "flex-end" }}
          onClick={() => setShowMore(false)}>
          <div style={{ background: "#fff", width: "100%", borderRadius: "20px 20px 0 0", padding: "20px 16px 36px" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <span style={{ fontWeight: 700, fontSize: 16, color: "#0f172a" }}>More Options</span>
              <button onClick={() => setShowMore(false)} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, padding: 6, cursor: "pointer", display: "flex" }}>
                <X size={18} color="#64748b" />
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
              {moreItems.map(item => (
                <div key={item.path}
                  onClick={() => goTo(item.path)}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center",
                    padding: "14px 8px", borderRadius: 14, cursor: "pointer",
                    background: pathname === item.path ? "#eff6ff" : "#f8fafc",
                    color: pathname === item.path ? "#1d4ed8" : "#475569",
                    border: pathname === item.path ? "1.5px solid #bfdbfe" : "1.5px solid transparent"
                  }}>
                  <item.icon size={22} />
                  <span style={{ fontSize: 11, fontWeight: 600, marginTop: 5 }}>{item.label}</span>
                </div>
              ))}
              <div
                onClick={logout}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "14px 8px", borderRadius: 14, cursor: "pointer", background: "#fff5f5", color: "#ef4444", border: "1.5px solid #fecaca" }}>
                <LogOut size={22} />
                <span style={{ fontSize: 11, fontWeight: 600, marginTop: 5 }}>Logout</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
