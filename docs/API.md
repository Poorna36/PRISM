# API Contracts

Base URL: `http://localhost:5000/api`

---

## POST /reviews/ingest

Called by simulation pages when a user submits a review.

**Request body:** Review JSON schema (see DATA.md)

**Response:**
```json
{
  "review_id": "uuid",
  "status": "queued | processed",
  "pipeline_triggered": true
}
```

Triggers the full 7-stage pipeline asynchronously. Returns immediately after queueing.

---

## GET /dashboard/:productId

Called by React frontend to populate all dashboard panels.

**Query params:**
- `platform` (optional) — filter to one platform
- `week_range` (optional, default 24) — weeks of history to return

**Response:**
```json
{
  "product_id": "string",
  "health_score": 0–100,
  "review_count": 320,
  "flagged_count": 14,
  "feature_sentiment": {
    "battery_life": { "positive": 0.58, "negative": 0.42, "count": 87 },
    "packaging":    { "positive": 0.31, "negative": 0.69, "count": 64 }
  },
  "product_summary": "Moderately Positive (64% positive, 320 reviews)...",
  "issues": [
    {
      "issue_id": "uuid",
      "feature": "packaging",
      "type": "batch | systemic | isolated",
      "severity": "high | medium | low",
      "confidence": 0.0–1.0,
      "confidence_level": "green | yellow | red",
      "affected_pct": 0.42,
      "recommendation": "Investigate packaging process for recent batches"
    }
  ],
  "weekly_trends": [
    { "week": "2024-W10", "battery_life": 0.6, "packaging": 0.3 }
  ],
  "what_changed_this_week": {
    "battery_life": "up",
    "packaging": "down"
  },
  "graph_data": {
    "nodes": [{ "id": "uuid", "feature": "string", "sentiment": "pos|neg", "week": "string" }],
    "edges": [{ "source": "uuid", "target": "uuid", "weight": 0.0–1.0 }]
  },
  "platform_comparison": {
    "amazon":   { "health_score": 72, "feature_sentiment": {} },
    "flipkart": { "health_score": 61, "feature_sentiment": {} }
  }
}
```

---

## GET /dashboard/all

Returns health score leaderboard for all 4 products.

**Response:**
```json
[
  { "product_id": "string", "name": "string", "health_score": 84 },
  { "product_id": "string", "name": "string", "health_score": 61 }
]
```

---

## GET /alerts

Returns active alerts where feature negative sentiment exceeded threshold.

**Response:**
```json
[
  {
    "alert_id": "uuid",
    "product_id": "string",
    "feature": "string",
    "triggered_at": "ISO 8601",
    "severity": "high | medium | low",
    "message": "string"
  }
]
```

Also pushed in real-time via Socket.io event `"alert:new"`.

---

## POST /demo/run

Called by Demo Center. Streams pipeline stages for a given review.

**Request body:**
```json
{ "review": { /* Review JSON schema */ } }
```

**Response:** Server-Sent Events (SSE) stream. One event per pipeline stage:

```
event: stage
data: { "stage": 1, "name": "Validation", "status": "pass", "detail": "Not duplicate. Not spam." }

event: stage
data: { "stage": 2, "name": "Normalization", "result": "cleaned review text here" }

event: stage
data: { "stage": 3, "name": "Feature Extraction", "features": { "packaging": "negative" } }

...

event: done
data: { "insight_delta": { "health_score": 79, "new_issue": null } }
```

---

## POST /reports/generate

Triggers PDF generation for a product.

**Request body:**
```json
{ "product_id": "string", "platform": "all | amazon | ..." }
```

**Response:**
```json
{ "report_url": "/reports/uuid.pdf" }
```

PDF is rendered server-side via Puppeteer and served as a static file.

---

## GET /reviews/:productId

Returns paginated raw reviews (for drill-down in dashboard).

**Query params:** `page`, `limit`, `feature`, `sentiment`, `platform`

**Response:**
```json
{
  "reviews": [ { /* review + pipeline output */ } ],
  "total": 320,
  "page": 1
}
```
