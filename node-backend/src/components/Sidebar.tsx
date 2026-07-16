"use client";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, PlusCircle, Plus, Users, ClipboardList, Truck,
  BarChart3, Wrench, Hammer, LogOut, X, Key, Eye, EyeOff,
  Building2, Wallet, Activity, ShieldCheck, ChevronRight, ChevronDown,
  UserCog, MoreHorizontal, Sun, Moon, Monitor, Check, Settings, Bell,
  UserPlus, Mail, FileSpreadsheet,
} from "lucide-react";
import api from "@/lib/api";
import { isEntryPending } from "@/lib/entry-status";
import { todayIST } from "@/lib/dates";
import type { LaundryEntry } from "@/types";

function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

type Theme = "light" | "dark" | "system";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "system") {
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.setAttribute("data-theme", isDark ? "dark" : "light");
  } else {
    root.setAttribute("data-theme", theme);
  }
}

function getTokenRole(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(payload)).role || null;
  } catch { return null; }
}

const adminNavItems = [
  { path: "/dashboard",  label: "Dashboard",  icon: LayoutDashboard },
  { path: "/new-entry",  label: "New Entry",  icon: PlusCircle },
  { path: "/customers",  label: "Customers",  icon: Users },
  { path: "/entries",    label: "Entries",    icon: ClipboardList },
  { path: "/deliveries", label: "Deliveries", icon: Truck },
  { path: "/accounting", label: "Accounting", icon: Wallet },
  { path: "/reports",    label: "Reports",    icon: BarChart3 },
  { path: "/services",   label: "Services",   icon: Wrench },
  { path: "/labour",     label: "Labour",     icon: Hammer },
  { path: "/staff",      label: "Staff",      icon: UserCog },
  { path: "/settings",   label: "Settings",   icon: Settings },
];

const staffNavItems = [
  { path: "/dashboard",  label: "Dashboard",  icon: LayoutDashboard },
  { path: "/new-entry",  label: "New Entry",  icon: PlusCircle },
  { path: "/customers",  label: "Customers",  icon: Users },
  { path: "/entries",    label: "Entries",    icon: ClipboardList },
  { path: "/deliveries", label: "Deliveries", icon: Truck },
  { path: "/services",   label: "Services",   icon: Wrench },
];

// Mobile bottom bar — 4 real nav items + center FAB handled inline
const mobileNavLeft  = [
  { path: "/dashboard", label: "Home",    icon: LayoutDashboard },
  { path: "/entries",   label: "Entries", icon: ClipboardList },
];
const mobileNavRight = [
  { path: "/deliveries", label: "Deliveries", icon: Truck },
];

type Profile = { name: string; username: string; role?: string; read_only?: boolean; expires_at?: string | null };

export default function Sidebar({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();

  const [showMore,       setShowMore]       = useState(false);
  const [showProfile,    setShowProfile]    = useState(false);
  const [showShopPicker, setShowShopPicker] = useState(false);
  const [shops,          setShops]          = useState<{ shop_id: string; shop_name: string; name: string }[]>([]);
  const [selectedShopId, setSelectedShopId] = useState("");
  const [profile,        setProfile]        = useState<Profile | null>(() => {
    const role = getTokenRole();
    return role ? { name: "", username: "", role } : null;
  });

  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "system";
    return (localStorage.getItem("lp_theme") as Theme) || "system";
  });

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem("lp_theme", theme);
  }, [theme]);

  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("system");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);


  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showPassForm,  setShowPassForm]  = useState(false);
  const [oldPass,       setOldPass]       = useState("");
  const [newPass,       setNewPass]       = useState("");
  const [confirmPass,   setConfirmPass]   = useState("");
  const [showOld,       setShowOld]       = useState(false);
  const [showNew,       setShowNew]       = useState(false);
  const [passMsg,       setPassMsg]       = useState<{ text: string; ok: boolean } | null>(null);
  const [passLoading,   setPassLoading]   = useState(false);

  const [allPending,     setAllPending]     = useState<LaundryEntry[]>([]);
  const [showNotifSheet, setShowNotifSheet] = useState(false);
  const [pendingRequests, setPendingRequests] = useState(0);
  const today = todayIST();

  useEffect(() => {
    api.get("/auth/me").then(r => {
      // /me hands back a fresh token when the DB expiry has changed (e.g. plan renewed),
      // so the subscription lift takes effect on this load instead of after a re-login.
      if (r.data?.access_token && typeof window !== "undefined") localStorage.setItem("token", r.data.access_token);
      setProfile(r.data);
    }).catch(() => {});
    if (typeof window !== "undefined") setSelectedShopId(localStorage.getItem("sa_shop_id") || "");
  }, []);

  useEffect(() => {
    if (profile?.role === "superadmin") api.get("/admin/shops").then(r => setShops(r.data)).catch(() => {});
  }, [profile?.role]);

  useEffect(() => {
    if (profile?.role !== "superadmin") return;
    api.get("/admin/signup-requests").then(r => setPendingRequests(r.data.filter((x: { status: string }) => x.status === "pending").length)).catch(() => {});
  }, [profile?.role]);

  useEffect(() => {
    if (!profile?.role) return;
    // Superadmin only has alerts for a shop they've picked (the api client sends that
    // shop via x-selected-shop); admin/staff always see their own shop.
    if (profile.role === "superadmin" && !selectedShopId) { setAllPending([]); return; }
    api.get("/entries").then(r => {
      // All undelivered orders — including those without a delivery date, so the shop
      // still sees pending work to hand back even when no due date was entered.
      setAllPending(r.data.filter((e: LaundryEntry) => isEntryPending(e)));
    }).catch(() => {});
  }, [profile?.role, selectedShopId]);

  // Alerts are in-app only now — no auto browser/system pop-ups (those were disturbing on
  // every open). The bell just opens the in-app panel on click.
  const openAlerts = () => setShowNotifSheet(true);

  useEffect(() => {
    setShowProfile(false); setShowMore(false); setShowShopPicker(false);
    setShowPassForm(false); setShowThemeMenu(false); setShowNotifSheet(false);
  }, [pathname]);

  const logout = () => {
    localStorage.removeItem("token"); localStorage.removeItem("sa_shop_id");
    router.push("/login");
  };
  const goTo = (path: string) => { router.push(path); setShowMore(false); };
  const selectShop = (shopId: string) => {
    if (shopId) localStorage.setItem("sa_shop_id", shopId); else localStorage.removeItem("sa_shop_id");
    setSelectedShopId(shopId); setShowShopPicker(false); window.location.reload();
  };

  const changePassword = async () => {
    if (!oldPass || !newPass || !confirmPass) { setPassMsg({ text: "Please fill all fields", ok: false }); return; }
    if (newPass !== confirmPass) { setPassMsg({ text: "Passwords do not match", ok: false }); return; }
    if (newPass.length < 6) { setPassMsg({ text: "Min 6 characters required", ok: false }); return; }
    setPassLoading(true);
    try {
      await api.post("/admin/change-password", { old_password: oldPass, new_password: newPass });
      setPassMsg({ text: "Password changed!", ok: true });
      setOldPass(""); setNewPass(""); setConfirmPass("");
    } catch (e: any) { setPassMsg({ text: e.response?.data?.detail || "Failed", ok: false }); }
    finally { setPassLoading(false); setTimeout(() => setPassMsg(null), 4000); }
  };

  const isAdminSection = pathname === "/superadmin" || pathname === "/login-activity" || pathname === "/signup-requests" || pathname === "/weekly-report-log";

  const overdueEntries  = allPending.filter(e => e.delivery_date && e.delivery_date < today);
  const dueTodayEntries = allPending.filter(e => e.delivery_date === today);
  const upcomingEntries = allPending.filter(e => e.delivery_date && e.delivery_date > today);
  const noDateEntries   = allPending.filter(e => !e.delivery_date);
  // Orders needing attention now = overdue + due today + undated pending (future-dated excluded).
  const alertCount      = overdueEntries.length + dueTodayEntries.length + noDateEntries.length;
  // Admin/staff always; superadmin only while viewing a selected shop.
  const showAlerts      = !isAdminSection && (profile?.role !== "superadmin" || !!selectedShopId);

  const navItems = isAdminSection && profile?.role === "superadmin"
    ? [
        { path: "/superadmin", label: "Clients", icon: Building2 },
        { path: "/signup-requests", label: "Signup Requests", icon: UserPlus, badge: pendingRequests || undefined },
        { path: "/weekly-report-log", label: "Weekly Reports", icon: Mail },
        { path: "/login-activity", label: "Login Activity", icon: Activity },
      ]
    : profile?.role === "staff" ? staffNavItems
    : profile?.role === "superadmin" ? [...adminNavItems, { path: "/import", label: "Import", icon: FileSpreadsheet }]
    : adminNavItems;

  const inp: React.CSSProperties = {
    width: "100%", padding: "9px 12px",
    border: "1px solid var(--border)",
    borderRadius: 8, fontSize: 13, outline: "none",
    boxSizing: "border-box",
    background: "var(--bg-input)",
    color: "var(--text-primary)",
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-page)" }}>

      {/* ── Desktop Sidebar ── */}
      <aside className="sidebar" style={{
        width: 224, position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 50,
        background: "var(--bg-sidebar)",
        borderRight: "1px solid var(--border-default)",
        display: "flex", flexDirection: "column",
      }}>

        {/* Brand */}
        <div style={{ padding: "18px 16px 14px", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", gap: 11 }}>
          <img src="/app-icon.svg" alt="LaundryPro" style={{ height: 34, width: "auto", maxWidth: 44, objectFit: "contain", borderRadius: 8, flexShrink: 0 }} />
          <div style={{ fontWeight: 700, fontSize: 16, letterSpacing: "-.01em", color: "var(--text-primary)" }}>LaundryPro</div>
        </div>

        {/* Shop picker (superadmin only) */}
        {profile?.role === "superadmin" && !isAdminSection && (
          <div style={{ margin: "12px 14px 0" }}>
            <div onClick={() => setShowShopPicker(v => !v)}
              style={{ padding: "11px 13px", background: "var(--bg-input)", border: "1px solid var(--border-default)", borderRadius: 12, display: "flex", alignItems: "center", gap: 10, cursor: "pointer", transition: "border-color .15s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "var(--border-active)"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border-default)"}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 700 }}>Shop</div>
                <div style={{ fontWeight: 600, fontSize: 14, marginTop: 3, color: "var(--text-primary)" }}>
                  {selectedShopId ? (shops.find(s => s.shop_id === selectedShopId)?.shop_name || selectedShopId) : "All Shops"}
                </div>
              </div>
              <ChevronDown size={14} color="var(--text-muted)"
                style={{ transform: showShopPicker ? "rotate(180deg)" : "none", transition: "transform .15s", flexShrink: 0 }} />
            </div>
            {showShopPicker && (
              <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, marginTop: 4, overflow: "hidden", boxShadow: "0 6px 18px rgba(0,0,0,.15)", zIndex: 60, position: "relative" }}>
                {[{ shop_id: "", shop_name: "All Shops" }, ...shops].map(s => (
                  <div key={s.shop_id} onClick={() => selectShop(s.shop_id)}
                    style={{
                      padding: "9px 13px", fontSize: 13, cursor: "pointer", fontWeight: 500,
                      background: selectedShopId === s.shop_id ? "var(--grade-b-bg)" : "transparent",
                      color: selectedShopId === s.shop_id ? "var(--grade-b-text)" : "var(--text-primary)",
                      borderLeft: `2px solid ${selectedShopId === s.shop_id ? "var(--accent-primary)" : "transparent"}`,
                      transition: "background .1s",
                    }}
                    onMouseEnter={e => { if (selectedShopId !== s.shop_id) e.currentTarget.style.background = "var(--pressed)"; }}
                    onMouseLeave={e => { if (selectedShopId !== s.shop_id) e.currentTarget.style.background = "transparent"; }}>
                    {s.shop_id ? s.shop_name : "All Shops"}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Nav */}
        <nav style={{ flex: 1, padding: "8px 10px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
          {navItems.map(item => {
            const active = pathname === item.path;
            return (
              <div key={item.path} onClick={() => router.push(item.path)}
                className="lp-nav"
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "8px 12px", borderRadius: 8,
                  cursor: "pointer", transition: "all .15s",
                  background: active ? "var(--grade-b-bg)" : "transparent",
                  color: active ? "var(--grade-b-text)" : "var(--text-secondary)",
                  fontWeight: active ? 700 : 500, fontSize: 13.5,
                  borderLeft: `2px solid ${active ? "var(--accent-primary)" : "transparent"}`,
                }}>
                <item.icon size={15} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {"badge" in item && !!item.badge && (
                  <span style={{ background: "#d97706", color: "#fff", borderRadius: 8, padding: "1px 7px", fontSize: 10.5, fontWeight: 800 }}>{item.badge}</span>
                )}
              </div>
            );
          })}

          {profile?.role === "superadmin" && (
            <div style={{ marginTop: 6, borderTop: "1px solid var(--border-subtle)", paddingTop: 6 }}>
              <div onClick={() => router.push(isAdminSection ? "/dashboard" : "/superadmin")}
                className="lp-nav"
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "8px 12px", borderRadius: 8,
                  cursor: "pointer", transition: "all .15s",
                  background: isAdminSection ? "var(--grade-b-bg)" : "transparent",
                  color: isAdminSection ? "var(--grade-b-text)" : "var(--text-secondary)",
                  fontWeight: isAdminSection ? 700 : 500, fontSize: 13.5,
                }}>
                <ShieldCheck size={15} />
                <span>{isAdminSection ? "← Back to App" : "Admin Panel"}</span>
              </div>
            </div>
          )}
        </nav>

        {/* Profile (sidebar bottom) */}
        {profile && (
          <div style={{ padding: "14px 16px", borderTop: "1px solid var(--border-subtle)" }}>
            <div onClick={() => setShowProfile(true)}
              className="lp-nav"
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 9, cursor: "pointer", transition: "background .15s" }}>
              <div style={{
                width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                background: "var(--grade-b-bg)", border: "1px solid var(--grade-b-border)",
                color: "var(--grade-b-text)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 800, fontSize: 14,
              }}>
                {(profile.name || "?").charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{profile.name}</div>
                <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>@{profile.username}</div>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* ── Main area (header + content) ── */}
      <div className="main-content" style={{ flex: 1, marginLeft: 224, display: "flex", flexDirection: "column", minHeight: "100vh" }}>

        {/* Top header bar */}
        <header style={{
          height: 62, flexShrink: 0,
          padding: "0 28px",
          background: "var(--bg-elevated)",
          borderBottom: "1px solid var(--border-subtle)",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
          position: "sticky", top: 0, zIndex: 40,
        }}>
          {/* Mobile: logo + brand (desktop header keeps only the right-side actions) */}
          <div style={{ display: "none", alignItems: "center", gap: 9 }} className="mob-brand">
            <img src="/app-icon.svg" alt="LaundryPro" style={{ height: 30, width: "auto", maxWidth: 40, objectFit: "contain", borderRadius: 7, flexShrink: 0 }} />
            <div style={{ fontWeight: 800, fontSize: 17, color: "var(--text-primary)", letterSpacing: "-.01em" }}>LaundryPro</div>
          </div>

          {/* Right actions */}
          {showAlerts && (
            <button onClick={openAlerts} title="Alerts" aria-label="Alerts"
              style={{ position: "relative", marginLeft: "auto", background: "var(--bg-input)", border: "1px solid var(--border-default)", borderRadius: 10, padding: "9px", width: 38, height: 38, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)", flexShrink: 0 }}>
              <Bell size={17} color={alertCount > 0 ? "var(--accent-error)" : "var(--accent-success)"} />
              {alertCount > 0 && (
                <span style={{ position: "absolute", top: -6, right: -6, minWidth: 18, height: 18, padding: "0 4px", borderRadius: 9, background: "var(--accent-error)", color: "#fff", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {alertCount}
                </span>
              )}
            </button>
          )}

        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: "28px 32px 60px" }}>
          {profile?.read_only && (
            <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 10, padding: "11px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 16 }}>⚠️</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: "#92400E" }}>Subscription Expired — Read-Only Mode</div>
                <div style={{ fontSize: 12, color: "#A16207", marginTop: 2 }}>
                  You can view data but cannot make changes.
                  {profile.expires_at && (() => {
                    const days = Math.abs(Math.ceil((Date.now() - new Date(profile.expires_at!).getTime()) / 86400000));
                    return ` Expired ${days} day${days !== 1 ? "s" : ""} ago.`;
                  })()}
                </div>
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#D97706" }}>Contact Admin</span>
            </div>
          )}
          {children}
        </main>
      </div>

      {/* ── Mobile Bottom Bar ── */}
      <nav className="bottom-bar" style={{
        display: "none", position: "fixed", bottom: 0, left: 0, right: 0,
        background: "var(--bg-card-solid)", borderTop: "1px solid var(--border)",
        justifyContent: "space-around", alignItems: "center",
        // Include the phone's gesture-bar safe area so the nav sits above it.
        padding: "6px 0 calc(16px + env(safe-area-inset-bottom))", zIndex: 100,
      }}>
        {/* Left: Home + Entries */}
        {mobileNavLeft.map(item => {
          const active = pathname === item.path;
          return (
            <div key={item.path} onClick={() => goTo(item.path)}
              style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer",
                color: active ? "var(--accent-primary)" : "var(--text-muted)" }}>
              <item.icon size={22} />
              <span style={{ fontSize: 10, fontWeight: active ? 700 : 400 }}>{item.label}</span>
            </div>
          );
        })}

        {/* Center FAB — New Entry */}
        <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "flex-end", paddingBottom: 4 }}>
          <div onClick={() => goTo("/new-entry")}
            style={{
              width: 54, height: 54, borderRadius: "50%",
              background: "linear-gradient(135deg,#3b82f6,#2563eb)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", flexShrink: 0,
              boxShadow: "0 4px 20px rgba(37,99,235,0.55)",
              transform: "translateY(-10px)",
            }}>
            <Plus size={26} color="#fff" strokeWidth={2.5} />
          </div>
        </div>

        {/* Right: Deliveries + More */}
        {mobileNavRight.map(item => {
          const active = pathname === item.path;
          return (
            <div key={item.path} onClick={() => goTo(item.path)}
              style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer",
                color: active ? "var(--accent-primary)" : "var(--text-muted)" }}>
              <item.icon size={22} />
              <span style={{ fontSize: 10, fontWeight: active ? 700 : 400 }}>{item.label}</span>
            </div>
          );
        })}
        <div onClick={() => setShowMore(v => !v)}
          style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer",
            color: showMore ? "var(--accent-primary)" : "var(--text-muted)" }}>
          <MoreHorizontal size={22} />
          <span style={{ fontSize: 10, fontWeight: showMore ? 700 : 400 }}>More</span>
        </div>
      </nav>

      {/* ── Profile Modal ── */}
      {showProfile && profile && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={() => { setShowProfile(false); setShowThemeMenu(false); }}>
          <div style={{ background: "var(--bg-card)", borderRadius: 18, width: "100%", maxWidth: 360, boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}
            onClick={e => e.stopPropagation()}>

            {/* Modal header — accent band with avatar */}
            <div style={{ position: "relative", padding: "26px 20px 20px", borderRadius: "18px 18px 0 0", overflow: "hidden", background: "linear-gradient(135deg, var(--grade-b-bg), var(--bg-elevated))", borderBottom: "1px solid var(--border)" }}>
              <button onClick={() => setShowProfile(false)}
                style={{ position: "absolute", top: 14, right: 14, width: 28, height: 28, borderRadius: 8, background: "var(--bg-card)", border: "1px solid var(--border)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={14} color="var(--text-secondary)" />
              </button>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: "50%", flexShrink: 0,
                  background: "linear-gradient(135deg, var(--accent-primary), var(--grade-b-text))",
                  color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 800, fontSize: 24, boxShadow: "0 4px 14px rgba(0,0,0,0.18)",
                  border: "3px solid var(--bg-card)",
                }}>
                  {(profile.name || "?").charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 17, color: "var(--text-primary)", letterSpacing: "-0.01em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{profile.name}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>@{profile.username}</div>
                  <div style={{ display: "inline-flex", alignItems: "center", marginTop: 7, fontSize: 10, fontWeight: 800, color: "var(--grade-b-text)", background: "var(--bg-card)", border: "1px solid var(--grade-b-border)", borderRadius: 20, padding: "3px 10px", textTransform: "capitalize", letterSpacing: "0.03em" }}>{profile.role}</div>
                </div>
              </div>
            </div>

            {/* Modal body */}
            <div style={{ padding: "14px 16px 16px", borderRadius: "0 0 18px 18px" }}>

              {/* Theme switcher dropdown */}
              <div style={{ position: "relative", marginBottom: 8 }}>
                <button onClick={() => setShowThemeMenu(v => !v)}
                  style={{ width: "100%", padding: "11px 12px", border: "1px solid var(--border)", borderRadius: 12, background: "var(--bg-input)", color: "var(--text-primary)", fontWeight: 600, fontSize: 13.5, cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--bg-elevated)"}
                  onMouseLeave={e => e.currentTarget.style.background = "var(--bg-input)"}>
                  <span style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, background: "var(--grade-b-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {theme === "light"  && <Sun     size={16} color="var(--grade-b-text)" />}
                    {theme === "dark"   && <Moon    size={16} color="var(--grade-b-text)" />}
                    {theme === "system" && <Monitor size={16} color="var(--grade-b-text)" />}
                  </span>
                  <div style={{ flex: 1, textAlign: "left" }}>
                    <div>Appearance</div>
                    <div style={{ fontSize: 11, fontWeight: 500, color: "var(--text-muted)", marginTop: 1, textTransform: "capitalize" }}>{theme}</div>
                  </div>
                  <ChevronRight size={15} color="var(--text-muted)" style={{ transform: showThemeMenu ? "rotate(90deg)" : "none", transition: "transform .15s" }} />
                </button>
                {showThemeMenu && (
                  <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, zIndex: 10, overflow: "hidden", boxShadow: "0 8px 24px rgba(0,0,0,.16)" }}>
                    {([
                      { value: "light",  label: "Light",  icon: <Sun     size={15} /> },
                      { value: "dark",   label: "Dark",   icon: <Moon    size={15} /> },
                      { value: "system", label: "System", icon: <Monitor size={15} /> },
                    ] as { value: Theme; label: string; icon: React.ReactNode }[]).map(t => (
                      <div key={t.value} onClick={() => { setTheme(t.value); setShowThemeMenu(false); }}
                        style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", cursor: "pointer", fontSize: 13, fontWeight: theme === t.value ? 700 : 400, color: theme === t.value ? "var(--grade-b-text)" : "var(--text-primary)", background: theme === t.value ? "var(--grade-b-bg)" : "transparent" }}
                        onMouseEnter={e => { if (theme !== t.value) e.currentTarget.style.background = "var(--pressed)"; }}
                        onMouseLeave={e => { if (theme !== t.value) e.currentTarget.style.background = "transparent"; }}>
                        {t.icon} {t.label}
                        {theme === t.value && <Check size={14} style={{ marginLeft: "auto" }} />}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {!showPassForm ? (
                <>
                  <button onClick={() => setShowPassForm(true)}
                    style={{ width: "100%", padding: "11px 12px", border: "1px solid var(--border)", borderRadius: 12, background: "var(--bg-input)", color: "var(--text-primary)", fontWeight: 600, fontSize: 13.5, cursor: "pointer", display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--bg-elevated)"}
                    onMouseLeave={e => e.currentTarget.style.background = "var(--bg-input)"}>
                    <span style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, background: "var(--grade-b-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Key size={16} color="var(--grade-b-text)" />
                    </span>
                    <span style={{ flex: 1, textAlign: "left" }}>Change Password</span>
                    <ChevronRight size={15} color="var(--text-muted)" />
                  </button>
                  <button onClick={() => { setShowProfile(false); logout(); }}
                    style={{ width: "100%", padding: "11px 12px", border: "1px solid var(--grade-f-border)", borderRadius: 12, background: "var(--grade-f-bg)", color: "var(--grade-f-text)", fontWeight: 700, fontSize: 13.5, cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}
                    onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
                    onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
                    <span style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, background: "var(--grade-f-border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <LogOut size={16} color="var(--grade-f-text)" />
                    </span>
                    <span style={{ flex: 1, textAlign: "left" }}>Logout</span>
                  </button>
                </>
              ) : (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                    <button onClick={() => { setShowPassForm(false); setPassMsg(null); setOldPass(""); setNewPass(""); setConfirmPass(""); }}
                      style={{ background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 12, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 4 }}>
                      ← Back
                    </button>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Change Password</span>
                  </div>

                  {[
                    { label: "Current Password", val: oldPass, set: setOldPass, show: showOld, toggle: () => setShowOld(v => !v) },
                    { label: "New Password",     val: newPass, set: setNewPass, show: showNew, toggle: () => setShowNew(v => !v) },
                  ].map((f, i) => (
                    <div key={i} style={{ position: "relative", marginBottom: 10 }}>
                      <input type={f.show ? "text" : "password"} placeholder={f.label} value={f.val}
                        onChange={e => f.set(e.target.value)}
                        style={{ ...inp, paddingRight: 38 }} />
                      <button onClick={f.toggle} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", display: "flex", padding: 2 }}>
                        {f.show ? <EyeOff size={15} color="var(--text-muted)" /> : <Eye size={15} color="var(--text-muted)" />}
                      </button>
                    </div>
                  ))}

                  <input type="password" placeholder="Confirm New Password" value={confirmPass}
                    onChange={e => setConfirmPass(e.target.value)}
                    style={{ ...inp, borderColor: confirmPass && confirmPass !== newPass ? "var(--grade-f-border)" : "var(--border)" }} />

                  <div style={{ textAlign: "right", marginTop: 6, marginBottom: 12 }}>
                    <span style={{ fontSize: 12, color: "var(--accent-primary)", cursor: "pointer", fontWeight: 500 }}
                      onClick={() => setPassMsg({ text: "Contact your administrator to reset password.", ok: false })}>
                      Forgot Password?
                    </span>
                  </div>

                  {passMsg && (
                    <div style={{ padding: "8px 12px", borderRadius: 7, marginBottom: 10, fontSize: 12, fontWeight: 500, background: passMsg.ok ? "var(--grade-a-bg)" : "var(--grade-f-bg)", color: passMsg.ok ? "var(--grade-a-text)" : "var(--grade-f-text)" }}>
                      {passMsg.text}
                    </div>
                  )}

                  <button onClick={changePassword} disabled={passLoading}
                    style={{ width: "100%", padding: "11px", border: "none", borderRadius: 9, background: passLoading ? "var(--border-active)" : "var(--accent-primary)", color: "#0b1830", fontWeight: 700, fontSize: 13, cursor: passLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, boxShadow: "var(--shadow-glow-blue)" }}>
                    <Key size={14} /> {passLoading ? "Saving…" : "Save Password"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile More Sheet ── */}
      {showMore && (() => {
        const isStaff = profile?.role === "staff";
        const isSuperAdmin = profile?.role === "superadmin";
        const moreGrid = [
          { path: "/customers",  label: "Customers",     icon: Users,    sub: "Manage contacts" },
          ...(!isStaff ? [{ path: "/accounting", label: "Accounting",    icon: Wallet,   sub: "Income & expense" }] : []),
          ...(!isStaff ? [{ path: "/reports",    label: "Reports",       icon: BarChart3, sub: "Insights" }] : []),
          { path: "/services",   label: "Services",      icon: Wrench,   sub: "Pricing" },
          ...(!isStaff ? [{ path: "/labour",     label: "Labour",        icon: Hammer,   sub: "Press & pay" }] : []),
          ...(!isStaff ? [{ path: "/staff",      label: "Staff",         icon: UserCog,  sub: "Manage team" }] : []),
          ...(!isStaff ? [{ path: "/settings",   label: "Settings",      icon: Settings, sub: "Business profile" }] : []),
          ...(isSuperAdmin ? [
            { path: "/import",            label: "Bulk Import",     icon: FileSpreadsheet, sub: "Super Admin" },
            { path: "/superadmin",        label: "Clients",         icon: Building2, sub: "Super Admin" },
            { path: "/signup-requests",   label: "Signup requests", icon: UserPlus,  sub: "Super Admin" },
            { path: "/weekly-report-log", label: "Weekly reports",  icon: Mail,      sub: "Super Admin" },
            { path: "/login-activity",    label: "Login activity",  icon: Activity,  sub: "Super Admin" },
          ] : []),
        ];
        return (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 200, display: "flex", alignItems: "flex-end" }}
            onClick={() => setShowMore(false)}>
            <div style={{ background: "var(--bg-card)", width: "100%", borderRadius: "20px 20px 0 0", maxHeight: "88vh", overflowY: "auto" }}
              onClick={e => e.stopPropagation()}>

              {/* Sheet header — tap left side to open profile */}
              <div style={{ padding: "20px 18px 16px", borderBottom: "1px solid var(--border-hard)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div onClick={() => { setShowMore(false); setShowProfile(true); }} style={{ cursor: "pointer" }}>
                  <div style={{ fontWeight: 800, fontSize: 18, color: "var(--text-primary)" }}>More</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3, fontSize: 12, color: "var(--text-secondary)" }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--accent-success)", display: "inline-block", flexShrink: 0 }} />
                    {profile
                      ? `${(profile.role||"user").charAt(0).toUpperCase()}${(profile.role||"user").slice(1)} · @${profile.username}`
                      : "Loading…"}
                  </div>
                </div>
                <button onClick={() => setShowMore(false)}
                  style={{ width: 34, height: 34, background: "var(--bg-elevated)", border: "1px solid var(--border-hard)", borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <X size={16} color="var(--text-secondary)" />
                </button>
              </div>

              {/* Grid of pages */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "14px 14px 10px" }}>
                {moreGrid.map(item => {
                  const active = pathname === item.path;
                  return (
                    <div key={item.path} onClick={() => goTo(item.path)}
                      style={{
                        padding: "14px 14px 12px",
                        borderRadius: 14, cursor: "pointer",
                        background: active ? "var(--grade-b-bg)" : "var(--bg-elevated)",
                        border: `1.5px solid ${active ? "var(--grade-b-border)" : "var(--border-hard)"}`,
                        transition: "all .15s",
                      }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, marginBottom: 10,
                        background: active ? "rgba(110,168,255,0.25)" : "rgba(110,168,255,0.1)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: active ? "var(--grade-b-text)" : "var(--text-secondary)" }}>
                        <item.icon size={18} />
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: active ? "var(--grade-b-text)" : "var(--text-primary)", marginBottom: 2 }}>{item.label}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{item.sub}</div>
                    </div>
                  );
                })}
              </div>

              {/* Sign out */}
              <div style={{ padding: "4px 14px 32px" }}>
                <button onClick={() => { setShowMore(false); logout(); }}
                  style={{ width: "100%", padding: "14px", border: "1.5px solid var(--grade-f-border)", borderRadius: 14, background: "var(--grade-f-bg)", color: "var(--grade-f-text)", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <LogOut size={16} /> Sign out
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Alerts Popup ── */}
      {showNotifSheet && (
        <>
          {/* Invisible backdrop to close on outside tap */}
          <div style={{ position: "fixed", inset: 0, zIndex: 299 }} onClick={() => setShowNotifSheet(false)} />

          {/* Floating popup card */}
          <div style={{
            position: "fixed", top: 68, right: 14, zIndex: 300,
            background: "var(--bg-card)",
            borderRadius: 16,
            border: "1px solid var(--border-hard)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
            width: "min(340px, calc(100vw - 28px))",
            maxHeight: "70vh",
            overflowY: "auto",
            animation: "notifPop .15s ease-out",
          }}>
            <style>{`
              @keyframes notifPop {
                from { opacity: 0; transform: scale(0.93) translateY(-6px); }
                to   { opacity: 1; transform: scale(1)    translateY(0);    }
              }
            `}</style>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px 12px", borderBottom: "1px solid var(--border-hard)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Bell size={16} color="var(--text-primary)" />
                <span style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>Alerts</span>
                {alertCount > 0 && (
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 20, background: "var(--grade-f-bg)", color: "var(--grade-f-text)", border: "1px solid var(--grade-f-border)" }}>
                    {alertCount}
                  </span>
                )}
              </div>
              <button onClick={() => setShowNotifSheet(false)}
                style={{ width: 28, height: 28, borderRadius: 8, background: "var(--bg-elevated)", border: "1px solid var(--border-hard)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1 }}>×</span>
              </button>
            </div>

            {/* No alerts */}
            {overdueEntries.length === 0 && dueTodayEntries.length === 0 && upcomingEntries.length === 0 && noDateEntries.length === 0 && (
              <div style={{ padding: "28px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>✅</div>
                <p style={{ color: "var(--text-muted)", fontSize: 13, margin: 0 }}>All deliveries on track!</p>
              </div>
            )}

            {/* Overdue */}
            {overdueEntries.length > 0 && (
              <div style={{ padding: "12px 14px 4px" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--grade-f-text)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
                  Overdue · {overdueEntries.length}
                </div>
                {overdueEntries.map(e => {
                  const days = Math.floor((new Date(today).getTime() - new Date(e.delivery_date! + "T00:00:00").getTime()) / 86400000);
                  return (
                    <div key={e.id} onClick={() => { setShowNotifSheet(false); router.push(`/deliveries?customer=${e.customer_id}`); }}
                      style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", background: "var(--grade-f-bg)", border: "1px solid var(--grade-f-border)", borderRadius: 10, marginBottom: 6, cursor: "pointer" }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(239,68,68,0.18)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Truck size={13} color="var(--grade-f-text)" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.customer?.name}</div>
                        <div style={{ fontSize: 11, color: "var(--grade-f-text)", marginTop: 1 }}>{days}d overdue · ₹{Number(e.total_amount).toLocaleString("en-IN")}</div>
                      </div>
                      <ChevronRight size={12} color="var(--grade-f-text)" style={{ flexShrink: 0 }} />
                    </div>
                  );
                })}
              </div>
            )}

            {/* Due Today */}
            {dueTodayEntries.length > 0 && (
              <div style={{ padding: "12px 14px 4px" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--grade-c-text)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
                  Due Today · {dueTodayEntries.length}
                </div>
                {dueTodayEntries.map(e => (
                  <div key={e.id} onClick={() => { setShowNotifSheet(false); router.push(`/deliveries?customer=${e.customer_id}`); }}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", background: "var(--grade-c-bg)", border: "1px solid var(--grade-c-border)", borderRadius: 10, marginBottom: 6, cursor: "pointer" }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(245,158,11,0.18)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Truck size={13} color="var(--grade-c-text)" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.customer?.name}</div>
                      <div style={{ fontSize: 11, color: "var(--grade-c-text)", marginTop: 1 }}>Due today · ₹{Number(e.total_amount).toLocaleString("en-IN")}</div>
                    </div>
                    <ChevronRight size={12} color="var(--grade-c-text)" style={{ flexShrink: 0 }} />
                  </div>
                ))}
              </div>
            )}

            {/* Pending — no due date set */}
            {noDateEntries.length > 0 && (
              <div style={{ padding: "12px 14px 4px" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
                  Pending delivery · {noDateEntries.length}
                </div>
                {noDateEntries.slice(0, 8).map(e => {
                  const days = Math.floor((new Date(today).getTime() - new Date(e.entry_date + "T00:00:00").getTime()) / 86400000);
                  return (
                    <div key={e.id} onClick={() => { setShowNotifSheet(false); router.push(`/deliveries?customer=${e.customer_id}`); }}
                      style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", background: "var(--bg-elevated)", border: "1px solid var(--border-hard)", borderRadius: 10, marginBottom: 6, cursor: "pointer" }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--pressed)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Truck size={13} color="var(--text-secondary)" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.customer?.name}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>{days > 0 ? `${days}d waiting` : "Today"} · ₹{Number(e.total_amount).toLocaleString("en-IN")}</div>
                      </div>
                      <ChevronRight size={12} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                    </div>
                  );
                })}
                {noDateEntries.length > 8 && (
                  <div style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center", padding: "2px 0 6px" }}>
                    +{noDateEntries.length - 8} more
                  </div>
                )}
              </div>
            )}

            {/* Upcoming */}
            {upcomingEntries.length > 0 && (
              <div style={{ padding: "12px 14px 4px" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--grade-b-text)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
                  Upcoming · {upcomingEntries.length}
                </div>
                {upcomingEntries.slice(0, 3).map(e => (
                  <div key={e.id} onClick={() => { setShowNotifSheet(false); router.push(`/deliveries?customer=${e.customer_id}`); }}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", background: "var(--bg-elevated)", border: "1px solid var(--border-hard)", borderRadius: 10, marginBottom: 6, cursor: "pointer" }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--grade-b-bg)", border: "1px solid var(--grade-b-border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Truck size={13} color="var(--grade-b-text)" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.customer?.name}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>Due {fmtDate(e.delivery_date!)} · ₹{Number(e.total_amount).toLocaleString("en-IN")}</div>
                    </div>
                    <ChevronRight size={12} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                  </div>
                ))}
              </div>
            )}

            {/* View all */}
            <div style={{ padding: "10px 14px 14px" }}>
              <button onClick={() => { setShowNotifSheet(false); router.push("/deliveries"); }}
                style={{ width: "100%", padding: "10px", borderRadius: 10, background: "var(--accent-primary)", border: "none", color: "#0b1830", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                View all deliveries
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
