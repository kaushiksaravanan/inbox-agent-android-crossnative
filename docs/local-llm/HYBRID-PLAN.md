# Inbox Agent — Hybrid Architecture Plan

> Canonical architecture doc. Replaces the earlier `MODEL-PLAN.md`.

---

## 1. The thesis

Two Reddit threads — one from **Signal_Ad657** arguing for local-first email tooling, one from **Warm-Reaction-456** advocating to rip the AI out of an existing inbox product — independently converge on the same lesson:

> **Rules where you can, models only where rules can't.**

People work around systems they can't explain. A task that appears in someone's inbox triage without a legible reason gets ignored, distrusted, and eventually disabled. The bar isn't "is the model accurate enough on average" — it's "can the user point at any single task and understand exactly why it exists."

**Every task surfaced by Inbox Agent must be explainable.** Not "explainable in principle via SHAP values" — explainable in the literal sense that the UI can quote the exact text fragment and the exact rule that produced the task. If we can't do that for a given email, we don't produce a task. Skipping is cheaper than fabricating.

This document describes the architecture that lets us hit that bar while keeping the on-device footprint small enough to run on a 2018 phone.

---

## 2. Three-layer pipeline

Processing is **top-to-bottom, first-fire wins**. Each email passes through Layer 1 first; if Layer 1 emits a task, we stop. If not, fall through to Layer 2. If Layer 2 doesn't fire, fall through to Layer 3. If Layer 3 doesn't find usable spans, the email is skipped.

### Layer 1 — Sender catalog
- **Size:** ~5 KB JSON
- **Latency:** 0 ms (dictionary lookup + regex)
- **Coverage:** ~70%

A static JSON catalog of roughly 50 high-value senders: Netflix, Spotify, Adobe, Lovable, Comcast, USPS, FedEx, your bank, your utility, your major SaaS subscriptions, the airlines you fly, etc.

Each entry has the shape:

```json
{
  "sender_domain": "netflix.com",
  "patterns": [
    {
      "id": "netflix:renews",
      "subject_regex": "^Your Netflix membership will renew",
      "body_extractors": {
        "amount": "\\$([0-9]+\\.[0-9]{2})",
        "deadline": "on ([A-Z][a-z]+ [0-9]{1,2})"
      },
      "task_template": {
        "kind": "subscription_renewal",
        "counterparty": "Netflix",
        "action": "review renewal"
      }
    }
  ]
}
```

Fires fully deterministically. The emitted task carries `derived_from = "rule:netflix:renews"`.

### Layer 2 — Generic regex
- **Size:** ~10 KB
- **Latency:** 0 ms
- **Coverage:** ~15%

Cross-sender patterns: invoice line items, generic receipts, ICS calendar invites, verification-code strips, shipping-tracking numbers, "your order #X has shipped" templates that don't match a known sender.

`derived_from = "regex:invoice_pattern"` (or whichever pattern fired).

### Layer 3 — GLiNER fallback
- **Size:** ~25 MB (int4 quantized)
- **Latency:** ~100 ms per email on a mid-range phone
- **Coverage:** ~10%

Extractive NER. The model finds spans in the email text and labels them:

- `ACTION_VERB` — "pay", "renew", "confirm", "ship", "respond"
- `COUNTERPARTY` — sender entity name
- `AMOUNT` — dollar / currency figure
- `DEADLINE` — absolute or relative date

The spans are then dropped into a deterministic task template. **There is no free-text generation anywhere.** GLiNER picks text out of the email; we assemble the task fields from those spans plus the sender metadata.

`derived_from = "model:gliner"` plus the exact matched spans and their character offsets.

### Final residual: ~5%
If Layer 3 doesn't find at least one `ACTION_VERB` plus one of `{AMOUNT, DEADLINE}`, the email is skipped. **Better to miss than to make up.**

---

## 3. Total on-device footprint: 25–40 MB

| Component | Size |
| --- | --- |
| Sender catalog (Layer 1) | ~5 KB |
| Generic regex (Layer 2) | ~10 KB |
| GLiNER int4 (Layer 3) | ~25 MB |
| ONNX runtime (mobile native lib) | ~15 MB |
| **Total** | **~25–40 MB** |

Compare to the prior plan (`MODEL-PLAN.md`), which assumed a 700 MB Llama 1B as the primary inference engine. The hybrid architecture is roughly **25× smaller** and runs on a 2018-vintage phone with no thermal issues.

---

## 4. Every task is explainable

Each `Task` object carries a `derived_from` field. The value is one of:

- `rule:<rule_id>` — Layer 1, e.g. `rule:netflix:renews`
- `regex:<pattern_name>` — Layer 2, e.g. `regex:invoice_pattern`
- `model:gliner` + the matched spans (with character offsets into the email body)

The mobile UI exposes a **"Why is this here?"** panel on every task. The panel quotes the exact text fragment from the source email that produced the task — the subject line that matched the regex, or the body span that GLiNER tagged as `DEADLINE`. The user can always trace a task back to its evidence in two taps.

---

## 5. Failure modes — and how rules beat models on this task

The hybrid design eliminates entire classes of failure that a generative-LLM-based pipeline would expose us to:

- **Can't hallucinate the counterparty.** It comes from the sender's display name (Layer 1/2) or from a `COUNTERPARTY` span that GLiNER physically lifted out of the email (Layer 3). No model writes "Netflix" from prior knowledge — it has to point at the substring.
- **Can't hallucinate an amount.** Amounts are regex-extracted dollar figures or GLiNER spans tied to character offsets in the source text. If no such span exists, the task has no amount field.
- **Can't return malformed JSON.** The task object is **built** from rule/template fields, never **parsed** from a model output. There is no JSON-mode prompt to fail, no schema-coercion step.
- **Can't misclassify Netflix as a deadline.** Netflix lives in the subscription bucket via its sender domain in Layer 1. The classification is structural, not learned.

These failures are the ones that make AI-augmented inbox tools feel untrustworthy. The architecture makes them unrepresentable.

---

## 6. GLiNER fine-tune recipe

GLiNER is the only ML training we do. Recipe:

- **Base model:** `urchade/gliner_small-v2` (~49M params, quantizes to ~25 MB int4)
- **Synthetic data:** ~5,000 (email, NER spans) pairs generated by GPT-4o from a templated prompt over diverse sender categories (subscriptions, bills, deliveries, calendar invites, verification codes, refunds, shipping notifications)
- **Training:** 3 epochs on a free Colab T4
- **Eval targets:**
  - F1 > 0.85 on `AMOUNT`, `DEADLINE`
  - F1 > 0.90 on `COUNTERPARTY`, `ACTION_VERB`

Eval set is held-out real emails labeled by hand. If F1 misses the bar, we expand the synthetic-data prompt rather than swap base models.

---

## 7. Inference runtimes

Two deployment targets, same ONNX artifact:

- **Browser:** ONNX Runtime Web (~25 MB WASM). Runs GLiNER int4 at 50–100 ms per email on a modern laptop.
- **Android:** ONNX Runtime Mobile (~15 MB native lib). Same 50–100 ms range on mid-tier hardware.

iOS path is the same ONNX Runtime Mobile binary. No platform-specific model conversion.

---

## 8. Rollout plan

The architecture is designed so each layer ships independently and the app stays useful at every stage.

- **Phase 1 — Week 1: Layer 1 only.** Ship the sender catalog + rules engine. No model download. Covers ~70% of high-value email out of the gate.
- **Phase 2 — Weeks 2–3: Layer 2.** Add the generic regex layer. Coverage climbs to ~85%.
- **Phase 3 — Weeks 4–5: Layer 3.** Fine-tune GLiNER, quantize to int4, ship as an **optional** download. Users who skip the model download still get the full Layer 1 + Layer 2 product; their Layer 3 simply degrades to "no task found, skip email" rather than fabricating.

At no point does the app require the model to be useful.

---

## 9. Why this is moat

The sender catalog is the asset. It **compounds**:

- Every time we add Lyft, Robinhood, Audible, Patreon, Substack, DoorDash, Uber Eats, AT&T, etc., Layer 1 coverage strictly improves.
- No retraining. No eval regressions on unrelated senders. No model version pinning. Adding a new sender is a JSON PR.
- The catalog encodes domain knowledge — exactly which subject lines a given sender uses for renewals vs cancellations vs failed-payment notices — that is tedious to gather and trivial to defend.

A black-box model trained on the same email corpus would have to relearn this every retrain, with no guarantee that the previous behavior on Netflix stays stable when we add coverage for Lyft. A curated rules catalog has no such cross-contamination.

**Curated rules beat a black-box model for this task.** The architecture is the product.
