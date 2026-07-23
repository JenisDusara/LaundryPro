"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function tokenRole(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(payload)).role || null;
  } catch { return null; }
}

/**
 * Client-side guard for money/admin-only pages (accounting, payments, reports, labour, etc.).
 * Staff-role users are bounced to the dashboard. Returns `false` until the check passes so the
 * page can render nothing (avoids a flash of restricted content). The backend also enforces this
 * on the relevant APIs — this is the UX layer so staff never even see the page shell.
 */
export function useBlockStaff(): boolean {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  useEffect(() => {
    if (tokenRole() === "staff") { router.replace("/dashboard"); return; }
    setAllowed(true);
  }, [router]);
  return allowed;
}
