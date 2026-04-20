const jsonHeaders = { 'Content-Type': 'application/json' };

export async function login(employeeId, password) {
  return fetch('/api/auth/login', {
    method: 'POST',
    credentials: 'include',
    headers: jsonHeaders,
    body: JSON.stringify({ employee_id: employeeId, password }),
  });
}

export async function logout() {
  return fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
}

export async function getSession() {
  return fetch('/api/auth/me', { credentials: 'include' });
}

export async function fetchDashboardAll() {
  return fetch('/api/dashboard/all', { credentials: 'include' });
}

export async function fetchDashboard(productId, { platform, weekRange } = {}) {
  const q = new URLSearchParams();
  if (platform) q.set('platform', platform);
  if (weekRange) q.set('week_range', String(weekRange));
  const qs = q.toString();
  const url = `/api/dashboard/${encodeURIComponent(productId)}${qs ? `?${qs}` : ''}`;
  return fetch(url, { credentials: 'include' });
}

export async function fetchReviews(productId, { page = 1, limit = 15, feature, sentiment, platform } = {}) {
  const q = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (feature) q.set('feature', feature);
  if (sentiment) q.set('sentiment', sentiment);
  if (platform) q.set('platform', platform);
  return fetch(`/api/reviews/${encodeURIComponent(productId)}?${q}`, { credentials: 'include' });
}

export async function fetchAlerts() {
  return fetch('/api/alerts', { credentials: 'include' });
}

export async function generateReport(productId, platform = 'all') {
  return fetch('/api/reports/generate', {
    method: 'POST',
    credentials: 'include',
    headers: jsonHeaders,
    body: JSON.stringify({ product_id: productId, platform }),
  });
}

export async function runDemoPipeline(review) {
  return fetch('/api/demo/run', {
    method: 'POST',
    credentials: 'include',
    headers: jsonHeaders,
    body: JSON.stringify({ review }),
  });
}

export async function setGeminiKey(apiKey) {
  return fetch('/api/settings/gemini-key', {
    method: 'POST',
    credentials: 'include',
    headers: jsonHeaders,
    body: JSON.stringify({ api_key: apiKey }),
  });
}

export async function getGeminiKeyStatus() {
  return fetch('/api/settings/gemini-key/status', { credentials: 'include' });
}

