# Build Progress

**How to use this file:**
- Before starting work: read this file to know what's done
- After finishing work: update the relevant checkboxes and add a one-line note under "Last session"
- Keep notes short — just enough for the next IDE to not duplicate or break work

---

## Last Session
_Update this after every session. Replace previous entry._

```

```

---

## SIMULATION PAGES (`simulation/`)

- [ ] `seed-reviews.json` — ~400 reviews, 4 products × 4 platforms, timestamps 6mo → now
- [ ] `simulation.js` — shared JS: load seed reviews, render them, handle review form submit, POST to API, update live counter
- [ ] `amazon.html` — product listings + reviews rendered via simulation.js
- [ ] `flipkart.html`
- [ ] `jiomart.html`
- [ ] `brand.html`

---

## BACKEND (`server/`)

### Setup
<<<<<<< HEAD
- [x] `package.json` with deps: express, sequelize, sqlite3, socket.io, jsonwebtoken, cookie-parser, axios, @xenova/transformers, natural, uuid
- [x] `index.js` — Express app, middleware, route mounting, Socket.io init, SQLite sync, embedding preload
- [x] DB schema created via Sequelize sync (Reviews, GraphNodes, GraphEdges, Insights, Alerts tables)
- [x] `.env.example` committed (no real keys)
- [x] `config/db.js` — SQLite via Sequelize
- [x] `config/auth.config.js` — demo credentials
- [x] Server startup verified — DB syncs, port binds, all 27 modules load ✅

### Auth
- [x] `middleware/authMiddleware.js` — JWT validation, cookie extraction, route protection
- [x] `routes/auth.js` — POST /api/auth/login, POST /api/auth/logout, GET /api/auth/me
- [x] Auth bug fixed: GET /me now uses authMiddleware directly (was bypassed because auth routes skip global middleware)
- [x] Auth flow tested: login ✓, wrong creds 401 ✓, /me with cookie ✓, /me without cookie 401 ✓, logout ✓

### Routes
- [x] `routes/reviews.js` — POST /api/reviews/ingest, GET /api/reviews/:productId (paginated)
- [x] `routes/dashboard.js` — GET /api/dashboard/:productId, GET /api/dashboard/all
- [x] `routes/alerts.js` — GET /api/alerts
- [x] `routes/demo.js` — POST /api/demo/run (SSE streaming)
- [x] `routes/reports.js` — POST /api/reports/generate (wired to pdf.js, generates real report)

### Pipeline
- [x] `pipeline/embeddings.js` — all-MiniLM-L6-v2 via @xenova/transformers, anchor caching, cosine similarity
- [x] `pipeline/normalize.js` — Stage 1: Sarvam AI translation with fallback
- [x] `pipeline/trust.js` — Stage 2: hash dedup, cosine near-dedup (>0.92), spam heuristics
- [x] `pipeline/extract.js` — Stage 3: embedding feature detection (7 features), per-feature sentiment, ambiguity detection
- [x] `pipeline/graph.js` — Stage 4: node creation, edge weight formula, BFS cluster classification
- [x] `pipeline/timeseries.js` — Stage 5: weekly aggregation, trend direction, spike detection
- [x] `pipeline/confidence.js` — Stage 6: confidence formula with ambiguity penalty, coherence bonus, recommendation map
- [x] `pipeline/feedback.js` — Stage 7: Gemini survey generation with fallback
- [x] `pipeline/index.js` — orchestrator: runs all 7 stages, alert creation, Socket.io emit

### Utils
- [x] `utils/socket.js` — Socket.io setup, alert:new emitter
- [x] `utils/pdf.js` — HTML report generator with Puppeteer PDF support + graceful HTML fallback. 5-section consulting-style report.

### Models
- [x] `models/Review.js`
- [x] `models/GraphNode.js`
- [x] `models/GraphEdge.js`
- [x] `models/Insight.js`
- [x] `models/Alert.js`
- [x] `models/index.js`

### Verification
- [x] 27/27 module require() checks pass
- [x] SQLite DB syncs and creates all tables
- [x] Server binds to port successfully
- [x] 17/17 API integration tests pass (auth, protected routes, review ingest)
=======
- [ ] `package.json` with deps: express, sequelize/prisma, pg, redis, socket.io, axios, puppeteer
- [ ] `index.js` — Express app, middleware, route mounting, Socket.io init
- [ ] DB schema created and migrated (Reviews, GraphNodes, Insights, Alerts, SurveyResponses tables)
- [ ] `.env.example` committed (no real keys)

### Routes
- [ ] `routes/reviews.js` — POST /api/reviews/ingest
- [ ] `routes/dashboard.js` — GET /api/dashboard/:productId, GET /api/dashboard/all
- [ ] `routes/alerts.js` — GET /api/alerts
- [ ] `routes/demo.js` — POST /api/demo/run (SSE streaming)
- [ ] `routes/reports.js` — POST /api/reports/generate, GET /reports/:filename

### Pipeline
- [ ] `pipeline/normalize.js` — Sarvam AI integration
- [ ] `pipeline/trust.js` — dedup hash check, cosine similarity near-dedup, spam heuristics
- [ ] `pipeline/extract.js` — feature tagging + sentiment scoring for 7 features
- [ ] `pipeline/graph.js` — node creation, edge weight formula, cluster classification (systemic/batch/isolated)
- [ ] `pipeline/timeseries.js` — weekly aggregation, trend direction, spike detection, what_changed_this_week
- [ ] `pipeline/confidence.js` — confidence formula, level mapping, recommendation action map, priority ranking
- [ ] `pipeline/feedback.js` — Gemini API integration, survey dispatch (simulated), response ingestion

### Utils
- [ ] `utils/pdf.js` — Puppeteer PDF renderer, 5-section structure
- [ ] `utils/socket.js` — Socket.io setup, alert:new emitter
>>>>>>> main

---

## FRONTEND (`client/`)

### Setup
- [ ] Vite + React project initialized
- [ ] Tailwind CSS configured
<<<<<<< HEAD
- [ ] Dependencies: recharts, d3, framer-motion, socket.io-client, zustand
- [ ] `src/api/index.js` — all fetch functions wrapping backend endpoints

### Pages
- [ ] `AuthPage.jsx` — login page (working)
- [ ] `MainPage.jsx` — single page with component stubs for frontend team
=======
- [ ] Dependencies: recharts, d3, framer-motion, socket.io-client, zustand (or redux)
- [ ] `src/api/index.js` — all fetch functions wrapping backend endpoints

### Pages
- [ ] `MainPage.jsx` — single page, contains all sections including Demo Center as final section. Exact section order/layout TBD by frontend team during build.
>>>>>>> main

### Dashboard Components
- [ ] `HealthScoreCard`
- [ ] `ProductLeaderboard`
- [ ] `ProductSummaryBanner`
- [ ] `FeatureSentimentBars` (with click-to-filter)
- [ ] `TrendChart` (Recharts, timeline markers)
- [ ] `WhatChangedStrip`
- [ ] `GraphNetwork` (D3 force-directed)
- [ ] `IssueList` + `ConfidenceMeter`
- [ ] `AlertCenter` (Socket.io driven)
- [ ] `PlatformToggle`
- [ ] `ReviewDrilldown` (paginated, filterable)
- [ ] `FlaggedCounter`
- [ ] `LiveReviewCounter`
- [ ] `PDFExportButton`

### Demo Center Components
- [ ] `PipelineStageCard` — individual animated stage card
- [ ] `DemoPipeline` — SSE listener, sequential Framer Motion reveal
- [ ] Mini health score leaderboard at bottom of Demo Center

### Design
- [ ] Global design tokens applied (colors, typography — see UI.md)
- [ ] Feature tag color map consistent across all charts
- [ ] Framer Motion transitions on panel mount
- [ ] D3 graph node hover tooltips

---

## INTEGRATION & QA

- [ ] Simulation page → backend ingest → dashboard update end-to-end tested
- [ ] Real-time alert fires and appears in React client
- [ ] Demo Center SSE stream plays all 8 stages without error
- [ ] PDF generates and downloads correctly
- [ ] Platform comparison toggle re-renders correctly
- [ ] Feature tag filter propagates to all panels
- [ ] `what_changed_this_week` shows correct directions
