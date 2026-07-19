"use client";
// App-wide error boundary. Next.js renders this whenever a route segment throws while rendering,
// instead of showing the default blank white error screen. `reset()` re-attempts the segment.
import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Unhandled app error:", error);
  }, [error]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "var(--bg-primary, #f8fafc)" }}>
      <div style={{ maxWidth: 420, textAlign: "center", background: "var(--bg-card, #fff)", border: "1px solid var(--border-color, #e2e8f0)", borderRadius: 16, padding: "36px 28px" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "var(--text-primary, #1e293b)" }}>Something went wrong</h1>
        <p style={{ margin: "10px 0 22px", fontSize: 14, color: "var(--text-secondary, #64748b)" }}>
          An unexpected error occurred. You can try again — if it keeps happening, please refresh the page.
        </p>
        <button
          onClick={() => reset()}
          style={{ padding: "10px 22px", borderRadius: 10, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 14, color: "#fff", background: "var(--accent-primary, #2563eb)" }}
        >
          Try again
        </button>
      </div>
    </div>
  );
}
