"use client";

import {
  animate,
  useInView,
  useMotionValue,
  useTransform,
  motion,
} from "framer-motion";
import { useEffect, useRef } from "react";

/** Counts up from 0 to `value` once it scrolls into view. */
export function Counter({
  value,
  decimals = 0,
  duration = 1.6,
}: {
  value: number;
  decimals?: number;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const count = useMotionValue(0);
  const display = useTransform(count, (v) =>
    decimals ? v.toFixed(decimals) : Math.round(v).toLocaleString("en-IN")
  );

  useEffect(() => {
    if (inView) {
      const controls = animate(count, value, {
        duration,
        ease: [0.16, 1, 0.3, 1],
      });
      return controls.stop;
    }
  }, [inView, value, count, duration]);

  return <motion.span ref={ref}>{display}</motion.span>;
}
