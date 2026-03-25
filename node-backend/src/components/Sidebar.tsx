"use client";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { Home, PlusCircle, Users, ClipboardList, Truck, BarChart3, Settings, Hammer, LogOut, Menu, X } from "lucide-react";

const navItems = [
  { path: "/dashboard", label: "Home", icon: Home },
  { path: "/new-entry", label: "New Entry", icon: PlusCircle },
  { path: "/customers", label: "Customers", icon: Users },
  { path: "/entries", label: "Entries", icon: ClipboardList },
  { path: "/deliveries", label: "Deliveries", icon: Truck },
  { path: "/reports", label: "Reports", icon: BarChart3 },
  { path: "/services", label: "Services", icon: Settings },
  { path: "/labour", label: "Labour", icon: Hammer },
  { path: "/admin", label: "Admin", icon: Settings },
];

const mobileNav = [
  { path: "/dashboard", label: "Home", icon: Home },
  { path: "/new-entry", label: "New", icon: PlusCircle },
  { path: "/entries", label: "Entries", icon: ClipboardList },
  { path: "/deliveries", label: "Delivery", icon: Truck },
];

const moreItems = [
  { path: "/reports", label: "Reports", icon: BarChart3 },
  { path: "/services", label: "Services", icon: Settings },
  { path: "/labour", label: "Labour", icon: Hammer },
  { path: "/customers", label: "Customers", icon: Users },
  { path: "/admin", label: "Admin", icon: Settings },
];

export default function Sidebar({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [showMore, setShowMore] = useState(false);

  const logout = () => { localStorage.removeItem("token"); router.push("/login"); };
  const goTo = (path: string) => { router.push(path); setShowMore(false); };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f1f5f9" }}>
      {/* Desktop Sidebar */}
      <aside className="sidebar" style={{ width: 220, background: "#fff", borderRight: "1px solid #e2e8f0", padding: "16px 0", display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 50 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#1e3a8a", padding: "8px 20px 24px" }}>👔 LaundryPro</div>
        <nav style={{ flex: 1 }}>
          {navItems.map(item => {
            const active = pathname === item.path;
            return (
              <div key={item.path}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", cursor: "pointer", color: active ? "#1e40af" : "#475569", fontSize: 14, fontWeight: 500, background: active ? "#eff6ff" : "transparent", borderRight: active ? "3px solid #1e40af" : "none" }}
                onClick={() => router.push(item.path)}>
                <item.icon size={20} />
                <span>{item.label}</span>
              </div>
            );
          })}
        </nav>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", cursor: "pointer", color: "#ef4444", fontSize: 14 }} onClick={logout}>
          <LogOut size={20} /><span>Logout</span>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content" style={{ flex: 1, marginLeft: 220, padding: 24, paddingBottom: 80, width: "calc(100% - 220px)" }}>
        {children}
      </main>

      {/* Mobile Bottom Bar */}
      <nav className="bottom-bar" style={{ display: "none", position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff", borderTop: "1px solid #e2e8f0", justifyContent: "space-around", padding: "8px 0 12px", zIndex: 100 }}>
        {mobileNav.map(item => {
          const active = pathname === item.path;
          return (
            <div key={item.path} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, cursor: "pointer", color: active ? "#1e40af" : "#94a3b8" }} onClick={() => goTo(item.path)}>
              <item.icon size={22} />
              <span style={{ fontSize: 10 }}>{item.label}</span>
            </div>
          );
        })}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, cursor: "pointer", color: showMore ? "#1e40af" : "#94a3b8" }} onClick={() => setShowMore(v => !v)}>
          <Menu size={22} />
          <span style={{ fontSize: 10 }}>More</span>
        </div>
      </nav>

      {/* More Overlay */}
      {showMore && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 200, display: "flex", alignItems: "flex-end" }} onClick={() => setShowMore(false)}>
          <div style={{ background: "#fff", width: "100%", borderRadius: "16px 16px 0 0", padding: "16px 16px 32px" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: "#1e3a8a" }}>More Options</span>
              <X size={20} color="#64748b" style={{ cursor: "pointer" }} onClick={() => setShowMore(false)} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
              {moreItems.map(item => (
                <div key={item.path} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "14px 8px", borderRadius: 12, cursor: "pointer", background: pathname === item.path ? "#eff6ff" : "#f8fafc", color: pathname === item.path ? "#1e40af" : "#475569" }} onClick={() => goTo(item.path)}>
                  <item.icon size={24} />
                  <span style={{ fontSize: 12, fontWeight: 600, marginTop: 4 }}>{item.label}</span>
                </div>
              ))}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "14px 8px", borderRadius: 12, cursor: "pointer", background: "#fef2f2", color: "#ef4444" }} onClick={logout}>
                <LogOut size={24} />
                <span style={{ fontSize: 12, fontWeight: 600, marginTop: 4 }}>Logout</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
