"use client";

import { WashingMachine, Shirt, Droplets, Wind, Waves } from "lucide-react";

/**
 * Soft floating laundry glyphs — washing machine, shirt, steam, droplets —
 * scattered as faint background decoration so a section instantly reads as
 * *laundry*. Purely decorative; ignored by screen readers & pointer events.
 */
export function FloatingLaundry({ className = "" }: { className?: string }) {
  const items = [
    { Icon: WashingMachine, cls: "left-[6%] top-[18%]", size: 46, delay: "0s", spin: true },
    { Icon: Shirt, cls: "right-[8%] top-[12%] rotate-[14deg]", size: 40, delay: "-1.5s" },
    { Icon: Droplets, cls: "left-[14%] bottom-[16%]", size: 34, delay: "-3s" },
    { Icon: Wind, cls: "right-[12%] bottom-[20%] -rotate-[8deg]", size: 38, delay: "-2.2s" },
    { Icon: Waves, cls: "left-[46%] top-[8%]", size: 32, delay: "-4s" },
  ];
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      {items.map(({ Icon, cls, size, delay, spin }, i) => (
        <div
          key={i}
          className={`absolute text-navy/[0.07] dark:text-white/[0.06] ${cls} animate-bob`}
          style={{ animationDelay: delay }}
        >
          <Icon size={size} strokeWidth={1.5} className={spin ? "animate-spin-slow" : ""} />
        </div>
      ))}
    </div>
  );
}

/** Rising soap bubbles — a light, playful laundry touch. */
export function Bubbles({ className = "" }: { className?: string }) {
  const bubbles = [
    { left: "10%", size: 10, delay: "0s", dur: "6s" },
    { left: "24%", size: 6, delay: "-2s", dur: "7s" },
    { left: "40%", size: 14, delay: "-1s", dur: "8s" },
    { left: "58%", size: 8, delay: "-3.5s", dur: "6.5s" },
    { left: "72%", size: 5, delay: "-1.5s", dur: "7.5s" },
    { left: "86%", size: 11, delay: "-2.8s", dur: "8.5s" },
  ];
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {bubbles.map((b, i) => (
        <span
          key={i}
          className="animate-rise absolute bottom-0 rounded-full border border-navy/20 bg-navy/[0.05] dark:border-white/20 dark:bg-white/[0.05]"
          style={{
            left: b.left,
            width: b.size,
            height: b.size,
            animationDelay: b.delay,
            animationDuration: b.dur,
          }}
        />
      ))}
    </div>
  );
}

/**
 * A gentle water-wave divider. Sits at the bottom of a section to evoke
 * washing / water. Inherits the *next* section's background via `fill`.
 */
export function WaveDivider({
  className = "",
  flip = false,
}: {
  className?: string;
  flip?: boolean;
}) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-x-0 ${flip ? "top-0" : "bottom-0"} leading-[0] ${className}`}
    >
      <svg
        viewBox="0 0 1440 90"
        preserveAspectRatio="none"
        className={`h-[54px] w-full text-navy/[0.06] dark:text-white/[0.05] ${flip ? "rotate-180" : ""}`}
      >
        <path
          fill="currentColor"
          d="M0 40c120 26 260 40 420 30s320-46 540-46 380 40 540 44 0 0 0 0v58H0z"
        />
        <path
          fill="currentColor"
          opacity="0.6"
          d="M0 58c160 20 300 8 480-6s340-30 520-24 300 30 440 34v58H0z"
        />
      </svg>
    </div>
  );
}
