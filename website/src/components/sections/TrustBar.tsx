"use client";

import { cities } from "@/lib/site";

export function TrustBar() {
  return (
    <section className="section-band py-9">
      <p className="mb-6 text-center text-[12px] font-bold uppercase tracking-[0.18em] text-faint">
        Running in laundry shops across India
      </p>

      {/* seamless scrolling ticker (train-like) */}
      <div className="marquee-mask group relative overflow-hidden">
        <div className="flex w-max animate-marquee items-center gap-3 group-hover:[animation-play-state:paused]">
          {[...cities, ...cities].map((c, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-4 py-1.5 text-[14px] font-semibold tracking-tight text-muted shadow-sm transition-colors hover:border-navy/40 hover:text-navy dark:hover:text-sky-400"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-navy/50" />
              {c}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
