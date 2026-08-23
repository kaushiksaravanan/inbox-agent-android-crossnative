# Local Fine-Tuned LM for Email → Task Extraction

**Status:** Feasibility + training plan, ready for execution
**Owner:** inbox-agent / local-llm track
**Last updated:** 2026-06-23

> Live web validation was unavailable at draft time (WebSearch returned upstream errors). All cited figures come from the upstream model cards and runtime docs that have been stable since release; verify the numbers against the URLs in the **References** section before committing budget.

---

## 1. Target capabilities

Single, narrow task. **No general chat, no reply drafting, no long-form summarisation.**

**Input**
- One email, structured:
  - `from` (string, RFC 5322 address)
  - `subject` (string)
  - `snippet` (string, ~200 chars — the preview line shown in most clients)
  - `body` (string, plain-text, up to **4 K tokens**; HTML stripped upstream)

**Output**
- A JSON array of zero or more task objects. Empty array is a valid, common output.

```jsonc
[
  {
    "title":        "Pay Verizon bill",           // verb-first, ≤ 60 chars, summary of action
    "detail":       "Auto-pay disabled; $84.32 due Jun 28",
    "category":     "payment",                    // payment | subscription | followup | deadline | autopay | other
    "priority":     "high",                       // low | medium | high
    "due_at":       "2026-06-28T00:00:00Z",       // ISO-8601 UTC, or null
    "amount_cents": 8432,                         // integer cents, or null
    "counterparty": "Verizon"                     // brand / person / org, or null
  }
]
```

**Hard constraints**
- Output MUST parse as JSON on the first try (no markdown fences, no preamble).
- Unknown fields → `null`, never hallucinated.
- The model never produces prose outside the JSON array.
- The summarisation surface is bounded: `title ≤ 60 chars`, `detail ≤ 240 chars`. Anything longer is a leak.

---

## 2. Base model candidates

Comparison aimed at "average hardware" — mid-range x86 laptop with iGPU, and a recent Android flagship (Pixel 8 / S24-class). All sizes are int4-quantised on-disk footprints. Throughput numbers are typical published figures from the model cards and MLC/llama.cpp benchmarks; treat them as ballpark.

| Model | Params | Int4 size | Laptop tok/s (CPU) | Pixel-8 tok/s | JSON quality | Fine-tune effort | Notes |
|---|---|---|---|---|---|---|---|
| **Llama 3.2 1B Instruct** | 1.24 B | ~700 MB | 30–50 | ~20 | Good with LoRA | Lowest | Designed by Meta for on-device. Built-in tool-call / structured-output training. |
| Qwen 2.5 1.5B Instruct | 1.5 B | ~900 MB | 25–40 | 15–18 | Very good | Low | Strong multilingual; Apache-2.0; larger vocab. |
| Gemma 2 2B | 2.6 B | ~1.6 GB | 18–30 | 10–14 | Good | Medium | Gemma license (open but with use restrictions). |
| Llama 3.2 3B Instruct | 3.2 B | ~1.9 GB | 15–25 | 7–10 | Better | Medium | Same license as 1B; meaningfully better at long-tail extraction. |
| **Phi-3.5 Mini Instruct** | 3.8 B | ~2.4 GB | 12–20 | 5–8 | Best of this list at JSON | Medium | MIT license. Trained heavily on synthetic structured data → excellent first-pass JSON. |

**Recommendation**
- **Phone build → Llama 3.2 1B Instruct.** Smallest int4 footprint that comfortably fits inside an APK + assets, fastest fine-tune, fastest inference on mobile NPUs. With a focused LoRA on ~10 K labelled emails, JSON-parse rate and category accuracy are well within target.
- **Laptop / web build → Phi-3.5 Mini.** ~3× larger but materially better at producing valid JSON on edge cases (multilingual subjects, forwarded chains, ambiguous "is this even a task" emails). MIT license simplifies redistribution.

Both quantised to **int4** for distribution:
- Phone: MLC-LLM converted weights (`q4f16_1`).
- Web: WebLLM-converted weights (`q4f16_1`), cached in OPFS after first download.
- Laptop: GGUF `Q4_K_M` via llama.cpp.

---

## 3. Training data

Goal: ~10 K `(email, tasks_json)` pairs, stratified by category.

### 3.1 Synthetic core (~8 K pairs)

Use the existing `prompts.ts` extraction prompt as the **labelling oracle** against a teacher model (GPT-4o or Claude Opus). Pipeline:

1. Sample ~12 K real / realistic email bodies (see 3.2 for sources).
2. For each, run the teacher with the production prompt to produce the JSON output.
3. Discard the ones the teacher refuses, returns malformed JSON for, or where category confidence is low (judge-loop with a second pass).
4. Keep ~8 K clean pairs.

Cost estimate (Jun 2026 pricing): input ~600 tokens + output ~150 tokens per email → ~7.5 M tokens total. **~$15–30 one-time** at current GPT-4o / Opus rates.

### 3.2 Real-world augmentation (~2 K pairs)

- **Enron email corpus** (public, ~500 K real messages). Label a 2 K stratified subset with the same teacher, then **hand-review** every example. Enron is gold for tone, threading, forwarded chains, and noisy headers — things synthesised emails miss.
- Optional second source: **public bug-tracker / mailing-list digests** (LKML, Apache lists) for the `followup` category, which is under-represented in Enron.

### 3.3 Stratification

Each of the six categories must have **≥ 1.5 K examples**. The unbalanced default (synthetic skews to `payment` / `subscription`) is fixed by oversampling underrepresented categories at synthesis time — i.e. prompt the teacher to generate emails in specific categories rather than relying on the natural distribution.

Distribution target:

| Category | Examples |
|---|---|
| payment | 1.8 K |
| subscription | 1.6 K |
| followup | 1.8 K |
| deadline | 1.6 K |
| autopay | 1.5 K |
| other (incl. "no task") | 1.7 K |

`other` MUST include a healthy fraction of emails that produce `[]` — newsletters, marketing blasts, "your order shipped" notifications. Without these the model over-fires.

### 3.4 Eval splits

- **1 K held-out test split** — drawn from the same distribution, never seen at training.
- **200 hand-curated "golden" examples** — gnarly real-world emails the team labelled manually (multi-task emails, ambiguous due-dates, foreign-currency amounts, forwarded chains, "thanks!" replies that aren't tasks). This is the regression bar.

---

## 4. Fine-tune recipe

LoRA, not full fine-tune. The base models are already instruction-tuned; we only need to bias them toward the JSON schema and the six categories.

| Hyperparameter | Value |
|---|---|
| Method | LoRA |
| Rank `r` | 16 |
| Alpha `α` | 32 |
| Target modules | `q_proj`, `k_proj`, `v_proj`, `o_proj` |
| Dropout | 0.05 |
| Epochs | 3 |
| Learning rate | 2e-4, cosine schedule, 3 % warmup |
| Batch size | 8 (gradient-accumulated to effective 32) |
| Sequence length | 2048 |
| Precision | bf16 |
| Optimizer | AdamW (`β1=0.9`, `β2=0.999`, weight decay 0.01) |
| Packing | enabled (concatenate short examples) |

**Tooling**
- **Unsloth** is the fastest path: ~2× the throughput of vanilla HF Trainer on a single GPU, and it ships LoRA presets for both Llama 3.2 and Phi-3.5. Falls back to Axolotl if Unsloth disagrees with the base model.
- Single **A100 80 GB** on Lambda Labs / Modal / RunPod: ~$1.50–$2/hr. Both models train end-to-end in **2–4 hours**.

**Budget:** ~$5–15 per run, including a few re-runs to tune hyperparams. Round to **$30 total compute** for the training phase.

**Post-training**
- Merge LoRA into base weights for inference.
- Quantise to int4 (`q4f16_1` for MLC/WebLLM, `Q4_K_M` for GGUF).
- Smoke-test on the 200 golden examples before promoting.

---

## 5. Eval criteria

All targets are on the **1 K held-out split** unless otherwise noted.

| Metric | Target | Notes |
|---|---|---|
| JSON parse rate (first attempt, no repair) | **≥ 99 %** | Hardest single number. Failures here cascade into UX. |
| Category exact-match | **≥ 95 %** | Six-way classification. |
| Field-level F1 (averaged over `title`, `detail`, `due_at`, `amount_cents`, `counterparty`) | **≥ 85 %** | `due_at` and `amount_cents` use normalised exact-match; `title` / `detail` use ROUGE-L ≥ 0.6 as "match". |
| Priority @ top-1 (when ≥ 1 task) | **≥ 80 %** | Compared against teacher label. |
| False-positive rate on "no task" emails | **≤ 2 %** | Critical — measured on a held-out slice of 500 newsletter / marketing emails. |
| Latency p50 (Pixel 8, typical 800-token email) | **< 800 ms** | end-to-end including tokenisation. |
| Latency p95 (Pixel 8) | **< 2.0 s** | |
| Golden-set regression | **0 regressions** | Any drop on the 200 hand-curated examples blocks release. |

---

## 6. Inference runtimes

| Surface | Runtime | Why |
|---|---|---|
| **Android** | **MLC-LLM** | Best Android story today — TVM-compiled kernels for Adreno (Snapdragon) and Mali (Tensor / Exynos) GPUs, plus CPU fallback. Ships a Kotlin SDK; the model file is a regular asset. |
| **iOS** (later) | MLC-LLM (Metal) | Same toolchain, different backend. Out of scope for v1. |
| **Web** | **WebLLM** (WebGPU) | Runs in the browser tab with no server round-trip. First-load is 30–90 s on a 100 Mbps link (~700 MB); cached in **OPFS** so subsequent loads are instant. Falls back to a "your browser doesn't support WebGPU, use the BYOK path" message on Safari < 18 / older Firefox. |
| **Desktop** (optional, post-v1) | **llama.cpp** via Tauri | GGUF `Q4_K_M`; uses Metal on macOS, CUDA / Vulkan on Windows, CPU everywhere else. |

A single LoRA-merged checkpoint feeds all three: convert to MLC for Android+Web, convert to GGUF for desktop. Same prompt, same schema, same eval.

---

## 7. Distribution

- **Android APK:** ship the int4 model file (~700 MB for Llama 3.2 1B) inside the APK assets. Yes, the APK is large — gate behind Play Asset Delivery (`install-time` asset pack) so it lands during first install rather than as a download-on-open.
- **Web:** lazy-download on first launch with a "Preparing your local AI…" progress bar. Persist to OPFS keyed by a content hash so a model upgrade triggers a single redownload, not a re-fetch on every visit.
- **Desktop (later):** bundled in the Tauri build.

**License posture**
- **Llama 3.2** is governed by the Llama 3.2 Community License (Meta). Commercial use is allowed, with the well-known **700 M monthly-active-user** clause requiring a separate Meta agreement above that threshold — irrelevant for any business at this stage. Acceptable Use Policy applies. Verify the exact wording at [the Llama 3.2 license page](https://www.llama.com/llama3_2/license/) before shipping.
- **Phi-3.5 Mini** is **MIT-licensed** (Microsoft) — easiest possible redistribution story. Confirm on the [HuggingFace model card](https://huggingface.co/microsoft/Phi-3.5-mini-instruct).
- The fine-tuned LoRA delta is the project's IP; we publish the merged weights under the upstream license terms.

---

## 8. Fallback: BYOK

Default path is **local**. We keep a **bring-your-own-key** mode as opt-in for power users who want:
- Higher recall on multilingual / multi-task edge cases.
- Better handling of very long forwarded chains.
- A safety net while the local model matures.

Providers supported on day 1: **OpenAI** and **Anthropic**. The user pastes a key, it lives in encrypted local storage (Android Keystore / browser IndexedDB with subtle-crypto wrap), never touches our servers. UI is honest: a one-line note that "your emails will leave the device and be sent to OpenAI/Anthropic with your key" before the toggle flips.

---

## 9. Cost model

| Phase | One-time | Per-user recurring |
|---|---|---|
| Data synthesis (teacher labelling) | $15–30 | — |
| Hand-review of Enron subset | ~12 h human time | — |
| Fine-tune compute (~3 runs) | $5–15 | — |
| Eval compute | < $5 | — |
| Hosting / inference | **$0** | **$0** |
| Bandwidth (first model download, web only) | — | ~$0.02 per cold install at S3 egress rates |

**Total training cost: ~$30 one-time.** Inference cost is **zero** because it runs on the user's device.

This unlocks a **one-time license fee** business model (or fully free with an optional pro tier) rather than a per-seat subscription tied to LLM API spend.

---

## 10. Timeline

| Phase | Calendar time |
|---|---|
| Data synthesis + Enron labelling + hand-review | **2 weeks** |
| Fine-tune (Llama 3.2 1B, then Phi-3.5 Mini) | **1 day** total compute, plus a day of hyperparam tweaking |
| MLC integration on Android (Kotlin SDK + asset packing + UI) | **3–5 days** |
| WebLLM integration on web (loader, progress bar, OPFS cache, WebGPU fallback) | **3–5 days** |
| Eval + iterate on golden set + ship-readiness | **1 week** |

**Critical path: ~4–5 calendar weeks**, parallelisable to ~3 weeks if MLC and WebLLM tracks run concurrently after fine-tune lands.

---

## References

- Llama 3.2 model family (sizes, on-device positioning): <https://ai.meta.com/blog/llama-3-2-connect-2024-vision-edge-mobile-devices/>
- Llama 3.2 license: <https://www.llama.com/llama3_2/license/>
- Phi-3.5 Mini model card (MIT license, structured-output training): <https://huggingface.co/microsoft/Phi-3.5-mini-instruct>
- Qwen 2.5 model card: <https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct>
- Gemma 2 model card: <https://huggingface.co/google/gemma-2-2b-it>
- MLC-LLM (Android, WebLLM, conversion toolchain): <https://llm.mlc.ai/>
- WebLLM (WebGPU runtime in-browser): <https://webllm.mlc.ai/>
- llama.cpp (GGUF, mobile / desktop): <https://github.com/ggerganov/llama.cpp>
- Unsloth (LoRA fine-tune toolkit): <https://github.com/unslothai/unsloth>
- Axolotl: <https://github.com/axolotl-ai-cloud/axolotl>
- Enron email corpus: <https://www.cs.cmu.edu/~enron/>

> Verify upstream model sizes and license terms against these URLs before allocating budget. Live web validation was not available when this document was drafted.
