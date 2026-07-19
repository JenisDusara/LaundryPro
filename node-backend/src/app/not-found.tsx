// Shown for any unmatched route (404) instead of the default bare Next.js page.
import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "var(--bg-primary, #f8fafc)" }}>
      <div style={{ maxWidth: 420, textAlign: "center", background: "var(--bg-card, #fff)", border: "1px solid var(--border-color, #e2e8f0)", borderRadius: 16, padding: "36px 28px" }}>
        <div style={{ fontSize: 44, fontWeight: 800, color: "var(--accent-primary, #2563eb)", letterSpacing: -1 }}>404</div>
        <h1 style={{ margin: "6px 0 0", fontSize: 20, fontWeight: 700, color: "var(--text-primary, #1e293b)" }}>Page not found</h1>
        <p style={{ margin: "10px 0 22px", fontSize: 14, color: "var(--text-secondary, #64748b)" }}>
          The page you’re looking for doesn’t exist or may have been moved.
        </p>
        <Link
          href="/dashboard"
          style={{ display: "inline-block", padding: "10px 22px", borderRadius: 10, textDecoration: "none", fontWeight: 600, fontSize: 14, color: "#fff", background: "var(--accent-primary, #2563eb)" }}
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
