"use client";

import { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
} from "motion/react";
import { AppPreview } from "@/components/app-preview";

// Pulls the AppPreview slightly closer + tilts it as it enters the viewport,
// then settles flat. Scroll-linked, not time-based, so it follows the user.
export function ScrollLinkedPreview() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // Active band: lift + un-tilt as it enters, drift away as it leaves.
  const y = useTransform(scrollYProgress, [0, 0.5, 1], [40, 0, -40]);
  const rotate = useTransform(scrollYProgress, [0, 0.5, 1], [6, 0, -3]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.94, 1, 0.97]);

  if (reduce) {
    return (
      <div ref={ref}>
        <AppPreview />
      </div>
    );
  }

  return (
    <motion.div ref={ref} style={{ y, rotate, scale }}>
      <AppPreview />
    </motion.div>
  );
}
