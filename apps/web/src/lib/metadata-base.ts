// Shared twitter card base — spread into per-page `twitter` blocks so that
// Next.js's shallow-merge of nested metadata fields doesn't drop the @inboxagent
// attribution when a child segment defines its own `twitter` block. See
// nextjs.org/docs/app/api-reference/functions/generate-metadata ("Inheriting
// fields"): when a child sets `twitter`, the parent's entire nested block is
// replaced, not merged field-by-field.
export const TWITTER_BASE = {
  card: "summary_large_image" as const,
  creator: "@inboxagent",
};
