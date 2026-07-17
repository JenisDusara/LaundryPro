"use client";
import React from "react";

// Lightweight, dependency-free SVG charts (theme-aware). Used on the Reports page.

export interface Seg { label: string; value: number; color: string; }

// Donut chart + legend (revenue share, payment method split, etc.)
export function Donut({ segments, size = 168, centerLabel = "Total", money = true }: { segments: Seg[]; size?: number; centerLabel?: string; money?: boolean }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const R = size / 2 - 14, C = 2 * Math.PI * R, cx = size / 2, cy = size / 2;
  const shown = segments.filter(s => s.value > 0);
  let off = 0;
  const fmt = (n: number) => (money ? "₹" : "") + Math.round(n).toLocaleString("en-IN");
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 22, flexWrap: "wrap" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="var(--bg-input)" strokeWidth={20} />
        {total > 0 && shown.map((s, i) => {
          const len = (s.value / total) * C;
          const el = <circle key={i} cx={cx} cy={cy} r={R} fill="none" stroke={s.color} strokeWidth={20} strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-off} transform={`rotate(-90 ${cx} ${cy})`} />;
          off += len; return el;
        })}
        <text x={cx} y={cy - 3} textAnchor="middle" fontSize={12} fill="var(--text-muted)">{centerLabel}</text>
        <text x={cx} y={cy + 17} textAnchor="middle" fontSize={17} fontWeight={800} fill="var(--text-primary)">{fmt(total)}</text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 9, minWidth: 150, flex: 1 }}>
        {shown.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: s.color, flexShrink: 0 }} />
            <span style={{ color: "var(--text-secondary)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.label}</span>
            <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{fmt(s.value)}</span>
            <span style={{ color: "var(--text-muted)", fontSize: 11, width: 36, textAlign: "right" }}>{total > 0 ? Math.round((s.value / total) * 100) : 0}%</span>
          </div>
        ))}
        {shown.length === 0 && <span style={{ fontSize: 13, color: "var(--text-muted)" }}>No data</span>}
      </div>
    </div>
  );
}

// Vertical bar chart (daily earnings, etc.)
export function Bars({ data, height = 190, color = "#3b82f6" }: { data: { label: string; value: number }[]; height?: number; color?: string }) {
  if (!data.length) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  const barW = Math.max(14, Math.min(46, Math.floor(600 / data.length) - 8));
  const gap = 10, pad = 10, labelH = 24, valH = 16;
  const chartH = height - labelH - valH;
  const w = pad * 2 + data.length * barW + (data.length - 1) * gap;
  return (
    <div style={{ overflowX: "auto" }}>
      <svg width={Math.max(w, 280)} height={height} viewBox={`0 0 ${Math.max(w, 280)} ${height}`}>
        {data.map((d, i) => {
          const h = Math.max(3, (d.value / max) * chartH);
          const x = pad + i * (barW + gap);
          const y = valH + (chartH - h);
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={h} rx={5} fill={color} opacity={0.9} />
              <text x={x + barW / 2} y={y - 5} textAnchor="middle" fontSize={10} fontWeight={700} fill="var(--text-secondary)">{d.value >= 1000 ? `${Math.round(d.value / 1000)}k` : Math.round(d.value)}</text>
              <text x={x + barW / 2} y={height - 7} textAnchor="middle" fontSize={11} fill="var(--text-muted)">{d.label}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
