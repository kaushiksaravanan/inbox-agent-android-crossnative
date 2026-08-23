// Centralized copy for the landing page with SIMPLE / BUZZWORD variants.
// The active mode is controlled by CopyContext (see components/copy-context.tsx)
// and toggled via the pill in SiteNav (see components/copy-toggle.tsx).

export type CopyMode = "simple" | "buzzword";

// A standard SIMPLE/BUZZWORD pair used throughout most of the landing copy.
export type CopyPair = {
  simple: string;
  buzzword: string;
};

// New "How it works" shape: one step owned by the user, three owned by the agent.
// Only SIMPLE values are provided here — the legacy how_headline / how_body keys
// below still carry the BUZZWORD variants for the agentic-mode rendering until
// that section is migrated.
export type HowStep = {
  number: string;
  title: string;
  body: string;
};

export const COPY = {
  // Shortened body copy used in the redesigned sections. These render the same
  // string regardless of mode — keep the punchy version everywhere.
  hero_body_simple:
    "Reads your inbox. Names the task. Rings your phone.",
  what_body_simple:
    "Watches renewals, charges, replies you owe. Skips the rest.",
  android_body_simple: "One ping. One tap. Done.",
  safety_body_simple:
    "By default, your email never leaves your device. Turn on BYOK and email is sent only to the model provider you choose — never to us.",
  how_eyebrow_simple: "How it works",
  how_headline_simple: "One step. Yours.",
  how_subline_simple: "The other three run on your device.",

  hero_eyebrow: {
    simple: "A local-first email agent.",
    buzzword: "Autonomous inbox intelligence, always-on.",
  },
  hero_headline: {
    simple: "Cancel Netflix before midnight.",
    buzzword: "Cancel Netflix before midnight — agentically.",
  },
  hero_body: {
    simple:
      "Reads your inbox on your phone. Names the task. Rings your phone. No black box by default.",
    buzzword:
      "An autonomous inbox agent that performs intelligent triage across your mailboxes, surfacing decision-grade signal and routing only high-intent moments to your phone.",
  },
  hero_cta_primary: {
    simple: "Get it — $49",
    buzzword: "Deploy your agent",
  },
  hero_cta_secondary: {
    simple: "Get the app",
    buzzword: "Install the companion app",
  },
  hero_finepoint: {
    simple: "Gmail today, more soon. $49 one-time. 30-day no-questions refund.",
    buzzword: "Gmail-native. $49 one-time license. 30-day full refund guarantee.",
  },

  how_eyebrow: {
    simple: "How it works",
    buzzword: "The agentic loop",
  },
  how_headline: {
    simple: "One step. Yours.",
    buzzword: "One handshake. Infinite leverage.",
  },
  // Legacy: how_subline is consumed by landing-content alongside the new
  // step_user / steps_agent keys. Buzzword copy stays in how_body for the
  // agentic-mode rendering until that section is migrated to the new shape.
  how_subline: {
    simple: "The other three run on your device.",
    buzzword: "The rest of the loop runs itself.",
  },
  how_body: {
    simple:
      "One sign-in. We ring your phone when a decision is due. Checks every 15 min by default — tune it faster, slower, or pause it.",
    buzzword:
      "A single OAuth handshake bootstraps the agentic loop. From there, an autonomous read-decide-notify cycle runs continuously in the background and escalates only decision-grade events to your device. The default 15-minute sync cadence is fully configurable — tune the polling interval to your latency tolerance.",
  },

  // New "How it works" shape. landing-content reads these for SIMPLE mode.
  step_user: {
    number: "01",
    title: "Connect.",
    body: "Sign in to Gmail once. The token lives in your phone's keychain — not on our servers.",
  } as HowStep,
  steps_agent: [
    {
      number: "02",
      title: "Read.",
      body: "Your phone polls Gmail directly. No server in between.",
    },
    {
      number: "03",
      title: "Decide.",
      body: "A small AI that recognizes renewal/payment/reply emails turns them into named tasks. Every task is explainable — tap to see why. (BYOK tasks show the provider's reasoning instead.)",
    },
    {
      number: "04",
      title: "Remind.",
      body: "Tasks ring as alarms with the action verb. Cancel. Pay. Confirm.",
    },
  ] as HowStep[],

  what_eyebrow: {
    simple: "What you get",
    buzzword: "Outcomes, not inbox theater",
  },
  what_headline: {
    simple: "No more missed renewals.",
    buzzword: "Compounding focus across every mailbox.",
  },
  what_body: {
    simple:
      "Watches for renewals, charges, replies you owe. Skips the rest.",
    buzzword:
      "Inbox Agent operationalizes intelligent triage over auto-renewals, payment events, refund flows, and high-intent threads. Low-signal noise is suppressed; you receive a curated, decision-ready feed instead of an unbounded backlog.",
  },

  android_eyebrow: {
    simple: "On your phone",
    buzzword: "Mobile-native, edge-aware",
  },
  android_headline: {
    simple: "A buzz, not a flood.",
    buzzword: "High-signal pings, no notification spam.",
  },
  android_body: {
    simple:
      "One ping. One tap. Done. No folders. No rules.",
    buzzword:
      "The Android companion delivers yes/no prompts at the moment of decision. Resolve in a single tap — no manual rule authoring, no folder taxonomies, no inbox grooming overhead.",
  },

  safety_eyebrow: {
    simple: "Your data, your rules",
    buzzword: "Privacy-first, sovereignty-grade",
  },
  safety_headline: {
    simple: "Your email. Your phone. Your data.",
    buzzword: "Zero-retention architecture by design.",
  },
  safety_body: {
    simple:
      "By default, we never see an email. We never see a task. Subpoena us and you get encrypted bytes. Turn on BYOK and email goes only to the model provider you choose — never to us.",
    buzzword:
      "Mail is read on-device, never ingested server-side. Inference runs inside the app boundary and payloads are discarded post-decision. State is persisted locally — your device is the source of truth. The server holds only opaque ciphertext; a subpoena yields encrypted bytes. Bring-your-own-key support and a single-tap kill switch preserve full operator control.",
  },

  safety_tiles: [
    {
      simple_title: "No server processing",
      simple_body:
        "Your phone reads Gmail directly. We never see the email body. Ever.",
      buzzword_title: "Zero-retention inference",
      buzzword_body:
        "Mail is read at inference time and discarded. No durable copy lives outside your device.",
    },
    {
      simple_title: "On-device AI",
      simple_body:
        "A small AI that recognizes renewal/payment/reply emails handles most email. No internet AI needed.",
      buzzword_title: "On-device state plane",
      buzzword_body:
        "All persistent state — decisions, preferences, history — is co-located with the client. Sovereignty by architecture.",
    },
    {
      simple_title: "Encrypted sync",
      simple_body:
        "Web and mobile sync via a scrambled backup only your other devices can read. Our server holds scrambled data only you can unlock.",
      buzzword_title: "BYOK model routing",
      buzzword_body:
        "Plug in your own OpenAI or Anthropic credentials. Inference costs flow directly to your provider — we stay out of the loop.",
    },
    {
      simple_title: "Read-only OAuth",
      simple_body:
        "Read-only Gmail scope. We can't send or modify email.",
      buzzword_title: "Tunable polling cadence",
      buzzword_body:
        "The default 15-minute sync interval is operator-configurable end-to-end. Dial latency up, down, or fully paused.",
    },
  ],

  numbers_tiles: [
    {
      simple_label: "Time to decide",
      buzzword_label: "Mean time-to-decision",
      value: "90s",
    },
    {
      simple_label: "Email you see",
      buzzword_label: "High-signal surface ratio",
      value: "~3%",
    },
    {
      simple_label: "Default check-in",
      buzzword_label: "Default polling interval",
      value: "15 min",
    },
    {
      simple_label: "Email on our servers",
      buzzword_label: "Server-side payload retention",
      value: "0",
    },
  ],

  faq: [
    {
      q: {
        simple: "How do I know why a task is on my list?",
        buzzword: "How is task provenance surfaced?",
      },
      a: {
        simple:
          "Tap any task → \"Why?\". You see the rule that fired and the matched line. Mark wrong → we fix it.",
        buzzword:
          "Every extracted task is explainable end-to-end: the firing rule and the matched email span are surfaced inline. No black-box LLM in the default path. Operator feedback loops back into rule refinement.",
      },
    },
    {
      q: {
        simple: "Do you send my email to OpenAI / Anthropic / Google?",
        buzzword: "What is the data ingestion scope?",
      },
      a: {
        simple:
          "No. The small AI runs on your phone. You can plug in your own AI key if you want one in the loop.",
        buzzword:
          "Ingestion is gated to each sync cycle. New messages are inspected, a decision is emitted, and payloads are discarded post-inference. Zero server-side retention.",
      },
    },
    {
      q: {
        simple: "What if your servers are subpoenaed?",
        buzzword: "Where is state persisted?",
      },
      a: {
        simple:
          "We have a scrambled ID and a scrambled backup (we don't hold the key), and a purchase record. No emails, no tasks, no keys.",
        buzzword:
          "All persistent state is co-located with the client on your device. The server holds no durable copy of operator data.",
      },
    },
    {
      q: {
        simple: "Does it work offline?",
        buzzword: "What is the offline mode posture?",
      },
      a: {
        simple:
          "Task extraction runs on your phone, so offline works. Gmail polling needs network. Already-extracted alarms still fire offline. New emails can't reach the phone without network, so we'll catch up as soon as you reconnect.",
        buzzword:
          "Task extraction is on-device, so inference continues under network partition. Gmail polling requires connectivity; already-extracted alarms still fire on schedule, and new mail is reconciled on reconnect.",
      },
    },
    {
      q: {
        simple: "Can I use my own AI key?",
        buzzword: "Is BYOK supported?",
      },
      a: {
        simple:
          "Yes — you can plug in your own AI key if you want. BYOK explanations come from the provider and won't show a rule + matched line.",
        buzzword:
          "Yes. BYOK routing for OpenAI and Anthropic is first-class. Inference costs flow directly to your provider; we are not in the billing path.",
      },
    },
    {
      q: {
        simple: "How often does it check?",
        buzzword: "What is the default polling cadence?",
      },
      a: {
        simple:
          "Every 15 minutes by default. You can tune it faster, slower, or pause it.",
        buzzword:
          "The default polling interval is 15 minutes and is operator-configurable end-to-end — tune latency up, down, or fully paused.",
      },
    },
    {
      q: {
        simple: "What if the agent misses a task or makes a mistake?",
        buzzword: "What is the SLA on agent accuracy?",
      },
      a: {
        simple:
          "30-day refund, no questions. There's a refund button in settings during your first 30 days.",
        buzzword:
          "30-day no-questions refund is honored end-to-end via an in-product self-serve flow. Operator satisfaction takes precedence over revenue retention.",
      },
    },
  ],

  final_section: {
    simple: {
      headline: "I built this because Lovable charged me $100.",
      body: "True story: signed up for a Lovable monthly with a coupon. Forgot about it. $50 hit my card. Then another $50 the next day. Had to block my debit card, get it reissued. The autopay email was sitting in another inbox I never check. Inbox Agent is what I needed that week.",
      cta: "Get started",
      signature: "— Kaushik · maker",
    },
    buzzword: {
      headline: "I built this because a missed Lovable renewal cost me a debit card.",
      body: "Lossy inboxes are how subscription leak compounds. A single missed renewal email triggered $100 in charges and a card reissue. Inbox Agent collapses that failure mode: high-signal escalation when it matters, silence otherwise.",
      cta: "Deploy your agent",
      signature: "— Kaushik",
    },
  },
} as const;
