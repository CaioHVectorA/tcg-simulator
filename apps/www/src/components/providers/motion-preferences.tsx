"use client";
import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";
export function MotionPreferences({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user" transition={{ duration: 0.18 }}>{children}</MotionConfig>;
}
