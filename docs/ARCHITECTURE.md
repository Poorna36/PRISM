# Architecture

## Three Distinct Parts

```
┌──────────────────────────────────────────────────┐
│           SIMULATION PAGES (Static HTML)         │
│  amazon.html / flipkart.html / jiomart.html /    │
│  brand.html                                      │
│  - Display 4 products with preloaded ~400 reviews│
│  - Timestamps spread from "just now" → 6 months  │
│  - User can add a review → shows as "just now"   │
│  - POSTs to backend API on every review add      │
└───────────────────┬──────────────────────────────┘
                    │ POST /api/reviews/ingest
┌───────────────────▼──────────────────────────────┐
│              BACKEND (Node.js/Python)            │
│  Receives reviews → runs full pipeline:          │
│  Normalize → Trust → Extract (Embeddings)        │
│  → Graph → Score → Insights → Alerts             │
│                                                  │
│  Embedding layer (all-MiniLM-L6-v2):            │
│  - Loaded once at startup, cached in memory      │
│  - Used in Stage 2 (near-dedup), Stage 3         │
│    (feature detection), Stage 4 (graph edges),  │
│    Stage 6 (cluster coherence signal)            │
│                                                  │
│  Persists to DB, exposes REST API to frontend    │
└───────────────────┬──────────────────────────────┘
                    │ REST API
┌───────────────────▼──────────────────────────────┐
│           MAIN WEB APP (React Frontend)          │
│  Fetches from backend, renders dashboard:        │
│  Health scores, trends, semantic graph viz,      │
│  alerts, recommendations, Demo Center, PDF       │
└──────────────────────────────────────────────────┘
```

## Key Boundaries

| Part | Tech | Role |
|------|------|------|
| Simulation pages | Static HTML + Vanilla JS | Simulate e-commerce platforms. No framework needed. |
| Backend | Node.js (Express) + Python microservice option | All intelligence logic lives here. Embedding model runs here. |
| Embedding model | all-MiniLM-L6-v2 via @xenova/transformers | Pre-trained semantic representations. No training required. Loaded once at startup. |
| Main frontend | React + Recharts/D3 | Visualization, animations, dashboard UX only. No business logic. |

## Data Flow

1. Simulation page loads → renders ~400 seed reviews from static JSON with distributed timestamps
2. User adds a review on simulation page → instantly shown as "just now" locally → POSTed to `POST /api/reviews/ingest`
3. Backend ingests → runs full 7-stage pipeline → stores result in DB
   - Stage 3 computes a 384-dim sentence embedding for the review
   - Embedding is used for feature detection (cosine similarity vs anchor phrases), near-dedup (Stage 2), graph edges (Stage 4), and cluster coherence scoring (Stage 6)
4. React frontend polls `GET /api/dashboard/:productId` → re-renders affected panels
5. WebSocket (or SSE) pushes real-time alert events to frontend when thresholds crossed
6. Demo Center calls `POST /api/demo/run` → backend streams pipeline stages back step-by-step, including similarity scores per feature for explainability

## Why Backend is Central

All intelligence lives in the backend — normalization (Sarvam AI), trust filtering (embedding-based near-dedup), semantic feature extraction (pre-trained embeddings + sentiment), graph construction and clustering, time-series analysis, confidence scoring, Gemini survey generation, and PDF rendering. The frontend is purely presentation.

## Embedding Design Principles

- **No training required.** The system uses a pre-trained sentence encoder (`all-MiniLM-L6-v2`). Feature detection is driven by cosine similarity to human-written anchor phrases — no labeled data, no fine-tuning.
- **Fully explainable.** Every feature match is backed by a numeric similarity score and a named anchor phrase. Every graph edge has a decomposed weight. No black-box classifications.
- **Hackathon-feasible.** Embedding one review takes ~30–50ms on CPU. Feature anchor embeddings are pre-computed once at startup. Full pipeline per review targets < 2 seconds end-to-end.
- **Single model, multiple uses.** The same embedding vector is reused across Stage 2 (near-dedup), Stage 3 (feature detection), Stage 4 (graph edges), and Stage 6 (cluster coherence). No redundant computation.
