import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Home, PlusCircle, Users, ClipboardList, Settings,
  LogOut, Truck, BarChart3, X, Menu, Hammer,
} from "lucide-react";

const navItems = [
  { path: "/", label: "Home", icon: Home },
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
  { path: "/", label: "Home", icon: Home },
  { path: "/new-entry", label: "New", icon: PlusCircle },
  { path: "/entries", label: "Entries", icon: ClipboardList },
  { path: "/deliveries", label: "Delivery", icon: Truck },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showMore, setShowMore] = useState(false);

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const goTo = (path: string) => {
    navigate(path);
    setShowMore(false);
  };

  const moreItems = [
    { path: "/reports", label: "Reports", icon: BarChart3 },
    { path: "/services", label: "Services", icon: Settings },
    { path: "/labour", label: "Labour", icon: Hammer },
    { path: "/customers", label: "Customers", icon: Users },
    { path: "/admin", label: "Admin", icon: Settings },
  ];

  return (
    <div style={s.wrapper}>
      {/* Desktop Sidebar */}
      <aside className="sidebar" style={s.sidebar}>
        <div style={s.brand}>👔 LaundryPro</div>
        <nav style={s.nav}>
          {navItems.map(item => {
            const active = location.pathname === item.path;
            return (
              <div key={item.path}
                style={{ ...s.navItem, ...(active ? s.navActive : {}) }}
                onClick={() => navigate(item.path)}>
                <item.icon size={20} />
                <span>{item.label}</span>
              </div>
            );
          })}
        </nav>
        <div style={s.navItem} onClick={logout}>
          <LogOut size={20} />
          <span>Logout</span>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content" style={s.main}>{children}</main>

      {/* Mobile Bottom Tab */}
      <nav className="bottom-bar" style={s.bottomBar}>
        {mobileNav.map(item => {
          const active = location.pathname === item.path;
          return (
            <div key={item.path}
              style={{ ...s.tab, color: active ? "#1e40af" : "#94a3b8" }}
              onClick={() => goTo(item.path)}>
              <item.icon size={22} />
              <span style={s.tabLabel}>{item.label}</span>
            </div>
          );
        })}
        {/* More button */}
        <div style={{ ...s.tab, color: showMore ? "#1e40af" : "#94a3b8" }}
          onClick={() => setShowMore(v => !v)}>
          <Menu size={22} />
          <span style={s.tabLabel}>More</span>
        </div>
      </nav>

      {/* More Menu Overlay */}
      {showMore && (
        <div style={s.overlay} onClick={() => setShowMore(false)}>
          <div style={s.morePanel} onClick={e => e.stopPropagation()}>
            <div style={s.morePanelHeader}>
              <span style={{ fontWeight: 700, fontSize: 15, color: "#1e3a8a" }}>More Options</span>
              <X size={20} color="#64748b" style={{ cursor: "pointer" }} onClick={() => setShowMore(false)} />
            </div>
            <div style={s.moreGrid}>
              {moreItems.map(item => {
                const active = location.pathname === item.path;
                return (
                  <div key={item.path}
                    style={{ ...s.moreItem, background: active ? "#eff6ff" : "#f8fafc", color: active ? "#1e40af" : "#475569" }}
                    onClick={() => goTo(item.path)}>
                    <item.icon size={24} />
                    <span style={{ fontSize: 12, fontWeight: 600, marginTop: 4 }}>{item.label}</span>
                  </div>
                );
              })}
              <div style={{ ...s.moreItem, background: "#fef2f2", color: "#ef4444" }} onClick={logout}>
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

const s: Record<string, React.CSSProperties> = {
  wrapper: { display: "flex", minHeight: "100vh", background: "#f1f5f9" },
  sidebar: {
    width: 220, background: "#fff", borderRight: "1px solid #e2e8f0",
    padding: "16px 0", display: "flex", flexDirection: "column",
    position: "fixed", top: 0, left: 0, bottom: 0,
  },
  brand: { fontSize: 20, fontWeight: 700, color: "#1e3a8a", padding: "8px 20px 24px" },
  nav: { flex: 1 },
  navItem: {
    display: "flex", alignItems: "center", gap: 12, padding: "12px 20px",
    cursor: "pointer", color: "#475569", fontSize: 14, fontWeight: 500,
  },
  navActive: { background: "#eff6ff", color: "#1e40af", borderRight: "3px solid #1e40af" },
  main: { flex: 1, marginLeft: 220, padding: 24, paddingBottom: 80, width: "calc(100% - 220px)" },
  bottomBar: {
    display: "none", position: "fixed", bottom: 0, left: 0, right: 0,
    background: "#fff", borderTop: "1px solid #e2e8f0",
    justifyContent: "space-around", padding: "8px 0 12px", zIndex: 100,
  },
  tab: { display: "flex", flexDirection: "column", alignItems: "center", gap: 2, cursor: "pointer" },
  tabLabel: { fontSize: 10 },
  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
    zIndex: 200, display: "flex", alignItems: "flex-end",
  },
  morePanel: {
    background: "#fff", width: "100%", borderRadius: "16px 16px 0 0",
    padding: "16px 16px 32px",
  },
  morePanelHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16,
  },
  moreGrid: {
    display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10,
  },
  moreItem: {
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    padding: "14px 8px", borderRadius: 12, cursor: "pointer", textAlign: "center",
  },
};