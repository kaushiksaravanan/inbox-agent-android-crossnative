"use client";

import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from "react";
import { useReducedMotion } from "motion/react";

/**
 * Reveal — Premium archetype scroll-triggered entrance.
 *
 * Implemented with IntersectionObserver + CSS classes (no motion lib).
 * Primary: 12px y-translate + opacity (under 1/3 viewport rule).
 * Easing: signature MD3 standard (cubic-bezier(.4,0,.2,1)).
 * Duration: 500ms.
 *
 * Honors prefers-reduced-motion: when the user has reduced motion enabled,
 * we short-circuit to the static end state (always "shown").
 *
 * Safety net: if IntersectionObserver never fires (already in viewport at
 * mount on some browsers, display:contents parent, etc.), force "shown"
 * after 1s so content is never invisible forever.
 */
function useReveal<T extends Element>(rootMarginPx = 80) {
  const ref = useRef<T | null>(null);
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (shown) return;

    // Reduced motion: skip animation, render end state immediately.
    if (reduce) {
      setShown(true);
      return;
    }

    const el = ref.current;
    if (!el) return;

    // Safety-net timeout: never let content stay invisible.
    const t = setTimeout(() => setShown(true), 1000);

    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return () => clearTimeout(t);
    }

    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true);
            obs.disconnect();
            break;
          }
        }
      },
      { rootMargin: `-${rootMarginPx}px 0px -${rootMarginPx}px 0px` },
    );
    obs.observe(el);

    return () => {
      clearTimeout(t);
      obs.disconnect();
    };
  }, [rootMarginPx, shown, reduce]);

  return { ref, shown };
}

export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, shown } = useReveal<HTMLDivElement>();
  const style: CSSProperties | undefined =
    delay > 0 ? { transitionDelay: `${delay * 1000}ms` } : undefined;

  return (
    <div
      ref={ref}
      className={`reveal-target${shown ? " is-shown" : ""}${
        className ? ` ${className}` : ""
      }`}
      style={style}
    >
      {children}
    </div>
  );
}

/**
 * RevealStagger — animates direct children (use RevealItem) in sequence.
 * 80ms per child × max 4 children = 320ms (under 400ms ceiling).
 *
 * Note: do NOT pass `className="contents"` — `display: contents` removes the
 * box that IntersectionObserver needs. As a safety net, we detect that here
 * and drop the className so the wrapper still renders as a normal block.
 */
export function RevealStagger({
  children,
  className,
  staggerMs = 80,
}: {
  children: ReactNode;
  className?: string;
  staggerMs?: number;
}) {
  const { ref, shown } = useReveal<HTMLDivElement>();

  // Safety net: `display: contents` breaks IntersectionObserver observation.
  const safeClassName =
    className && /\bcontents\b/.test(className) ? undefined : className;

  // Walk direct children and inject a stagger delay prop into any RevealItem.
  let index = 0;
  const staggered = Children.map(children, (child) => {
    if (!isValidElement(child)) return child;
    const el = child as ReactElement<{
      __staggerDelayMs?: number;
      __staggerShown?: boolean;
    }>;
    const delayMs = index * staggerMs;
    index += 1;
    return cloneElement(el, {
      __staggerDelayMs: delayMs,
      __staggerShown: shown,
    });
  });

  return (
    <div ref={ref} className={safeClassName}>
      {staggered}
    </div>
  );
}

export function RevealItem({
  children,
  className,
  // Injected by RevealStagger via cloneElement.
  __staggerDelayMs,
  __staggerShown,
}: {
  children: ReactNode;
  className?: string;
  __staggerDelayMs?: number;
  __staggerShown?: boolean;
}) {
  // If used outside a RevealStagger, fall back to a self-driven reveal.
  const { ref, shown: ownShown } = useReveal<HTMLDivElement>();
  const usingParent = typeof __staggerShown === "boolean";
  const shown = usingParent ? !!__staggerShown : ownShown;
  const delayMs = __staggerDelayMs ?? 0;
  const style: CSSProperties | undefined =
    delayMs > 0 ? { transitionDelay: `${delayMs}ms` } : undefined;

  return (
    <div
      ref={usingParent ? undefined : ref}
      className={`reveal-target${shown ? " is-shown" : ""}${
        className ? ` ${className}` : ""
      }`}
      style={style}
    >
      {children}
    </div>
  );
}
