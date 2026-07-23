"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import api from "@/lib/api";
import { isEntryDelivered } from "@/lib/entry-status";
import ProtectedLayout from "@/components/ProtectedLayout";
import EmptyState from "@/components/EmptyState";
import { FilterPanel } from "@/components/Filters";
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

  const customerMap = new Map<string, { name: string; phone: string; flat: string; society: string; entries: LaundryEntry[] }>();
  visibleEntries.forEach(e => { if (!customerMap.has(e.customer_id)) customerMap.set(e.customer_id, { name: e.customer?.name || "Unknown", phone: e.customer?.phone || "", flat: e.customer?.flat_number || "", society: e.customer?.society_name || "", entries: [] }); customerMap.get(e.customer_id)!.entries.push(e); });

  const filteredCustomers = Array.from(customerMap.entries()).filter(([, c]) =>
    (!fName || c.name.toLowerCase().includes(fName.toLowerCase())) &&
    (!fPhone || c.phone.includes(fPhone))
  );

  const fmtShort = (d: string) => { try { return new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" }); } catch { return d; } };
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

      {/* ── Customer cards (tap → full order details) ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filteredCustomers.length === 0 && !loading && <EmptyState title="No orders found" subtitle={(fName || fPhone) ? "Try a different name or phone." : "No orders for this period yet."} />}
        {filteredCustomers.map(([cid, cust], ci) => {
          const custTotal = cust.entries.reduce((s, e) => s + Number(e.total_amount), 0);
          const custAllDel = cust.entries.length > 0 && cust.entries.every(isEntryDelivered);
          const pendingCnt = cust.entries.flatMap(e => e.items).filter(i => i.item_status !== "delivered").length;
          const tagStatus = cust.entries.some(e => e.tag_status === "issue")
            ? "issue"
            : cust.entries.some(e => e.tag_status === "ready")
              ? "ready"
              : cust.entries.some(e => e.tag_status === "in_process")
                ? "in_process"
                : custAllDel
                  ? "delivered"
                  : "collected";
          const tag = tagStyle(tagStatus);
          const latestDate = cust.entries.map(e => e.entry_date).sort().reverse()[0];
          const oldestPending = cust.entries.filter(e => e.items.some(i => i.item_status !== "delivered")).map(e => e.entry_date).sort()[0];
          const isOverdue = !custAllDel && !!oldestPending && (Date.now() - new Date(oldestPending + "T00:00:00").getTime()) > 30 * 24 * 60 * 60 * 1000;
          const avatarColor = AVATAR_COLORS[ci % AVATAR_COLORS.length];

          return (
            <div key={cid} className="cust-card" onClick={() => router.push(`/customer/${cid}`)}
              style={{ background: "var(--bg-card,#fff)", borderRadius: 14, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: "1px solid var(--border-hard)", transition: "box-shadow 0.2s", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, padding: "14px 14px" }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: avatarColor, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: "#fff", fontSize: 20, fontWeight: 900, userSelect: "none", lineHeight: 1 }}>{cust.name.charAt(0).toUpperCase()}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cust.name}</div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: "var(--text-primary)", flexShrink: 0 }}>₹{custTotal.toLocaleString("en-IN")}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                    {[cust.flat, cust.society, `${cust.entries.length} order${cust.entries.length !== 1 ? "s" : ""}`, latestDate ? fmtShort(latestDate) : ""].filter(Boolean).join(" · ")}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, flexShrink: 0,
                    background: isOverdue ? "rgba(239,68,68,0.12)" : custAllDel ? "rgba(5,150,105,0.12)" : "rgba(245,158,11,0.12)",
                    color: isOverdue ? "#ef4444" : custAllDel ? "#10b981" : "#f59e0b",
                    border: `1px solid ${isOverdue ? "rgba(239,68,68,0.25)" : custAllDel ? "rgba(5,150,105,0.25)" : "rgba(245,158,11,0.25)"}` }}>
                    {isOverdue ? "Overdue" : custAllDel ? "Delivered" : `${pendingCnt} pending`}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, flexShrink: 0, background: tag.bg, color: tag.text, border: `1px solid ${tag.border}` }}>
                    QR: {TAG_LABELS[tagStatus] || tagStatus}
                  </span>
                </div>
              </div>
              <ChevronRight size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
            </div>
          );
        })}
      </div>
    </ProtectedLayout>
  );
}
