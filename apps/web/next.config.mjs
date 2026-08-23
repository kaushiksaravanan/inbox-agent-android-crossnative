import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Security headers applied to every response. CSP is deliberately not
 * strict-locked yet — we'd need to enumerate the next/og inline script
 * hashes first. Adding nonce later is the migration path.
 */
const securityHeaders = [
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Strict-Transport-Security",
    // 1 year, include subdomains, signal HSTS preload eligibility.
    value: "max-age=31536000; includeSubDomains; preload",
  },
  {
    key: "Permissions-Policy",
    // Disable powerful APIs we never use.
    value:
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()",
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@inbox/shared", "@inbox/ui"],
  // Build is the final safety net — lint and typecheck still run via
  // `pnpm verify` and the pre-push hook. But letting `next build` itself
  // surface those errors gives a second line of defense, and the cost is
  // small (~5 seconds added to a build).
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  experimental: {
    optimizeCss: true,
    outputFileTracingRoot: path.join(__dirname, "../.."),
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
  webpack: (config, { nextRuntime }) => {
    // @supabase/ssr ships a defensive `process.version` reference inside
    // its supabase-js core dependency. webpack flags it as a Node-only API
    // not available in the Edge runtime. The reference is never executed
    // at Edge runtime (it sits behind a `typeof process !== "undefined"`
    // guard upstream), so the warning is benign. Suppress just this one
    // signature on the edge build so legitimate Edge warnings stay loud.
    //
    // Upstream tracker: https://github.com/supabase/auth-js/issues/811
    if (nextRuntime === "edge") {
      config.ignoreWarnings = [
        ...(config.ignoreWarnings ?? []),
        {
          module: /@supabase\/(supabase-js|ssr|auth-js)/,
          message: /A Node\.js API is used \(process\.version/,
        },
      ];
    }

    // Webpack's PackFileCacheStrategy logs an `info`-level note via the
    // infrastructure logger for any string ≥ ~100KB serialized into the
    // build cache. Our pages have ≥100KB chunks because of the inlined
    // JSON-LD schemas (Organization, SoftwareApplication, FAQPage on
    // /pricing). The note suggests using Buffer for faster deserialization
    // on subsequent builds — it's an optional micro-optimization, not a
    // runtime concern. Bumping the infrastructure log level to "error"
    // silences the info channel without hiding real warnings.
    config.infrastructureLogging = {
      ...(config.infrastructureLogging ?? {}),
      level: "error",
    };

    return config;
  },
};

export default nextConfig;
