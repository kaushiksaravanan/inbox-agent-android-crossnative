"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

/**
 * Splash intro — Premium archetype.
 *
 * Cycles through 5 greetings on a black screen, ~2.5s total.
 *
 * Motion layers:
 *   primary   — word swap (y-translate + opacity, signature easing)
 *   secondary — letter-spacing tightens as each word settles (Disney follow-through)
 *   ambient   — slow grain overlay (subtle life)
 *
 * Honors prefers-reduced-motion (single static frame, 600ms exit).
 * Renders once per session (sessionStorage) to avoid re-trigger on nav.
 */

const GREETINGS = ["hello", "hola", "bonjour", "olá", "ciao"] as const;

// Signature easing: MD3 Standard, used everywhere in this codebase.
const EASE = [0.4, 0, 0.2, 1] as const;
const EASE_OUT = [0.2, 0, 0, 1] as const;

const WORD_HOLD_MS = 500;
const CROSSFADE_MS = 320;

export function Splash() {
  const [mounted, setMounted] = useState(false);
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    setMounted(true);
    if (typeof window === "undefined") return;

    if (sessionStorage.getItem("inbox.splash.seen")) {
      setDone(true);
      return;
    }
    sessionStorage.setItem("inbox.splash.seen", "1");

    if (reduce) {
      const t = window.setTimeout(() => setDone(true), 600);
      return () => window.clearTimeout(t);
    }

    let i = 0;
    const tick = window.setInterval(() => {
      i += 1;
      if (i >= GREETINGS.length) {
        window.clearInterval(tick);
        window.setTimeout(() => setDone(true), WORD_HOLD_MS);
        return;
      }
      setIndex(i);
    }, WORD_HOLD_MS);

    return () => window.clearInterval(tick);
  }, [reduce]);

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          className="fixed inset-0 z-[100] text-white grid place-items-center"
          style={{ background: "var(--night-grad)" }}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.6, ease: EASE } }}
          aria-hidden="true"
        >
          {/* ambient: subtle grain */}
          <motion.div
            className="absolute inset-0 mix-blend-overlay opacity-[0.08] pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.08 }}
            transition={{ duration: 0.8, ease: EASE }}
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.6) 1px, transparent 0)",
              backgroundSize: "3px 3px",
            }}
          />

          {/* primary: the word itself */}
          <div className="relative min-h-[1.8em] py-[0.2em] overflow-visible flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.span
                key={GREETINGS[index]}
                className="block"
                style={{
                  fontFamily:
                    "var(--font-display), 'Bricolage Grotesque', system-ui, sans-serif",
                  fontWeight: 700,
                  fontSize: "clamp(64px, 14vw, 160px)",
                  lineHeight: 1.25,
                  letterSpacing: "-0.04em",
                }}
                initial={{ y: 24, opacity: 0, letterSpacing: "-0.02em" }}
                animate={{
                  y: 0,
                  opacity: 1,
                  letterSpacing: "-0.04em",
                  transition: { duration: 0.42, ease: EASE_OUT },
                }}
                exit={{
                  y: -24,
                  opacity: 0,
                  letterSpacing: "-0.06em",
                  transition: { duration: CROSSFADE_MS / 1000, ease: EASE },
                }}
              >
                {GREETINGS[index]}
                <span style={{ color: "var(--accent)" }}>.</span>
              </motion.span>
            </AnimatePresence>
          </div>

          {/* progress hairline */}
          <motion.div
            className="absolute bottom-12 left-1/2 -translate-x-1/2 h-px"
            style={{ background: "var(--accent)" }}
            initial={{ width: 0 }}
            animate={{
              width: 120,
              transition: { duration: GREETINGS.length * (WORD_HOLD_MS / 1000), ease: "linear" },
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
