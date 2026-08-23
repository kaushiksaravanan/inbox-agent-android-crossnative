"use client";

import { useRef, type ReactNode } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
} from "motion/react";

export type StickyScrollItem = {
  title: string;
  body: string;
  demo: ReactNode;
};

/**
 * StickyScrollReveal — left column stays pinned with the active heading
 * + body while the right column scrolls through a stack of demo cards.
 * Each card fades + lifts into view as it enters the viewport.
 *
 * Adapted from the watermelon.sh "Sticky Scroll" pattern.
 */
export function StickyScrollReveal({ items }: { items: StickyScrollItem[] }) {
  const reduce = useReducedMotion();
  const total = items.length;

  return (
    <section className="border-b border-black/10">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-24 grid lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-32">
            <p className="eyebrow mb-6">The shape of it</p>
            <h2 className="display text-[44px] lg:text-[64px] leading-[0.95]">
              Connect once.
              <br />
              <em className="italic">Then forget us.</em>
            </h2>
            <p className="mt-6 max-w-md text-[15px] leading-[1.6] text-black/70">
              Four pieces, in order. Sign in, structured reads in plain
              Postgres, an alarm in your pocket, a draft in your voice.
            </p>
            <p className="mt-8 mono text-[10px] uppercase tracking-[0.18em] text-black/55">
              Scroll &darr;
            </p>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-16">
          {items.map((item, i) => (
            <StickyCard
              key={item.title}
              item={item}
              index={i}
              total={total}
              reduce={!!reduce}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function StickyCard({
  item,
  index,
  total,
  reduce,
}: {
  item: StickyScrollItem;
  index: number;
  total: number;
  reduce: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 85%", "start 35%"],
  });

  const opacity = useTransform(scrollYProgress, [0, 1], [0.25, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [40, 0]);

  return (
    <motion.div
      ref={ref}
      style={reduce ? undefined : { opacity, y }}
      className="border border-black bg-white"
    >
      <div className="border-b border-black/10 px-6 py-4 flex items-center justify-between">
        <p className="mono text-[10px] uppercase tracking-[0.18em] text-black/60">
          Step {String(index + 1).padStart(2, "0")}
        </p>
        <p className="mono text-[10px] uppercase tracking-[0.18em] text-black/55">
          {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </p>
      </div>
      <div className="p-8 lg:p-10 grid gap-6">
        <h3 className="display text-[32px] leading-[1.05]">{item.title}</h3>
        <p className="text-[15px] leading-[1.6] text-black/70 max-w-xl">
          {item.body}
        </p>
        <div className="mt-2 border-t border-black/10 pt-6">{item.demo}</div>
      </div>
    </motion.div>
  );
}

export default StickyScrollReveal;
