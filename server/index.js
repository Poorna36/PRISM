require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');

const sequelize = require('./config/db');
const authMiddleware = require('./middleware/authMiddleware');
const { initSocket } = require('./utils/socket');

// Routes
const authRoutes = require('./routes/auth');
const reviewRoutes = require('./routes/reviews');
const dashboardRoutes = require('./routes/dashboard');
const alertRoutes = require('./routes/alerts');
const demoRoutes = require('./routes/demo');
const reportRoutes = require('./routes/reports');
const surveyRoutes = require('./routes/survey');

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// Ensure data directory exists for SQLite
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Auth routes — no middleware (login/logout must be unprotected)
app.use('/api/auth', authRoutes);

// Review ingest — no auth (simulation pages call this without JWT)
app.use('/api/reviews', reviewRoutes);

// Survey (email + browser fallback) — no auth
app.use('/api/survey', surveyRoutes);

// Protected routes — require valid JWT
app.use('/api/dashboard', authMiddleware, dashboardRoutes);
app.use('/api/alerts', authMiddleware, alertRoutes);
app.use('/api/demo', authMiddleware, demoRoutes);
app.use('/api/reports', authMiddleware, reportRoutes);

// Static files for reports
app.use('/reports', express.static(path.join(__dirname, 'reports')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    // Sync database (creates tables if they don't exist)
    await sequelize.sync();
    console.log('[DB] SQLite database synced');

    // Pre-load embedding model (async, non-blocking)
    const embeddings = require('./pipeline/embeddings');
    embeddings.initialize().then(() => {
      console.log('[Embeddings] Model loaded and anchor embeddings cached');
    }).catch(err => {
      console.warn('[Embeddings] Failed to load model (pipeline will fallback):', err.message);
    });

    server.listen(PORT, () => {
      console.log(`[Server] PRISM backend running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('[Server] Failed to start:', err);
    process.exit(1);
  }
}

start();
