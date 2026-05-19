// ====================================
// products.js — Product management
// ====================================
(function () {
  'use strict';

  let cache = [];
  const fmt = POS.vat.formatMoney;

  async function loadAll() {
    cache = await callApi('getProducts');
    return cache;
  }

  function getCache() { return cache; }

  function findByBarcode(barcode) {
    return cache.find(p => String(p.barcode) === String(barcode));
  }

  function search(query) {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    return cache.filter(p =>
      String(p.barcode).toLowerCase().includes(q) ||
      String(p.name).toLowerCase().includes(q)
    ).slice(0, 10);
  }

  // ====== Tab UI ======
  function renderTab() {
    document.getElementById('tab-products').innerHTML = `
      <div class="bg-white rounded-lg p-4 shadow">
        <div class="flex flex-wrap items-center gap-2 mb-4">
          <h2 class="text-lg font-bold mr-auto">จัดการสินค้า</h2>
          <input id="productSearch" placeholder="ค้นหา..." class="border rounded px-3 py-2 text-sm">
          <button onclick="POS.products.openForm()" class="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">
            + เพิ่มสินค้า
          </button>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-slate-100">
              <tr>
                <th class="w-16 p-2">รูป</th>
                <th class="text-left p-2">บาร์โค้ด</th>
                <th class="text-left p-2">ชื่อสินค้า</th>
                <th class="text-left p-2">หมวด</th>
                <th class="text-right p-2">ทุน</th>
                <th class="text-right p-2">ขาย</th>
                <th class="text-right p-2">คงเหลือ</th>
                <th class="text-center p-2">หน่วย</th>
                <th class="w-32"></th>
              </tr>
            </thead>
            <tbody id="productsTable"></tbody>
          </table>
        </div>
      </div>
    `;

    document.getElementById('productSearch').addEventListener('input', renderTable);
    renderTable();
  }

  function renderTable() {
    const searchEl = document.getElementById('productSearch');
    const q = searchEl ? searchEl.value.toLowerCase().trim() : '';
    const filtered = q
      ? cache.filter(p =>
          String(p.barcode).toLowerCase().includes(q) ||
          String(p.name).toLowerCase().includes(q) ||
          String(p.category).toLowerCase().includes(q))
      : cache;

    const tbody = document.getElementById('productsTable');
    if (!tbody) return;

    tbody.innerHTML = filtered.map(p => {
      const isLow = Number(p.min_stock) > 0 && Number(p.stock) <= Number(p.min_stock);
      return `
      <tr class="border-b ${isLow ? 'bg-red-50' : ''}" data-product-row="${escapeHtml(p.barcode)}">
        <td class="p-2">${renderThumbnail(p.image, 'w-12 h-12')}</td>
        <td class="p-2 text-xs">${escapeHtml(p.barcode)}</td>
        <td class="p-2">${escapeHtml(p.name)}</td>
        <td class="p-2 text-xs">${escapeHtml(p.category || '')}</td>
        <td class="p-2 text-right">${fmt(p.cost_price)}</td>
        <td class="p-2 text-right font-medium">${fmt(p.sell_price)}</td>
        <td class="p-2 text-right ${isLow ? 'text-red-600 font-bold' : ''}">${p.stock}</td>
        <td class="p-2 text-center text-xs">${escapeHtml(p.unit)}</td>
        <td class="p-2 text-center">
          <button data-edit-product="${escapeHtml(p.barcode)}" class="text-blue-600 text-sm">แก้ไข</button>
          <button data-delete-product="${escapeHtml(p.barcode)}" class="text-red-600 text-sm ml-2">ลบ</button>
        </td>
      </tr>`;
    }).join('') || '<tr><td colspan="9" class="text-center p-4 text-slate-400">ยังไม่มีสินค้า</td></tr>';

    // Delegated events
    tbody.addEventListener('click', handleTableClick);
  }

  function handleTableClick(e) {
    const editBtn = e.target.closest('[data-edit-product]');
    if (editBtn) {
      const product = findByBarcode(editBtn.dataset.editProduct);
      if (product) openForm(product);
      return;
    }
    const deleteBtn = e.target.closest('[data-delete-product]');
    if (deleteBtn) {
      deleteHandler(deleteBtn.dataset.deleteProduct);
    }
  }

  // ====== Form Modal ======
  function ensureFormModal() {
    if (document.getElementById('productFormModal')) return;
    document.getElementById('modalRoot').insertAdjacentHTML('beforeend', `
      <div id="productFormModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 hidden">
        <div class="bg-white rounded-lg p-6 max-w-lg w-11/12 max-h-[90vh] overflow-y-auto">
          <h3 class="text-lg font-bold mb-3" id="productFormTitle">เพิ่มสินค้า</h3>
          <div class="space-y-2">
            <div>
              <label class="text-sm">บาร์โค้ด *</label>
              <div class="flex gap-2">
                <input id="pfBarcode" class="flex-1 border rounded px-3 py-2">
                <button onclick="openScanner('product')" class="px-3 py-2 bg-blue-600 text-white rounded">📷</button>
              </div>
            </div>
            <div>
              <label class="text-sm">ชื่อสินค้า *</label>
              <input id="pfName" class="w-full border rounded px-3 py-2">
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div><label class="text-sm">หมวดหมู่</label><input id="pfCategory" class="w-full border rounded px-3 py-2"></div>
              <div><label class="text-sm">หน่วย</label><input id="pfUnit" value="ชิ้น" class="w-full border rounded px-3 py-2"></div>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div><label class="text-sm">ราคาทุน</label><input id="pfCost" type="number" min="0" step="0.01" class="w-full border rounded px-3 py-2"></div>
              <div><label class="text-sm">ราคาขาย * <span class="text-xs text-slate-500">(รวม VAT)</span></label><input id="pfPrice" type="number" min="0" step="0.01" class="w-full border rounded px-3 py-2"></div>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div><label class="text-sm">สต๊อกเริ่มต้น</label><input id="pfStock" type="number" min="0" class="w-full border rounded px-3 py-2"></div>
              <div><label class="text-sm">สต๊อกขั้นต่ำ</label><input id="pfMinStock" type="number" min="0" value="0" class="w-full border rounded px-3 py-2"></div>
            </div>
            <div>
              <label class="text-sm">รูปสินค้า</label>
              <div class="flex gap-2 items-start">
                <div id="pfImagePreview" class="w-24 h-24 border-2 border-dashed border-slate-300 rounded flex items-center justify-center bg-slate-50 text-slate-400 text-xs text-center overflow-hidden flex-shrink-0">ยังไม่มีรูป</div>
                <div class="flex-1 space-y-1">
                  <input id="pfImageFile" type="file" accept="image/*" capture="environment" class="w-full text-xs file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:bg-blue-600 file:text-white">
                  <button type="button" onclick="POS.products.clearImage()" class="text-xs text-red-600 underline">ลบรูป</button>
                </div>
              </div>
              <input type="hidden" id="pfImageData">
            </div>
          </div>
          <div class="flex gap-2 mt-4">
            <button onclick="POS.products.saveForm()" class="flex-1 bg-blue-600 text-white py-2 rounded">บันทึก</button>
            <button onclick="POS.products.closeForm()" class="px-4 py-2 border rounded">ยกเลิก</button>
          </div>
        </div>
      </div>
    `);

    document.getElementById('pfImageFile').addEventListener('change', handleImageUpload);
  }

  async function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const dataUrl = await POS.images.resizeImageFile(file);
      setImagePreview(dataUrl);
    } catch (err) {
      showToast('โหลดรูปไม่ได้: ' + err.message, 'error');
    }
  }

  function setImagePreview(dataUrl) {
    document.getElementById('pfImageData').value = dataUrl || '';
    const box = document.getElementById('pfImagePreview');
    box.innerHTML = dataUrl ? `<img src="${dataUrl}" class="w-full h-full object-cover">` : 'ยังไม่มีรูป';
  }

  function clearImage() {
    document.getElementById('pfImageFile').value = '';
    setImagePreview('');
  }

  function openForm(product = null) {
    ensureFormModal();
    if (product) {
      document.getElementById('productFormTitle').textContent = 'แก้ไขสินค้า';
      document.getElementById('pfBarcode').value = product.barcode;
      document.getElementById('pfBarcode').disabled = true;
      document.getElementById('pfName').value = product.name;
      document.getElementById('pfCategory').value = product.category || '';
      document.getElementById('pfUnit').value = product.unit || 'ชิ้น';
      document.getElementById('pfCost').value = product.cost_price;
      document.getElementById('pfPrice').value = product.sell_price;
      document.getElementById('pfStock').value = product.stock;
      document.getElementById('pfMinStock').value = product.min_stock || 0;
      setImagePreview(product.image || '');
    } else {
      document.getElementById('productFormTitle').textContent = 'เพิ่มสินค้า';
      ['pfBarcode','pfName','pfCategory','pfCost','pfPrice','pfStock'].forEach(id => document.getElementById(id).value = '');
      document.getElementById('pfUnit').value = 'ชิ้น';
      document.getElementById('pfMinStock').value = 0;
      document.getElementById('pfBarcode').disabled = false;
      setImagePreview('');
    }
    document.getElementById('pfImageFile').value = '';
    document.getElementById('productFormModal').classList.remove('hidden');
  }

  function closeForm() {
    document.getElementById('productFormModal').classList.add('hidden');
  }

  async function saveForm() {
    const product = {
      barcode: document.getElementById('pfBarcode').value.trim(),
      name: document.getElementById('pfName').value.trim(),
      category: document.getElementById('pfCategory').value.trim(),
      unit: document.getElementById('pfUnit').value.trim() || 'ชิ้น',
      cost_price: Number(document.getElementById('pfCost').value) || 0,
      sell_price: Number(document.getElementById('pfPrice').value) || 0,
      stock: Number(document.getElementById('pfStock').value) || 0,
      min_stock: Number(document.getElementById('pfMinStock').value) || 0,
      image: document.getElementById('pfImageData').value || ''
    };

    if (!product.barcode || !product.name) {
      showToast('กรอกบาร์โค้ดและชื่อสินค้า', 'error');
      return;
    }

    try {
      await callApi('saveProduct', { body: product });
      showToast('บันทึกสินค้าแล้ว');
      closeForm();
      await loadAll();
      renderTable();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function deleteHandler(barcode) {
    if (!confirm('ลบสินค้า ' + barcode + ' ?')) return;
    try {
      await callApi('deleteProduct', { body: { barcode } });
      showToast('ลบแล้ว');
      await loadAll();
      renderTable();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  // Register scanner handler
  POS.scanner.registerHandler('product', (code) => {
    POS.feedback.playScanSuccess();
    document.getElementById('pfBarcode').value = code;
    showToast('สแกนแล้ว: ' + code);
  });

  window.POS = window.POS || {};
  window.POS.products = {
    loadAll, getCache, findByBarcode, search,
    renderTab, renderTable,
    openForm, closeForm, saveForm, clearImage
  };
})();
