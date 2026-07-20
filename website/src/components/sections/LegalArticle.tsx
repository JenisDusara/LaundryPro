import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { LegalDoc } from "@/lib/legal";

export function LegalArticle({ doc }: { doc: LegalDoc }) {
  return (
    <section className="relative py-16 sm:py-20">
      <div className="mx-auto w-full max-w-3xl px-5 sm:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted transition-colors hover:text-text"
        >
          <ArrowLeft size={15} /> Back to home
        </Link>

        <div className="mt-6 border-b border-line pb-6">
          <div className="mb-3 text-[12px] font-bold uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-400">
            Legal
          </div>
          <h1 className="font-display text-[clamp(28px,4.4vw,44px)] font-extrabold tracking-[-0.02em] text-text">
            {doc.title}
          </h1>
          <p className="mt-2 text-[13px] text-faint">Last updated: {doc.updated}</p>
        </div>

        <p className="mt-6 text-[15.5px] leading-relaxed text-muted">{doc.intro}</p>

        <div className="mt-8 space-y-8">
          {doc.sections.map((s) => (
            <div key={s.h}>
              <h2 className="text-[17px] font-bold text-text">{s.h}</h2>
              {s.body?.map((p, i) => (
                <p key={i} className="mt-2.5 text-[14.5px] leading-relaxed text-muted">
                  {p}
                </p>
              ))}
              {s.list && (
                <ul className="mt-3 space-y-2">
                  {s.list.map((li) => (
                    <li key={li} className="flex items-start gap-2.5 text-[14.5px] leading-relaxed text-muted">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-500" />
                      {li}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        <p className="mt-10 rounded-xl border border-line bg-card p-4 text-[12.5px] leading-relaxed text-faint">
          This document is provided for general information about how LaundryMax
          works. Please have it reviewed by a qualified professional before
          relying on it for your business.
        </p>
      </div>
    </section>
  );
}
