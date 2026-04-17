# Stack & Structure

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Simulation pages | HTML + Vanilla JS | Static platform mockups, no build step |
| Backend runtime | Node.js + Express | REST API, pipeline orchestration |
| Authentication | JWT (jsonwebtoken) + cookie-parser | Session management, route protection |
| NLP processing | Python (FastAPI microservice, optional) | Heavy NLP if offloaded from Node |
| Database | PostgreSQL | Reviews, pipeline outputs, insights, graph nodes |
| Cache | Redis | Poll results, dashboard snapshots, rate limiting |
| Language normalization | Sarvam AI API | Called from backend Stage 1 |
| Survey generation | Gemini API | Called from backend Stage 7 |
| Real-time push | Socket.io (or SSE) | Alert events to React frontend |
| Frontend | React (Vite) | Dashboard UI + Auth page |
| Charting | Recharts + D3.js | Trend charts, graph network visualization |
| Animations | Framer Motion | Panel transitions, Demo Center pipeline animation, auth shake |
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
│   ├── .env                     # SARVAM_API_KEY, GEMINI_API_KEY, JWT_SECRET, DB_URL, PORT
│   ├── package.json
│   ├── index.js                 # Express entry point
│   ├── config/
│   │   └── auth.config.js       # EMPLOYEE_ID and PASSWORD constants (demo credentials)
│   ├── middleware/
│   │   └── authMiddleware.js    # JWT validation — applied to all routes except /auth/login
│   ├── routes/
│   │   ├── auth.js              # POST /api/auth/login, POST /api/auth/logout, GET /api/auth/me
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
    │   ├── App.jsx              # Auth gate: renders AuthPage or MainPage
    │   ├── api/                 # All fetch calls to backend
    │   │   └── index.js         # Includes login(), logout(), getSession() + all dashboard calls
    │   ├── components/
    │   │   ├── Auth/            # AuthPage sub-components if needed
    │   │   ├── Dashboard/       # Main dashboard panels
    │   │   ├── DemoCenter/      # Pipeline animation
    │   │   ├── Graph/           # D3 graph network
    │   │   ├── Charts/          # Recharts wrappers
    │   │   └── Alerts/          # Real-time alert badges
    │   ├── pages/
    │   │   ├── AuthPage.jsx     # Login page — first thing rendered
    │   │   ├── DashboardPage.jsx
    │   │   └── DemoCenterPage.jsx
    │   └── store/               # Zustand stores
    │       ├── authStore.js     # isAuthenticated, login(), logout(), checkSession()
    │       └── dashboardStore.js
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
JWT_SECRET=
PDF_OUTPUT_DIR=./reports
```

---

## Backend Dependencies (additions for auth)

```json
"jsonwebtoken": "^9.0.0",
"cookie-parser": "^1.4.6"
```

Add `cookie-parser` middleware in `index.js` before route mounting. Apply `authMiddleware` to all routes except `POST /api/auth/login`.
