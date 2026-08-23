import { LandingContent } from "@/components/landing-content";
import { COPY } from "@/lib/copy";
import { EXTRA_HOME_FAQS } from "@/lib/home-faq";
import { APP_VERSION } from "@inbox/shared";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://inbox.agent";

// Schema.org SoftwareApplication metadata. Keep these claims honest:
//   - No fake ratings (we have zero users)
//   - Pricing must match the actual one-time $49 license (ROADMAP rules out subscriptions)
//   - Version pulled from @inbox/shared (single source of truth)
//   - Description must not promise features we cut (no "drafts replies")

const mobileJsonLd = {
  "@context": "https://schema.org",
  "@type": "MobileApplication",
  name: "Inbox Agent",
  description:
    'A local-first Android app that rings your phone with action verbs from your email. "Cancel Netflix before midnight," not "1 new message". Pairs with web in six digits.',
  applicationCategory: "Productivity",
  operatingSystem: "Android 9.0+, Web (companion)",
  url: SITE_URL,
  softwareVersion: APP_VERSION,
  offers: {
    "@type": "Offer",
    name: "Inbox Agent license",
    price: "49",
    priceCurrency: "USD",
    description: "One-time, 30-day refund.",
  },
};

const softwareJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Inbox Agent",
  description:
    "Local-first email agent. Reads your inbox on your phone, extracts action verbs as tasks, rings you when something is due. Never sends email.",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web, Android",
  url: SITE_URL,
  softwareVersion: APP_VERSION,
  offers: {
    "@type": "Offer",
    name: "Inbox Agent license",
    price: "49",
    priceCurrency: "USD",
    description: "One-time, 30-day refund.",
  },
  // No aggregateRating. We have zero users; faking ratings is the kind of
  // SEO sin we'd rather flag in `/security` than commit ourselves.
};

// FAQPage entries must match the visible page verbatim (Google's structured-data
// policy). To prevent drift, both this JSON-LD AND landing-content.tsx render
// from the same sources: COPY.faq (the first 4 questions) and EXTRA_HOME_FAQS
// (the 3 hardcoded tail entries). Do not inline answer strings here — edit the
// source modules so the visible DOM and the schema stay in lockstep.
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    ...COPY.faq.map((item) => ({
      "@type": "Question",
      name: item.q.simple,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a.simple,
      },
    })),
    ...EXTRA_HOME_FAQS.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  ],
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(mobileJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <LandingContent />
    </>
  );
}
