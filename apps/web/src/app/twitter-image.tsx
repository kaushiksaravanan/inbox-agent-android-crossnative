import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Inbox Agent — Cancel Netflix before midnight";
export const size = { width: 1200, height: 600 };
export const contentType = "image/png";

// Same brand as opengraph-image.tsx but at Twitter's 1200x600 ratio.
export default async function TwitterImage() {
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
        {/* Top row: mark + url */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ width: "44px", height: "44px", background: "#101010" }} />
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
          <div
            style={{
              fontSize: "18px",
              fontWeight: 600,
              color: "#c64210",
              letterSpacing: "-0.01em",
            }}
          >
            inbox.agent
          </div>
        </div>

        {/* Centered headline */}
        <div
          style={{
            marginTop: "auto",
            marginBottom: "32px",
            display: "flex",
            flexDirection: "column",
            fontSize: "96px",
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

        {/* Tagline */}
        <div
          style={{
            fontSize: "24px",
            fontWeight: 400,
            color: "#262626",
            maxWidth: "780px",
            lineHeight: 1.35,
          }}
        >
          Reads your inbox. Names the task. Rings your phone.
        </div>

        {/* Accent band */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            width: "480px",
            height: "10px",
            background: "#c64210",
          }}
        />
      </div>
    ),
    { ...size },
  );
}
