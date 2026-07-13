"use client";
import { useEffect } from "react";

// Registers the service worker so the app is installable (Add to Home Screen) and runs
// standalone. Registration is best-effort and never blocks the app.
export default function PWARegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    const onLoad = () => navigator.serviceWorker.register("/sw.js").catch(() => {});
    window.addEventListener("load", onLoad);
    // If the page is already loaded (client nav), register immediately too.
    if (document.readyState === "complete") onLoad();
    return () => window.removeEventListener("load", onLoad);
  }, []);
  return null;
}
