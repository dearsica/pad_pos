// ====================================
// app.js — Boot & tab navigation
// ====================================
(function () {
  'use strict';

  window.APP_VERSION = '2.1.2';
  window.APP_BUILD_DATE = '2026-05-19';

  // ====== Tab routing ======
  const tabRenderers = {
    pos: () => POS.pos.renderTab(),
    products: () => POS.products.renderTab(),
    stock: () => POS.stock.renderTab(),
    sales: () => POS.sales.renderTab(),
    members: () => POS.members.renderTab(),
    dashboard: () => POS.dashboard.renderTab(),
    settings: () => POS.settings.render()
  };

  function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(b => {
      b.classList.toggle('tab-active', b.dataset.tab === tabName);
    });
    document.querySelectorAll('.tab-content').forEach(c => {
      c.classList.toggle('hidden', c.id !== 'tab-' + tabName);
    });
    const renderer = tabRenderers[tabName];
    if (renderer) renderer();
  }

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // ====== Setup modal ======
  function openSetup() {
    document.getElementById('apiUrlInput').value = POS.api.getApiUrl();
    document.getElementById('setupModal').classList.remove('hidden');
  }
  window.openSetup = openSetup;

  async function saveApiUrl() {
    const url = document.getElementById('apiUrlInput').value.trim();
    if (!url) return;
    POS.api.setApiUrl(url);
    const status = document.getElementById('setupStatus');
    status.textContent = 'กำลังทดสอบ...';
    try {
      await callApi('init');
      status.textContent = '✓ เชื่อมต่อสำเร็จ';
      status.className = 'text-sm mt-3 text-green-600';
      setTimeout(() => {
        document.getElementById('setupModal').classList.add('hidden');
        initialLoad();
      }, 800);
    } catch (err) {
      status.textContent = '✗ ' + err.message;
      status.className = 'text-sm mt-3 text-red-600';
    }
  }
  window.saveApiUrl = saveApiUrl;

  async function initialLoad() {
    setApiStatus('connecting');
    try {
      await POS.products.loadAll();
      setApiStatus('connected');
      POS.pos.renderTab();
    } catch (err) {
      setApiStatus('error');
      showToast(err.message, 'error');
    }
  }

  function setApiStatus(state) {
    const el = document.getElementById('apiStatus');
    const states = {
      connecting: { text: '🔄 กำลังเชื่อมต่อ...', cls: 'bg-yellow-100 text-yellow-800' },
      connected:  { text: '● ออนไลน์', cls: 'bg-green-100 text-green-800' },
      error:      { text: '● ผิดพลาด', cls: 'bg-red-100 text-red-800' },
      offline:    { text: 'ไม่ได้เชื่อมต่อ', cls: 'bg-slate-200 text-slate-600' }
    };
    const s = states[state] || states.offline;
    el.textContent = s.text;
    el.className = 'text-xs px-2 py-1 rounded ' + s.cls;
  }

  // ====== Version UI ======
  function applyVersionToUI() {
    document.getElementById('appVersionBadge').textContent = 'v' + window.APP_VERSION;
  }
  window.forceRefresh = function () {
    const url = new URL(window.location.href);
    url.searchParams.set('_t', Date.now());
    window.location.replace(url.toString());
  };

  // ====== Boot ======
  applyVersionToUI();
  POS.settings.applyShopNameToHeader(POS.settings.getSettings().shopName);

  if (POS.api.getApiUrl()) {
    initialLoad();
  } else {
    openSetup();
  }
})();
