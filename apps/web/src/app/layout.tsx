import type { Metadata } from "next";
import { Inter, Bricolage_Grotesque, JetBrains_Mono } from "next/font/google";
import { SplashLoader } from "@/components/splash-loader";
import { ToasterProvider } from "@/components/toaster-provider";
import { CopyProvider } from "@/components/copy-context";
import "./globals.css";

// Body — clean geometric sans (Neue Montreal substitute via Inter weight 400/500)
const sans = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

// Display — heavy, boxy, geometric. Bricolage Grotesque echoes Degular Display's weight + tracking.
const display = Bricolage_Grotesque({
  weight: ["600", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
});

// Mono — JetBrains Mono for technical eyebrows/labels. Switched from Kode
// Mono because next/font/google can't compute fallback metrics for Kode
// Mono (emits "Failed to find font override values" at build time, which
// causes a layout-shift gap until the webfont loads). JetBrains Mono ships
// the metrics next/font needs.
const mono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "700"],
  variable: "--font-mono",
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://inbox.kaushik.cv";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    template: "%s — Inbox Agent",
    default: "Inbox Agent — An email agent for your phone",
  },
  description:
    "A local-first email agent. Reads your inbox on your phone. AI runs on your phone. One time $49, refundable.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: "Inbox Agent",
    url: "/",
    title: "Inbox Agent — An email agent for your phone",
    description:
      "A local-first email agent. Reads your inbox on your phone. AI runs on your phone. One time $49, refundable.",
    // og:image / twitter:image are emitted by the
    // src/app/opengraph-image.tsx and twitter-image.tsx convention files.
  },
  twitter: {
    card: "summary_large_image",
    creator: "@inboxagent",
    title: "Inbox Agent — An email agent for your phone",
    description:
      "A local-first email agent. Reads your inbox on your phone. AI runs on your phone. One time $49, refundable.",
  },
  icons: {
    icon: "/icon",
    apple: "/apple-icon",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Inbox Agent",
    url: SITE_URL,
    logo: `${SITE_URL}/apple-icon`,
    sameAs: [
      "https://github.com/inboxagent/inbox-agent",
      "https://twitter.com/inboxagent",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: "hi@inbox.agent",
      availableLanguage: ["English"],
    },
  };

  return (
    <html lang="en">
      <body className={`${sans.variable} ${display.variable} ${mono.variable}`}>
        <SplashLoader />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <CopyProvider>{children}</CopyProvider>
        <ToasterProvider />
      </body>
    </html>
  );
}
