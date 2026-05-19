// ====================================
// dashboard.js — Sales analytics dashboard
// ====================================
(function () {
  'use strict';

  const fmt = POS.vat.formatMoney;

  function renderTab() {
    document.getElementById('tab-dashboard').innerHTML = `
      <div class="flex flex-wrap gap-2 mb-4 items-end">
        <div><label class="text-xs">จาก</label><input id="dashFrom" type="date" class="border rounded px-2 py-1 text-sm"></div>
        <div><label class="text-xs">ถึง</label><input id="dashTo" type="date" class="border rounded px-2 py-1 text-sm"></div>
        <button onclick="POS.dashboard.load()" class="bg-blue-600 text-white px-4 py-1 rounded text-sm">โหลด</button>
      </div>

      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div class="bg-white rounded-lg p-4 shadow"><div class="text-xs text-slate-500">ยอดขายรวม</div><div id="dashRevenue" class="text-2xl font-bold text-blue-600">0</div></div>
        <div class="bg-white rounded-lg p-4 shadow"><div class="text-xs text-slate-500">กำไรรวม</div><div id="dashProfit" class="text-2xl font-bold text-green-600">0</div></div>
        <div class="bg-white rounded-lg p-4 shadow"><div class="text-xs text-slate-500">% กำไร</div><div id="dashMargin" class="text-2xl font-bold">0%</div></div>
        <div class="bg-white rounded-lg p-4 shadow"><div class="text-xs text-slate-500">บิล</div><div id="dashCount" class="text-2xl font-bold">0</div></div>
        <div class="bg-white rounded-lg p-4 shadow"><div class="text-xs text-slate-500">มูลค่าสต๊อก (ทุน)</div><div id="dashStockValue" class="text-2xl font-bold text-purple-600">0</div></div>
        <div class="bg-white rounded-lg p-4 shadow"><div class="text-xs text-slate-500">SKU ทั้งหมด</div><div id="dashSku" class="text-2xl font-bold">0</div></div>
        <div class="bg-white rounded-lg p-4 shadow col-span-2"><div class="text-xs text-slate-500">สินค้าใกล้หมด</div><div id="dashLowStock" class="text-2xl font-bold text-red-600">0 รายการ</div></div>
      </div>

      <div class="grid lg:grid-cols-2 gap-4">
        <div class="bg-white rounded-lg p-4 shadow">
          <h3 class="font-bold mb-2">🏆 สินค้าขายดี</h3>
          <table class="w-full text-sm">
            <thead><tr class="text-left text-xs text-slate-500"><th>สินค้า</th><th class="text-right">ขายได้</th><th class="text-right">กำไร</th></tr></thead>
            <tbody id="dashTopProducts"></tbody>
          </table>
        </div>
        <div class="bg-white rounded-lg p-4 shadow">
          <h3 class="font-bold mb-2">⚠️ สินค้าใกล้หมด</h3>
          <table class="w-full text-sm">
            <thead><tr class="text-left text-xs text-slate-500"><th>สินค้า</th><th class="text-right">คงเหลือ</th><th class="text-right">ขั้นต่ำ</th></tr></thead>
            <tbody id="dashLowStockList"></tbody>
          </table>
        </div>
      </div>
    `;
    load();
  }

  async function load() {
    const from = document.getElementById('dashFrom').value;
    const to = document.getElementById('dashTo').value;
    const params = {};
    if (from) params.from = from;
    if (to) params.to = to + 'T23:59:59';

    try {
      const d = await callApi('getDashboard', { params });
      document.getElementById('dashRevenue').textContent = '฿' + fmt(d.total_revenue);
      document.getElementById('dashProfit').textContent = '฿' + fmt(d.total_profit);
      document.getElementById('dashMargin').textContent = Number(d.profit_margin).toFixed(1) + '%';
      document.getElementById('dashCount').textContent = d.sales_count;
      document.getElementById('dashStockValue').textContent = '฿' + fmt(d.stock_value);
      document.getElementById('dashSku').textContent = d.products_count;
      document.getElementById('dashLowStock').textContent = d.low_stock_count + ' รายการ';

      document.getElementById('dashTopProducts').innerHTML = d.top_products.map(p => `
        <tr class="border-b"><td class="p-1">${escapeHtml(p.name)}</td><td class="text-right p-1">${p.qty_sold}</td><td class="text-right p-1 text-green-600">${fmt(p.profit)}</td></tr>
      `).join('') || '<tr><td colspan="3" class="text-center text-slate-400 p-2">ไม่มีข้อมูล</td></tr>';

      document.getElementById('dashLowStockList').innerHTML = d.low_stock_items.map(p => `
        <tr class="border-b"><td class="p-1">${escapeHtml(p.name)}</td><td class="text-right p-1 text-red-600">${p.stock}</td><td class="text-right p-1">${p.min_stock}</td></tr>
      `).join('') || '<tr><td colspan="3" class="text-center text-slate-400 p-2">ไม่มีสินค้าใกล้หมด</td></tr>';
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  window.POS = window.POS || {};
  window.POS.dashboard = { renderTab, load };
})();
