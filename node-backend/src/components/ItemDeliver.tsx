"use client";
import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Check, Minus, Plus } from "lucide-react";
import api from "@/lib/api";
import type { EntryItem } from "@/types";

// A single laundry-item chip that supports PARTIAL delivery.
// Tap the chip → a small stepper lets you set how many of `quantity` are handed over
// (e.g. 2 of 4 today, rest later). The chip colour shows the state at a glance:
//   green  = fully delivered   ·  amber = partly delivered  ·  neutral = nothing yet
// The stepper is rendered in a portal (document.body) with fixed positioning so it
// always floats above the page, never trapped/overlapped by other cards' stacking.
export default function ItemDeliver({
  entryId, item, onChanged, disabled,
}: {
  entryId: string;
  item: EntryItem;
  onChanged: () => void;
  disabled?: boolean;
}) {
  const qty = item.quantity;
  const done = Math.max(0, Math.min(qty, item.delivered_qty ?? (item.item_status === "delivered" ? qty : 0)));
  const [open, setOpen] = useState(false);
  const [n, setN] = useState(done);
  const [saving, setSaving] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const state = done >= qty ? "done" : done > 0 ? "partial" : "none";
  const bg     = state === "done" ? "var(--grade-a-bg)"     : state === "partial" ? "var(--grade-c-bg)"     : "var(--grade-b-bg)";
  const fg     = state === "done" ? "var(--grade-a-text)"   : state === "partial" ? "var(--grade-c-text)"   : "var(--grade-b-text)";
  const border = state === "done" ? "var(--grade-a-border)" : state === "partial" ? "var(--grade-c-border)" : "var(--grade-b-border)";

  const label = state === "done"
    ? `✓ ${item.service_name} ×${qty}`
    : state === "partial"
      ? `${item.service_name} ${done}/${qty}`
      : `${item.service_name} ×${qty}`;

  const openPopover = () => {
    if (disabled || !btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    const W = 216, H = 190;
    const left = Math.max(8, Math.min(r.left, window.innerWidth - W - 8));
    // Prefer below the chip; flip above if it would run off the bottom.
    const top = r.bottom + 6 + H > window.innerHeight ? Math.max(8, r.top - H - 6) : r.bottom + 6;
    setPos({ top, left });
    setN(done);
    setOpen(true);
  };

  const save = async (value: number) => {
    const v = Math.max(0, Math.min(qty, value));
    setSaving(true);
    try {
      await api.patch(`/entries/${entryId}/items/${item.id}/status`, null, { params: { qty: v } });
      setOpen(false);
      onChanged();
    } catch {
      alert("Update failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button ref={btnRef} onClick={openPopover} disabled={disabled}
        title={disabled ? "" : "Tap to set how many delivered"}
        style={{ background: bg, color: fg, border: `1px solid ${border}`, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 8, cursor: disabled ? "default" : "pointer" }}>
        {label}
      </button>

      {open && pos && typeof document !== "undefined" && createPortal(
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 9998, background: "rgba(0,0,0,0.28)" }} onClick={() => setOpen(false)} />
          <div style={{ position: "fixed", top: pos.top, left: pos.left, zIndex: 9999, background: "var(--bg-card-solid)", border: "1px solid var(--border-hard)", borderRadius: 12, boxShadow: "0 16px 40px rgba(0,0,0,0.45)", padding: 12, width: 216 }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 2 }}>{item.service_name}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 10 }}>Kitne deliver hue? (total {qty})</div>

            {/* Stepper */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 10 }}>
              <button onClick={() => setN(v => Math.max(0, v - 1))} disabled={n <= 0}
                style={{ width: 34, height: 34, borderRadius: 9, border: "1px solid var(--border-hard)", background: "var(--bg-elevated)", cursor: n <= 0 ? "default" : "pointer", opacity: n <= 0 ? 0.4 : 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-primary)" }}>
                <Minus size={15} />
              </button>
              <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", minWidth: 46, textAlign: "center", fontVariantNumeric: "tabular-nums" }}>{n}<span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 600 }}>/{qty}</span></div>
              <button onClick={() => setN(v => Math.min(qty, v + 1))} disabled={n >= qty}
                style={{ width: 34, height: 34, borderRadius: 9, border: "1px solid var(--border-hard)", background: "var(--bg-elevated)", cursor: n >= qty ? "default" : "pointer", opacity: n >= qty ? 0.4 : 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-primary)" }}>
                <Plus size={15} />
              </button>
            </div>

            {/* Quick + save */}
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => save(0)} disabled={saving}
                style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "1px solid var(--border-hard)", background: "var(--bg-elevated)", color: "var(--text-secondary)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                None
              </button>
              <button onClick={() => save(qty)} disabled={saving}
                style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "1px solid var(--grade-a-border)", background: "var(--grade-a-bg)", color: "var(--grade-a-text)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                All ✓
              </button>
              <button onClick={() => save(n)} disabled={saving}
                style={{ flex: 1.2, padding: "8px 0", borderRadius: 8, border: "none", background: "var(--accent-primary)", color: "#0b1830", fontSize: 12, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                <Check size={13} /> {saving ? "…" : "Save"}
              </button>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
}
