"use client";
import React, { useState } from "react";
import { Search, RotateCcw, Filter as FilterIcon, ChevronDown } from "lucide-react";

// MyUniclean-style filter: a "Filter" button that opens a collapsible panel with
// dropdowns + a Start/End date range, a Search button that applies the filter, and
// (optionally) separate text search fields. The panel stays hidden until the button
// is clicked. Used across Entries / Customers / Deliveries / Reports.

export interface FilterSelect { key: string; label: string; options: { value: string; label: string }[]; }
export interface FilterText { key: string; label: string; placeholder?: string; }

export function FilterPanel({
  selects = [], dateRange = false, texts = [], initial = {}, onApply, applyLabel = "Search",
}: {
  selects?: FilterSelect[];
  dateRange?: boolean;
  texts?: FilterText[];
  initial?: Record<string, string>;
  onApply: (values: Record<string, string>) => void;
  applyLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>(initial);
  const set = (k: string, v: string) => setDraft(d => ({ ...d, [k]: v }));
  const apply = () => { onApply(draft); setOpen(false); };
  const reset = () => { setDraft({}); onApply({}); };

  // How many "real" filters are active (ignoring the date range) — shown as a badge.
  const activeCount =
    selects.filter(s => draft[s.key] && draft[s.key] !== "all").length +
    texts.filter(t => draft[t.key]).length;

  const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const presetRange = (kind: "today" | "week" | "month"): [string, string] => {
    const now = new Date();
    if (kind === "today") return [iso(now), iso(now)];
    if (kind === "week") { const s = new Date(now); s.setDate(s.getDate() - 6); return [iso(s), iso(now)]; }
    return [iso(new Date(now.getFullYear(), now.getMonth(), 1)), iso(new Date(now.getFullYear(), now.getMonth() + 1, 0))];
  };
  const setRange = (kind: "today" | "week" | "month") => { const [f, t] = presetRange(kind); setDraft(d => ({ ...d, from: f, to: t })); };

  const field: React.CSSProperties = { width: "100%", boxSizing: "border-box", padding: "10px 12px", border: "1.5px solid var(--border)", borderRadius: 8, fontSize: 13, outline: "none", background: "var(--bg-input)", color: "var(--text-primary)" };
  const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 5, display: "block" };

  return (
    <div style={{ marginBottom: 14 }}>
      {/* Filter toggle button */}
      <button onClick={() => setOpen(o => !o)}
        style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 16px", borderRadius: 10, cursor: "pointer", fontSize: 13.5, fontWeight: 700,
          border: `1.5px solid ${open || activeCount > 0 ? "var(--accent-primary)" : "var(--border-hard)"}`,
          background: open || activeCount > 0 ? "var(--grade-b-bg)" : "var(--bg-card)",
          color: open || activeCount > 0 ? "var(--grade-b-text)" : "var(--text-secondary)" }}>
        <FilterIcon size={15} /> Filter
        {activeCount > 0 && <span style={{ fontSize: 11, fontWeight: 800, minWidth: 18, height: 18, padding: "0 5px", borderRadius: 9, background: "var(--accent-primary)", color: "#0b1830", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{activeCount}</span>}
        <ChevronDown size={15} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
      </button>

      {/* Collapsible panel */}
      {open && (
        <div style={{ background: "var(--bg-card)", border: "1.5px solid var(--border-hard)", borderRadius: 12, padding: "14px 16px", marginTop: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
            {selects.map(s => (
              <div key={s.key}>
                <label style={lbl}>{s.label}</label>
                <select value={draft[s.key] ?? ""} onChange={e => set(s.key, e.target.value)} style={field}>
                  {s.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            ))}
            {dateRange && (
              <>
                <div>
                  <label style={lbl}>Start date</label>
                  <input type="date" value={draft.from ?? ""} max={draft.to || undefined} onChange={e => set("from", e.target.value)} style={field} />
                </div>
                <div>
                  <label style={lbl}>End date</label>
                  <input type="date" value={draft.to ?? ""} min={draft.from || undefined} onChange={e => set("to", e.target.value)} style={field} />
                </div>
              </>
            )}
          </div>

          {dateRange && (
            <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
              {([["today", "Today"], ["week", "7 days"], ["month", "This month"]] as [ "today"|"week"|"month", string][]).map(([k, l]) => (
                <button key={k} onClick={() => setRange(k)} style={{ padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: "pointer", border: "1px solid var(--border-hard)", background: "var(--bg-input)", color: "var(--text-secondary)" }}>{l}</button>
              ))}
            </div>
          )}

          {texts.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginTop: 10 }}>
              {texts.map(t => (
                <div key={t.key}>
                  <label style={lbl}>{t.label}</label>
                  <input value={draft[t.key] ?? ""} onChange={e => set(t.key, e.target.value)} onKeyDown={e => { if (e.key === "Enter") apply(); }} placeholder={t.placeholder || ""} style={field} />
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button onClick={apply} style={{ flex: 1, padding: "11px", borderRadius: 9, border: "none", cursor: "pointer", fontSize: 13.5, fontWeight: 700, background: "var(--accent-primary)", color: "#0b1830", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, boxShadow: "var(--shadow-glow-blue)" }}>
              <Search size={15} /> {applyLabel}
            </button>
            <button onClick={reset} title="Reset filters" style={{ padding: "11px 14px", borderRadius: 9, border: "1px solid var(--border-hard)", cursor: "pointer", fontSize: 13, fontWeight: 700, background: "var(--bg-input)", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 6 }}>
              <RotateCcw size={14} /> Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
