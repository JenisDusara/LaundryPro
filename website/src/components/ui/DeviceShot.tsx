"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus } from "lucide-react";

type Frame = "browser" | "laptop" | "phone";

/**
 * Shows a REAL software screenshot inside a device frame. If the file isn't in
 * /public/shots yet, a clean labelled placeholder is shown instead — so we
 * never fabricate a fake product UI.
 */
export function DeviceShot({
  src,
  alt,
  frame = "browser",
  className = "",
  url = "app.laundrymax.in",
}: {
  src: string;
  alt: string;
  frame?: Frame;
  className?: string;
  url?: string;
}) {
  const [err, setErr] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const file = src.split("/").pop();

  // Catch images that already failed before React attached onError (dev 404s).
  useEffect(() => {
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth === 0) setErr(true);
  }, []);

  const Placeholder = (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400 dark:from-slate-800 dark:to-slate-900">
      <ImagePlus size={26} />
      <span className="px-4 text-center text-[11px] font-semibold">
        Add your screenshot
      </span>
      <span className="rounded bg-black/5 px-1.5 py-0.5 font-mono text-[9.5px] dark:bg-white/10">
        /shots/{file}
      </span>
    </div>
  );

  const Img = err ? (
    Placeholder
  ) : (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      onError={() => setErr(true)}
      onLoad={(e) => {
        if (e.currentTarget.naturalWidth === 0) setErr(true);
      }}
      className="h-full w-full object-cover object-top"
    />
  );

  if (frame === "phone") {
    return (
      <div
        className={`relative h-[420px] w-[208px] rounded-[30px] bg-[#111] p-[6px] shadow-[0_30px_60px_-15px_rgba(11,24,48,0.5)] ring-1 ring-black/40 ${className}`}
      >
        <div className="absolute left-1/2 top-2.5 z-20 h-[22px] w-[80px] -translate-x-1/2 rounded-full bg-black" />
        <div className="h-full w-full overflow-hidden rounded-[24px] bg-white">
          {Img}
        </div>
      </div>
    );
  }

  // browser / laptop
  return (
    <div className={className}>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_30px_70px_-25px_rgba(15,23,42,0.4)] dark:border-slate-700">
        <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-100 px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
          <span className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          </span>
          <span className="ml-2 flex h-5 flex-1 items-center rounded-md bg-white px-2.5 text-[10px] text-slate-400 dark:bg-slate-900">
            {url}
          </span>
        </div>
        <div className="aspect-[16/10] w-full">{Img}</div>
      </div>
      {frame === "laptop" && (
        <>
          <div className="mx-auto h-2.5 w-[112%] -translate-x-[5.3%] rounded-b-xl bg-gradient-to-b from-slate-300 to-slate-400 shadow-lg dark:from-slate-600 dark:to-slate-700" />
          <div className="mx-auto h-1 w-[36%] rounded-b-md bg-slate-400/70 dark:bg-slate-600/70" />
        </>
      )}
    </div>
  );
}
