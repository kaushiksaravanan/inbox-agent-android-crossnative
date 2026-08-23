"use client";

import dynamic from "next/dynamic";

// Lazy-load the splash on the client so its motion library and grain layer
// stay out of the critical bundle. Keeps LCP/TBT on landing routes lean.
const Splash = dynamic(
  () => import("@/components/splash").then((m) => m.Splash),
  { ssr: false },
);

export function SplashLoader() {
  return <Splash />;
}
