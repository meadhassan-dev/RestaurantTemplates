function getCart() {
  return JSON.parse(localStorage.getItem('restaurant_cart') || '[]');
}

function saveCart(cart) {
  localStorage.setItem('restaurant_cart', JSON.stringify(cart));
  updateCartCount();
}

function addToCart(name, price, image) {
  let cart = getCart();
  let existing = cart.find(item => item.name === name);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ name, price, image, qty: 1 });
  }
  saveCart(cart);
  let btns = document.querySelectorAll('.btn-add-cart');
  btns.forEach(btn => {
    if (btn.getAttribute('onclick').includes(name)) {
      btn.classList.add('added');
      btn.innerHTML = '<i class="fas fa-check"></i> Added';
      setTimeout(() => {
        btn.classList.remove('added');
        btn.innerHTML = '<i class="fas fa-plus"></i> Add';
      }, 1200);
    }
  });
}

function removeFromCart(name) {
  let cart = getCart().filter(item => item.name !== name);
  saveCart(cart);
  renderCartPage();
}

function updateQty(name, change) {
  let cart = getCart();
  let item = cart.find(i => i.name === name);
  if (item) {
    item.qty += change;
    if (item.qty <= 0) {
      cart = cart.filter(i => i.name !== name);
    }
  }
  saveCart(cart);
  renderCartPage();
}

function clearCart() {
  localStorage.removeItem('restaurant_cart');
  updateCartCount();
}

function updateCartCount() {
  let cart = getCart();
  let count = cart.reduce((sum, item) => sum + item.qty, 0);
  document.querySelectorAll('#cartCount').forEach(el => el.textContent = count);
  let floating = document.getElementById('floatingCart');
  let floatingCount = document.getElementById('floatingCount');
  if (floating) {
    if (count > 0) {
      floating.style.display = 'block';
      if (floatingCount) floatingCount.textContent = count;
    } else {
      floating.style.display = 'none';
    }
  }
}

function renderCartPage() {
  let container = document.getElementById('cartItems');
  let emptyState = document.getElementById('emptyCart');
  if (!container) return;
  let cart = getCart();
  if (cart.length === 0) {
    container.innerHTML = '';
    if (emptyState) emptyState.style.display = 'block';
    return;
  }
  if (emptyState) emptyState.style.display = 'none';
  let html = '';
  cart.forEach(item => {
    html += `
      <div class="cart-item">
        <img src="${item.image}" alt="${item.name}">
        <div class="cart-item-info">
          <h6>${item.name}</h6>
          <p>$${item.price} each</p>
        </div>
        <div class="cart-item-price">$${(item.price * item.qty).toFixed(2)}</div>
        <div class="cart-qty-controls">
          <button onclick="updateQty('${item.name}', -1)">-</button>
          <span>${item.qty}</span>
          <button onclick="updateQty('${item.name}', 1)">+</button>
        </div>
        <button class="cart-item-remove" onclick="removeFromCart('${item.name}')">
          <i class="fas fa-trash-alt"></i>
        </button>
      </div>
    `;
  });
  container.innerHTML = html;
  let subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  let delivery = 3.99;
  let tax = subtotal * 0.08;
  let total = subtotal + delivery + tax;
  document.getElementById('subtotal').textContent = '$' + subtotal.toFixed(2);
  document.getElementById('taxAmount').textContent = '$' + tax.toFixed(2);
  document.getElementById('totalAmount').textContent = '$' + total.toFixed(2);
}

function initFilters() {
  let filterBtns = document.querySelectorAll('.filter-btn');
  if (filterBtns.length === 0) return;
  filterBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      filterBtns.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      let category = this.getAttribute('data-category');
      let items = document.querySelectorAll('.menu-item');
      items.forEach(item => {
        if (category === 'all' || item.getAttribute('data-category') === category) {
          item.style.display = '';
        } else {
          item.style.display = 'none';
        }
      });
    });
  });
}

function initCheckout() {
  let form = document.getElementById('checkoutForm');
  if (!form) return;
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    let cart = getCart();
    if (cart.length === 0) return;
    let orders = JSON.parse(localStorage.getItem('restaurant_orders') || '[]');
    let subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    let total = subtotal + 3.99 + (subtotal * 0.08);
    let order = {
      id: 'ORD-' + Math.floor(1000 + Math.random() * 9000),
      items: cart.map(i => ({ name: i.name, price: i.price, qty: i.qty })),
      total: total,
      status: 'pending',
      payment: document.getElementById('paymentMethod').value,
      customer: form.querySelectorAll('input')[0].value,
      phone: form.querySelectorAll('input')[1].value,
      address: form.querySelector('textarea').value,
      time: new Date().toISOString()
    };
    orders.push(order);
    localStorage.setItem('restaurant_orders', JSON.stringify(orders));
    document.getElementById('orderNumber').textContent = order.id;
    let modal = new bootstrap.Modal(document.getElementById('orderSuccessModal'));
    modal.show();
    clearCart();
    renderCartPage();
  });
}

function getOrders() {
  return JSON.parse(localStorage.getItem('restaurant_orders') || '[]');
}

function isAdminPage() {
  return document.getElementById('tab-overview') !== null;
}

function initAdmin() {
  if (!isAdminPage()) return;
  renderOverview();
  renderOrdersTable();
  renderSalesReport();
  renderMenuManagement();
  initSidebar();
  initOrderFilter();
  renderCharts();
}

function renderOverview() {
  let orders = getOrders();
  let today = new Date().toDateString();
  let todayOrders = orders.filter(o => new Date(o.time).toDateString() === today);
  let todaySales = todayOrders.reduce((sum, o) => sum + o.total, 0);
  let weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0,0,0,0);
  let weekOrders = orders.filter(o => new Date(o.time) >= weekStart);
  let weekSales = weekOrders.reduce((sum, o) => sum + o.total, 0);
  let totalSales = orders.reduce((sum, o) => sum + o.total, 0);
  document.getElementById('todayOrders').textContent = todayOrders.length;
  document.getElementById('todaySales').textContent = '$' + todaySales.toFixed(0);
  document.getElementById('weekSales').textContent = '$' + weekSales.toFixed(0);
  document.getElementById('totalSales').textContent = '$' + totalSales.toFixed(0);
  let tbody = document.getElementById('recentOrdersTable');
  if (tbody) {
    let recent = orders.slice(-5).reverse();
    tbody.innerHTML = recent.map(o => `
      <tr>
        <td><strong>${o.id}</strong></td>
        <td>${o.customer}</td>
        <td>${o.items.map(i => i.name + ' x' + i.qty).join(', ')}</td>
        <td><strong>$${o.total.toFixed(2)}</strong></td>
        <td><span class="badge-status badge-${o.status}">${capitalize(o.status)}</span></td>
        <td>${formatTime(o.time)}</td>
      </tr>
    `).join('');
  }
  let itemCounts = {};
  orders.forEach(o => {
    o.items.forEach(i => {
      itemCounts[i.name] = (itemCounts[i.name] || 0) + i.qty;
    });
  });
  let sorted = Object.entries(itemCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  let popEl = document.getElementById('popularItems');
  if (popEl) {
    popEl.innerHTML = sorted.map(([name, count]) => `
      <div class="popular-item">
        <span class="popular-item-name">${name}</span>
        <span class="popular-item-count">${count} ordered</span>
      </div>
    `).join('') || '<p class="text-muted small">No orders yet</p>';
  }
}

function renderOrdersTable() {
  let tbody = document.getElementById('allOrdersTable');
  if (!tbody) return;
  let orders = getOrders().reverse();
  let filter = document.getElementById('orderFilter');
  let selected = filter ? filter.value : 'all';
  if (selected !== 'all') {
    orders = orders.filter(o => o.status === selected);
  }
  tbody.innerHTML = orders.map(o => `
    <tr>
      <td><strong>${o.id}</strong></td>
      <td>${o.customer}</td>
      <td>${o.phone}</td>
      <td>${o.items.map(i => i.name + ' x' + i.qty).join(', ')}</td>
      <td><strong>$${o.total.toFixed(2)}</strong></td>
      <td>${capitalize(o.payment)}</td>
      <td><span class="badge-status badge-${o.status}">${capitalize(o.status)}</span></td>
      <td>${formatTime(o.time)}</td>
      <td>
        <select class="form-select form-select-sm" style="width: auto;" onchange="updateOrderStatus('${o.id}', this.value)">
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
  let orders = getOrders();
  let order = orders.find(o => o.id === orderId);
  if (order) {
    order.status = newStatus;
    localStorage.setItem('restaurant_orders', JSON.stringify(orders));
    renderOverview();
    renderSalesReport();
  }
}

function renderSalesReport() {
  let orders = getOrders();
  let today = new Date().toDateString();
  let todayOrders = orders.filter(o => new Date(o.time).toDateString() === today);
  let weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0,0,0,0);
  let weekOrders = orders.filter(o => new Date(o.time) >= weekStart);
  let el;
  el = document.getElementById('reportTodaySales');
  if (el) el.textContent = '$' + todayOrders.reduce((s, o) => s + o.total, 0).toFixed(2);
  el = document.getElementById('reportTodayOrders');
  if (el) el.textContent = todayOrders.length + ' orders';
  el = document.getElementById('reportWeekSales');
  if (el) el.textContent = '$' + weekOrders.reduce((s, o) => s + o.total, 0).toFixed(2);
  el = document.getElementById('reportWeekOrders');
  if (el) el.textContent = weekOrders.length + ' orders';
  el = document.getElementById('reportTotalSales');
  if (el) el.textContent = '$' + orders.reduce((s, o) => s + o.total, 0).toFixed(2);
  el = document.getElementById('reportTotalOrders');
  if (el) el.textContent = orders.length + ' orders';
}

function renderMenuManagement() {
  let tbody = document.getElementById('menuItemsTable');
  if (!tbody) return;
  let orders = getOrders();
  let itemStats = {};
  orders.forEach(o => {
    o.items.forEach(i => {
      if (!itemStats[i.name]) {
        itemStats[i.name] = { name: i.name, price: i.price, count: 0 };
      }
      itemStats[i.name].count += i.qty;
      itemStats[i.name].price = i.price;
    });
  });
  let items = Object.values(itemStats).sort((a, b) => b.count - a.count);
  tbody.innerHTML = items.map(i => `
    <tr>
      <td><i class="fas fa-utensils text-muted"></i></td>
      <td><strong>${i.name}</strong></td>
      <td>—</td>
      <td>$${i.price}</td>
      <td><span class="badge bg-light text-dark">${i.count}</span></td>
    </tr>
  `).join('') || '<tr><td colspan="5" class="text-center text-muted py-4">No menu data yet</td></tr>';
}

function renderCharts() {
  if (!isAdminPage()) return;
  let orders = getOrders();
  let weekLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  let weekData = new Array(7).fill(0);
  let today = new Date();
  orders.forEach(o => {
    let d = new Date(o.time);
    if ((today - d) < 7 * 86400000) {
      weekData[d.getDay()] += o.total;
    }
  });
  let salesCtx = document.getElementById('salesChart');
  if (salesCtx) {
    new Chart(salesCtx, {
      type: 'bar',
      data: {
        labels: weekLabels,
        datasets: [{
          label: 'Sales ($)',
          data: weekData,
          backgroundColor: '#E53935',
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { callback: v => '$' + v } } }
      }
    });
  }
  let dayLabels = [];
  let dayData = [];
  for (let i = 6; i >= 0; i--) {
    let d = new Date();
    d.setDate(d.getDate() - i);
    dayLabels.push(d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));
    let dayTotal = orders
      .filter(o => new Date(o.time).toDateString() === d.toDateString())
      .reduce((s, o) => s + o.total, 0);
    dayData.push(dayTotal);
  }
  let dailyCtx = document.getElementById('dailySalesChart');
  if (dailyCtx) {
    new Chart(dailyCtx, {
      type: 'line',
      data: {
        labels: dayLabels,
        datasets: [{
          label: 'Sales ($)',
          data: dayData,
          borderColor: '#FFD700',
          backgroundColor: '#FFD70022',
          fill: true,
          tension: 0.4,
          pointRadius: 5,
          pointBackgroundColor: '#E53935'
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { callback: v => '$' + v } } }
      }
    });
  }
}

function initSidebar() {
  let links = document.querySelectorAll('.sidebar-link');
  links.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      let tab = this.getAttribute('data-tab');
      links.forEach(l => l.classList.remove('active'));
      this.classList.add('active');
      document.querySelectorAll('.admin-tab').forEach(t => t.style.display = 'none');
      document.getElementById('tab-' + tab).style.display = 'block';
    });
  });
}

function initOrderFilter() {
  let filter = document.getElementById('orderFilter');
  if (!filter) return;
  filter.addEventListener('change', function() {
    renderOrdersTable();
  });
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatTime(isoString) {
  let d = new Date(isoString);
  let now = new Date();
  let diff = now - d;
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
  if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function seedDemoData() {
  if (localStorage.getItem('restaurant_orders')) return;
  let demoOrders = [];
  let names = ['John Smith', 'Maria Garcia', 'David Chen', 'Sarah Johnson', 'Mike Wilson'];
  let menuItems = [
    { name: 'Margherita', price: 14 },
    { name: 'Pepperoni', price: 16 },
    { name: 'Four Cheese', price: 17 },
    { name: 'Veggie Supreme', price: 16 },
    { name: 'Meat Lovers', price: 18 },
    { name: 'Garlic Knots', price: 6 },
    { name: 'Wings', price: 12 },
    { name: 'Tiramisu', price: 9 }
  ];
  for (let i = 0; i < 15; i++) {
    let daysAgo = Math.floor(Math.random() * 7);
    let d = new Date();
    d.setDate(d.getDate() - daysAgo);
    d.setHours(10 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60));
    let itemCount = 1 + Math.floor(Math.random() * 3);
    let items = [];
    let used = {};
    for (let j = 0; j < itemCount; j++) {
      let idx = Math.floor(Math.random() * menuItems.length);
      while (used[idx]) idx = Math.floor(Math.random() * menuItems.length);
      used[idx] = true;
      items.push({ ...menuItems[idx], qty: 1 + Math.floor(Math.random() * 2) });
    }
    let subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);
    let total = subtotal + 3.99 + subtotal * 0.08;
    let statuses = ['pending', 'preparing', 'delivered', 'delivered', 'delivered'];
    demoOrders.push({
      id: 'ORD-' + (1000 + i),
      items: items,
      total: total,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      payment: Math.random() > 0.5 ? 'cash' : 'card',
      customer: names[Math.floor(Math.random() * names.length)],
      phone: '(212) 555-' + Math.floor(1000 + Math.random() * 9000),
      address: Math.floor(100 + Math.random() * 900) + ' Main St',
      time: d.toISOString()
    });
  }
  localStorage.setItem('restaurant_orders', JSON.stringify(demoOrders));
}

document.addEventListener('DOMContentLoaded', function() {
  updateCartCount();
  renderCartPage();
  initFilters();
  initCheckout();
  seedDemoData();
  initAdmin();
});
