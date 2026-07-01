"use client";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, PlusCircle, Users, ClipboardList, Truck,
  BarChart3, Wrench, Hammer, LogOut, X, Key, Eye, EyeOff,
  Building2, Wallet, Activity, ShieldCheck, ChevronRight, ChevronDown,
  UserCog, MoreHorizontal, Sun, Moon, Monitor, Check, Search,
} from "lucide-react";
import api from "@/lib/api";

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
];

const staffNavItems = [
  { path: "/dashboard",  label: "Dashboard",  icon: LayoutDashboard },
  { path: "/new-entry",  label: "New Entry",  icon: PlusCircle },
  { path: "/customers",  label: "Customers",  icon: Users },
  { path: "/entries",    label: "Entries",    icon: ClipboardList },
  { path: "/deliveries", label: "Deliveries", icon: Truck },
  { path: "/services",   label: "Services",   icon: Wrench },
];

const mobileNav = [
  { path: "/dashboard",  label: "Home",      icon: LayoutDashboard },
  { path: "/new-entry",  label: "New",       icon: PlusCircle },
  { path: "/customers",  label: "Customers", icon: Users },
  { path: "/entries",    label: "Entries",   icon: ClipboardList },
];

const moreItems = [
  { path: "/accounting", label: "Accounting", icon: Wallet },
  { path: "/reports",    label: "Reports",    icon: BarChart3 },
  { path: "/services",   label: "Services",   icon: Wrench },
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

  const cycleTheme = () => {
    const order: Theme[] = ["light", "dark", "system"];
    setTheme(prev => order[(order.indexOf(prev) + 1) % 3]);
  };

  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showPassForm,  setShowPassForm]  = useState(false);
  const [oldPass,       setOldPass]       = useState("");
  const [newPass,       setNewPass]       = useState("");
  const [confirmPass,   setConfirmPass]   = useState("");
  const [showOld,       setShowOld]       = useState(false);
  const [showNew,       setShowNew]       = useState(false);
  const [passMsg,       setPassMsg]       = useState<{ text: string; ok: boolean } | null>(null);
  const [passLoading,   setPassLoading]   = useState(false);

  useEffect(() => {
    api.get("/auth/me").then(r => setProfile(r.data)).catch(() => {});
    if (typeof window !== "undefined") setSelectedShopId(localStorage.getItem("sa_shop_id") || "");
  }, []);

  useEffect(() => {
    if (profile?.role === "superadmin") api.get("/admin/shops").then(r => setShops(r.data)).catch(() => {});
  }, [profile?.role]);

  useEffect(() => {
    setShowProfile(false); setShowMore(false); setShowShopPicker(false);
    setShowPassForm(false); setShowThemeMenu(false);
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

  const isAdminSection = pathname === "/superadmin" || pathname === "/login-activity";

  const navItems = isAdminSection && profile?.role === "superadmin"
    ? [{ path: "/superadmin", label: "Clients", icon: Building2 }, { path: "/login-activity", label: "Login Activity", icon: Activity }]
    : profile?.role === "staff" ? staffNavItems : adminNavItems;

  const themeIcon = theme === "light" ? <Sun size={14} /> : theme === "dark" ? <Moon size={14} /> : <Monitor size={14} />;

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
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: "linear-gradient(135deg,#6EA8FF,#3f7fe0)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 800, fontSize: 14, color: "#0b1830",
            boxShadow: "0 6px 16px -6px rgba(110,168,255,.7)",
          }}>LP</div>
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
                <span>{item.label}</span>
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
          {/* Search */}
          <div className="mob-hide" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--bg-input)", border: "1px solid var(--border-default)", borderRadius: 8, padding: "8px 12px", minWidth: 280 }}>
            <Search size={14} color="var(--text-muted)" />
            <input
              placeholder="Search customers, entries, flats…"
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "var(--text-primary)", fontSize: 13 }}
            />
          </div>
          {/* Mobile: LP brand shown when search is hidden */}
          <div style={{ display: "none" }} className="mob-brand">
            <div style={{ fontWeight: 800, fontSize: 16, color: "var(--text-primary)", letterSpacing: "-.01em" }}>LaundryPro</div>
          </div>

          {/* Right actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="mob-hide" style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12, fontWeight: 500, color: "var(--text-secondary)" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--accent-success)", display: "inline-block", flexShrink: 0 }} />
              Synced
            </div>

            {/* Theme cycle button */}
            <button onClick={cycleTheme}
              style={{ display: "inline-flex", alignItems: "center", gap: 7, border: "1px solid var(--border-default)", background: "var(--bg-input)", color: "var(--text-secondary)", fontWeight: 600, fontSize: 12, borderRadius: 8, padding: "7px 12px", cursor: "pointer", transition: "border-color .15s, color .15s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--border-active)"; e.currentTarget.style.color = "var(--text-primary)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border-default)"; e.currentTarget.style.color = "var(--text-secondary)"; }}>
              {themeIcon}
              <span>{theme.charAt(0).toUpperCase() + theme.slice(1)}</span>
            </button>

            {/* Avatar → opens profile modal */}
            <div onClick={() => setShowProfile(true)}
              style={{
                width: 34, height: 34, borderRadius: "50%", cursor: "pointer",
                background: "var(--grade-b-bg)", border: "1px solid var(--grade-b-border)",
                color: "var(--grade-b-text)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 800, fontSize: 13,
              }}>
              {(profile?.name || "A").charAt(0).toUpperCase()}
            </div>
          </div>
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
        background: "var(--bg-card)", borderTop: "1px solid var(--border)",
        justifyContent: "space-around", padding: "8px 0 14px", zIndex: 100,
      }}>
        {mobileNav.map(item => {
          const active = pathname === item.path;
          return (
            <div key={item.path} onClick={() => goTo(item.path)}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer", color: active ? "var(--accent-primary)" : "var(--text-muted)" }}>
              <item.icon size={22} />
              <span style={{ fontSize: 10, fontWeight: active ? 600 : 400 }}>{item.label}</span>
            </div>
          );
        })}
        <div onClick={() => setShowMore(v => !v)}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer", color: showMore ? "var(--accent-primary)" : "var(--text-muted)" }}>
          <MoreHorizontal size={22} />
          <span style={{ fontSize: 10 }}>More</span>
        </div>
      </nav>

      {/* ── Profile Modal ── */}
      {showProfile && profile && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={() => { setShowProfile(false); setShowThemeMenu(false); }}>
          <div style={{ background: "var(--bg-card)", borderRadius: 18, width: "100%", maxWidth: 360, boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}
            onClick={e => e.stopPropagation()}>

            {/* Modal header */}
            <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12, borderRadius: "18px 18px 0 0" }}>
              <div style={{
                width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
                background: "var(--grade-b-bg)", border: "1px solid var(--grade-b-border)",
                color: "var(--grade-b-text)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 800, fontSize: 18,
              }}>
                {(profile.name || "?").charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>{profile.name}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>@{profile.username}</div>
                <div style={{ display: "inline-block", marginTop: 4, fontSize: 10, fontWeight: 700, color: "var(--grade-b-text)", background: "var(--grade-b-bg)", borderRadius: 4, padding: "2px 7px", textTransform: "capitalize" }}>{profile.role}</div>
              </div>
              <button onClick={() => setShowProfile(false)}
                style={{ width: 28, height: 28, borderRadius: 7, background: "var(--bg-input)", border: "1px solid var(--border)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <X size={13} color="var(--text-secondary)" />
              </button>
            </div>

            {/* Modal body */}
            <div style={{ padding: "18px 20px 16px", borderRadius: "0 0 18px 18px" }}>

              {/* Theme switcher dropdown */}
              <div style={{ position: "relative", marginBottom: 10 }}>
                <button onClick={() => setShowThemeMenu(v => !v)}
                  style={{ width: "100%", padding: "11px", border: "1.5px solid var(--border)", borderRadius: 9, background: "var(--bg-input)", color: "var(--text-primary)", fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {theme === "light"  && <><Sun     size={14} color="var(--accent-primary)" /> Appearance — Light</>}
                    {theme === "dark"   && <><Moon    size={14} color="var(--accent-primary)" /> Appearance — Dark</>}
                    {theme === "system" && <><Monitor size={14} color="var(--accent-primary)" /> Appearance — System</>}
                  </div>
                  <ChevronRight size={14} color="var(--text-muted)" style={{ transform: showThemeMenu ? "rotate(90deg)" : "none", transition: "transform .15s" }} />
                </button>
                {showThemeMenu && (
                  <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 9, zIndex: 10, overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,.12)" }}>
                    {([
                      { value: "light",  label: "Light",  icon: <Sun     size={14} /> },
                      { value: "dark",   label: "Dark",   icon: <Moon    size={14} /> },
                      { value: "system", label: "System", icon: <Monitor size={14} /> },
                    ] as { value: Theme; label: string; icon: React.ReactNode }[]).map(t => (
                      <div key={t.value} onClick={() => { setTheme(t.value); setShowThemeMenu(false); }}
                        style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer", fontSize: 13, fontWeight: theme === t.value ? 600 : 400, color: theme === t.value ? "var(--grade-b-text)" : "var(--text-primary)", background: theme === t.value ? "var(--grade-b-bg)" : "transparent" }}
                        onMouseEnter={e => { if (theme !== t.value) e.currentTarget.style.background = "var(--pressed)"; }}
                        onMouseLeave={e => { if (theme !== t.value) e.currentTarget.style.background = "transparent"; }}>
                        {t.icon} {t.label}
                        {theme === t.value && <Check size={13} style={{ marginLeft: "auto" }} />}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {!showPassForm ? (
                <>
                  <button onClick={() => setShowPassForm(true)}
                    style={{ width: "100%", padding: "11px", border: "1.5px solid var(--border)", borderRadius: 9, background: "var(--bg-input)", color: "var(--text-primary)", fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 10 }}>
                    <Key size={14} color="var(--accent-primary)" /> Change Password
                  </button>
                  <button onClick={() => { setShowProfile(false); logout(); }}
                    style={{ width: "100%", padding: "11px", border: "1.5px solid var(--grade-f-border)", borderRadius: 9, background: "var(--grade-f-bg)", color: "var(--grade-f-text)", fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    <LogOut size={14} /> Logout
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
      {showMore && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 200, display: "flex", alignItems: "flex-end" }}
          onClick={() => setShowMore(false)}>
          <div style={{ background: "var(--bg-card)", width: "100%", borderRadius: "16px 16px 0 0", padding: "18px 16px 32px" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <span style={{ fontWeight: 600, fontSize: 15, color: "var(--text-primary)" }}>More</span>
              <button onClick={() => setShowMore(false)} style={{ background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 7, padding: 6, cursor: "pointer", display: "flex" }}>
                <X size={16} color="var(--text-secondary)" />
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
              {moreItems.map(item => (
                <div key={item.path} onClick={() => goTo(item.path)}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "13px 8px", borderRadius: 12, cursor: "pointer",
                    background: pathname === item.path ? "var(--grade-b-bg)" : "var(--bg-input)",
                    color: pathname === item.path ? "var(--grade-b-text)" : "var(--text-secondary)",
                    border: `1px solid ${pathname === item.path ? "var(--grade-b-border)" : "var(--border)"}` }}>
                  <item.icon size={20} />
                  <span style={{ fontSize: 11, fontWeight: 500, marginTop: 5 }}>{item.label}</span>
                </div>
              ))}
              <div onClick={logout}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "13px 8px", borderRadius: 12, cursor: "pointer", background: "var(--grade-f-bg)", color: "var(--grade-f-text)", border: "1px solid var(--grade-f-border)" }}>
                <LogOut size={20} />
                <span style={{ fontSize: 11, fontWeight: 500, marginTop: 5 }}>Logout</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
