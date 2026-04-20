# Data

## Review JSON Schema

Every review — whether from seed data or user submission — uses this shape:

```json
{
  "product_id": "string",
  "platform": "amazon | flipkart | jiomart | brand",
  "review_text": "string",
  "transcript": "string | null",
  "rating": 1–5,
  "user_id": "string",
  "media_type": "none | image | video",
  "timestamp": "ISO 8601"
}
```

`transcript` is populated instead of `review_text` when `media_type` is `image` or `video`.

---

## Seed Data (`simulation/seed-reviews.json`)

~400 reviews distributed across:
- 4 products × 4 platforms
- Timestamps ranging from **6 months ago → present**, spread weekly
- Intentionally diverse:

| Type | Characteristics |
|------|----------------|
| Clean English | Grammatically correct, clear sentiment |
| Noisy English | Typos, abbreviations, broken grammar |
| Multilingual | English, Hindi, Hinglish, Kannada |
| Sarcastic / Ambiguous | Non-surface-level sentiment |
| Incomplete | Truncated sentences |
| Image/Video | `media_type` set, `transcript` populated |

A small portion simulates bot/spam reviews (for trust layer testing).

---

## Simulation Pages Behavior

- On page load: render all seed reviews from `seed-reviews.json` with their original timestamps
- User submits a review form (text + email + rating + optional media) →
  1. Review appears instantly on the page with timestamp `"just now"`
  2. JS calls `POST http://localhost:5000/api/reviews/ingest` with the review JSON
- Live counter on each page: *"347 reviews analyzed across 4 platforms"* — increments on successful ingest response
- **Simulation pages do not process reviews.** They only display and submit.

---

## Products

4 products, consistent across all platforms. Defined in `simulation/seed-reviews.json` under `"products"` key. Each has: `product_id`, `name`, `description`, `price`, `image_url`, `platform_prices` (per platform).
