import type { MetadataRoute } from "next";

// Fall back to a placeholder for build time when the env var isn't set
// (e.g. local builds, CI without the prod env). The placeholder is a
// real-but-non-resolving subdomain so anyone manually inspecting a
// sitemap built without env config can tell something's off without
// the build itself failing. Set NEXT_PUBLIC_SITE_URL in production
// deploy config to override.
function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://inbox.agent";
}

const SITE_URL = getSiteUrl();

// Public, indexable routes only. Auth pages (/login, /signup) and OAuth
// callback paths are deliberately excluded — they have no unique content
// search engines should index. Robots-policy in robots.ts also blocks
// the API + dashboard surface area at the crawler level.
//
// Per-route hints (changeFrequency, priority, lastModified) are
// guesses search engines may weigh; they're not commitments.

interface RouteHint {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
  /**
   * Time the page's content actually changed — NOT the time the sitemap
   * was generated. Bump this when you edit the route's content. Required:
   * if it's missing, TypeScript fails the build rather than silently
   * churning lastmod on every redeploy (which makes the signal worthless,
   * per sitemaps.org spec + Google's stated handling).
   */
  lastModified: Date;
}

// Legal pages were last rewritten on the local-first pivot day.
const LEGAL_LAST_MODIFIED = new Date("2026-06-24T00:00:00Z");

// Marketing pages — bump when the route's content actually changes.
const HOME_LAST_MODIFIED = new Date("2026-06-24T00:00:00Z");
const PRICING_LAST_MODIFIED = new Date("2026-06-24T00:00:00Z");
const SECURITY_LAST_MODIFIED = new Date("2026-06-24T00:00:00Z");
const ABOUT_LAST_MODIFIED = new Date("2026-06-24T00:00:00Z");
const CONTACT_LAST_MODIFIED = new Date("2026-06-24T00:00:00Z");

// TODO: /changelog and /status are genuinely dynamic — derive these from
// the latest changelog entry / latest status incident timestamp inside
// sitemap() once a data source is wired up. Until then, bump manually.
const CHANGELOG_LAST_MODIFIED = new Date("2026-06-24T00:00:00Z");
const STATUS_LAST_MODIFIED = new Date("2026-06-24T00:00:00Z");

const ROUTES: RouteHint[] = [
  {
    path: "/",
    changeFrequency: "weekly",
    priority: 1.0,
    lastModified: HOME_LAST_MODIFIED,
  },
  {
    path: "/pricing",
    changeFrequency: "monthly",
    priority: 0.9,
    lastModified: PRICING_LAST_MODIFIED,
  },
  {
    path: "/security",
    changeFrequency: "monthly",
    priority: 0.85,
    lastModified: SECURITY_LAST_MODIFIED,
  },
  {
    path: "/about",
    changeFrequency: "monthly",
    priority: 0.7,
    lastModified: ABOUT_LAST_MODIFIED,
  },
  {
    path: "/contact",
    changeFrequency: "yearly",
    priority: 0.6,
    lastModified: CONTACT_LAST_MODIFIED,
  },
  {
    path: "/changelog",
    changeFrequency: "weekly",
    priority: 0.55,
    lastModified: CHANGELOG_LAST_MODIFIED,
  },
  {
    path: "/status",
    changeFrequency: "daily",
    priority: 0.5,
    lastModified: STATUS_LAST_MODIFIED,
  },
  {
    path: "/privacy",
    changeFrequency: "yearly",
    priority: 0.4,
    lastModified: LEGAL_LAST_MODIFIED,
  },
  {
    path: "/terms",
    changeFrequency: "yearly",
    priority: 0.4,
    lastModified: LEGAL_LAST_MODIFIED,
  },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return ROUTES.map((r) => ({
    url: `${SITE_URL}${r.path === "/" ? "" : r.path}`,
    lastModified: r.lastModified,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
