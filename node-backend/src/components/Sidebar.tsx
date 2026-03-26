"use client";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, PlusCircle, Users, ClipboardList, Truck,
  BarChart3, Wrench, Hammer, ShieldCheck, LogOut, X, MoreHorizontal
} from "lucide-react";

const navItems = [
  { path: "/dashboard",  label: "Dashboard",  icon: LayoutDashboard },
  { path: "/new-entry",  label: "New Entry",   icon: PlusCircle },
  { path: "/customers",  label: "Customers",   icon: Users },
  { path: "/entries",    label: "Entries",     icon: ClipboardList },
  { path: "/deliveries", label: "Deliveries",  icon: Truck },
  { path: "/reports",    label: "Reports",     icon: BarChart3 },
  { path: "/services",   label: "Services",    icon: Wrench },
  { path: "/labour",     label: "Labour",      icon: Hammer },
  { path: "/admin",      label: "Admin",       icon: ShieldCheck },
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
  { path: "/admin",     label: "Admin",     icon: ShieldCheck },
];

export default function Sidebar({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [showMore, setShowMore] = useState(false);

  const logout = () => { localStorage.removeItem("token"); router.push("/login"); };
  const goTo   = (path: string) => { router.push(path); setShowMore(false); };

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

        {/* Logout */}
        <div style={{ padding: "12px 10px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <div
            onClick={logout}
            style={{
              display: "flex", alignItems: "center", gap: 12, padding: "11px 14px",
              borderRadius: 10, cursor: "pointer", color: "rgba(255,100,100,0.8)",
              fontSize: 14, fontWeight: 500, transition: "all 0.15s"
            }}
            onMouseEnter={e => { e.currentTarget.style.background="rgba(239,68,68,0.15)"; e.currentTarget.style.color="#f87171"; }}
            onMouseLeave={e => { e.currentTarget.style.background="transparent"; e.currentTarget.style.color="rgba(255,100,100,0.8)"; }}
          >
            <LogOut size={18} /><span>Logout</span>
          </div>
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
