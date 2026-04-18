# Pipeline

All stages run in the backend (`server/pipeline/`). Triggered on every `POST /api/reviews/ingest`. Also callable stage-by-stage via `POST /api/demo/run` (SSE stream).

---

## Stage 1 — Normalize (`normalize.js`)

**Input:** Raw review JSON  
**External call:** Sarvam AI API  
**Output:** `{ normalized_text: string, detected_language: string }`

- Handles: multilingual input (English, Hindi, Hinglish, Kannada), emojis, slang, broken grammar, code-switching, incomplete sentences
- Image/video reviews: `transcript` field is used as input instead of `review_text`
- Output is clean, concise, professional-form English — this normalized text feeds all downstream stages

---

## Stage 2 — Trust Filter (`trust.js`)

**Input:** Normalized review  
**Output:** `{ pass: boolean, reason: string | null }`

| Check | Method |
|-------|--------|
| Exact deduplication | Hash of normalized text vs DB |
| Near-duplicate clustering | Cosine similarity > 0.92 threshold on review embeddings |
| Bot/spam detection | Heuristics: submission velocity, generic phrasing patterns, rating anomalies |

Rejected reviews are stored with `status: "flagged"`. Flagged count is surfaced in dashboard.

> **Note:** Near-duplicate detection reuses the review embedding computed in Stage 3 if available, or computes a lightweight one on-demand here. No separate embedding call needed.

---

## Stage 3 — Feature Extraction & Sentiment (`extract.js`)

**Input:** Normalized text  
**Output:** `{ features: { [feature_name]: { sentiment: "positive"|"negative", score: float } } }`

This is the core NLP stage. It uses **pre-trained semantic embeddings** to identify which product features a review discusses, then scores sentiment per feature.

### 3a — Embedding-Based Feature Detection

**Why embeddings over keywords:** Keyword matching misses paraphrases ("the box was crushed" → `packaging`), domain synonyms, and multilingual residue after normalization. Pre-trained sentence embeddings capture semantic meaning, not surface tokens.

**Implementation:**

```
model: all-MiniLM-L6-v2 (via @xenova/transformers — runs in Node.js, no Python required)
       OR sentence-transformers Python microservice if offloaded
```

**Feature anchor descriptions** — each predefined feature is represented as a short descriptive phrase that is embedded once at server startup and cached:

```js
const FEATURE_ANCHORS = {
  battery_life:       "battery life, charging speed, how long the battery lasts",
  packaging:          "box, packaging, unboxing, damaged box, packaging quality",
  build_quality:      "build quality, durability, materials, feels cheap, solid construction",
  customer_support:   "customer support, after-sales service, helpdesk, return process",
  delivery_speed:     "delivery speed, shipping time, arrived late, fast delivery",
  value_for_money:    "value for money, price, worth the cost, expensive, affordable",
  performance:        "performance, speed, lag, response time, processing power",
};
```

**Detection logic:**

```
1. Embed normalized review text → review_vector (384-dim float array)
2. For each feature:
     similarity = cosine_similarity(review_vector, feature_anchor_vector)
     if similarity > FEATURE_THRESHOLD (default: 0.50) → feature is relevant
3. A review may match 1–N features
4. Store per-feature similarity score as `score` in output
```

**Threshold rationale:** 0.50 is conservative enough to avoid false positives on unrelated text while catching paraphrases. Tunable per feature if needed — packaging anchors may warrant a lower threshold (0.45) due to shorter mentions.

**Explainability:** Every match is attributable to a numeric similarity score and a known anchor phrase. No black-box decision — similarity score is logged per review per feature and surfaced in the Demo Center stage output.

### 3b — Sentiment Scoring per Feature

Sentiment is computed **per matched feature**, not for the review as a whole. This enables mixed-sentiment reviews to be correctly split (e.g., positive on performance, negative on packaging).

```
method: rule-augmented sentiment — VADER or lightweight transformer head
         on the sentence(s) most similar to the feature anchor
```

**Process:**

```
1. Split normalized text into sentences
2. For each matched feature:
     - Find the 1–2 sentences with highest cosine similarity to the feature anchor
     - Run sentiment classifier on those sentences only
     - Output: { sentiment: "positive"|"negative", score: 0.0–1.0 }
```

**Ambiguity handling** (runs in parallel with sentiment scoring):

| Signal | Detection Method | Output |
|--------|-----------------|--------|
| Sarcasm | Contradiction between star rating and sentiment polarity + tone markers | `ambiguity: "sarcasm"` |
| Mixed polarity | Positive and negative sentences both linked to the same feature (score delta < 0.2) | `ambiguity: "mixed"` |
| Vague | Low lexical density in feature-relevant sentences (< 4 content words) | `ambiguity: "vague"` |

Ambiguity flags are stored on the feature output and fed directly to Stage 6 confidence scoring as a penalty multiplier.

**Ambiguity confidence multipliers:**

| Class | Confidence multiplier |
|-------|-----------------------|
| None | 1.00 |
| Vague | 0.85 |
| Mixed | 0.70 |
| Sarcasm | 0.55 |

**Final output per feature (unchanged format):**

```json
{
  "battery_life": { "sentiment": "negative", "score": 0.76 },
  "packaging":    { "sentiment": "negative", "score": 0.61 }
}
```

`score` reflects the similarity confidence (how strongly this review relates to the feature). Sentiment is binary for dashboard rendering. Ambiguity class is stored in the DB but not exposed in the standard dashboard response — it feeds Stage 6 internally.

---

## Stage 4 — Graph Integration (`graph.js`)

**Input:** Feature-sentiment output + review metadata  
**Output:** Graph node created in DB; edges drawn to existing nodes

Node fields: `review_id`, `features[]`, `sentiments[]`, `platform`, `week`, `product_id`, `embedding_vector`

The review embedding computed in Stage 3 is stored on the node. This enables optional embedding-based similarity between reviews as an additional edge signal.

**Edge weight formula:**

```
edge_weight = (feature_overlap × 0.5) + (sentiment_match × 0.3) + (week_proximity × 0.2)
```

- `feature_overlap`: fraction of shared matched features between two nodes (now semantically detected, not keyword-based — improves grouping of paraphrased issues)
- `sentiment_match`: 1.0 if both nodes agree on sentiment for shared features, 0.0 otherwise
- `week_proximity`: 1.0 if same week, decays linearly to 0.0 at 4-week gap

**Optional embedding similarity signal (lightweight, additive):**

If two nodes share no keyword overlap but have high embedding similarity (cosine > 0.80), they may still form a weak edge. This catches reviews that describe the same issue with entirely different vocabulary. This signal is additive — it does not replace the formula above; it can contribute up to +0.1 to edge weight.

**Edge creation threshold:** `edge_weight > 0.40`

Because feature detection is now embedding-based rather than keyword-based, edges connect reviews that are **semantically similar**, not just lexically similar. This produces tighter, more meaningful clusters.

### Cluster Classification

Run after each new node is added:

| Cluster Type | Detection Condition |
|-------------|---------------------|
| Systemic | Dense cluster (≥8 nodes) spanning ≥3 weeks, same feature, same sentiment |
| Batch | Dense cluster (≥5 nodes) within ≤2 week window |
| Isolated | Node with no edges above threshold |

Classification uses threshold-based connected components — no k-means or DBSCAN. Clusters are semantically stronger than in a keyword-based system because the underlying edges are formed from embedding-based feature overlap.

---

## Stage 5 — Time-Series Analysis (`timeseries.js`)

**Input:** All graph nodes for a product, grouped by week  
**Output:** Weekly sentiment trajectory per feature; trend direction; spike flags

All signals in this stage derive from embedding-based feature extraction (Stage 3). Sentiment assignments are more accurate and consistent across paraphrased reviews, which reduces noise in weekly aggregations.

- X-axis: weeks (up to 24 weeks of history)
- Detects: rising/falling sentiment, spikes, emerging issue clusters (new dense groupings forming in recent 2 weeks)
- **Spike threshold:** feature negative sentiment rate > 60% in any single week
- Timeline markers: hardcoded product update events stored per product in DB, overlaid on trend charts
- `what_changed_this_week`: compares current week avg sentiment vs prior week per feature → returns `"up" | "down" | "stable"`

No changes to aggregation logic. Embedding-based upstream simply improves input quality.

---

## Stage 6 — Confidence Scoring & Ranking (`confidence.js`)

**Input:** Classified cluster + time-series output + ambiguity flags from Stage 3  
**Output:** `{ confidence: float, confidence_level: "green"|"yellow"|"red", priority_rank: int }`

### Confidence Formula

Ambiguity penalty is applied **before** the main formula:

```
adjusted_scores = raw_feature_scores × ambiguity_multiplier (per review)
```

Then:

```
confidence = (frequency_score × 0.40)
           + (cluster_density × 0.35)
           + (sentiment_consistency × 0.25)
```

**Optional lightweight signal:** embedding similarity consistency within a cluster. If all nodes in a cluster have pairwise cosine similarity > 0.70 (using stored embedding vectors), add +0.05 to confidence. This rewards clusters where reviews are not just feature-matched but also semantically coherent — a stronger signal of a real, consistent issue.

| Range | Level | Color | Action |
|-------|-------|-------|--------|
| 0.75–1.0 | High | Green | Act immediately |
| 0.45–0.74 | Medium | Yellow | Monitor |
| 0.0–0.44 | Low | Red | Gather more data |

Issues ranked by `confidence × severity_weight`. Top issues surfaced in recommendations panel.

**Recommendation action map** (in `confidence.js`) maps `feature + issue_type` combinations to hardcoded suggested actions. Unchanged.

---

## Stage 7 — Adaptive Feedback (`feedback.js`)

**Input:** Classified issue + original review  
**External call:** Gemini API  
**Output:** Survey question(s) dispatched to user (simulated); responses stored in DB

Gemini prompt template:
> "Given this customer review and the detected issue ({feature}, {type}), generate 2 short follow-up survey questions to clarify whether this issue is general or segment-specific."

Survey responses feed back to confidence scoring — validated issues get confidence boost; contradicted ones get reduced.

---

## Embedding Model — Deployment Notes

| Option | When to use |
|--------|-------------|
| `@xenova/transformers` (Node.js WASM) | Default. No Python dependency. ~30ms per embedding on modern CPU. |
| `sentence-transformers` Python microservice | If embedding latency is a bottleneck under load. Expose as `POST /embed` on a local port. |

Model: `all-MiniLM-L6-v2` — 22M parameters, 384-dim output, Apache 2.0 license. No training required. Downloaded once, cached locally.

Feature anchor embeddings are computed **once at server startup** and stored in memory. Only review text requires per-request embedding.

**Hackathon feasibility:** A single review goes through embedding in ~30–50ms. Full pipeline per review (all 7 stages) targets < 2 seconds end-to-end.
