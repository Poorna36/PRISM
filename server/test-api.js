// Self-contained API integration test — starts server, tests endpoints, exits
require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');

const sequelize = require('./config/db');
const { initSocket } = require('./utils/socket');
const authMiddleware = require('./middleware/authMiddleware');

const app = express();
const server = http.createServer(app);
initSocket(server);

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', require('./routes/auth'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/dashboard', authMiddleware, require('./routes/dashboard'));
app.use('/api/alerts', authMiddleware, require('./routes/alerts'));
app.use('/api/demo', authMiddleware, require('./routes/demo'));
app.use('/api/reports', authMiddleware, require('./routes/reports'));
app.use('/reports', express.static(path.join(__dirname, 'reports')));
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = 5002;
let passed = 0;
let failed = 0;

function assert(name, condition) {
  if (condition) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.log(`  ✗ ${name}`); }
}

async function runTests() {
  const base = `http://localhost:${PORT}`;

  console.log('\n--- Auth Tests ---');

  // Health check
  const health = await fetch(`${base}/api/health`).then(r => r.json());
  assert('Health check returns OK', health.status === 'ok');

  // Login with correct credentials
  const loginRes = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employee_id: 'npd570', password: 'notre570' }),
  });
  const loginData = await loginRes.json();
  assert('Login succeeds with correct creds (200)', loginRes.status === 200);
  assert('Login returns token', !!loginData.token);
  assert('Login returns employee_id', loginData.employee_id === 'npd570');

  // Extract cookie
  const cookies = loginRes.headers.getSetCookie ? loginRes.headers.getSetCookie() : [loginRes.headers.get('set-cookie')];
  const cookie = cookies.filter(Boolean).join('; ');
  assert('Sets httpOnly cookie', cookie.includes('token='));

  // Login with wrong credentials
  const badLogin = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employee_id: 'wrong', password: 'wrong' }),
  });
  assert('Wrong creds returns 401', badLogin.status === 401);
  const badData = await badLogin.json();
  assert('Wrong creds returns "Authentication Failed"', badData.error === 'Authentication Failed');

  // GET /me with valid cookie
  const meRes = await fetch(`${base}/api/auth/me`, { headers: { Cookie: cookie } });
  assert('GET /me with valid cookie returns 200', meRes.status === 200);
  const meData = await meRes.json();
  assert('GET /me returns employee_id', meData.employee_id === 'npd570');

  // GET /me without cookie
  const meUnauth = await fetch(`${base}/api/auth/me`);
  assert('GET /me without cookie returns 401', meUnauth.status === 401);

  console.log('\n--- Protected Route Tests ---');

  // Dashboard without auth
  const dashUnauth = await fetch(`${base}/api/dashboard/all`);
  assert('Dashboard without auth returns 401', dashUnauth.status === 401);

  // Dashboard with auth
  const dashAuth = await fetch(`${base}/api/dashboard/all`, { headers: { Cookie: cookie } });
  assert('Dashboard with auth returns 200', dashAuth.status === 200);

  // Alerts with auth
  const alertsAuth = await fetch(`${base}/api/alerts`, { headers: { Cookie: cookie } });
  assert('Alerts with auth returns 200', alertsAuth.status === 200);

  console.log('\n--- Review Ingest Test ---');

  // Ingest a review (no auth required)
  const ingestRes = await fetch(`${base}/api/reviews/ingest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      product_id: 'test_product_1',
      platform: 'amazon',
      review_text: 'The battery life is terrible, barely lasts 2 hours. But the build quality feels premium and solid.',
      rating: 2,
      user_id: 'test_user_1',
      media_type: 'none',
      timestamp: new Date().toISOString(),
    }),
  });
  assert('Review ingest returns 201', ingestRes.status === 201);
  const ingestData = await ingestRes.json();
  assert('Ingest returns review_id', !!ingestData.review_id);
  assert('Ingest returns pipeline_triggered: true', ingestData.pipeline_triggered === true);

  // Logout
  const logoutRes = await fetch(`${base}/api/auth/logout`, { method: 'POST' });
  assert('Logout returns 200', logoutRes.status === 200);

  console.log(`\n=============================`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log(`=============================\n`);
}

async function main() {
  try {
    await sequelize.sync();
    console.log('[DB] Synced');

    await new Promise((resolve) => server.listen(PORT, resolve));
    console.log(`[Server] Running on port ${PORT}`);

    await runTests();
  } catch (err) {
    console.error('Test error:', err);
    failed++;
  }

  server.close();
  process.exit(failed > 0 ? 1 : 0);
}

main();
