# Stack & Structure

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Simulation pages | HTML + Vanilla JS | Static platform mockups, no build step |
| Backend runtime | Node.js + Express | REST API, pipeline orchestration |
| NLP processing | Python (FastAPI microservice, optional) | Heavy NLP if offloaded from Node |
| Database | PostgreSQL | Reviews, pipeline outputs, insights, graph nodes |
| Cache | Redis | Poll results, dashboard snapshots, rate limiting |
| Language normalization | Sarvam AI API | Called from backend Stage 1 |
| Survey generation | Gemini API | Called from backend Stage 7 |
| Real-time push | Socket.io (or SSE) | Alert events to React frontend |
| Frontend | React (Vite) | Dashboard UI |
| Charting | Recharts + D3.js | Trend charts, graph network visualization |
| Animations | Framer Motion | Panel transitions, Demo Center pipeline animation |
| PDF generation | Puppeteer (server-side) | Consulting-style report rendered on backend |
| Styling | Tailwind CSS | Utility-first, consistent design system |

---

## Folder Structure

```
/
├── README.md
├── docs/                        # All spec docs (this folder)
│
├── simulation/                  # Static HTML platform pages
│   ├── amazon.html
│   ├── flipkart.html
│   ├── jiomart.html
│   ├── brand.html
│   ├── simulation.js            # Shared JS: seed loader, review submit, POST to API
│   └── seed-reviews.json        # ~400 preloaded reviews with timestamp range
│
├── server/                      # Backend
│   ├── .env                     # SARVAM_API_KEY, GEMINI_API_KEY, DB_URL, PORT
│   ├── package.json
│   ├── index.js                 # Express entry point
│   ├── routes/
│   │   ├── reviews.js           # POST /api/reviews/ingest
│   │   ├── dashboard.js         # GET /api/dashboard/:productId
│   │   ├── demo.js              # POST /api/demo/run (streaming)
│   │   ├── alerts.js            # GET /api/alerts
│   │   └── reports.js           # POST /api/reports/generate
│   ├── pipeline/
│   │   ├── normalize.js         # Stage 1 — Sarvam AI
│   │   ├── trust.js             # Stage 2 — dedup, spam
│   │   ├── extract.js           # Stage 3 — feature + sentiment
│   │   ├── graph.js             # Stage 4 — graph nodes + edges
│   │   ├── timeseries.js        # Stage 5 — trend analysis
│   │   ├── confidence.js        # Stage 6 — scoring + ranking
│   │   └── feedback.js          # Stage 7 — Gemini survey
│   ├── models/                  # DB models (Sequelize or Prisma)
│   │   ├── Review.js
│   │   ├── GraphNode.js
│   │   ├── Insight.js
│   │   └── Alert.js
│   └── utils/
│       ├── pdf.js               # Puppeteer PDF renderer
│       └── socket.js            # Socket.io setup
│
└── client/                      # React frontend
    ├── package.json
    ├── vite.config.js
    ├── src/
    │   ├── main.jsx
    │   ├── App.jsx
    │   ├── api/                 # All fetch calls to backend
    │   │   └── index.js
    │   ├── components/
    │   │   ├── Dashboard/       # Main dashboard panels
    │   │   ├── DemoCenter/      # Pipeline animation
    │   │   ├── Graph/           # D3 graph network
    │   │   ├── Charts/          # Recharts wrappers
    │   │   └── Alerts/          # Real-time alert badges
    │   ├── pages/
    │   │   ├── DashboardPage.jsx
    │   │   └── DemoCenterPage.jsx
    │   └── store/               # Zustand or Redux — dashboard state
    └── public/
```

---

## Environment Variables (`server/.env`)

```
PORT=5000
DATABASE_URL=postgresql://user:pass@localhost:5432/reviews_db
REDIS_URL=redis://localhost:6379
SARVAM_API_KEY=
GEMINI_API_KEY=
PDF_OUTPUT_DIR=./reports
```
