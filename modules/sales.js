// ====================================
// sales.js — Sales history viewer
// ====================================
(function () {
  'use strict';

  const fmt = POS.vat.formatMoney;

  function renderTab() {
    document.getElementById('tab-sales').innerHTML = `
      <div class="bg-white rounded-lg p-4 shadow">
        <div class="flex flex-wrap gap-2 mb-4 items-end">
          <div><label class="text-xs">จาก</label><input id="salesFrom" type="date" class="border rounded px-2 py-1 text-sm"></div>
          <div><label class="text-xs">ถึง</label><input id="salesTo" type="date" class="border rounded px-2 py-1 text-sm"></div>
          <button onclick="POS.sales.load()" class="bg-blue-600 text-white px-4 py-1 rounded text-sm">โหลด</button>
          <span id="salesSummary" class="ml-auto text-sm font-medium"></span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-slate-100">
              <tr>
                <th class="text-left p-2">เลขที่บิล</th>
                <th class="text-left p-2">วันเวลา</th>
                <th class="text-right p-2">ยอดสุทธิ</th>
                <th class="text-right p-2">กำไร</th>
                <th class="text-left p-2">วิธีจ่าย</th>
                <th class="w-24"></th>
              </tr>
            </thead>
            <tbody id="salesTable"></tbody>
          </table>
        </div>
      </div>
    `;
    load();
  }

  async function load() {
    const from = document.getElementById('salesFrom').value;
    const to = document.getElementById('salesTo').value;
    const params = {};
    if (from) params.from = from;
    if (to) params.to = to + 'T23:59:59';

    try {
      const sales = await callApi('getSales', { params });
      const tbody = document.getElementById('salesTable');
      tbody.innerHTML = sales.map(s => `
        <tr class="border-b">
          <td class="p-2 text-xs">${escapeHtml(s.sale_id)}</td>
          <td class="p-2 text-xs">${new Date(s.datetime).toLocaleString('th-TH')}</td>
          <td class="p-2 text-right font-medium">${fmt(s.total)}</td>
          <td class="p-2 text-right text-green-600">${fmt(s.profit)}</td>
          <td class="p-2 text-xs">${escapeHtml(s.payment_method)}</td>
          <td class="p-2 text-center">
            <button data-view-sale="${escapeHtml(s.sale_id)}" class="text-blue-600 text-sm">ดู</button>
          </td>
        </tr>
      `).join('') || '<tr><td colspan="6" class="text-center p-4 text-slate-400">ไม่มีข้อมูล</td></tr>';

      tbody.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-view-sale]');
        if (btn) viewDetail(btn.dataset.viewSale);
      });

      const totalRevenue = sales.reduce((s, x) => s + Number(x.total), 0);
      const totalProfit = sales.reduce((s, x) => s + Number(x.profit), 0);
      document.getElementById('salesSummary').textContent =
        `${sales.length} บิล · ยอด ฿${fmt(totalRevenue)} · กำไร ฿${fmt(totalProfit)}`;
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function viewDetail(saleId) {
    try {
      const detail = await callApi('getSaleDetail', { params: { saleId } });
      POS.receipts.show(
        { sale_id: detail.sale.sale_id, total: Number(detail.sale.total), member_points_earned: 0 },
        detail.items.map(i => ({
          name: i.name, barcode: i.barcode, qty: Number(i.qty),
          unit_price: Number(i.unit_price), unit_cost: Number(i.unit_cost)
        })),
        { payment_method: detail.sale.payment_method, discount: Number(detail.sale.discount) }
      );
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  window.POS = window.POS || {};
  window.POS.sales = { renderTab, load };
})();
