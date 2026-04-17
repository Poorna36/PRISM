# Customer Review Intelligence Platform

AI-powered review analytics system. Ingests noisy, multilingual e-commerce reviews from simulated platform pages via API, processes them through a full backend intelligence pipeline, and delivers feature-level sentiment analysis, graph-based issue classification, trend detection, and prioritized recommendations through a React + enterprise dashboard.

Protected by an employee authentication gate — the login page is the first thing rendered on app load.

---

## Docs — Load Only What You Need

| File | Read when building... |
|------|-----------------------|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System overview, layers, data flow |
| [docs/AUTH.md](docs/AUTH.md) | Authentication — login page, JWT flow, credentials |
| [docs/STACK.md](docs/STACK.md) | Tech stack, folder structure, environment |
| [docs/DATA.md](docs/DATA.md) | Review schema, seed data, simulation pages |
| [docs/API.md](docs/API.md) | All backend endpoints + request/response contracts |
| [docs/PIPELINE.md](docs/PIPELINE.md) | Backend processing stages 1–7 |
| [docs/INSIGHTS.md](docs/INSIGHTS.md) | Insight types, health score, alerts, recommendations, PDF |
| [docs/UI.md](docs/UI.md) | React frontend, dashboard panels, Demo Center, animations |
| [docs/PROGRESS.md](docs/PROGRESS.md) | ✅ Build checklist — update after every session |

---

## Quick Start

```bash
# Backend
cd server && npm install && npm run dev

# Frontend (main app)
cd client && npm install && npm run dev

# Simulation pages (static, open directly in browser)
open simulation/amazon.html
```

Create `server/.env`:
```
SARVAM_API_KEY=your-key
GEMINI_API_KEY=your-key
JWT_SECRET=your-secret-key-here
PORT=5000
```

> Simulation pages post reviews to `http://localhost:5000/api/reviews/ingest`. Main app frontend connects to the same backend.

---

## Demo Login Credentials

| Field | Value |
|-------|-------|
| Employee ID | `npd570` |
| Password | `notre570` |

The Employee ID is shown as placeholder text in the login field. Wrong credentials show an "Authentication Failed" message.
