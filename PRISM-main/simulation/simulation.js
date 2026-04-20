/**
 * simulation.js — Shared engine for all 4 Paralink simulation pages.
 * Handles: product grid, review display + sort, add-review form, API POST.
 */

const API_BASE = 'http://localhost:5000/api';
let seedData = null;
let currentPlatform = '';
let currentProductId = null;
let liveReviews = {}; // { productId: [review, ...] }
let sortMode = 'newest'; // 'newest' | 'oldest' | 'highest' | 'lowest'

/* ── Seed data ───────────────────────────────────────────────────── */
async function ensureSeedDataLoaded() {
  if (seedData) return seedData;
  seedData = (typeof SEED_DATA !== 'undefined') ? SEED_DATA : { products: [], reviews: [] };
  return seedData;
}

/* ── Bootstrap reviews into liveReviews map ─────────────────────── */
function bootstrapReviews(platform) {
  const all = (typeof REVIEWS_DATA !== 'undefined') ? REVIEWS_DATA : [];
  liveReviews = {};
  all.filter(r => r.platform === platform).forEach(r => {
    if (!liveReviews[r.product_id]) liveReviews[r.product_id] = [];
    liveReviews[r.product_id].push(r);
  });
}

/* ── Helpers ─────────────────────────────────────────────────────── */
function fmt(n) { return new Intl.NumberFormat('en-IN').format(n); }
function escapeHtml(s) { if (!s) return ''; const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
function starsHTML(n, size) {
  const r = Math.max(0, Math.min(5, Math.round(n)));
  const sz = size || 14;
  return `<span style="color:#f59e0b;font-size:${sz}px">${'★'.repeat(r)}${'☆'.repeat(5-r)}</span>`;
}
function timeAgo(ts) {
  if (!ts || ts === 'just now') return 'just now';
  const ms = Date.now() - new Date(ts).getTime();
  const m = Math.floor(ms/60000), h = Math.floor(ms/3600000), d = Math.floor(ms/86400000), w = Math.floor(d/7), mo = Math.floor(d/30);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d < 7) return `${d}d ago`;
  if (w < 5) return `${w}w ago`;
  return `${mo}mo ago`;
}
function totalReviewCount() {
  return Object.values(liveReviews).reduce((a, arr) => a + arr.length, 0);
}
function updateLiveCounter() {
  document.querySelectorAll('.prism-live-counter').forEach(el => {
    el.textContent = `${totalReviewCount()} reviews analyzed across 4 platforms`;
  });
}
function ratingMeta(productId) {
  const revs = liveReviews[productId] || [];
  if (!revs.length) return { avg: '0.0', total: 0 };
  const avg = revs.reduce((a, r) => a + r.rating, 0) / revs.length;
  return { avg: avg.toFixed(1), total: revs.length };
}
function sortedReviews(productId) {
  const revs = [...(liveReviews[productId] || [])];
  if (sortMode === 'newest') return revs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  if (sortMode === 'oldest') return revs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  if (sortMode === 'highest') return revs.sort((a, b) => b.rating - a.rating);
  if (sortMode === 'lowest') return revs.sort((a, b) => a.rating - b.rating);
  return revs;
}

/* ── Render product grid ─────────────────────────────────────────── */
async function renderAllProducts(platform, containerId, onSelect) {
  currentPlatform = platform;
  await ensureSeedDataLoaded();
  bootstrapReviews(platform);
  const grid = document.getElementById(containerId);
  if (!grid) return;
  grid.innerHTML = '';
  (seedData.products || []).forEach(p => {
    const price = p.platform_prices?.[platform] || p.price;
    const img = p.images?.[platform] || '';
    const meta = ratingMeta(p.product_id);
    const disc = p.mrp ? Math.round((1 - price / p.mrp) * 100) : 0;
    const card = document.createElement('div');
    card.className = 'product-grid-card';
    card.dataset.productId = p.product_id;
    card.innerHTML = `
      <img class="grid-product-img" src="${img}" alt="${escapeHtml(p.name)}" onerror="this.style.display='none'">
      <div class="grid-product-category">${escapeHtml(p.category)}</div>
      <div class="grid-product-name">${escapeHtml(p.name)}</div>
      <div class="grid-product-price">₹${fmt(price)}${p.mrp ? ` <span style="text-decoration:line-through;color:#999;font-size:12px;font-weight:400">₹${fmt(p.mrp)}</span> <span style="color:#16a34a;font-size:12px;font-weight:600">${disc}% off</span>` : ''}</div>
      <div style="margin:4px 0 10px;font-size:13px">${starsHTML(parseFloat(meta.avg))} <span style="color:#666">${meta.avg} (${meta.total})</span></div>
      <button class="grid-product-btn">View & Review</button>`;
    card.addEventListener('click', () => {
      currentProductId = p.product_id;
      if (onSelect) onSelect(p.product_id);
      renderProductPanel(p, platform);
    });
    grid.appendChild(card);
  });
  updateLiveCounter();
}

/* ── Render full product panel (reviews + form) ──────────────────── */
function renderProductPanel(product, platform) {
  document.querySelectorAll('.product-grid-card').forEach(c =>
    c.classList.toggle('active', c.dataset.productId === product.product_id));

  let panel = document.getElementById('prism-product-panel');
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'prism-product-panel';
    const container = document.querySelector('.page-container');
    if (container) container.appendChild(panel);
  }

  const price = product.platform_prices?.[platform] || product.price;
  const img = product.images?.[platform] || '';
  const meta = ratingMeta(product.product_id);

  panel.innerHTML = `
    <div class="prism-panel-inner">
      <div class="prism-product-hero">
        <img src="${img}" alt="${escapeHtml(product.name)}" class="prism-hero-img" onerror="this.style.display='none'">
        <div class="prism-hero-info">
          <div class="prism-hero-category">${escapeHtml(product.category)}</div>
          <h2 class="prism-hero-name">${escapeHtml(product.name)}</h2>
          <p class="prism-hero-desc">${escapeHtml(product.description || '')}</p>
          <div class="prism-hero-rating">${starsHTML(parseFloat(meta.avg), 20)} <strong>${meta.avg}</strong> <span style="color:#888">(${meta.total} reviews)</span></div>
          <div class="prism-hero-price">₹${fmt(price)} ${product.mrp ? `<span style="text-decoration:line-through;color:#aaa;font-size:14px">₹${fmt(product.mrp)}</span>` : ''}</div>
        </div>
      </div>

      <!-- Add Review Form -->
      <div class="prism-review-form-wrap">
        <h3 class="prism-section-title">✍️ Write a Review</h3>
        <div class="prism-form" id="form-${product.product_id}">
          <div class="prism-form-row">
            <div class="prism-form-group">
              <label>Your Name</label>
              <input type="text" id="inp-user-${product.product_id}" placeholder="Your name">
            </div>
            <div class="prism-form-group">
              <label>Your email (for follow-up)</label>
              <input type="email" id="review-email" placeholder="Your email (for follow-up)" required />
            </div>
            <div class="prism-form-group">
              <label>Rating</label>
              <div class="prism-star-pick" id="star-${product.product_id}" data-val="0">
                ${[1,2,3,4,5].map(n => `<span class="prism-star" data-n="${n}" onclick="setStar('${product.product_id}',${n})">★</span>`).join('')}
              </div>
            </div>
          </div>
          <div class="prism-form-group" style="margin-top:10px">
            <label>Your Review</label>
            <textarea id="inp-text-${product.product_id}" rows="3" placeholder="Share your experience with this product..."></textarea>
          </div>
          <div class="prism-form-row" style="align-items:center;margin-top:10px">
            <button class="prism-submit-btn" onclick="submitReview('${product.product_id}','${platform}')">Submit Review</button>
            <div id="status-${product.product_id}" class="prism-submit-status"></div>
          </div>
        </div>
      </div>

      <!-- Reviews List -->
      <div class="prism-reviews-header">
        <h3 class="prism-section-title">💬 Customer Reviews <span id="review-count-${product.product_id}" style="font-weight:400;color:#888;font-size:15px">(${meta.total})</span></h3>
        <div class="prism-sort-wrap">
          <label style="font-size:13px;color:#888;margin-right:6px">Sort by:</label>
          <select class="prism-sort-select" onchange="changeSort('${product.product_id}', this.value)">
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="highest">Highest Stars</option>
            <option value="lowest">Lowest Stars</option>
          </select>
        </div>
      </div>
      <div id="reviews-list-${product.product_id}" class="prism-reviews-list"></div>
    </div>`;

  renderReviewsList(product.product_id);
  panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ── Render reviews list ─────────────────────────────────────────── */
function renderReviewsList(productId) {
  const container = document.getElementById(`reviews-list-${productId}`);
  if (!container) return;
  const revs = sortedReviews(productId);
  if (!revs.length) {
    container.innerHTML = `<div class="prism-no-reviews">No reviews yet — be the first to review this product!</div>`;
    return;
  }
  container.innerHTML = revs.map(r => {
    const initials = (r.user_id || 'A').charAt(0).toUpperCase();
    const text = r.media_type !== 'none' && r.transcript ? `[${r.media_type === 'image' ? '📷 Image' : '🎥 Video'}] ${r.transcript}` : r.review_text || '';
    return `<div class="prism-review-card">
      <div class="prism-review-header">
        <div class="prism-review-avatar">${initials}</div>
        <div>
          <div class="prism-review-user">${escapeHtml(r.user_id || 'Anonymous')}</div>
          <div>${starsHTML(r.rating, 13)}</div>
        </div>
        <div class="prism-review-time">${timeAgo(r.timestamp)}</div>
      </div>
      <div class="prism-review-text">${escapeHtml(text)}</div>
    </div>`;
  }).join('');

  // Update count badge
  const cnt = document.getElementById(`review-count-${productId}`);
  if (cnt) cnt.textContent = `(${revs.length})`;
}

/* ── Sort change ─────────────────────────────────────────────────── */
function changeSort(productId, val) {
  sortMode = val;
  renderReviewsList(productId);
}

/* ── Star picker ─────────────────────────────────────────────────── */
function setStar(productId, n) {
  const wrap = document.getElementById(`star-${productId}`);
  if (!wrap) return;
  wrap.dataset.val = n;
  wrap.querySelectorAll('.prism-star').forEach(s => {
    s.classList.toggle('lit', parseInt(s.dataset.n) <= n);
  });
}

/* ── Submit review ───────────────────────────────────────────────── */
async function submitReview(productId, platform) {
  const userId = document.getElementById(`inp-user-${productId}`)?.value.trim();
  const email = document.getElementById('review-email')?.value.trim();
  const text = document.getElementById(`inp-text-${productId}`)?.value.trim();
  const ratingVal = parseInt(document.getElementById(`star-${productId}`)?.dataset.val || '0');
  const status = document.getElementById(`status-${productId}`);

  if (!userId) { showStatus(status, 'warning', 'Please enter your name.'); return; }
  if (!email) { showStatus(status, 'warning', 'Please enter your email for follow-up.'); return; }
  if (!text) { showStatus(status, 'warning', 'Please write a review.'); return; }
  if (!ratingVal) { showStatus(status, 'warning', 'Please select a star rating.'); return; }

  const review = {
    product_id: productId, platform, review_text: text,
    transcript: null, rating: ratingVal, user_id: userId,
    email,
    media_type: 'none', timestamp: 'just now'
  };

  // Show instantly
  if (!liveReviews[productId]) liveReviews[productId] = [];
  liveReviews[productId].unshift({ ...review });
  renderReviewsList(productId);
  updateLiveCounter();

  // Update card rating badge
  document.querySelectorAll('.product-grid-card').forEach(c => {
    if (c.dataset.productId === productId) {
      const meta = ratingMeta(productId);
      const ratingEl = c.querySelector('div[style*="margin:4px"]');
      if (ratingEl) ratingEl.innerHTML = `${starsHTML(parseFloat(meta.avg))} <span style="color:#666">${meta.avg} (${meta.total})</span>`;
    }
  });

  // Reset form
  document.getElementById(`inp-user-${productId}`).value = '';
  const emailInp = document.getElementById('review-email');
  if (emailInp) emailInp.value = '';
  document.getElementById(`inp-text-${productId}`).value = '';
  setStar(productId, 0);
  document.getElementById(`star-${productId}`).dataset.val = '0';

  showStatus(status, 'loading', '⏳ Sending to PRISM pipeline...');

  try {
    const res = await fetch(`${API_BASE}/reviews/ingest`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...review, timestamp: new Date().toISOString() })
    });
    if (res.ok) {
      showStatus(status, 'success', '✅ Review sent to PRISM! Pipeline running...');
    } else {
      showStatus(status, 'warning', `⚠️ Saved locally (API responded ${res.status})`);
    }
  } catch {
    showStatus(status, 'warning', '⚠️ Saved locally — backend not running.');
  }
  setTimeout(() => { if (status) status.style.display = 'none'; }, 4000);
}

function showStatus(el, type, msg) {
  if (!el) return;
  el.style.display = 'block';
  el.className = `prism-submit-status ${type}`;
  el.textContent = msg;
}

/* ── Init product commerce experience ────────────────────────────── */
async function initProductCommerceExperience(platform) {
  currentPlatform = platform;
  await ensureSeedDataLoaded();
  bootstrapReviews(platform);
  updateLiveCounter();
  // Auto-open first product
  if (seedData.products?.length) {
    const first = seedData.products[0];
    currentProductId = first.product_id;
    setTimeout(() => renderProductPanel(first, platform), 200);
  }
}
