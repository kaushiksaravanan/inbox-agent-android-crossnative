// Pixel 8 device frame from Android Studio's official device-art-resources,
// with our content rendered inside the 1080×2400 display area as live HTML/CSS.
//
// Why this exists: the previous /screens/phone-hero.png and phone-tasks.png
// were screenshots of localhost:3000 inside a browser tab — the address bar
// was literally visible. This component uses the same Pixel 8 frame asset
// Android Studio ships (back.webp + 1080×2400 display at offset 49,55 per
// the frame's layout spec) and draws clean lockscreen content on top with
// no possibility of chrome/URL leakage.
//
// Frame: /screens/pixel-8-back.webp (245KB, 1187×2513)
// Display rect: 1080×2400 at (49, 55) inside the frame.

import Image from "next/image";

interface PixelPhoneProps {
  variant: "lockscreen" | "task-list";
  /** Rendered CSS width in pixels. Height is derived from frame aspect. */
  width?: number;
  className?: string;
  /** Hint the browser to fetch the frame texture eagerly for above-fold use. */
  priority?: boolean;
}

const FRAME_W = 1187;
const FRAME_H = 2513;
const DISPLAY_X = 49;
const DISPLAY_Y = 55;
const DISPLAY_W = 1080;
const DISPLAY_H = 2400;

const NOTIFS = [
  {
    time: "now",
    title: "Cancel Netflix before midnight.",
    body: "$15.99 renews tomorrow · tap to cancel",
    live: true,
  },
  {
    time: "2m ago",
    title: "Pay Comcast — $84.21.",
    body: "Due Friday · tap to pay",
    live: false,
  },
  {
    time: "14m ago",
    title: "Confirm dentist — Thu 3 PM.",
    body: "Reply Yes by 6 PM · tap to open",
    live: false,
  },
] as const;

const TASKS = [
  { title: "Cancel Netflix", meta: "$15.99 · renews tomorrow", due: true },
  { title: "Pay Comcast", meta: "$84.21 · due Friday", due: true },
  { title: "Confirm dentist", meta: "Thu 3:00 PM · Dr. Patel", due: false },
  { title: "Reply to Sarah", meta: "Q3 plan · 2d wait", due: false },
] as const;

export function PixelPhone({
  variant,
  width = 280,
  className = "",
  priority = false,
}: PixelPhoneProps) {
  const height = (width * FRAME_H) / FRAME_W;
  const scale = width / FRAME_W;

  // Display-area dimensions in CSS pixels at the current scale.
  const dispX = DISPLAY_X * scale;
  const dispY = DISPLAY_Y * scale;
  const dispW = DISPLAY_W * scale;
  const dispH = DISPLAY_H * scale;

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width,
        height,
        // The frame already has its own subtle shadow baked in, but a
        // soft outer drop adds anchoring on light backgrounds.
        filter: "drop-shadow(0 24px 48px rgba(0,0,0,0.18))",
      }}
      aria-label={
        variant === "lockscreen"
          ? "Pixel phone lockscreen with three Inbox Agent notifications: cancel Netflix, pay Comcast, confirm dentist."
          : "Pixel phone showing the Inbox Agent task list with upcoming tasks."
      }
      role="img"
    >
      {/* Display content (rendered behind the frame so the bezel covers any
          edge artifacts). Absolutely positioned to match the 1080×2400
          display rect inside the frame. */}
      <div
        style={{
          position: "absolute",
          left: dispX,
          top: dispY,
          width: dispW,
          height: dispH,
          borderRadius: 32 * scale,
          overflow: "hidden",
          // Background depends on variant; both kept inside the bezel.
          background: variant === "lockscreen" ? "#0a0a0a" : "var(--paper, #faf6ef)",
        }}
      >
        {variant === "lockscreen" ? (
          <LockscreenContent scale={scale} />
        ) : (
          <TaskListContent scale={scale} />
        )}
      </div>

      {/* Frame on top — its mask region around the display is transparent
          via the original asset, so the content underneath shows through. */}
      <Image
        src="/screens/pixel-8-back.webp"
        alt=""
        aria-hidden
        width={FRAME_W}
        height={FRAME_H}
        priority={priority}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

function LockscreenContent({ scale }: { scale: number }) {
  // All measurements in 1080-wide design units, scaled to current size.
  const px = (n: number) => n * scale;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        color: "#fff",
        fontFamily:
          "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
        padding: `${px(120)}px ${px(60)}px ${px(80)}px`,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Status bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontFamily: "ui-monospace, monospace",
          fontSize: px(32),
          color: "rgba(255,255,255,0.85)",
          marginBottom: px(60),
        }}
      >
        <span>9:41</span>
        <span style={{ display: "flex", gap: px(12), alignItems: "center" }}>
          <span style={{ fontSize: px(28) }}>●●●●</span>
          <span style={{ fontSize: px(28) }}>5G</span>
          <span
            style={{
              display: "inline-block",
              width: px(48),
              height: px(22),
              border: "2px solid rgba(255,255,255,0.85)",
              borderRadius: px(4),
              position: "relative",
            }}
          >
            <span
              style={{
                position: "absolute",
                inset: px(2),
                background: "rgba(255,255,255,0.85)",
                width: "70%",
              }}
            />
          </span>
        </span>
      </div>

      {/* Time block */}
      <div style={{ textAlign: "center", marginBottom: px(60) }}>
        <div style={{ fontSize: px(220), fontWeight: 300, lineHeight: 1, color: "#fff" }}>
          9:41
        </div>
        <div
          style={{
            fontFamily: "ui-monospace, monospace",
            fontSize: px(32),
            color: "rgba(255,255,255,0.6)",
            marginTop: px(20),
          }}
        >
          Tuesday, June 23
        </div>
      </div>

      {/* Notifications */}
      <div style={{ display: "flex", flexDirection: "column", gap: px(24) }}>
        {NOTIFS.map((n, i) => (
          <div
            key={i}
            style={{
              borderRadius: px(32),
              padding: `${px(28)}px ${px(36)}px`,
              background: n.live
                ? "rgba(243, 110, 33, 0.18)"
                : "rgba(255,255,255,0.08)",
              border: `1px solid ${n.live ? "rgba(243, 110, 33, 0.4)" : "rgba(255,255,255,0.06)"}`,
              backdropFilter: "blur(8px)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: px(16),
                fontFamily: "ui-monospace, monospace",
                fontSize: px(22),
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: px(16) }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: px(56),
                    height: px(56),
                    borderRadius: px(14),
                    background: n.live ? "#F36E21" : "rgba(255,255,255,0.15)",
                    color: "#fff",
                    fontSize: px(28),
                    fontWeight: 700,
                  }}
                >
                  i
                </span>
                <span style={{ color: "rgba(255,255,255,0.75)", letterSpacing: 1.5 }}>
                  INBOX AGENT
                </span>
                {n.live && (
                  <span
                    style={{
                      color: "#F36E21",
                      fontSize: px(18),
                      letterSpacing: 1.5,
                      fontWeight: 700,
                    }}
                  >
                    ● LIVE
                  </span>
                )}
              </span>
              <span style={{ color: "rgba(255,255,255,0.55)" }}>{n.time}</span>
            </div>
            <div
              style={{
                fontSize: px(40),
                fontWeight: 600,
                lineHeight: 1.15,
                marginBottom: px(12),
                color: "#fff",
              }}
            >
              {n.title}
            </div>
            <div
              style={{
                fontSize: px(28),
                color: "rgba(255,255,255,0.7)",
                lineHeight: 1.4,
              }}
            >
              {n.body}
            </div>
          </div>
        ))}
      </div>

      {/* Spacer to push the home indicator down */}
      <div style={{ flex: 1, minHeight: px(40) }} />

      {/* Home indicator */}
      <div
        style={{
          alignSelf: "center",
          width: px(220),
          height: px(10),
          background: "rgba(255,255,255,0.4)",
          borderRadius: px(5),
        }}
      />
    </div>
  );
}

function TaskListContent({ scale }: { scale: number }) {
  const px = (n: number) => n * scale;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        color: "#111",
        fontFamily:
          "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
        padding: `${px(120)}px ${px(60)}px ${px(80)}px`,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Status bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontFamily: "ui-monospace, monospace",
          fontSize: px(32),
          color: "rgba(0,0,0,0.85)",
          marginBottom: px(80),
        }}
      >
        <span>9:41</span>
        <span style={{ display: "flex", gap: px(12), alignItems: "center" }}>
          <span style={{ fontSize: px(28) }}>●●●●</span>
          <span style={{ fontSize: px(28) }}>5G</span>
          <span
            style={{
              display: "inline-block",
              width: px(48),
              height: px(22),
              border: "2px solid rgba(0,0,0,0.85)",
              borderRadius: px(4),
              position: "relative",
            }}
          >
            <span
              style={{
                position: "absolute",
                inset: px(2),
                background: "rgba(0,0,0,0.85)",
                width: "70%",
              }}
            />
          </span>
        </span>
      </div>

      {/* Header */}
      <div
        style={{
          fontFamily: "ui-monospace, monospace",
          fontSize: px(28),
          color: "rgba(0,0,0,0.5)",
          marginBottom: px(20),
          letterSpacing: 1.5,
        }}
      >
        TODAY
      </div>
      <div
        style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: px(96),
          fontWeight: 700,
          lineHeight: 1,
          marginBottom: px(60),
          color: "#111",
        }}
      >
        Friday, Jun 21
      </div>

      {/* Tasks */}
      <div style={{ display: "flex", flexDirection: "column", gap: px(24) }}>
        {TASKS.map((t, i) => (
          <div
            key={i}
            style={{
              background: "#fff",
              borderRadius: px(32),
              border: "1px solid rgba(0,0,0,0.08)",
              padding: `${px(36)}px ${px(40)}px`,
              display: "flex",
              alignItems: "center",
              gap: px(32),
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}
          >
            <span
              style={{
                width: px(40),
                height: px(40),
                borderRadius: "50%",
                border: `3px solid ${t.due ? "#F36E21" : "rgba(0,0,0,0.25)"}`,
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: px(40),
                  fontWeight: 600,
                  color: "#111",
                  marginBottom: px(8),
                }}
              >
                {t.title}
              </div>
              <div
                style={{
                  fontSize: px(28),
                  color: t.due ? "#F36E21" : "rgba(0,0,0,0.55)",
                }}
              >
                {t.meta}
              </div>
            </div>
            {t.due && (
              <span
                style={{
                  width: px(16),
                  height: px(16),
                  borderRadius: "50%",
                  background: "#F36E21",
                  flexShrink: 0,
                }}
              />
            )}
          </div>
        ))}
      </div>

      <div style={{ flex: 1, minHeight: px(40) }} />

      {/* Home indicator */}
      <div
        style={{
          alignSelf: "center",
          width: px(220),
          height: px(10),
          background: "rgba(0,0,0,0.25)",
          borderRadius: px(5),
        }}
      />
    </div>
  );
}
