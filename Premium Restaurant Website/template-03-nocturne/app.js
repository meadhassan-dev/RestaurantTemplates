/* NOCTURNE — Modern Gastronomy After Dark
   Shared behaviour for all pages.
==================================================== */

/* ---------------- Scroll progress bar ---------------- */
(function initProgress() {
  const bar = document.getElementById('scrollProgress');
  if (!bar) return;
  function paint() {
    const h = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + '%';
  }
  window.addEventListener('scroll', paint, { passive: true });
  window.addEventListener('resize', paint);
  paint();
})();

/* ---------------- Preloader ---------------- */
document.addEventListener('DOMContentLoaded', function () {
  const pre = document.getElementById('preloader');
  if (pre) {
    setTimeout(() => {
      pre.classList.add('hidden');
      document.body.classList.remove('lock');
    }, 800);
  } else {
    document.body.classList.remove('lock');
  }
});

window.addEventListener('load', function () {
  const pre = document.getElementById('preloader');
  if (pre) pre.classList.add('hidden');
  document.body.classList.remove('lock');
});

/* ---------------- Navbar scroll state ---------------- */
const nocNav = document.getElementById('nocNav');
function navScroll() {
  if (!nocNav) return;
  if (window.scrollY > 60) nocNav.classList.add('scrolled');
  else nocNav.classList.remove('scrolled');
}
window.addEventListener('scroll', navScroll);
navScroll();

/* Close mobile menu on link click */
document.querySelectorAll('#nocNavbar .nav-link').forEach(link => {
  link.addEventListener('click', () => {
    const col = document.getElementById('nocNavbar');
    if (col && col.classList.contains('show')) {
      const bs = bootstrap.Collapse.getOrCreateInstance(col);
      bs.hide();
    }
  });
});

/* ---------------- Active nav link ---------------- */
(function setActiveLink() {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link-noc').forEach(a => {
    if (a.getAttribute('href') === page) a.classList.add('active');
  });
})();

/* ---------------- Reveal on scroll ---------------- */
const revealEls = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObs.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
revealEls.forEach(el => revealObs.observe(el));

/* ---------------- Hero parallax (photo media) ---------------- */
const parallaxEls = document.querySelectorAll('[data-parallax]');
if (parallaxEls.length) {
  let pxTicking = false;
  function updateParallax() {
    parallaxEls.forEach(el => {
      const img = el.querySelector('img');
      if (!img) return;
      const rect = el.getBoundingClientRect();
      const mid = rect.top + rect.height / 2;
      const offset = (mid - window.innerHeight / 2) * 0.08;
      img.style.transform = `translateY(${offset.toFixed(1)}px) scale(1.12)`;
    });
    pxTicking = false;
  }
  window.addEventListener('scroll', () => {
    if (!pxTicking) {
      pxTicking = true;
      requestAnimationFrame(updateParallax);
    }
  }, { passive: true });
  window.addEventListener('resize', updateParallax);
  updateParallax();
}

/* ---------------- Animated counters ---------------- */
function animateCount(el) {
  const target = parseInt(el.dataset.count || '0', 10);
  const duration = 2000;
  const start = performance.now();
  function tick(now) {
    const p = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.floor(target * eased).toLocaleString();
    if (p < 1) requestAnimationFrame(tick);
    else el.textContent = target.toLocaleString();
  }
  requestAnimationFrame(tick);
}
const countObs = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCount(entry.target);
      countObs.unobserve(entry.target);
    }
  });
}, { threshold: 0.6 });
document.querySelectorAll('.stat-num-noc[data-count]').forEach(el => countObs.observe(el));

/* ---------------- Back to top ---------------- */
const backTop = document.getElementById('backToTop');
if (backTop) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 500) backTop.classList.add('show');
    else backTop.classList.remove('show');
  });
  backTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* ---------------- Toast helper ---------------- */
function showToast(message, icon) {
  let wrap = document.getElementById('toastWrap');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.id = 'toastWrap';
    wrap.style.cssText = 'position:fixed;top:24px;right:24px;z-index:3000;display:flex;flex-direction:column;gap:10px;';
    document.body.appendChild(wrap);
  }
  const t = document.createElement('div');
  t.className = 'toast show toast-noc';
  t.style.cssText = 'display:flex;align-items:center;gap:10px;padding:14px 20px;min-width:260px;box-shadow:0 14px 40px rgba(4,7,20,.5);animation:fadeSlideIn .4s var(--ease);';
  t.innerHTML = (icon ? `<i class="fas fa-${icon} text-accent"></i> ` : '') + `<span>${message}</span>`;
  wrap.appendChild(t);
  setTimeout(() => { t.style.transition = 'opacity .4s'; t.style.opacity = '0'; setTimeout(() => t.remove(), 400); }, 2600);
}
const styleTag = document.createElement('style');
styleTag.textContent = `@keyframes fadeSlideIn{from{opacity:0;transform:translateX(30px)}to{opacity:1;transform:translateX(0)}}`;
document.head.appendChild(styleTag);

/* ====================================================
   CART
==================================================== */
function getCart() {
  try { return JSON.parse(localStorage.getItem('nocturne_cart') || '[]'); } catch (e) { return []; }
}
function saveCart(cart) {
  localStorage.setItem('nocturne_cart', JSON.stringify(cart));
  updateCartCount();
}
function addToCart(id) {
  const item = MENU.find(i => i.id === Number(id));
  if (!item) return;
  let cart = getCart();
  const existing = cart.find(c => c.id === item.id);
  if (existing) existing.qty += 1;
  else cart.push({ ...item, qty: 1 });
  saveCart(cart);
  showToast(`${item.name} added to your table`, 'check');
}
function removeFromCart(id) {
  saveCart(getCart().filter(i => i.id !== Number(id)));
  renderCartPage();
}
function updateQty(id, change) {
  let cart = getCart();
  const item = cart.find(i => i.id === Number(id));
  if (item) {
    item.qty += change;
    if (item.qty <= 0) cart = cart.filter(i => i.id !== Number(id));
  }
  saveCart(cart);
  renderCartPage();
}
function clearCart() {
  localStorage.removeItem('nocturne_cart');
  updateCartCount();
  renderCartPage();
}
function updateCartCount() {
  const cart = getCart();
  const count = cart.reduce((s, i) => s + i.qty, 0);
  document.querySelectorAll('#cartCount, #floatingCount').forEach(el => { if (el) el.textContent = count; });
  const fc = document.getElementById('floatingCart');
  if (fc) fc.style.display = count > 0 ? 'flex' : 'none';
}

/* ---------------- Cart page rendering ---------------- */
function renderCartPage() {
  const container = document.getElementById('cartItems');
  if (!container) return;
  const empty = document.getElementById('emptyCart');
  const cart = getCart();
  if (cart.length === 0) {
    container.innerHTML = '';
    if (empty) { empty.classList.remove('d-none'); empty.classList.add('visible'); }
    return;
  }
  if (empty) empty.classList.add('d-none');
  container.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="ci-img"><img src="${item.image}" alt="${item.name}"></div>
      <div class="ci-info">
        <h6>${item.name}</h6>
        <p>$${item.price.toFixed(2)} each</p>
      </div>
      <div class="ci-qty">
        <button onclick="updateQty(${item.id}, -1)" aria-label="Decrease"><i class="fas fa-minus"></i></button>
        <span>${item.qty}</span>
        <button onclick="updateQty(${item.id}, 1)" aria-label="Increase"><i class="fas fa-plus"></i></button>
      </div>
      <div class="ci-total">$${(item.price * item.qty).toFixed(2)}</div>
      <button class="ci-remove" onclick="removeFromCart(${item.id})" aria-label="Remove"><i class="fas fa-trash-alt"></i></button>
    </div>
  `).join('');
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const tax = subtotal * 0.1025;
  const delivery = subtotal > 150 ? 0 : 8.5;
  const total = subtotal + tax + delivery;
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('cartSubtotal', '$' + subtotal.toFixed(2));
  set('cartTax', '$' + tax.toFixed(2));
  set('cartDelivery', delivery === 0 ? 'Complimentary' : '$' + delivery.toFixed(2));
  set('cartTotal', '$' + total.toFixed(2));
}

/* ---------------- Checkout ---------------- */
function initCheckout() {
  const form = document.getElementById('checkoutForm');
  if (!form) return;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const cart = getCart();
    if (cart.length === 0) { showToast('Your cart is empty', 'info'); return; }
    const orders = getOrders();
    const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const tax = subtotal * 0.1025;
    const delivery = subtotal > 150 ? 0 : 8.5;
    const order = {
      id: 'NCT-' + Math.floor(1000 + Math.random() * 9000),
      items: cart.map(i => ({ name: i.name, price: i.price, qty: i.qty })),
      subtotal, tax, delivery,
      total: subtotal + tax + delivery,
      status: 'pending',
      payment: form.querySelector('#paymentMethod').value,
      customer: form.querySelector('#custName').value,
      email: form.querySelector('#custEmail').value,
      phone: form.querySelector('#custPhone').value,
      address: form.querySelector('#custAddress').value,
      time: new Date().toISOString()
    };
    orders.push(order);
    localStorage.setItem('nocturne_orders', JSON.stringify(orders));
    const numEl = document.getElementById('orderNumber');
    if (numEl) numEl.textContent = order.id;
    clearCart();
    const modal = document.getElementById('orderSuccessModal');
    if (modal) bootstrap.Modal.getOrCreateInstance(modal).show();
    form.reset();
  });
}

/* ---------------- Orders (shared) ---------------- */
function getOrders() {
  try { return JSON.parse(localStorage.getItem('nocturne_orders') || '[]'); } catch (e) { return []; }
}
function saveOrders(orders) { localStorage.setItem('nocturne_orders', JSON.stringify(orders)); }

/* ====================================================
   MENU DATA
==================================================== */
const MENU = [
  { id: 1, name: 'Tuna Tartare "Velvet"', category: 'starters', price: 28, description: 'Ora king tuna, yuzu pearls, avocado cloud, sesame tuile', image: 'https://images.unsplash.com/photo-1541529086526-db283c563270?w=600&q=80', tag: 'Signature' },
  { id: 2, name: 'Burrata & White Peach', category: 'starters', price: 24, description: 'Sicilian burrata, white peach, basil pearls, aged balsamic', image: 'https://images.unsplash.com/photo-1541516160071-4bb0c5af65ba?w=600&q=80', tag: 'New' },
  { id: 3, name: 'Lobster Cappuccino', category: 'starters', price: 34, description: 'Twin-tail lobster, bisque foam, tarragon oil', image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600&q=80' },
  { id: 4, name: 'Foie Gras Torchon', category: 'starters', price: 38, description: 'Sauternes-cured foie, brioche, pickled cherry', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80' },
  { id: 5, name: 'A5 Wagyu "Midnight"', category: 'mains', price: 88, description: 'Japanese A5 wagyu, charred onion, black garlic jus, potato espuma', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80', tag: 'Signature' },
  { id: 6, name: 'Iberico Presa', category: 'mains', price: 54, description: 'Iberian pork, mole negro, charred pineapple, herb oil', image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&q=80' },
  { id: 7, name: 'Black Cod Miso', category: 'mains', price: 48, description: 'Caramelised black cod, sake glaze, winter truffle, jasmine rice', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&q=80', tag: 'New' },
  { id: 8, name: 'Truffle Risotto', category: 'mains', price: 42, description: 'Acquerello risotto, black truffle, parmesan espuma', image: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=600&q=80' },
  { id: 9, name: 'Cauliflower "Crown"', category: 'vegetarian', price: 32, description: 'Whole-roasted cauliflower, smoked romesco, almond praline', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80', tag: 'Vegan option' },
  { id: 10, name: 'Wild Mushroom Tagliatelle', category: 'vegetarian', price: 36, description: 'Hand-cut pasta, chanterelles, brown butter, thyme', image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600&q=80' },
  { id: 11, name: 'Golden Beet Carpaccio', category: 'vegetarian', price: 28, description: 'Charred golden beet, whipped goat cheese, pistachio, sorrel', image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600&q=80' },
  { id: 12, name: 'Noir Chocolate Dome', category: 'desserts', price: 22, description: 'Dark chocolate dome, salted caramel core, gold leaf', image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=600&q=80', tag: 'Signature' },
  { id: 13, name: 'Peach Melba Verrine', category: 'desserts', price: 18, description: 'Vanilla parfait, peach, raspberry, almond crumble', image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&q=80' },
  { id: 14, name: 'Cheese & Truffle Honey', category: 'desserts', price: 26, description: 'Artisan cheese board, truffle honey, walnut crisps', image: 'https://images.unsplash.com/photo-1452195100486-9cc805987862?w=600&q=80' },
  { id: 15, name: 'Midnight Martini', category: 'drinks', price: 22, description: 'House gin, violet liqueur, dry vermouth, black cherry', image: 'https://images.unsplash.com/photo-1536935338788-846bb9981813?w=600&q=80', tag: 'Mixologist' },
  { id: 16, name: 'Nebbiolo Riserva', category: 'drinks', price: 88, description: 'Piedmont red — roses, tar, dark cherry', image: 'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=600&q=80' }
];

function getMenu() {
  try { const s = JSON.parse(localStorage.getItem('nocturne_menu')); return Array.isArray(s) && s.length ? s : MENU; } catch (e) { return MENU; }
}
function saveMenu(menu) { localStorage.setItem('nocturne_menu', JSON.stringify(menu)); }

/* ====================================================
   RESERVATIONS
==================================================== */
function initReservation() {
  const form = document.getElementById('reservationForm');
  if (!form) return;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const res = {
      id: 'RES-' + Math.floor(1000 + Math.random() * 9000),
      name: form.querySelector('#resName').value,
      email: form.querySelector('#resEmail').value,
      phone: form.querySelector('#resPhone').value,
      guests: form.querySelector('#resGuests').value,
      date: form.querySelector('#resDate').value,
      time: form.querySelector('#resTime').value,
      occasion: form.querySelector('#resOccasion') ? form.querySelector('#resOccasion').value : '',
      notes: form.querySelector('#resNotes') ? form.querySelector('#resNotes').value : '',
      status: 'pending',
      created: new Date().toISOString()
    };
    const list = JSON.parse(localStorage.getItem('nocturne_reservations') || '[]');
    list.push(res);
    localStorage.setItem('nocturne_reservations', JSON.stringify(list));
    const numEl = document.getElementById('resConfirmNumber');
    if (numEl) numEl.textContent = res.id;
    const modal = document.getElementById('reservationSuccessModal');
    if (modal) bootstrap.Modal.getOrCreateInstance(modal).show();
    form.reset();
  });
}

/* ====================================================
   CONTACT
==================================================== */
function initContact() {
  const form = document.getElementById('contactForm');
  if (!form) return;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const msg = {
      id: 'MSG-' + Math.floor(1000 + Math.random() * 9000),
      name: form.querySelector('#msgName').value,
      email: form.querySelector('#msgEmail').value,
      subject: form.querySelector('#msgSubject') ? form.querySelector('#msgSubject').value : '',
      message: form.querySelector('#msgBody').value,
      created: new Date().toISOString()
    };
    const list = JSON.parse(localStorage.getItem('nocturne_messages') || '[]');
    list.push(msg);
    localStorage.setItem('nocturne_messages', JSON.stringify(list));
    const numEl = document.getElementById('msgConfirmNumber');
    if (numEl) numEl.textContent = msg.id;
    const modal = document.getElementById('contactSuccessModal');
    if (modal) bootstrap.Modal.getOrCreateInstance(modal).show();
    form.reset();
  });
}

/* ====================================================
   ORDER PAGE (filterable grid)
==================================================== */
function initOrderPage() {
  const grid = document.getElementById('menuGrid');
  if (!grid) return;
  const noResults = document.getElementById('noResults');
  const menu = getMenu();

  function render(category, query) {
    let items = menu;
    if (category !== 'all') items = items.filter(i => i.category === category);
    if (query) items = items.filter(i => (i.name + i.description).toLowerCase().includes(query.toLowerCase()));
    if (items.length === 0) {
      grid.innerHTML = '';
      if (noResults) noResults.classList.remove('d-none');
      return;
    }
    if (noResults) noResults.classList.add('d-none');
    grid.innerHTML = items.map(item => `
      <div class="col-md-6 col-lg-4">
        <div class="order-card">
          <div class="oc-img">
            <img src="${item.image}" alt="${item.name}">
            ${item.tag ? `<span class="oc-tag">${item.tag}</span>` : ''}
          </div>
          <div class="oc-body">
            <h5>${item.name}</h5>
            <p>${item.description}</p>
            <div class="d-flex justify-content-between align-items-center mt-2">
              <span class="oc-price">$${item.price.toFixed(2)}</span>
              <button class="btn-noc oc-btn" onclick="addToCart(${item.id})"><i class="fas fa-plus"></i> Add</button>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  }

  let activeCat = 'all';
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeCat = btn.dataset.category;
    const q = document.getElementById('menuSearch') ? document.getElementById('menuSearch').value : '';
    render(activeCat, q);
  }));
  const search = document.getElementById('menuSearch');
  if (search) search.addEventListener('input', () => render(activeCat, search.value));

  render('all', '');
}

/* ====================================================
   MENU PAGE (filterable list)
==================================================== */
function initMenuPage() {
  const container = document.getElementById('menuContainer');
  if (!container) return;
  const menu = getMenu();

  const CAT = {
    starters: { label: 'Starters', icon: 'fa-bowl-food' },
    mains: { label: 'Mains', icon: 'fa-drumstick-bite' },
    vegetarian: { label: 'Vegetarian', icon: 'fa-leaf' },
    desserts: { label: 'Desserts', icon: 'fa-cake-candles' },
    drinks: { label: 'Drinks', icon: 'fa-wine-glass' }
  };

  function itemCard(item) {
    return `
      <div class="menu-item" data-category="${item.category}">
        <div class="mi-icon"><i class="fas ${CAT[item.category] ? CAT[item.category].icon : 'fa-utensils'}"></i></div>
        <div class="mi-main">
          <div class="mi-top">
            <h4>${item.name}</h4>
            <span class="mi-dots"></span>
            <span class="mi-price">$${item.price.toFixed(2)}</span>
          </div>
          <p>${item.description}</p>
          ${item.tag ? `<span class="mi-tag">${item.tag}</span>` : ''}
        </div>
      </div>`;
  }

  function render(filter) {
    const cats = filter === 'all'
      ? Object.keys(CAT)
      : Object.keys(CAT).filter(c => c === filter);
    container.innerHTML = cats.map(cat => `
      <div class="menu-category" data-cat="${cat}">
        <div class="menu-category-head">
          <h3><i class="fas ${CAT[cat].icon}"></i> ${CAT[cat].label}</h3>
        </div>
        ${menu.filter(i => i.category === cat).map(itemCard).join('')}
      </div>`).join('');
  }

  const buttons = document.querySelectorAll('#menuTabs button');
  buttons.forEach(btn => btn.addEventListener('click', () => {
    buttons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    render(btn.dataset.filter || 'all');
  }));

  render('all');
}

/* ====================================================
   ADMIN DASHBOARD
==================================================== */
function isAdminPage() { return document.getElementById('tab-overview') !== null; }

function initAdmin() {
  if (!isAdminPage()) return;
  seedDemoData();
  renderOverview();
  renderOrdersTable();
  renderSalesReport();
  renderMenuManagement();
  renderReservations();
  renderMessages();
  initSidebar();
  initOrderFilter();
  renderCharts();
  initAddItemForm();
}

function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }

function formatTime(iso) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
  if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function renderOverview() {
  const orders = getOrders();
  const today = new Date().toDateString();
  const todayOrders = orders.filter(o => new Date(o.time).toDateString() === today);
  const todaySales = todayOrders.reduce((s, o) => s + o.total, 0);
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weekSales = orders.filter(o => new Date(o.time) >= weekStart).reduce((s, o) => s + o.total, 0);
  const totalSales = orders.reduce((s, o) => s + o.total, 0);
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('todayOrders', todayOrders.length);
  set('todaySales', '$' + todaySales.toFixed(0));
  set('weekSales', '$' + weekSales.toFixed(0));
  set('totalSales', '$' + totalSales.toFixed(0));

  const tbody = document.getElementById('recentOrdersTable');
  if (tbody) {
    const recent = orders.slice(-6).reverse();
    tbody.innerHTML = recent.map(o => `
      <tr>
        <td><strong>${o.id}</strong></td>
        <td>${o.customer}</td>
        <td>${o.items.map(i => i.name + ' × ' + i.qty).join(', ')}</td>
        <td><strong>$${o.total.toFixed(2)}</strong></td>
        <td><span class="badge-status badge-${o.status}">${capitalize(o.status)}</span></td>
        <td>${formatTime(o.time)}</td>
      </tr>
    `).join('') || '<tr><td colspan="6" class="text-center text-muted py-4">No orders yet</td></tr>';
  }

  const itemCounts = {};
  orders.forEach(o => o.items.forEach(i => { itemCounts[i.name] = (itemCounts[i.name] || 0) + i.qty; }));
  const top = Object.entries(itemCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const popEl = document.getElementById('popularItems');
  if (popEl) {
    popEl.innerHTML = top.map(([name, count]) => `
      <div class="popular-item">
        <span class="popular-item-name">${name}</span>
        <span class="popular-item-count">${count} ordered</span>
      </div>
    `).join('') || '<p class="text-muted small">No orders yet</p>';
  }
}

function renderOrdersTable() {
  const tbody = document.getElementById('allOrdersTable');
  if (!tbody) return;
  const orders = getOrders().reverse();
  const filter = document.getElementById('orderFilter');
  const selected = filter ? filter.value : 'all';
  const filtered = selected === 'all' ? orders : orders.filter(o => o.status === selected);
  tbody.innerHTML = filtered.map(o => `
    <tr>
      <td><strong>${o.id}</strong></td>
      <td>${o.customer}</td>
      <td>${o.phone || '—'}</td>
      <td>${o.items.map(i => i.name + ' × ' + i.qty).join(', ')}</td>
      <td><strong>$${o.total.toFixed(2)}</strong></td>
      <td>${capitalize(o.payment)}</td>
      <td><span class="badge-status badge-${o.status}">${capitalize(o.status)}</span></td>
      <td>${formatTime(o.time)}</td>
      <td>
        <select class="form-select form-select-sm st-select" onchange="updateOrderStatus('${o.id}', this.value)">
          <option value="pending" ${o.status === 'pending' ? 'selected' : ''}>Pending</option>
          <option value="preparing" ${o.status === 'preparing' ? 'selected' : ''}>Preparing</option>
          <option value="delivered" ${o.status === 'delivered' ? 'selected' : ''}>Delivered</option>
          <option value="cancelled" ${o.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
        </select>
      </td>
    </tr>
  `).join('') || '<tr><td colspan="9" class="text-center text-muted py-4">No orders found</td></tr>';
}

function updateOrderStatus(orderId, newStatus) {
  const orders = getOrders();
  const order = orders.find(o => o.id === orderId);
  if (order) {
    order.status = newStatus;
    saveOrders(orders);
    renderOverview();
    renderSalesReport();
    showToast(`Order ${orderId} marked as ${newStatus}`, 'check');
  }
}

function renderSalesReport() {
  const orders = getOrders();
  const today = new Date().toDateString();
  const todayOrders = orders.filter(o => new Date(o.time).toDateString() === today);
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weekOrders = orders.filter(o => new Date(o.time) >= weekStart);
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('reportTodaySales', '$' + todayOrders.reduce((s, o) => s + o.total, 0).toFixed(2));
  set('reportTodayOrders', todayOrders.length + ' orders');
  set('reportWeekSales', '$' + weekOrders.reduce((s, o) => s + o.total, 0).toFixed(2));
  set('reportWeekOrders', weekOrders.length + ' orders');
  set('reportTotalSales', '$' + orders.reduce((s, o) => s + o.total, 0).toFixed(2));
  set('reportTotalOrders', orders.length + ' orders');
}

function renderMenuManagement() {
  const tbody = document.getElementById('menuItemsTable');
  if (!tbody) return;
  const menu = getMenu();
  tbody.innerHTML = menu.map(item => `
    <tr>
      <td><img src="${item.image}" alt="${item.name}" class="mini-thumb"></td>
      <td><strong>${item.name}</strong></td>
      <td>${capitalize(item.category)}</td>
      <td>$${item.price.toFixed(2)}</td>
      <td>${item.tag || '—'}</td>
      <td>
        <button class="btn-icon" onclick="editMenuItem(${item.id})" title="Edit"><i class="fas fa-edit"></i></button>
        <button class="btn-icon danger" onclick="deleteMenuItem(${item.id})" title="Delete"><i class="fas fa-trash-alt"></i></button>
      </td>
    </tr>
  `).join('') || '<tr><td colspan="6" class="text-center text-muted py-4">No menu items</td></tr>';
}

function deleteMenuItem(id) {
  if (!confirm('Delete this menu item?')) return;
  const menu = getMenu().filter(i => i.id !== Number(id));
  localStorage.setItem('nocturne_menu', JSON.stringify(menu));
  renderMenuManagement();
  showToast('Menu item deleted', 'trash-alt');
}

function editMenuItem(id) {
  const item = getMenu().find(i => i.id === Number(id));
  if (!item) return;
  const f = document.getElementById('addItemForm');
  if (!f) return;
  f.querySelector('#itemName').value = item.name;
  f.querySelector('#itemCategory').value = item.category;
  f.querySelector('#itemPrice').value = item.price;
  f.querySelector('#itemDescription').value = item.description;
  f.querySelector('#itemImage').value = item.image;
  f.querySelector('#itemTag').value = item.tag || '';
  f.dataset.editId = id;
  f.querySelector('#itemFormTitle').textContent = 'Edit Menu Item';
  f.querySelector('#itemFormSubmit').innerHTML = '<i class="fas fa-save me-2"></i> Update Item';
  document.getElementById('tab-menu').scrollIntoView({ behavior: 'smooth' });
}

function initAddItemForm() {
  const f = document.getElementById('addItemForm');
  if (!f) return;
  f.addEventListener('submit', function (e) {
    e.preventDefault();
    const menu = getMenu();
    const item = {
      name: f.querySelector('#itemName').value,
      category: f.querySelector('#itemCategory').value,
      price: parseFloat(f.querySelector('#itemPrice').value),
      description: f.querySelector('#itemDescription').value,
      image: f.querySelector('#itemImage').value || MENU[0].image,
      tag: f.querySelector('#itemTag').value
    };
    const editId = f.dataset.editId;
    if (editId) {
      const idx = menu.findIndex(i => i.id === Number(editId));
      if (idx !== -1) menu[idx] = { ...menu[idx], ...item };
      showToast('Menu item updated', 'check');
    } else {
      item.id = Date.now();
      menu.push(item);
      showToast('Menu item added', 'check');
    }
    localStorage.setItem('nocturne_menu', JSON.stringify(menu));
    delete f.dataset.editId;
    f.reset();
    f.querySelector('#itemFormTitle').textContent = 'Add Menu Item';
    f.querySelector('#itemFormSubmit').innerHTML = '<i class="fas fa-plus me-2"></i> Add Item';
    renderMenuManagement();
  });
}

function renderReservations() {
  const tbody = document.getElementById('reservationsTable');
  if (!tbody) return;
  const list = JSON.parse(localStorage.getItem('nocturne_reservations') || '[]');
  tbody.innerHTML = list.reverse().map(r => `
    <tr>
      <td><strong>${r.id}</strong></td>
      <td>${r.name}</td>
      <td>${r.guests} guests</td>
      <td>${r.date} · ${r.time}</td>
      <td>${r.occasion || '—'}</td>
      <td>${formatTime(r.created)}</td>
      <td>
        <select class="form-select form-select-sm st-select" onchange="updateResStatus('${r.id}', this.value)">
          <option value="pending" ${r.status === 'pending' ? 'selected' : ''}>Pending</option>
          <option value="confirmed" ${r.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
          <option value="seated" ${r.status === 'seated' ? 'selected' : ''}>Seated</option>
          <option value="cancelled" ${r.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
        </select>
      </td>
    </tr>
  `).join('') || '<tr><td colspan="7" class="text-center text-muted py-4">No reservations yet</td></tr>';
}

function updateResStatus(id, status) {
  const list = JSON.parse(localStorage.getItem('nocturne_reservations') || '[]');
  const r = list.find(x => x.id === id);
  if (r) {
    r.status = status;
    localStorage.setItem('nocturne_reservations', JSON.stringify(list));
    renderReservations();
    showToast(`Reservation ${id} marked as ${status}`, 'check');
  }
}

function renderMessages() {
  const tbody = document.getElementById('messagesTable');
  if (!tbody) return;
  const list = JSON.parse(localStorage.getItem('nocturne_messages') || '[]');
  tbody.innerHTML = list.reverse().map(m => `
    <tr>
      <td><strong>${m.id}</strong></td>
      <td>${m.name}</td>
      <td>${m.email}</td>
      <td>${m.subject || '—'}</td>
      <td class="msg-body-cell">${m.message}</td>
      <td>${formatTime(m.created)}</td>
    </tr>
  `).join('') || '<tr><td colspan="6" class="text-center text-muted py-4">No messages yet</td></tr>';
}

function renderCharts() {
  const orders = getOrders();
  const violet = '#8B7BF7';
  const magenta = '#E45C8E';
  const violetSoft = 'rgba(139,123,247,.18)';
  const gridLine = 'rgba(139,123,247,.12)';
  const tickColor = '#9BA1C0';
  const weekLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weekData = new Array(7).fill(0);
  orders.forEach(o => {
    const d = new Date(o.time);
    if ((new Date() - d) < 7 * 86400000) weekData[d.getDay()] += o.total;
  });
  const salesCtx = document.getElementById('salesChart');
  if (salesCtx && window.Chart) {
    new Chart(salesCtx, {
      type: 'bar',
      data: { labels: weekLabels, datasets: [{ label: 'Sales ($)', data: weekData, backgroundColor: violet, borderRadius: 8, maxBarThickness: 40 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: gridLine }, ticks: { color: tickColor, callback: v => '$' + v } }, x: { grid: { display: false }, ticks: { color: tickColor } } } }
    });
  }
  const dayLabels = [];
  const dayData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dayLabels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
    dayData.push(orders.filter(o => new Date(o.time).toDateString() === d.toDateString()).reduce((s, o) => s + o.total, 0));
  }
  const dailyCtx = document.getElementById('dailySalesChart');
  if (dailyCtx && window.Chart) {
    new Chart(dailyCtx, {
      type: 'line',
      data: { labels: dayLabels, datasets: [{ label: 'Sales ($)', data: dayData, borderColor: magenta, backgroundColor: violetSoft, fill: true, tension: 0.45, pointRadius: 4, pointBackgroundColor: violet, borderWidth: 2 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: gridLine }, ticks: { color: tickColor, callback: v => '$' + v } }, x: { grid: { display: false }, ticks: { color: tickColor } } } }
    });
  }
}

function initSidebar() {
  const links = document.querySelectorAll('.sidebar-link');
  links.forEach(link => link.addEventListener('click', function (e) {
    e.preventDefault();
    links.forEach(l => l.classList.remove('active'));
    this.classList.add('active');
    document.querySelectorAll('.admin-tab').forEach(t => { t.style.display = 'none'; });
    const tab = document.getElementById('tab-' + this.dataset.tab);
    if (tab) tab.style.display = 'block';
  }));
}

function initOrderFilter() {
  const filter = document.getElementById('orderFilter');
  if (filter) filter.addEventListener('change', renderOrdersTable);
}

function seedDemoData() {
  if (localStorage.getItem('nocturne_orders')) return;
  const names = ['Isabella Whitmore', 'Marcus Bennett', 'Victoria Laurent', 'Jonas Keller', 'Priya Raghavan'];
  const demoMenu = MENU.slice(0, 12);
  const orders = [];
  const statuses = ['pending', 'preparing', 'delivered', 'delivered', 'delivered'];
  for (let i = 0; i < 18; i++) {
    const d = new Date();
    d.setDate(d.getDate() - Math.floor(Math.random() * 7));
    d.setHours(18 + Math.floor(Math.random() * 5), Math.floor(Math.random() * 60));
    const items = [];
    const used = new Set();
    const count = 1 + Math.floor(Math.random() * 3);
    for (let j = 0; j < count; j++) {
      let idx = Math.floor(Math.random() * demoMenu.length);
      while (used.has(idx)) idx = Math.floor(Math.random() * demoMenu.length);
      used.add(idx);
      items.push({ name: demoMenu[idx].name, price: demoMenu[idx].price, qty: 1 + Math.floor(Math.random() * 2) });
    }
    const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);
    orders.push({
      id: 'NCT-' + (1000 + i),
      items,
      subtotal,
      tax: subtotal * 0.1025,
      delivery: 8.5,
      total: subtotal * 1.1025 + 8.5,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      payment: Math.random() > 0.5 ? 'card' : 'cash',
      customer: names[Math.floor(Math.random() * names.length)],
      phone: '(312) 555-' + Math.floor(1000 + Math.random() * 9000),
      email: 'guest@example.com',
      address: Math.floor(100 + Math.random() * 900) + ' Wabash Avenue, Chicago',
      time: d.toISOString()
    });
  }
  localStorage.setItem('nocturne_orders', JSON.stringify(orders));

  const res = [
    { id: 'RES-1001', name: 'Isabella Whitmore', email: 'isabella@example.com', phone: '(312) 555-0111', guests: '2', date: '2026-08-08', time: '19:30', occasion: 'Anniversary', notes: '', status: 'confirmed', created: new Date().toISOString() },
    { id: 'RES-1002', name: 'Marcus Bennett', email: 'marcus@example.com', phone: '(312) 555-0222', guests: '4', date: '2026-08-10', time: '20:00', occasion: 'Business', notes: '', status: 'pending', created: new Date().toISOString() },
    { id: 'RES-1003', name: 'Victoria Laurent', email: 'victoria@example.com', phone: '(312) 555-0333', guests: '6+', date: '2026-08-12', time: '18:30', occasion: 'Private Event', notes: '', status: 'pending', created: new Date().toISOString() }
  ];
  localStorage.setItem('nocturne_reservations', JSON.stringify(res));

  const msgs = [
    { id: 'MSG-1001', name: 'Priya Raghavan', email: 'priya@example.com', subject: 'Chef\u2019s table for four', message: 'Do you open the chef\u2019s table on Fridays? We\u2019d love to celebrate.', created: new Date().toISOString() },
    { id: 'MSG-1002', name: 'Jonathan Clarke', email: 'jon@example.com', subject: 'Dietary question', message: 'Could the tasting menu be made nut-free for an allergy?', created: new Date(Date.now() - 86400000).toISOString() }
  ];
  localStorage.setItem('nocturne_messages', JSON.stringify(msgs));
}

/* ====================================================
   GALLERY (filterable + lightbox)
==================================================== */
function initGallery() {
  const grid = document.getElementById('galleryGrid');
  if (!grid) return;
  const buttons = document.querySelectorAll('.gallery-filter button');
  function render(cat) {
    const items = grid.querySelectorAll('.g-item');
    items.forEach(it => {
      it.style.display = (cat === 'all' || it.dataset.category === cat) ? '' : 'none';
    });
  }
  buttons.forEach(btn => btn.addEventListener('click', () => {
    buttons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    render(btn.dataset.filter);
  }));
  grid.addEventListener('click', function (e) {
    const item = e.target.closest('.g-item');
    if (!item) return;
    e.preventDefault();
    const img = item.querySelector('img');
    openLightbox(img.src, img.alt, item.dataset.caption || '');
  });
}

function openLightbox(src, alt, caption) {
  let lb = document.getElementById('lightbox');
  if (!lb) {
    lb = document.createElement('div');
    lb.id = 'lightbox';
    lb.style.cssText = 'position:fixed;inset:0;z-index:5000;background:rgba(7,11,24,.96);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;opacity:0;visibility:hidden;transition:all .4s var(--ease);';
    lb.innerHTML = `<button style="position:absolute;top:24px;right:30px;background:none;border:none;color:var(--violet-soft);font-size:2rem;cursor:pointer;"><i class="fas fa-times"></i></button>
      <img style="max-width:88vw;max-height:72vh;object-fit:contain;border:1px solid var(--line-strong);box-shadow:0 30px 80px rgba(0,0,0,.6);border-radius:14px;"/>
      <p style="color:var(--silver);letter-spacing:.2em;text-transform:uppercase;font-size:.75rem;margin:0;font-family:var(--serif);"></p>`;
    document.body.appendChild(lb);
    lb.querySelector('button').addEventListener('click', () => { lb.style.opacity = '0'; lb.style.visibility = 'hidden'; });
    lb.addEventListener('click', e => { if (e.target === lb) { lb.style.opacity = '0'; lb.style.visibility = 'hidden'; } });
  }
  lb.querySelector('img').src = src;
  lb.querySelector('img').alt = alt;
  lb.querySelector('p').textContent = caption || alt || '';
  lb.style.opacity = '1';
  lb.style.visibility = 'visible';
}

/* ====================================================
   INIT
==================================================== */
document.addEventListener('DOMContentLoaded', function () {
  updateCartCount();
  renderCartPage();
  initCheckout();
  initReservation();
  initContact();
  initOrderPage();
  initMenuPage();
  initGallery();
  initAdmin();
});
