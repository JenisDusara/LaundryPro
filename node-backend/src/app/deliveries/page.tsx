"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Deliveries has been merged into the "Orders" page (/entries). This redirect keeps any
// old links / bookmarks / PWA shortcuts working by forwarding to /entries with the same
// filter/customer params.
export default function DeliveriesRedirect() {
  const router = useRouter();
  useEffect(() => {
    const q = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
    if (!q.get("filter") && !q.get("customer")) q.set("filter", "pending");
    router.replace(`/entries?${q.toString()}`);
  }, [router]);
  return <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>Opening Orders…</div>;
}
