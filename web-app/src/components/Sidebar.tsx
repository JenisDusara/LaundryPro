"use client";
import { useRouter, usePathname } from "next/navigation";
import { LayoutDashboard, PlusCircle, Users, ClipboardList, Truck, BarChart3, Wrench, Hammer, Wallet, MoreHorizontal, Star, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const navItems = [
  { path: "/dashboard",  label: "Dashboard",  icon: LayoutDashboard },
  { path: "/new-entry",  label: "New Entry",   icon: PlusCircle },
  { path: "/customers",  label: "Customers",   icon: Users },
  { path: "/entries",    label: "Entries",     icon: ClipboardList },
  { path: "/deliveries", label: "Deliveries",  icon: Truck },
  { path: "/accounting", label: "Accounting",  icon: Wallet },
  { path: "/reports",    label: "Reports",     icon: BarChart3 },
  { path: "/services",   label: "Services",    icon: Wrench },
  { path: "/labour",     label: "Labour",      icon: Hammer },
  { path: "/reviews",    label: "Reviews",     icon: Star },
];

const mobileNav = [
  { path: "/dashboard",  label: "Home",      icon: LayoutDashboard },
  { path: "/new-entry",  label: "New",       icon: PlusCircle },
  { path: "/customers",  label: "Customers", icon: Users },
  { path: "/entries",    label: "Entries",   icon: ClipboardList },
];

export default function Sidebar({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const { isAuth, logout } = useAuth();

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f0f4f8" }}>

      {/* Desktop Sidebar */}
      <aside className="sidebar" style={{ width: 230, position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 50, background: "linear-gradient(180deg,#0f172a 0%,#1e3a8a 60%,#1d4ed8 100%)", display: "flex", flexDirection: "column", boxShadow: "4px 0 24px rgba(0,0,0,0.18)" }}>

        {/* Brand */}
        <div style={{ padding: "20px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: "linear-gradient(135deg,#3b82f6,#60a5fa)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, boxShadow: "0 4px 12px rgba(59,130,246,0.4)", flexShrink: 0 }}>👔</div>
            <div>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 16, letterSpacing: -0.3 }}>LaundryPro</div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10 }}>Management System</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 10px", overflowY: "auto" }}>
          {navItems.map(item => {
            const active = pathname === item.path;
            return (
              <div key={item.path} onClick={() => router.push(item.path)}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderRadius: 10, marginBottom: 2, cursor: "pointer", transition: "all 0.15s", background: active ? "rgba(255,255,255,0.15)" : "transparent", color: active ? "#fff" : "rgba(255,255,255,0.55)", fontWeight: active ? 700 : 500, fontSize: 14, boxShadow: active ? "0 2px 8px rgba(0,0,0,0.2)" : "none" }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#fff"; } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.55)"; } }}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </div>
            );
          })}
        </nav>

        {/* Bottom: logout only when authenticated */}
        {isAuth && (
          <div style={{ padding: "10px 12px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <button onClick={() => logout()} style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 10, border: "none", background: "transparent", color: "rgba(255,255,255,0.35)", fontWeight: 600, fontSize: 12, cursor: "pointer" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "rgba(255,255,255,0.6)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.35)"; }}>
              <LogOut size={13} /> Logout
            </button>
          </div>
        )}
      </aside>

      {/* Main content */}
      <main className="main-content" style={{ flex: 1, marginLeft: 230, padding: 28, paddingBottom: 90, minHeight: "100vh" }}>
        {children}
      </main>

      {/* Mobile bottom bar */}
      <nav className="bottom-bar" style={{ display: "none", position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff", borderTop: "1px solid #e2e8f0", justifyContent: "space-around", padding: "8px 0 14px", zIndex: 100 }}>
        {mobileNav.map(item => {
          const active = pathname === item.path;
          return (
            <div key={item.path} onClick={() => router.push(item.path)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer", color: active ? "#1d4ed8" : "#94a3b8" }}>
              <item.icon size={22} />
              <span style={{ fontSize: 10, fontWeight: active ? 700 : 500 }}>{item.label}</span>
            </div>
          );
        })}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer", color: "#94a3b8" }}>
          <MoreHorizontal size={22} />
          <span style={{ fontSize: 10 }}>More</span>
        </div>
      </nav>
    </div>
  );
}
