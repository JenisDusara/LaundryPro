import type { Metadata } from "next";

// A server-component layout only so `metadata` can be exported here — the scan page itself is a
// client component (it needs localStorage + an API call) and Next disallows `metadata` exports
// from "use client" files. Belt-and-suspenders with robots.ts: this also blocks indexing via the
// per-page <meta name="robots"> tag in case a crawler ignores robots.txt.
export const metadata: Metadata = {
  title: "Order tag",
  robots: { index: false, follow: false, nocache: true },
};

export default function ScanLayout({ children }: { children: React.ReactNode }) {
  return children;
}
