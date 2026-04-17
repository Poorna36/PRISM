# UI (React Frontend)

Frontend lives in `client/`. It is purely presentational — all data comes from the backend API. No business logic in the frontend.

React (Vite) + Tailwind CSS + Recharts + D3.js + Framer Motion + Socket.io client.

---

## Pages

| Route | Page | File |
|-------|------|------|
| `/` | Main App | `pages/MainPage.jsx` |

Single-page layout. The frontend team will decide the exact section order and layout during build. Demo Center is the final section of the page (always anchored at the bottom). No routing needed.

---

## Dashboard Panels

All panels live under `components/Dashboard/`. Each is a separate component fed props from the dashboard API response.

| Component | Data source field | What it renders |
|-----------|------------------|----------------|
| `HealthScoreCard` | `health_score` | Large score badge (0–100) with color ring |
| `ProductLeaderboard` | `GET /dashboard/all` | Ranked list of all 4 products by health score |
| `ProductSummaryBanner` | `product_summary` | Steam-style sentiment string |
| `FeatureSentimentBars` | `feature_sentiment` | Horizontal bars, pos/neg split per feature. Click = filter all panels |
| `TrendChart` | `weekly_trends` | Recharts LineChart, weekly x-axis, one line per feature. Timeline marker overlays. |
| `WhatChangedStrip` | `what_changed_this_week` | Row of feature name + ↑↓→ arrows |
| `GraphNetwork` | `graph_data` | D3 force-directed graph. Nodes colored by sentiment. Edges weighted by similarity. |
| `IssueList` | `issues` | Prioritized cards: feature, type badge, severity, confidence meter, recommendation |
| `ConfidenceMeter` | `issues[].confidence_level` | Color-coded bar (green/yellow/red) per issue |
| `AlertCenter` | Socket.io `"alert:new"` | Notification badges. Persist until dismissed. |
| `PlatformToggle` | `platform_comparison` | Dropdown/toggle to switch platform view; re-renders FeatureSentimentBars + TrendChart |
| `ReviewDrilldown` | `GET /reviews/:productId` | Paginated review list. Filtered by active feature tag. |
| `FlaggedCounter` | `flagged_count` | Static counter: "14 reviews flagged and excluded" |
| `LiveReviewCounter` | `review_count` | "347 reviews analyzed across 4 platforms" |
| `PDFExportButton` | Calls `POST /reports/generate` | Download link when report ready |

---

## Animations

Use **Framer Motion** for:
- Panel mount/unmount transitions (fade + slide)
- Alert badge pop-in
- Confidence meter fill animation on load
- Health score count-up animation

Use **D3** for:
- Graph node force simulation (not Recharts — must be D3 for the physics-based layout)
- Node hover tooltips showing review snippet
- Edge thickness proportional to weight

---

## Demo Center (`components/DemoCenter/`)

A section at the bottom of the main page — not a separate route. The frontend team will decide how it sits within the overall page layout.

Calls `POST /api/demo/run` with a review → receives SSE stream → animates each stage sequentially.

**Layout:** Vertical pipeline with 8 stage cards. Each card starts grayed out. As SSE events arrive, the card animates in (Framer Motion) and shows stage output.

```
Stage Card Structure:
┌────────────────────────────────┐
│ ① Stage Name          [badge] │
│ Input: ...                     │
│ Output: ...                    │
│ ──────────── [progress bar]    │
└────────────────────────────────┘
```

Stages animate in sequence with ~400ms delay between each. Final stage triggers health score update in a mini leaderboard shown at the bottom of the Demo Center page.

---

## Design System

> These are starting-point suggestions, not a binding spec. The frontend team owns all design decisions and should feel free to modify, replace, or extend anything here — theme, colors, typography, spacing, aesthetic direction, all of it.

- **Colors (suggested baseline):** Confidence green `#22c55e`, yellow `#eab308`, red `#ef4444`. Neutral dark background (`#0f172a`). Card surface `#1e293b`.
- **Typography (suggested):** Inter or Geist. Rough hierarchy: score = 48px bold, panel title = 18px semibold, body = 14px.
- **Cards (suggested):** Rounded-xl, subtle border (`border-slate-700`), no drop shadows — flat enterprise aesthetic.
- **Feature tag pills:** Clickable. Active state = filled accent color. Filters all panels simultaneously.
- **Trend lines:** Each feature should use a consistent color across all charts (same color for a given feature in TrendChart, FeatureSentimentBars, and GraphNetwork nodes) — this is a functional consistency requirement, not just a style preference.
