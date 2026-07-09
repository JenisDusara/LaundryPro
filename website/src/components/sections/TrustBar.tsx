"use client";

import { cities } from "@/lib/site";

export function TrustBar() {
  return (
    <section className="border-y border-line bg-card/60 py-8">
      <p className="mb-6 text-center text-[12px] font-bold uppercase tracking-[0.18em] text-faint">
        Running in laundry shops across India
      </p>

      {/* seamless scrolling ticker (train-like) */}
      <div className="marquee-mask group relative overflow-hidden">
        <div className="flex w-max animate-marquee items-center group-hover:[animation-play-state:paused]">
          {[...cities, ...cities].map((c, i) => (
            <span key={i} className="flex items-center">
              <span className="px-7 text-[17px] font-bold tracking-tight text-faint transition-colors hover:text-navy">
                {c}
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-line" />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
