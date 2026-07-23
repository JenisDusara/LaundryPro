"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, QrCode } from "lucide-react";
import api from "@/lib/api";
import { isEntryDelivered } from "@/lib/entry-status";
import ProtectedLayout from "@/components/ProtectedLayout";
import EmptyState from "@/components/EmptyState";
import { FilterPanel } from "@/components/Filters";
import QrTagModal from "@/components/QrTagModal";
import type { LaundryEntry } from "@/types";

const AVATAR_COLORS = ["#1e40af", "#059669", "#7c3aed", "#d97706", "#dc2626", "#0891b2", "#be185d", "#0f766e"];
const TAG_LABELS: Record<string, string> = {
  collected: "Collected",
  in_process: "In process",
  ready: "Ready",
  delivered: "Delivered",
  issue: "Issue",
};
const TAG_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  collected: { bg: "rgba(59,130,246,0.12)", text: "#2563eb", border: "rgba(59,130,246,0.25)" },
  in_process: { bg: "rgba(245,158,11,0.12)", text: "#f59e0b", border: "rgba(245,158,11,0.25)" },
  ready: { bg: "rgba(14,165,233,0.12)", text: "#0284c7", border: "rgba(14,165,233,0.25)" },
  delivered: { bg: "rgba(5,150,105,0.12)", text: "#10b981", border: "rgba(5,150,105,0.25)" },
  issue: { bg: "rgba(239,68,68,0.12)", text: "#ef4444", border: "rgba(239,68,68,0.25)" },
};
const tagStyle = (status = "collected") => TAG_COLORS[status] || TAG_COLORS.collected;

export default function Orders() {
  const router = useRouter();
  const [entries, setEntries] = useState<LaundryEntry[]>([]);
  // Date range (defaults to this month).
  const monthStart = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`; };
  const monthEnd = () => { const d = new Date(); const e = new Date(d.getFullYear(), d.getMonth() + 1, 0); return `${e.getFullYear()}-${String(e.getMonth() + 1).padStart(2, "0")}-${String(e.getDate()).padStart(2, "0")}`; };
  const [from, setFrom] = useState(monthStart);
  const [to, setTo] = useState(monthEnd);
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [fName, setFName] = useState("");
  const [fPhone, setFPhone] = useState("");
  // In-app QR tag preview (no new browser tab).
  const [qrEntryId, setQrEntryId] = useState<string | null>(null);
  const applyFilters = (v: Record<string, string>) => {
    setFrom(v.from || monthStart()); setTo(v.to || monthEnd());
    setStatusFilter(v.status || "all"); setPaymentFilter(v.payment || "all");
    setFName(v.name || ""); setFPhone(v.phone || "");
  };

  const load = async () => {
    if (!from || !to) return;
    setLoading(true); setLoadError("");
    try { const res = await api.get("/entries", { params: { from, to } }); setEntries(res.data); }
    catch (e: any) { setLoadError(e?.response?.data?.detail || "Failed to load orders."); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [from, to]);
  // Deep-links (this page is the merged "Orders" list — Entries + Deliveries):
  //  ?date=YYYY-MM-DD              → that day (dashboard "Today's Pickups")
  //  ?filter=pending|delivered    → all-time, that status (dashboard cards / bell "view all")
  //  ?customer=<id>               → jump straight to that customer's detail page (bell alert)
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const cust = q.get("customer");
    if (cust) { router.replace(`/customer/${cust}`); return; }
    const d = q.get("date");
    const f = q.get("filter");
    if (d && /^\d{4}-\d{2}-\d{2}$/.test(d)) { setFrom(d); setTo(d); }
    else if (f) { setFrom("2000-01-01"); setTo("2100-12-31"); } // all-time for status views
    if (f === "pending" || f === "delivered") setStatusFilter(f);
  }, [router]);

  // Status + payment filters — applied client-side on the loaded range.
  const stageOf = (e: LaundryEntry) => isEntryDelivered(e) ? "delivered" : "pending";
  const visibleEntries = entries.filter(e => {
    if (statusFilter !== "all" && stageOf(e) !== statusFilter) return false;
    if (paymentFilter !== "all") {
      const bal = Number(e.total_amount) - (e.amount_paid ?? 0);
      if (paymentFilter === "paid" && bal > 0) return false;
      if (paymentFilter === "udhaar" && bal <= 0) return false;
    }
    return true;
  });

  // Per-entry list (not grouped by customer): apply name/phone search, then sort newest-first
  // and group under date headers so each day's order is a separate card with its own QR button.
  const searchedEntries = visibleEntries.filter(e =>
    (!fName || (e.customer?.name || "").toLowerCase().includes(fName.toLowerCase())) &&
    (!fPhone || (e.customer?.phone || "").includes(fPhone))
  );
  const sortedEntries = [...searchedEntries].sort((a, b) => (a.entry_date < b.entry_date ? 1 : a.entry_date > b.entry_date ? -1 : 0));
  const entriesByDate = new Map<string, LaundryEntry[]>();
  sortedEntries.forEach(e => { if (!entriesByDate.has(e.entry_date)) entriesByDate.set(e.entry_date, []); entriesByDate.get(e.entry_date)!.push(e); });
  const dateGroups = Array.from(entriesByDate.entries());
  // Open the in-app QR preview for one entry (no new tab). The modal fetches its own data.
  const openTag = (entry: LaundryEntry) => setQrEntryId(entry.id);

  const fmtShort = (d: string) => { try { return new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" }); } catch { return d; } };
  const fmtDay = (d: string) => { try { return new Date(d + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "long", year: "numeric" }); } catch { return d; } };
  const invFmt = (n?: number | null) => (n ? "INV-" + String(n).padStart(4, "0") : "Order");
  const monthLabel = from === to ? new Date(from + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : `${fmtShort(from)} – ${fmtShort(to)}`;

  return (
    <ProtectedLayout>
      <style>{`.cust-card:hover{box-shadow:0 6px 24px rgba(0,0,0,0.12)!important}`}</style>

      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
        <div>
          <h2 style={{ color: "var(--text-primary)", margin: "0 0 2px", fontSize: 22, fontWeight: 800 }}>Orders</h2>
          <p style={{ color: "var(--text-muted)", fontSize: 12, margin: 0 }}>{monthLabel}</p>
        </div>
      </div>

      {/* ── Filters ── */}
      <FilterPanel
        initial={{ from, to, status: statusFilter, payment: paymentFilter, name: fName, phone: fPhone }}
        onApply={applyFilters}
        dateRange
        selects={[
          { key: "status", label: "Status", options: [{ value: "all", label: "All statuses" }, { value: "pending", label: "Pending" }, { value: "delivered", label: "Delivered" }] },
          { key: "payment", label: "Payment", options: [{ value: "all", label: "All" }, { value: "paid", label: "Paid" }, { value: "udhaar", label: "Udhaar (due)" }] },
        ]}
        texts={[
          { key: "name", label: "Search by name", placeholder: "Customer name" },
          { key: "phone", label: "Search by phone", placeholder: "Phone number" },
        ]}
      />

      {loading && <div style={{ textAlign: "center", padding: 32, color: "#94a3b8" }}>Loading...</div>}
      {loadError && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "12px 16px", marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}>
          <span>⚠️</span>
          <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 13, color: "#dc2626" }}>Database waking up</div><div style={{ fontSize: 12, color: "#ef4444" }}>{loadError}</div></div>
          <button onClick={load} style={{ padding: "6px 14px", background: "#dc2626", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Retry</button>
        </div>
      )}

      {/* ── Entry cards, grouped by day (each has its own QR button) ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {dateGroups.length === 0 && !loading && <EmptyState title="No orders found" subtitle={(fName || fPhone) ? "Try a different name or phone." : "No orders for this period yet."} />}
        {dateGroups.map(([date, dayEntries]) => {
          const dayTotal = dayEntries.reduce((s, e) => s + Number(e.total_amount), 0);
          const dayQty = dayEntries.reduce((s, e) => s + e.items.reduce((q, i) => q + Number(i.quantity), 0), 0);
          return (
            <div key={date}>
              {/* Date header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 8, padding: "0 2px" }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text-primary)" }}>{fmtDay(date)}</div>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-muted)" }}>{dayEntries.length} order{dayEntries.length !== 1 ? "s" : ""} · {dayQty} item{dayQty !== 1 ? "s" : ""} · ₹{dayTotal.toLocaleString("en-IN")}</div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {dayEntries.map((e, ci) => {
                  const delivered = isEntryDelivered(e);
                  const pend = e.items.filter(i => i.item_status !== "delivered").length;
                  const summary = e.items.map(i => `${i.service_name}×${i.quantity}`).join(", ");
                  const tagStatus = e.tag_status || (delivered ? "delivered" : "collected");
                  const tag = tagStyle(tagStatus);
                  const name = e.customer?.name || "Unknown";
                  const avatarColor = AVATAR_COLORS[ci % AVATAR_COLORS.length];

                  return (
                    <div key={e.id} className="cust-card"
                      style={{ background: "var(--bg-card,#fff)", borderRadius: 14, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: "1px solid var(--border-hard)", transition: "box-shadow 0.2s", display: "flex", alignItems: "center", gap: 12, padding: "14px 14px" }}>
                      <div onClick={() => router.push(`/customer/${e.customer_id}`)} style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: avatarColor, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ color: "#fff", fontSize: 20, fontWeight: 900, userSelect: "none", lineHeight: 1 }}>{name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                            <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</div>
                            <div style={{ fontWeight: 800, fontSize: 15, color: "var(--text-primary)", flexShrink: 0 }}>₹{Number(e.total_amount).toLocaleString("en-IN")}</div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                            <div style={{ fontSize: 12, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                              {[invFmt(e.invoice_no), summary].filter(Boolean).join(" · ")}
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, flexShrink: 0,
                              background: delivered ? "rgba(5,150,105,0.12)" : "rgba(245,158,11,0.12)",
                              color: delivered ? "#10b981" : "#f59e0b",
                              border: `1px solid ${delivered ? "rgba(5,150,105,0.25)" : "rgba(245,158,11,0.25)"}` }}>
                              {delivered ? "Delivered" : `${pend} pending`}
                            </span>
                            <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, flexShrink: 0, background: tag.bg, color: tag.text, border: `1px solid ${tag.border}` }}>
                              {TAG_LABELS[tagStatus] || tagStatus}
                            </span>
                          </div>
                        </div>
                      </div>
                      {/* QR button — opens this exact day's entry tag */}
                      <button onClick={(ev) => { ev.stopPropagation(); openTag(e); }} title="Show QR tag for this order"
                        style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 6, padding: "9px 12px", borderRadius: 10, border: "1px solid var(--grade-b-border)", background: "var(--grade-b-bg)", color: "var(--grade-b-text)", cursor: "pointer", fontSize: 12.5, fontWeight: 700 }}>
                        <QrCode size={15} /> QR
                      </button>
                      <ChevronRight size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── QR tag preview modal (in-app, no new tab) ── */}
      {qrEntryId && <QrTagModal entryId={qrEntryId} mode="order" onClose={() => setQrEntryId(null)} />}
    </ProtectedLayout>
  );
}
