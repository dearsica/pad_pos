// ====================================
// stock.js — Receive stock
// ====================================
(function () {
  'use strict';

  function renderTab() {
    document.getElementById('tab-stock').innerHTML = `
      <div class="bg-white rounded-lg p-4 shadow max-w-2xl">
        <h2 class="text-lg font-bold mb-4">📥 รับสินค้าเข้าสต๊อก</h2>
        <div class="space-y-3">
          <div>
            <label class="text-sm">บาร์โค้ดสินค้า</label>
            <div class="flex gap-2">
              <input id="stockBarcode" placeholder="ยิงบาร์โค้ดหรือพิมพ์" class="flex-1 border-2 border-blue-500 rounded px-3 py-2">
              <button onclick="openScanner('stock')" class="px-4 py-2 bg-blue-600 text-white rounded">📷 กล้อง</button>
            </div>
            <div class="flex gap-3 mt-2 items-start">
              <div id="stockProductImage" class="w-20 h-20 border rounded bg-slate-50 flex items-center justify-center text-xs text-slate-400 overflow-hidden flex-shrink-0 hidden"></div>
              <div id="stockProductInfo" class="text-sm text-slate-600 flex-1"></div>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div><label class="text-sm">จำนวนที่รับ</label><input id="stockQty" type="number" min="1" class="w-full border rounded px-3 py-2"></div>
            <div><label class="text-sm">ราคาทุน/หน่วย (อัปเดต)</label><input id="stockCost" type="number" min="0" step="0.01" class="w-full border rounded px-3 py-2"></div>
          </div>
          <div><label class="text-sm">อ้างอิง (เลขใบส่งของ)</label><input id="stockRef" class="w-full border rounded px-3 py-2"></div>
          <div><label class="text-sm">หมายเหตุ</label><input id="stockNote" class="w-full border rounded px-3 py-2"></div>
          <button onclick="POS.stock.submit()" class="w-full bg-green-600 text-white py-3 rounded font-bold">
            บันทึกรับสินค้า
          </button>
        </div>
      </div>
    `;

    document.getElementById('stockBarcode').addEventListener('change', lookup);
  }

  function lookup() {
    const code = document.getElementById('stockBarcode').value.trim();
    const info = document.getElementById('stockProductInfo');
    const imgBox = document.getElementById('stockProductImage');

    if (!code) {
      info.textContent = '';
      imgBox.classList.add('hidden');
      return;
    }

    const product = POS.products.findByBarcode(code);
    if (!product) {
      info.textContent = '✗ ไม่พบสินค้า';
      info.className = 'text-sm text-red-600 flex-1';
      imgBox.classList.add('hidden');
      return;
    }

    info.innerHTML = `<div class="font-medium text-green-700">✓ ${escapeHtml(product.name)}</div>
      <div class="text-xs text-slate-600">ทุนปัจจุบัน ฿${POS.vat.formatMoney(product.cost_price)} · คงเหลือ ${product.stock}</div>`;
    info.className = 'text-sm flex-1';

    if (product.image) {
      imgBox.innerHTML = `<img src="${product.image}" class="w-full h-full object-cover cursor-pointer" data-image-preview="${escapeAttr(product.image)}">`;
      imgBox.classList.remove('hidden');
    } else {
      imgBox.classList.add('hidden');
    }

    document.getElementById('stockCost').value = product.cost_price;
  }

  async function submit() {
    const payload = {
      barcode: document.getElementById('stockBarcode').value.trim(),
      qty: Number(document.getElementById('stockQty').value) || 0,
      unit_cost: Number(document.getElementById('stockCost').value) || 0,
      reference: document.getElementById('stockRef').value.trim(),
      note: document.getElementById('stockNote').value.trim()
    };

    if (!payload.barcode || payload.qty <= 0) {
      showToast('กรอกบาร์โค้ดและจำนวน', 'error');
      return;
    }

    try {
      const result = await callApi('receiveStock', { body: payload });
      showToast('รับเข้าสต๊อกแล้ว · คงเหลือ ' + result.new_stock);
      ['stockBarcode','stockQty','stockCost','stockRef','stockNote'].forEach(id => document.getElementById(id).value = '');
      document.getElementById('stockProductInfo').textContent = '';
      document.getElementById('stockProductImage').classList.add('hidden');
      await POS.products.loadAll();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  POS.scanner.registerHandler('stock', (code) => {
    POS.feedback.playScanSuccess();
    document.getElementById('stockBarcode').value = code;
    lookup();
    showToast('สแกนแล้ว: ' + code);
  });

  window.POS = window.POS || {};
  window.POS.stock = { renderTab, submit };
})();
