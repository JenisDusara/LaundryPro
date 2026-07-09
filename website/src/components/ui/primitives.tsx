import type { ReactNode } from "react";

export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-content px-5 sm:px-8 ${className}`}>
      {children}
    </div>
  );
}

/** Small-caps eyebrow above section headings. */
export function Eyebrow({
  children,
  align = "center",
  tone = "navy",
}: {
  children: ReactNode;
  align?: "center" | "left";
  tone?: "navy" | "amber" | "wa";
}) {
  const color =
    tone === "amber" ? "text-amber-deep" : tone === "wa" ? "text-wa-deep" : "text-navy dark:text-sky-400";
  return (
    <div
      className={`mb-4 text-[12px] font-bold uppercase tracking-[0.18em] ${color} ${
        align === "center" ? "text-center" : "text-left"
      }`}
    >
      {children}
    </div>
  );
}

export function SectionHeading({
  children,
  align = "center",
  className = "",
}: {
  children: ReactNode;
  align?: "center" | "left";
  className?: string;
}) {
  return (
    <h2
      className={`font-display text-[clamp(28px,4.4vw,46px)] font-extrabold leading-[1.12] tracking-[-0.02em] text-text ${
        align === "center" ? "text-center" : "text-left"
      } ${className}`}
    >
      {children}
    </h2>
  );
}
