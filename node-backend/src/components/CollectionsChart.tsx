"use client";
import { useState } from "react";
import { Banknote, Smartphone, CreditCard } from "lucide-react";

// Part-to-whole donut of payment collections by method. Colours come from the
// theme-aware --pay-* CSS vars (validated for CVD + contrast via the dataviz skill).
// Identity is never colour-alone: every method is labelled with its amount, and the
// hovered segment's detail replaces the centre total.

type Props = { cash: number; upi: number; card: number; size?: number };

const METHODS = [
  { key: "cash", label: "Cash", color: "var(--pay-cash)", Icon: Banknote },
  { key: "upi",  label: "UPI",  color: "var(--pay-upi)",  Icon: Smartphone },
  { key: "card", label: "Card", color: "var(--pay-card)", Icon: CreditCard },
] as const;

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

export default function CollectionsChart({ cash, upi, card, size = 132 }: Props) {
  const [hover, setHover] = useState<string | null>(null);
  const vals: Record<string, number> = { cash, upi, card };
  const total = cash + upi + card;

  const stroke = Math.round(size * 0.15);
  const r = (size - stroke) / 2;
  const C = 2 * Math.PI * r;
  const gap = total > 0 ? 2 : 0; // 2px surface gap between segments

  // Build arc segments (skip zero-value methods).
  let cursor = 0;
  const arcs = METHODS.filter(m => vals[m.key] > 0).map(m => {
    const frac = vals[m.key] / total;
    const len = frac * C;
    const dash = Math.max(len - gap, 0.5);
    const seg = { key: m.key, color: m.color, dash, offset: -cursor };
    cursor += len;
    return seg;
  });

  const centerMethod = hover ? METHODS.find(m => m.key === hover) : null;
  const centerValue = centerMethod ? vals[centerMethod.key] : total;
  const centerLabel = centerMethod ? centerMethod.label : "Total";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}
      role="img" aria-label={`Collections by method — total ${inr(total)}: cash ${inr(cash)}, UPI ${inr(upi)}, card ${inr(card)}`}>
      {/* Donut */}
      <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
          {/* Track */}
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--bg-elevated)" strokeWidth={stroke} />
          {total > 0 && arcs.map(a => (
            <circle key={a.key} cx={size / 2} cy={size / 2} r={r} fill="none"
              stroke={a.color} strokeWidth={hover === a.key ? stroke + 3 : stroke}
              strokeDasharray={`${a.dash} ${C - a.dash}`} strokeDashoffset={a.offset}
              strokeLinecap="butt"
              style={{ transition: "stroke-width .15s", cursor: "pointer", opacity: hover && hover !== a.key ? 0.5 : 1 }}
              onMouseEnter={() => setHover(a.key)} onMouseLeave={() => setHover(null)} />
          ))}
        </svg>
        {/* Centre readout */}
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--text-muted)" }}>{centerLabel}</div>
          <div style={{ fontSize: size < 130 ? 16 : 18, fontWeight: 800, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums", lineHeight: 1.1 }}>{inr(centerValue)}</div>
        </div>
      </div>

      {/* Legend — carries identity + exact amounts (relief for the light-mode contrast WARN) */}
      <div style={{ flex: 1, minWidth: 150, display: "flex", flexDirection: "column", gap: 8 }}>
        {METHODS.map(m => {
          const v = vals[m.key];
          const pct = total > 0 ? Math.round((v / total) * 100) : 0;
          return (
            <div key={m.key}
              onMouseEnter={() => setHover(m.key)} onMouseLeave={() => setHover(null)}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 8px", borderRadius: 8, cursor: "default",
                background: hover === m.key ? "var(--pressed)" : "transparent", transition: "background .15s" }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: m.color, flexShrink: 0 }} />
              <m.Icon size={14} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{m.label}</span>
              <span style={{ marginLeft: "auto", fontSize: 13, fontWeight: 700, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>{inr(v)}</span>
              <span style={{ fontSize: 11, color: "var(--text-muted)", width: 34, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
