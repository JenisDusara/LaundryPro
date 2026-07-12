"use client";
import { useEffect } from "react";

// Hard zoom lock for mobile (and desktop). The viewport meta in layout.tsx handles Android,
// but iOS Safari ignores `user-scalable=no`, so we block its zoom gestures explicitly here.
// Double-tap zoom is already handled by `touch-action: manipulation` in globals.css.
export default function NoZoom() {
  useEffect(() => {
    // iOS Safari pinch-zoom fires gesture* events — cancel them.
    const preventGesture = (e: Event) => e.preventDefault();
    document.addEventListener("gesturestart", preventGesture);
    document.addEventListener("gesturechange", preventGesture);
    document.addEventListener("gestureend", preventGesture);

    // Two-or-more-finger touchmove = a pinch. Block it (passive:false lets us preventDefault).
    const preventPinch = (e: TouchEvent) => {
      if (e.touches.length > 1) e.preventDefault();
    };
    document.addEventListener("touchmove", preventPinch, { passive: false });

    // Desktop / trackpad: Ctrl/Cmd + wheel is the browser zoom gesture.
    const preventWheelZoom = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) e.preventDefault();
    };
    document.addEventListener("wheel", preventWheelZoom, { passive: false });

    // Desktop keyboard zoom: Ctrl/Cmd with +, -, =, or 0.
    const preventKeyZoom = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ["+", "-", "=", "0"].includes(e.key)) e.preventDefault();
    };
    document.addEventListener("keydown", preventKeyZoom);

    return () => {
      document.removeEventListener("gesturestart", preventGesture);
      document.removeEventListener("gesturechange", preventGesture);
      document.removeEventListener("gestureend", preventGesture);
      document.removeEventListener("touchmove", preventPinch);
      document.removeEventListener("wheel", preventWheelZoom);
      document.removeEventListener("keydown", preventKeyZoom);
    };
  }, []);

  return null;
}
