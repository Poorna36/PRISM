// Full server startup test — starts the server, checks DB sync, then exits
require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');

const sequelize = require('./config/db');
const { initSocket } = require('./utils/socket');

const authRoutes = require('./routes/auth');
const reviewRoutes = require('./routes/reviews');
const dashboardRoutes = require('./routes/dashboard');
const alertRoutes = require('./routes/alerts');
const demoRoutes = require('./routes/demo');
const reportRoutes = require('./routes/reports');
const authMiddleware = require('./middleware/authMiddleware');

const app = express();
const server = http.createServer(app);
initSocket(server);

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'], credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/dashboard', authMiddleware, dashboardRoutes);
app.use('/api/alerts', authMiddleware, alertRoutes);
app.use('/api/demo', authMiddleware, demoRoutes);
app.use('/api/reports', authMiddleware, reportRoutes);
app.use('/reports', express.static(path.join(__dirname, 'reports')));

async function test() {
  try {
    await sequelize.sync();
    console.log('[DB] SQLite synced OK');

    // Quick listen test
    await new Promise((resolve, reject) => {
      server.listen(5001, () => {
        console.log('[Server] Listening on port 5001 OK');
        server.close(resolve);
      });
      server.on('error', reject);
    });

    console.log('\nSERVER STARTUP TEST: PASSED');
    process.exit(0);
  } catch (err) {
    console.error('STARTUP TEST FAILED:', err.message);
    process.exit(1);
  }
}

test();
