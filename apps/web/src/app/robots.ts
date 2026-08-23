import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://inbox.agent";

// We block the API + dashboard at the crawler level. These routes return
// 307/401 for unauthenticated clients anyway, but blocking here saves
// crawl budget and prevents noise in search-console reports.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",       // all server endpoints
          "/auth/",      // OAuth callback
          "/oauth/",     // PKCE callback for Google
          "/dashboard",  // user dashboard (auth-gated, but block anyway)
          "/accounts",
          "/devices",
          "/settings",
          "/tasks",
          "/welcome",    // auth-gated (dashboard) route group page
          "/login",      // (auth) route group page
          "/signup",     // (auth) route group page
          "/forgot-password", // (auth) route group page
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
