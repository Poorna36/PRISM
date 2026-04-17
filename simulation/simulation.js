/**
 * PRISM Simulation Pages — Shared JS
 * Handles: seed review loading, review rendering, form submit, POST to API, live counter
 */

const API_BASE = 'http://localhost:5000/api';
const DEFAULT_DELIVERY_ADDRESS = 'PESITM Shivamogga, NH206 Sagar Road, Shivamogga 577204, Karnataka';
let seedData = null;
let reviewCount = 0;
let storeCart = [];
let currentCheckoutProduct = null;
let commerceInitialized = false;

// ── Utility: relative time ──
function timeAgo(daysAgo) {
  if (daysAgo === 0) return 'Just now';
  if (daysAgo < 1) return `${Math.round(daysAgo * 24)}h ago`;
  if (daysAgo === 1) return 'Yesterday';
  if (daysAgo < 7) return `${daysAgo} days ago`;
  if (daysAgo < 30) return `${Math.floor(daysAgo / 7)} weeks ago`;
  return `${Math.floor(daysAgo / 30)} months ago`;
}

// ── Utility: star HTML ──
function starsHTML(rating) {
  return Array.from({ length: 5 }, (_, i) =>
    `<span style="color:${i < rating ? '#f59e0b' : '#374151'};font-size:14px">★</span>`
  ).join('');
}

// ── Render a single review card ──
function renderReview(review, isNew = false) {
  const el = document.createElement('div');
  el.className = 'review-card';
  if (isNew) el.classList.add('new');
  el.innerHTML = `
    <div class="review-header">
      <div class="review-avatar">${review.user ? review.user[0].toUpperCase() : 'U'}</div>
      <div class="review-meta">
        <div class="review-user">${review.user || 'Anonymous'}</div>
        <div class="review-stars">${starsHTML(review.rating)}</div>
      </div>
      <div class="review-time">${isNew ? 'Just now' : timeAgo(review.days_ago || 0)}</div>
    </div>
    <div class="review-text">${review.text}</div>
    ${isNew ? '<div class="review-badge">✓ Submitted</div>' : ''}
  `;
  return el;
}

function ratingStars(avg) {
  return starsHTML(Math.max(1, Math.min(5, Math.round(Number(avg) || 0))));
}

// ── Load and render seed reviews for a given product + platform ──
async function loadSeedReviews(productId, platform, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  try {
    const res = await fetch('../simulation/seed-reviews.json');
    seedData = await res.json();
  } catch {
    // If relative path fails, try same directory
    try {
      const res = await fetch('./seed-reviews.json');
      seedData = await res.json();
    } catch {
      console.warn('Could not load seed-reviews.json');
      return;
    }
  }

  const filtered = seedData.reviews.filter(
    (r) => r.product_id === productId && r.platform === platform
  );

  reviewCount = filtered.length;
  updateCounter(reviewCount, 4);

  container.innerHTML = '';
  filtered.forEach((r) => container.appendChild(renderReview(r)));
}

async function ensureSeedDataLoaded() {
  if (seedData) return seedData;
  try {
    const res = await fetch('../simulation/seed-reviews.json');
    seedData = await res.json();
  } catch {
    try {
      const res = await fetch('./seed-reviews.json');
      seedData = await res.json();
    } catch {
      console.warn('Could not load seed-reviews.json');
      return null;
    }
  }
  return seedData;
}

// ── Update the live review counter ──
function updateCounter(count, platformCount = 4) {
  const el = document.getElementById('live-counter');
  if (el) el.textContent = `${count.toLocaleString()} reviews analyzed across ${platformCount} platforms`;
}

// ── Handle review form submission ──
function initReviewForm(formId, productId, platform, containerId) {
  const form = document.getElementById(formId);
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const text = form.querySelector('[name="review_text"]').value.trim();
    const rating = parseInt(form.querySelector('[name="rating"]').value, 10);
    const email = form.querySelector('[name="email"]')?.value || 'anon@example.com';

    if (!text || !rating) return;

    const reviewData = {
      product_id: productId,
      platform: platform,
      review_text: text,
      transcript: null,
      rating,
      user_id: email,
      media_type: 'none',
      timestamp: new Date().toISOString(),
    };

    // Optimistic UI: show review immediately
    const container = document.getElementById(containerId);
    const localReview = { ...reviewData, user: email.split('@')[0], days_ago: 0 };
    const card = renderReview(localReview, true);
    container.insertBefore(card, container.firstChild);

    // Increment counter immediately
    reviewCount++;
    updateCounter(reviewCount, 4);

    // Reset form
    form.reset();
    updateStarUI(0);

    // Show submit status
    const statusEl = document.getElementById('submit-status');
    if (statusEl) {
      statusEl.textContent = '⏳ Sending to PRISM pipeline...';
      statusEl.className = 'submit-status loading';
      statusEl.style.display = 'block';
    }

    // POST to API
    try {
      const res = await fetch(`${API_BASE}/reviews/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewData),
      });
      const data = await res.json();
      if (statusEl) {
        statusEl.textContent = `✓ Sent to pipeline (ID: ${data.review_id?.slice(0, 8)}...)`;
        statusEl.className = 'submit-status success';
        setTimeout(() => { statusEl.style.display = 'none'; }, 4000);
      }
    } catch (err) {
      if (statusEl) {
        statusEl.textContent = '⚠ Backend offline — review saved locally only';
        statusEl.className = 'submit-status warning';
        setTimeout(() => { statusEl.style.display = 'none'; }, 4000);
      }
    }
  });
}

// ── Star rating UI ──
let selectedRating = 0;

function initStarRating(containerId, inputName) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = Array.from({ length: 5 }, (_, i) =>
    `<button type="button" class="star-btn" data-value="${i + 1}">★</button>`
  ).join('');

  container.querySelectorAll('.star-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectedRating = parseInt(btn.dataset.value);
      const input = document.querySelector(`[name="${inputName}"]`);
      if (input) input.value = selectedRating;
      updateStarUI(selectedRating, containerId);
    });
    btn.addEventListener('mouseenter', () => updateStarUI(parseInt(btn.dataset.value), containerId, true));
    btn.addEventListener('mouseleave', () => updateStarUI(selectedRating, containerId));
  });
}

function updateStarUI(rating, containerId = 'star-rating', isHover = false) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.querySelectorAll('.star-btn').forEach((btn) => {
    const val = parseInt(btn.dataset.value);
    btn.style.color = val <= rating ? '#f59e0b' : '#374151';
    btn.style.transform = val <= rating ? 'scale(1.1)' : 'scale(1)';
  });
}

// ── Get product data ──
async function getProduct(productId, platform) {
  const data = await ensureSeedDataLoaded();
  if (!data) return null;
  const product = seedData.products.find((p) => p.product_id === productId);
  if (!product) return null;
  return {
    ...product,
    price: product.platform_prices[platform],
    image: product.images[platform],
  };
}

// ── Render product card ──
async function renderProductCard(productId, platform, containerId) {
  const product = await getProduct(productId, platform);
  const container = document.getElementById(containerId);
  if (!product || !container) return;

  container.innerHTML = `
    <div class="product-card">
      <img src="${product.image}" alt="${product.name}" class="product-image" onerror="this.src='https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'">
      <div class="product-info">
        <div class="product-category">${product.category}</div>
        <h2 class="product-name">${product.name}</h2>
        <p class="product-desc">${product.description}</p>
        <div class="product-price">₹${product.price.toLocaleString()}</div>
        <div class="product-actions">
          <button class="btn-primary">Buy Now</button>
          <button class="btn-secondary">Add to Cart</button>
        </div>
      </div>
    </div>
  `;
}

// ── Render all products in a grid ──
async function renderAllProducts(platform, containerId, onProductSelect) {
  const data = await ensureSeedDataLoaded();
  if (!data) return;

  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = '';
  seedData.products.forEach((p) => {
    const price = p.platform_prices[platform];
    const image = p.images[platform];
    const rating = computeRatingMeta(p.product_id, platform);
    const div = document.createElement('div');
    div.className = 'product-grid-card';
    div.dataset.productId = p.product_id;
    div.innerHTML = `
      <img src="${image}" alt="${p.name}" class="grid-product-img" onerror="this.src='https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'">
      <div class="grid-product-body">
        <div class="grid-product-category">${p.category}</div>
        <div class="grid-product-name">${p.name}</div>
        <div class="grid-product-price">₹${price.toLocaleString()}</div>
        <div style="display:flex;align-items:center;gap:6px;margin:6px 0 10px;">
          <span>${ratingStars(rating.avg)}</span>
          <span style="font-size:12px;color:#6b7280;">${rating.avg} (${rating.total})</span>
        </div>
        <button class="grid-product-open-btn" style="width:100%;border:1px solid #d1d5db;background:#fff;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;padding:9px;">Open Product</button>
      </div>
    `;
    div.querySelector('.grid-product-open-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      onProductSelect?.(p.product_id);
      const evt = new CustomEvent('open-product', { detail: { productId: p.product_id, platform } });
      window.dispatchEvent(evt);
    });
    div.addEventListener('click', () => {
      onProductSelect?.(p.product_id);
      const evt = new CustomEvent('open-product', { detail: { productId: p.product_id, platform } });
      window.dispatchEvent(evt);
    });
    container.appendChild(div);
  });
}

function platformTheme(platform) {
  if (platform === 'amazon') return { accent: '#ff9900', accentDark: '#fa8c00', brand: 'Amazon' };
  if (platform === 'flipkart') return { accent: '#2874f0', accentDark: '#1d5fd1', brand: 'Flipkart' };
  if (platform === 'jiomart') return { accent: '#ee3030', accentDark: '#cc2020', brand: 'JioMart' };
  return { accent: '#111827', accentDark: '#000000', brand: 'Hammer' };
}

function getProductSpecs(product) {
  return [
    ['Category', product.category],
    ['Connectivity', product.category === 'Audio' ? 'Bluetooth 5.3 + Wired backup' : 'Wi-Fi + App control'],
    ['Warranty', '1 Year Manufacturer Warranty'],
    ['Country of Origin', 'India'],
  ];
}

function getDeliveryDateText() {
  const dt = new Date();
  dt.setDate(dt.getDate() + 3);
  return dt.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

function computeRatingMeta(productId, platform) {
  const list = (seedData?.reviews || []).filter((r) => r.product_id === productId && r.platform === platform);
  const total = list.length;
  const avg = total ? (list.reduce((a, b) => a + Number(b.rating || 0), 0) / total).toFixed(1) : '0.0';
  return { total, avg };
}

function ensureCommerceUI(theme) {
  if (commerceInitialized) return;
  const style = document.createElement('style');
  style.textContent = `
    .commerce-close{border:none;background:#f3f4f6;font-size:20px;width:34px;height:34px;border-radius:8px;cursor:pointer}
    .commerce-content{display:grid;grid-template-columns:1fr;gap:18px;padding:0}
    .commerce-image{width:100%;height:420px;object-fit:contain;border-radius:10px;background:#fff}
    .commerce-price{font-size:28px;font-weight:800;margin:8px 0}
    .commerce-actions{display:flex;gap:10px;flex-wrap:wrap;margin:14px 0}
    .commerce-btn{border:none;border-radius:8px;padding:11px 14px;cursor:pointer;font-weight:700}
    .commerce-btn.primary{color:#fff}
    .commerce-btn.secondary{background:#fff;border:1px solid #d1d5db}
    .commerce-address{display:flex;gap:8px;margin:10px 0;max-width:460px}
    .commerce-address input{flex:1;border:1px solid #d1d5db;border-radius:8px;padding:10px}
    .commerce-specs{border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;margin:12px 0}
    .commerce-spec-row{display:grid;grid-template-columns:170px 1fr}
    .commerce-spec-row div{padding:9px 10px;font-size:13px}
    .commerce-spec-row:nth-child(odd){background:#f9fafb}
    .commerce-spec-label{color:#6b7280}
    .commerce-meta{color:#374151;font-size:14px;line-height:1.6}
    .pdp-page{position:fixed;inset:0;background:#fff;z-index:1200;display:none;overflow:auto}
    .pdp-page.open{display:block}
    .pdp-header{position:sticky;top:0;background:#fff;border-bottom:1px solid #e5e7eb;padding:10px 16px;display:flex;justify-content:space-between;align-items:center;z-index:2}
    .pdp-shell{max-width:1300px;margin:0 auto;padding:16px}
    .pdp-grid{display:grid;grid-template-columns:80px 500px 1fr 300px;gap:16px;align-items:start}
    .pdp-thumb{width:62px;height:62px;object-fit:cover;border:1px solid #d1d5db;border-radius:6px;cursor:pointer;background:#fff}
    .pdp-main-image-wrap{border:1px solid #e5e7eb;border-radius:10px;padding:10px;background:#fff}
    .pdp-title{font-size:24px;font-weight:600;line-height:1.35}
    .pdp-buybox{border:1px solid #d1d5db;border-radius:10px;padding:12px;position:sticky;top:64px}
    .pdp-offers{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:10px 0}
    .pdp-offer{border:1px solid #e5e7eb;border-radius:8px;padding:8px;font-size:12px;background:#fafafa}
    .pdp-section{margin-top:18px;border-top:1px solid #ececec;padding-top:14px}
    .pdp-review-form{border:1px solid #e5e7eb;border-radius:10px;padding:12px;background:#fafafa}
    .pdp-star-rating{display:flex;gap:4px;margin-top:8px}
    .pdp-review-form input,.pdp-review-form textarea{width:100%;border:1px solid #d1d5db;border-radius:8px;padding:9px;margin-top:8px}
    .pdp-review-form textarea{min-height:80px;resize:vertical}
    .pdp-review-list .review-card{margin-bottom:10px}
    .cart-drawer{position:fixed;right:-420px;top:0;width:min(400px,100%);height:100vh;background:#fff;z-index:1001;border-left:1px solid #e5e7eb;transition:right .2s;display:flex;flex-direction:column}
    .cart-drawer.open{right:0}
    .cart-head{padding:14px 16px;border-bottom:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:center}
    .cart-items{padding:12px;overflow:auto;flex:1}
    .cart-item{border:1px solid #e5e7eb;border-radius:8px;padding:10px;margin-bottom:8px}
    .checkout-panel{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);width:min(560px,94vw);background:#fff;border:1px solid #e5e7eb;border-radius:14px;z-index:1002;display:none}
    .checkout-panel.open{display:block}
    .checkout-body{padding:14px}
    .checkout-body input,.checkout-body textarea{width:100%;border:1px solid #d1d5db;border-radius:8px;padding:10px;margin:8px 0}
    .checkout-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:8px}
    @media (max-width:1180px){.pdp-grid{grid-template-columns:80px 1fr}.pdp-buybox{position:static}.pdp-main-image-wrap{max-width:620px}}
    @media (max-width:860px){.pdp-grid{grid-template-columns:1fr}.pdp-thumb-strip{display:flex;gap:8px;overflow:auto}.pdp-main-image-wrap{max-width:100%}}
  `;
  document.head.appendChild(style);

  const pdp = document.createElement('section');
  pdp.className = 'pdp-page';
  pdp.id = 'pdp-page';
  pdp.innerHTML = `
    <div class="pdp-header">
      <button class="commerce-btn secondary" id="pdp-back">← Back to products</button>
      <strong id="commerce-title">Product Details</strong>
      <button class="commerce-close" id="commerce-close">×</button>
    </div>
    <div class="pdp-shell">
      <div class="commerce-content" id="commerce-content"></div>
    </div>
  `;
  document.body.appendChild(pdp);

  const cart = document.createElement('aside');
  cart.className = 'cart-drawer';
  cart.id = 'cart-drawer';
  cart.innerHTML = `
    <div class="cart-head"><strong>Cart</strong><button class="commerce-close" id="cart-close">×</button></div>
    <div class="cart-items" id="cart-items"></div>
    <div style="padding:12px;border-top:1px solid #e5e7eb;">
      <button class="commerce-btn primary" id="cart-checkout-btn" style="width:100%;background:${theme.accent};">Proceed to Checkout</button>
    </div>
  `;
  document.body.appendChild(cart);

  const checkout = document.createElement('div');
  checkout.className = 'checkout-panel';
  checkout.id = 'checkout-panel';
  checkout.innerHTML = `
    <div class="commerce-head">
      <strong>Delivery Address</strong>
      <button class="commerce-close" id="checkout-close">×</button>
    </div>
    <div class="checkout-body">
      <div style="font-size:13px;color:#6b7280;">Complete this checkout mock to simulate a real buy flow.</div>
      <input id="checkout-name" placeholder="Full Name">
      <input id="checkout-phone" placeholder="Phone Number">
      <textarea id="checkout-address" placeholder="House No, Street, Area, City, State, Pincode">${DEFAULT_DELIVERY_ADDRESS}</textarea>
      <div class="checkout-actions">
        <button class="commerce-btn secondary" id="checkout-cancel">Cancel</button>
        <button class="commerce-btn primary" id="checkout-place-order" style="background:${theme.accent};">Place Order</button>
      </div>
      <div id="checkout-status" style="display:none;margin-top:8px;font-size:13px;"></div>
    </div>
  `;
  document.body.appendChild(checkout);

  document.getElementById('commerce-close').addEventListener('click', () => closeProductDetails());
  document.getElementById('pdp-back').addEventListener('click', () => closeProductDetails());
  document.getElementById('cart-close').addEventListener('click', () => closeCartDrawer());
  document.getElementById('checkout-close').addEventListener('click', () => closeCheckoutPanel());
  document.getElementById('checkout-cancel').addEventListener('click', () => closeCheckoutPanel());
  document.getElementById('cart-checkout-btn').addEventListener('click', () => openCheckoutPanel());
  document.getElementById('checkout-place-order').addEventListener('click', placeOrderMock);
  commerceInitialized = true;
}

function openProductDetails(product, platform) {
  const theme = platformTheme(platform);
  const rating = computeRatingMeta(product.product_id, platform);
  const specs = getProductSpecs(product);
  const productReviews = (seedData?.reviews || []).filter((r) => r.product_id === product.product_id && r.platform === platform);
  const specsRows = specs.map(([label, value]) => `
    <div class="commerce-spec-row"><div class="commerce-spec-label">${label}</div><div>${value}</div></div>
  `).join('');
  const reviewRows = productReviews.slice(0, 8).map((r) => `
    <div class="review-card">
      <div class="review-header">
        <div class="review-avatar">${r.user ? r.user[0].toUpperCase() : 'U'}</div>
        <div class="review-meta">
          <div class="review-user">${r.user || 'Anonymous'}</div>
          <div class="review-stars">${starsHTML(r.rating)}</div>
        </div>
        <div class="review-time">${timeAgo(r.days_ago || 0)}</div>
      </div>
      <div class="review-text">${r.text}</div>
    </div>
  `).join('');
  const content = document.getElementById('commerce-content');
  const title = document.getElementById('commerce-title');
  if (!content || !title) return;
  title.textContent = product.name;
  content.innerHTML = `
    <div class="pdp-grid">
      <div class="pdp-thumb-strip">
        <img class="pdp-thumb" src="${product.image}" alt="${product.name}">
        <img class="pdp-thumb" src="${product.image}" alt="${product.name}">
        <img class="pdp-thumb" src="${product.image}" alt="${product.name}">
        <img class="pdp-thumb" src="${product.image}" alt="${product.name}">
      </div>
      <div class="pdp-main-image-wrap">
        <img class="commerce-image" id="pdp-main-image" src="${product.image}" alt="${product.name}">
      </div>
      <div>
        <div class="pdp-title">${product.name}</div>
        <div class="commerce-meta" style="margin:8px 0;"><strong>${rating.avg}</strong> (${rating.total} ratings) ${ratingStars(rating.avg)}</div>
        <div class="commerce-price">₹${Number(product.price).toLocaleString('en-IN')}</div>
        <div class="commerce-meta">Inclusive of all taxes. EMI starts at ₹${Math.max(199, Math.round(product.price / 24)).toLocaleString('en-IN')}.</div>
        <div class="pdp-offers">
          <div class="pdp-offer"><strong>No Cost EMI</strong><br>Up to 12 months on select cards.</div>
          <div class="pdp-offer"><strong>Bank Offer</strong><br>10% instant discount up to ₹1,500.</div>
          <div class="pdp-offer"><strong>Exchange</strong><br>Up to ₹2,000 off on exchange.</div>
          <div class="pdp-offer"><strong>Warranty</strong><br>1 year manufacturer warranty.</div>
        </div>
        <p class="commerce-meta">${product.description}</p>
        <div class="commerce-specs">${specsRows}</div>
        <div class="pdp-section">
          <h3 style="margin-bottom:8px;">Customer reviews</h3>
          <div class="pdp-review-list">${reviewRows || '<div class="commerce-meta">No reviews yet.</div>'}</div>
        </div>
      </div>
      <aside class="pdp-buybox">
        <div class="commerce-meta"><strong style="font-size:22px;color:#111;">₹${Number(product.price).toLocaleString('en-IN')}</strong></div>
        <div class="commerce-meta" style="margin:8px 0;">FREE delivery by <strong>${getDeliveryDateText()}</strong></div>
        <div class="commerce-meta" style="font-size:12px;margin-bottom:8px;">Deliver to: <strong>${DEFAULT_DELIVERY_ADDRESS}</strong></div>
        <div class="commerce-address">
          <input id="pincode-input" placeholder="Enter delivery pincode">
          <button class="commerce-btn secondary" id="check-delivery">Check</button>
        </div>
        <div id="delivery-status" style="font-size:13px;color:#6b7280;">In stock and deliverable.</div>
        <div class="commerce-actions" style="display:grid;grid-template-columns:1fr;gap:10px;">
          <button class="commerce-btn primary" id="pdp-add-cart" style="background:${theme.accent};">Add to Cart</button>
          <button class="commerce-btn primary" id="pdp-buy-now" style="background:${theme.accentDark};">Buy Now</button>
        </div>
        <div class="pdp-review-form">
          <div style="font-weight:700;margin-bottom:4px;">Write a review</div>
          <input id="pdp-review-email" placeholder="Email (optional)">
          <div class="pdp-star-rating" id="pdp-star-rating"></div>
          <input type="hidden" name="pdp_rating_input" value="0">
          <textarea id="pdp-review-text" placeholder="Share your experience"></textarea>
          <button class="commerce-btn primary" id="pdp-submit-review" style="background:${theme.accent};width:100%;margin-top:8px;">Submit Review</button>
          <div id="pdp-submit-status" style="display:none;font-size:12px;margin-top:8px;"></div>
        </div>
      </aside>
    </div>
    <div class="pdp-section">
      <h3 style="margin-bottom:8px;">About this item</h3>
      <div class="commerce-meta">
        <ul style="margin-left:18px;">
          <li>Authentic ${theme.brand} marketplace style product detail page simulation.</li>
          <li>Live PRISM integration for review submissions and pipeline ingestion.</li>
          <li>Buy Now and Add to Cart with address checkout flow.</li>
        </ul>
      </div>
    </div>
  `;
  document.getElementById('pdp-page')?.classList.add('open');
  document.body.style.overflow = 'hidden';
  document.querySelectorAll('.pdp-thumb').forEach((thumb) => {
    thumb.addEventListener('click', () => {
      const main = document.getElementById('pdp-main-image');
      if (main) main.src = thumb.src;
    });
  });
  document.getElementById('pdp-add-cart')?.addEventListener('click', () => addToCart(product));
  document.getElementById('pdp-buy-now')?.addEventListener('click', () => buyNow(product));
  initStarRating('pdp-star-rating', 'pdp_rating_input');
  updateStarUI(0, 'pdp-star-rating');
  document.getElementById('pdp-submit-review')?.addEventListener('click', async () => {
    const email = document.getElementById('pdp-review-email')?.value?.trim() || 'anon@example.com';
    const ratingVal = parseInt(document.querySelector('[name="pdp_rating_input"]')?.value || '0', 10);
    const text = document.getElementById('pdp-review-text')?.value?.trim();
    const status = document.getElementById('pdp-submit-status');
    if (!status) return;
    if (!text || ratingVal < 1 || ratingVal > 5) {
      status.style.display = 'block';
      status.style.color = '#b91c1c';
      status.textContent = 'Add valid rating (1-5) and review text.';
      return;
    }
    const reviewData = {
      product_id: product.product_id,
      platform,
      review_text: text,
      transcript: null,
      rating: ratingVal,
      user_id: email,
      media_type: 'none',
      timestamp: new Date().toISOString(),
    };
    seedData.reviews.unshift({
      id: `local-${Date.now()}`,
      product_id: product.product_id,
      platform,
      user: email.split('@')[0],
      rating: ratingVal,
      text,
      days_ago: 0,
    });
    status.style.display = 'block';
    status.style.color = '#1d4ed8';
    status.textContent = 'Submitting to PRISM pipeline...';
    try {
      await fetch(`${API_BASE}/reviews/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewData),
      });
      status.style.color = '#047857';
      status.textContent = 'Review submitted and sent to pipeline.';
      setTimeout(() => openProductDetails(product, platform), 500);
    } catch {
      status.style.color = '#92400e';
      status.textContent = 'Backend offline: review saved locally in page.';
      setTimeout(() => openProductDetails(product, platform), 500);
    }
  });
  document.getElementById('check-delivery')?.addEventListener('click', () => {
    const pin = document.getElementById('pincode-input')?.value?.trim();
    const status = document.getElementById('delivery-status');
    if (!status) return;
    if (pin.length >= 6) status.textContent = `Delivery available to ${pin}. Expected by ${getDeliveryDateText()}.`;
    else status.textContent = 'Please enter a valid 6-digit pincode.';
  });
}

function closeProductDetails() {
  document.getElementById('pdp-page')?.classList.remove('open');
  document.body.style.overflow = '';
}

function openCartDrawer() {
  document.getElementById('cart-drawer')?.classList.add('open');
}

function closeCartDrawer() {
  document.getElementById('cart-drawer')?.classList.remove('open');
}

function renderCartItems() {
  const wrap = document.getElementById('cart-items');
  if (!wrap) return;
  if (!storeCart.length) {
    wrap.innerHTML = '<div style="color:#6b7280;font-size:13px;">Your cart is empty.</div>';
    return;
  }
  wrap.innerHTML = storeCart.map((item, idx) => `
    <div class="cart-item">
      <div style="font-weight:700;font-size:14px;">${item.name}</div>
      <div style="font-size:13px;color:#6b7280;">₹${Number(item.price).toLocaleString('en-IN')}</div>
      <button data-remove="${idx}" class="commerce-btn secondary" style="margin-top:8px;padding:7px 10px;font-size:12px;">Remove</button>
    </div>
  `).join('');
  wrap.querySelectorAll('[data-remove]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.getAttribute('data-remove'));
      storeCart.splice(idx, 1);
      renderCartItems();
    });
  });
}

function addToCart(product) {
  storeCart.push(product);
  renderCartItems();
  openCartDrawer();
}

function buyNow(product) {
  currentCheckoutProduct = product;
  openCheckoutPanel();
}

function openCheckoutPanel() {
  document.getElementById('checkout-panel')?.classList.add('open');
}

function closeCheckoutPanel() {
  document.getElementById('checkout-panel')?.classList.remove('open');
}

function placeOrderMock() {
  const name = document.getElementById('checkout-name')?.value?.trim();
  const phone = document.getElementById('checkout-phone')?.value?.trim();
  const address = document.getElementById('checkout-address')?.value?.trim();
  const status = document.getElementById('checkout-status');
  if (!status) return;
  if (!name || !phone || !address) {
    status.style.display = 'block';
    status.style.color = '#b91c1c';
    status.textContent = 'Please fill name, phone, and address before placing order.';
    return;
  }
  status.style.display = 'block';
  status.style.color = '#047857';
  const item = currentCheckoutProduct ? currentCheckoutProduct.name : `${storeCart.length} item(s)`;
  status.textContent = `Order placed successfully for ${item}. Delivery ETA: ${getDeliveryDateText()}.`;
  setTimeout(() => {
    closeCheckoutPanel();
    currentCheckoutProduct = null;
  }, 1800);
}

async function initProductCommerceExperience(platform) {
  const data = await ensureSeedDataLoaded();
  if (!data) return;
  const theme = platformTheme(platform);
  ensureCommerceUI(theme);
  renderCartItems();
  document.querySelectorAll('.product-grid-card').forEach((card) => {
    const pid = card.dataset.productId;
    if (!pid) return;
    card.addEventListener('dblclick', async () => {
      const product = await getProduct(pid, platform);
      if (product) openProductDetails(product, platform);
    });
  });
  window.addEventListener('open-product', async (e) => {
    if (e.detail?.platform !== platform) return;
    const product = await getProduct(e.detail.productId, platform);
    if (product) openProductDetails(product, platform);
  });
}
