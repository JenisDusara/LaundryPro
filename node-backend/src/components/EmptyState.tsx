import React from "react";

/**
 * Friendly empty-state shown wherever a list / section has no data — a small
 * laundry-basket illustration + a title (and optional subtitle / action).
 * Theme-aware: everything is drawn with CSS variables so it works in light & dark.
 */
export default function EmptyState({
  title = "No data found",
  subtitle,
  compact = false,
  action,
}: {
  title?: string;
  subtitle?: string;
  compact?: boolean;
  action?: React.ReactNode;
}) {
  const w = compact ? 132 : 168;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: compact ? "26px 16px" : "44px 16px", gap: 14 }}>
      <svg width={w} height={w * 0.8} viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        {/* soft backdrop */}
        <ellipse cx="100" cy="143" rx="58" ry="8" fill="var(--text-primary)" opacity="0.06" />
        <circle cx="100" cy="80" r="52" fill="var(--accent-primary)" opacity="0.08" />

        {/* question bubble */}
        <path d="M124 28 h36 a9 9 0 0 1 9 9 v18 a9 9 0 0 1 -9 9 h-19 l-9 10 v-10 h-8 a9 9 0 0 1 -9 -9 v-18 a9 9 0 0 1 9 -9 z"
          fill="var(--bg-card)" stroke="var(--grade-c-text)" strokeWidth="3" strokeLinejoin="round" />
        <text x="143" y="55" textAnchor="middle" fontSize="24" fontWeight="800" fill="var(--grade-c-text)" fontFamily="inherit">?</text>

        {/* sparkles */}
        <g stroke="var(--accent-primary)" strokeWidth="3" strokeLinecap="round" opacity="0.7">
          <path d="M42 50 v11 M36.5 55.5 h11" />
        </g>
        <circle cx="62" cy="38" r="3.2" fill="var(--grade-b-text)" opacity="0.65" />

        {/* basket rim */}
        <rect x="50" y="84" width="100" height="16" rx="7" fill="var(--accent-primary)" />
        {/* basket body */}
        <path d="M56 100 L144 100 L137 138 a6 6 0 0 1 -6 5 L69 143 a6 6 0 0 1 -6 -5 Z"
          fill="var(--bg-card)" stroke="var(--accent-primary)" strokeWidth="3" strokeLinejoin="round" />
        {/* slats */}
        <g stroke="var(--accent-primary)" strokeWidth="3" strokeLinecap="round" opacity="0.4">
          <line x1="76" y1="107" x2="74" y2="136" />
          <line x1="92" y1="107" x2="91" y2="137" />
          <line x1="108" y1="107" x2="109" y2="137" />
          <line x1="124" y1="107" x2="126" y2="136" />
        </g>
      </svg>

      <div>
        <div style={{ fontSize: compact ? 14 : 16, fontWeight: 800, color: "var(--text-primary)" }}>{title}</div>
        {subtitle && <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4, maxWidth: 300, lineHeight: 1.5 }}>{subtitle}</div>}
      </div>
      {action && <div style={{ marginTop: 2 }}>{action}</div>}
    </div>
  );
}
