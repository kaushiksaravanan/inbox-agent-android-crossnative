import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Inbox Agent — Cancel Netflix before midnight";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Mirrors the live landing page brand: warm paper canvas (#fafaf8),
// near-black ink, accent orange #c64210 (WCAG AA on both surfaces).
// Edge runtime can't load custom woff2 inline cheaply — we use system
// font stacks tuned to look close to Bricolage Grotesque + Inter.
//
// Layout uses explicit heights instead of marginTop:auto because
// satori (Next's edge image renderer) handles auto-margins differently
// than browsers — explicit numbers prevent the headline from
// overlapping the footer when font metrics shift between engines.
export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#fafaf8",
          color: "#101010",
          display: "flex",
          flexDirection: "column",
          padding: "72px",
          position: "relative",
          fontFamily:
            "'Helvetica Neue', system-ui, -apple-system, BlinkMacSystemFont, Arial, sans-serif",
        }}
      >
        {/* Top row: mark + eyebrow */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            height: "64px",
          }}
        >
          <div style={{ width: "56px", height: "56px", background: "#101010" }} />
          <div
            style={{
              fontSize: "20px",
              fontWeight: 500,
              letterSpacing: "3px",
              textTransform: "uppercase",
              color: "#676767",
            }}
          >
            Inbox Agent
          </div>
        </div>

        {/* Headline — centered vertically using a fixed-height middle block */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            height: "350px",
            marginTop: "20px",
            fontSize: "88px",
            fontWeight: 800,
            lineHeight: 1.0,
            letterSpacing: "-0.04em",
          }}
        >
          <div style={{ display: "flex" }}>Cancel Netflix</div>
          <div style={{ display: "flex" }}>
            before midnight
            <span style={{ color: "#c64210" }}>.</span>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            height: "80px",
          }}
        >
          <div
            style={{
              fontSize: "24px",
              fontWeight: 400,
              color: "#262626",
              maxWidth: "720px",
              lineHeight: 1.35,
            }}
          >
            Reads your inbox. Names the task. Rings your phone.
          </div>
          <div
            style={{
              fontSize: "20px",
              fontWeight: 600,
              color: "#c64210",
              letterSpacing: "-0.01em",
            }}
          >
            inbox.agent
          </div>
        </div>

        {/* Accent band */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            width: "480px",
            height: "12px",
            background: "#c64210",
          }}
        />
      </div>
    ),
    { ...size },
  );
}
