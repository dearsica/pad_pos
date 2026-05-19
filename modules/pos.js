// ====================================
// pos.js — Point of sale: cart, search, checkout
// ====================================
(function () {
  'use strict';

  const fmt = POS.vat.formatMoney;
  let cart = [];
  let currentMember = null;

  function renderTab() {
    document.getElementById('tab-pos').innerHTML = `
      <div class="grid lg:grid-cols-3 gap-4">
        <div class="lg:col-span-2 bg-white rounded-lg p-4 shadow">
          <div class="flex gap-2 mb-3">
            <input id="posScanInput" type="text" autofocus placeholder="ยิงบาร์โค้ดที่นี่ หรือพิมพ์รหัส/ชื่อสินค้า"
                   class="scanner-input flex-1 border-2 border-blue-500 rounded-lg px-4 py-3 text-lg">
            <button onclick="openScanner('pos')" class="px-4 py-3 bg-blue-600 text-white rounded-lg">📷 กล้อง</button>
          </div>

          <div id="searchResults" class="hidden mb-3 border rounded max-h-48 overflow-y-auto"></div>

          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-slate-100">
                <tr>
                  <th class="text-left p-2">สินค้า</th>
                  <th class="text-right p-2 w-24">จำนวน</th>
                  <th class="text-right p-2 w-24">ราคา</th>
                  <th class="text-right p-2 w-24">รวม</th>
                  <th class="w-12"></th>
                </tr>
              </thead>
              <tbody id="cartTable"></tbody>
            </table>
          </div>
        </div>

        <div class="bg-white rounded-lg p-4 shadow">
          <h3 class="font-bold mb-3">สรุปยอด</h3>

          <div class="mb-3">
            <label class="text-sm text-slate-600">สมาชิก (เบอร์โทร)</label>
            <div class="flex gap-1">
              <input id="memberPhoneInput" type="tel" placeholder="ไม่บังคับ" class="flex-1 border rounded px-2 py-1 text-sm">
              <button onclick="POS.pos.lookupMember()" class="px-3 py-1 bg-slate-200 rounded text-sm">ค้นหา</button>
            </div>
            <div id="memberInfo" class="text-xs text-blue-600 mt-1"></div>
          </div>

          <div class="space-y-2 mb-3" id="totalsSection"></div>

          <div class="mb-3">
            <label class="text-sm text-slate-600">วิธีจ่ายเงิน</label>
            <select id="paymentMethod" class="w-full border rounded px-2 py-1 text-sm">
              <option value="CASH">💵 เงินสด</option>
              <option value="TRANSFER">📱 โอน/พร้อมเพย์</option>
              <option value="CARD">💳 บัตร</option>
            </select>
          </div>

          <div id="managerQrSection" class="hidden mb-3 bg-blue-50 rounded p-3">
            <div class="text-xs text-blue-900 font-bold text-center mb-2">📱 QR PromptPay</div>
            <canvas id="managerQrCanvas" class="mx-auto"></canvas>
            <div id="managerQrLabel" class="text-center text-xs text-slate-600 mt-1"></div>
          </div>

          <button id="checkoutBtn" onclick="POS.pos.checkout()" class="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700">
            ✓ คิดเงิน (F2)
          </button>
          <button onclick="POS.pos.clearCart()" class="w-full mt-2 border py-2 rounded text-sm hover:bg-slate-50">
            ล้างตะกร้า
          </button>
        </div>
      </div>
    `;

    attachListeners();
    renderCart();
  }

  function attachListeners() {
    const scanInput = document.getElementById('posScanInput');
    scanInput.addEventListener('keydown', handleScanInput);

    const cartTable = document.getElementById('cartTable');
    cartTable.addEventListener('click', (e) => {
      const removeBtn = e.target.closest('[data-cart-remove]');
      if (removeBtn) removeFromCart(removeBtn.dataset.cartRemove);
    });
    cartTable.addEventListener('change', (e) => {
      const qtyInput = e.target.closest('[data-cart-qty]');
      if (qtyInput) updateCartQty(qtyInput.dataset.cartQty, qtyInput.value);
    });

    const paymentSel = document.getElementById('paymentMethod');
    if (paymentSel) paymentSel.addEventListener('change', syncCustomerDisplay);

    scanInput.focus();
  }

  function handleScanInput(e) {
    if (e.key !== 'Enter') {
      if (e.key.length === 1) {
        clearTimeout(handleScanInput._t);
        handleScanInput._t = setTimeout(() => searchForCart(e.target.value), 200);
      }
      return;
    }
    e.preventDefault();
    const code = e.target.value.trim();
    if (!code) return;
    addToCartByBarcode(code);
    e.target.value = '';
    hideSearchResults();
  }

  function searchForCart(query) {
    const results = POS.products.search(query);
    if (!results.length) { hideSearchResults(); return; }
    const box = document.getElementById('searchResults');
    box.innerHTML = results.map(p => `
      <div class="p-2 hover:bg-blue-50 cursor-pointer border-b last:border-0 flex gap-2 items-center"
           data-add-to-cart="${escapeHtml(p.barcode)}">
        ${renderThumbnail(p.image, 'w-10 h-10')}
        <div class="flex-1 min-w-0">
          <div class="font-medium truncate">${escapeHtml(p.name)}</div>
          <div class="text-xs text-slate-500">${escapeHtml(p.barcode)} · ฿${fmt(p.sell_price)} · คงเหลือ ${p.stock}</div>
        </div>
      </div>
    `).join('');
    box.classList.remove('hidden');

    box.querySelectorAll('[data-add-to-cart]').forEach(el => {
      el.addEventListener('click', () => {
        addToCartByBarcode(el.dataset.addToCart);
        document.getElementById('posScanInput').value = '';
        hideSearchResults();
      });
    });
  }

  function hideSearchResults() {
    const box = document.getElementById('searchResults');
    if (box) box.classList.add('hidden');
  }

  function addToCartByBarcode(barcode) {
    const product = POS.products.findByBarcode(barcode);
    if (!product) {
      POS.feedback.playScanError();
      showToast('ไม่พบสินค้ารหัส ' + barcode, 'error');
      return;
    }
    addToCart(product);
  }

  function addToCart(product) {
    const existing = cart.find(item => item.barcode === product.barcode);
    if (existing) {
      if (existing.qty + 1 > Number(product.stock)) {
        POS.feedback.playScanError();
        showToast('สต๊อกไม่พอ', 'error');
        return;
      }
      existing.qty += 1;
    } else {
      if (Number(product.stock) <= 0) {
        POS.feedback.playScanError();
        showToast('สินค้าหมดสต๊อก', 'error');
        return;
      }
      cart.push({
        barcode: product.barcode,
        name: product.name,
        image: product.image || '',
        qty: 1,
        unit_price: Number(product.sell_price),
        unit_cost: Number(product.cost_price),
        stock: Number(product.stock)
      });
    }
    POS.feedback.playScanSuccess();
    renderCart();
  }

  function updateCartQty(barcode, qty) {
    const item = cart.find(i => i.barcode === barcode);
    if (!item) return;
    const n = Number(qty);
    if (n <= 0) { removeFromCart(barcode); return; }
    if (n > item.stock) { showToast('สต๊อกไม่พอ', 'error'); return; }
    item.qty = n;
    renderCart();
  }

  function removeFromCart(barcode) {
    cart = cart.filter(i => i.barcode !== barcode);
    renderCart();
  }

  function clearCart(options = {}) {
    cart = [];
    currentMember = null;
    const phoneEl = document.getElementById('memberPhoneInput');
    const infoEl = document.getElementById('memberInfo');
    if (phoneEl) phoneEl.value = '';
    if (infoEl) infoEl.textContent = '';
    renderCart({ skipPublish: options.skipPublish });
  }

  function renderCart(options = {}) {
    const tbody = document.getElementById('cartTable');
    if (!tbody) return;
    if (!cart.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center p-8 text-slate-400">ยังไม่มีสินค้าในตะกร้า</td></tr>';
    } else {
      tbody.innerHTML = cart.map(item => `
        <tr class="border-b">
          <td class="p-2">
            <div class="flex gap-2 items-center">
              ${renderThumbnail(item.image, 'w-10 h-10')}
              <div class="min-w-0">
                <div class="font-medium truncate">${escapeHtml(item.name)}</div>
                <div class="text-xs text-slate-500">${escapeHtml(item.barcode)}</div>
              </div>
            </div>
          </td>
          <td class="p-2 text-right">
            <input type="number" min="1" value="${item.qty}" data-cart-qty="${escapeHtml(item.barcode)}"
                   class="w-16 text-right border rounded px-1 py-0.5">
          </td>
          <td class="p-2 text-right">${fmt(item.unit_price)}</td>
          <td class="p-2 text-right font-medium">${fmt(item.unit_price * item.qty)}</td>
          <td class="p-2 text-center">
            <button data-cart-remove="${escapeHtml(item.barcode)}" class="text-red-500 hover:bg-red-50 rounded w-8 h-8 text-lg leading-none">✕</button>
          </td>
        </tr>
      `).join('');
    }
    renderTotals();
    if (!options.skipPublish) syncCustomerDisplay();
  }

  function syncCustomerDisplay() {
    if (!cart.length) {
      POS.customerDisplay.publishIdle();
      return;
    }
    const paymentMethod = document.getElementById('paymentMethod')?.value || 'CASH';
    POS.customerDisplay.publishCart(cart, paymentMethod);
  }

  function renderTotals() {
    const section = document.getElementById('totalsSection');
    if (!section) return;

    const vatEnabled = POS.settings.getSettings().vatEnabled;
    const subtotal = cart.reduce((s, i) => s + i.unit_price * i.qty, 0);
    const costTotal = cart.reduce((s, i) => s + i.unit_cost * i.qty, 0);
    const total = subtotal;
    const profit = total - costTotal;

    const rows = [
      `<div class="flex justify-between"><span>ยอดรวม:</span><span>${fmt(subtotal)}</span></div>`
    ];

    if (vatEnabled) {
      const breakdown = POS.vat.fromInclusive(total);
      rows.push(`<div class="flex justify-between text-xs text-slate-500"><span>ราคาก่อน VAT:</span><span>${fmt(breakdown.netAmount)}</span></div>`);
      rows.push(`<div class="flex justify-between text-xs text-slate-500"><span>VAT 7%:</span><span>${fmt(breakdown.vatAmount)}</span></div>`);
    }

    rows.push(`<div class="flex justify-between text-xl font-bold border-t pt-2">
      <span>ยอดสุทธิ:</span><span class="text-blue-600">${fmt(total)}</span>
    </div>`);

    rows.push(`<div class="flex justify-between text-xs text-green-600">
      <span>กำไรประมาณ:</span><span>${fmt(profit)}</span>
    </div>`);

    section.innerHTML = rows.join('');
    renderManagerQr(total);
  }

  function renderManagerQr(total) {
    const qrSection = document.getElementById('managerQrSection');
    if (!qrSection) return;

    const paymentMethod = document.getElementById('paymentMethod')?.value;
    const settings = POS.settings.getSettings();
    const shouldShow = paymentMethod === 'TRANSFER'
                    && settings.promptpayTarget
                    && total > 0;

    if (!shouldShow) {
      qrSection.classList.add('hidden');
      return;
    }

    try {
      const payload = POS.promptpay.generatePayload(settings.promptpayTarget, total);
      const canvas = document.getElementById('managerQrCanvas');
      // Use QRCode library if available, else load it on the fly
      if (window.QRCode) {
        QRCode.toCanvas(canvas, payload, { width: 160, margin: 1 });
      } else {
        loadQrLibrary(() => QRCode.toCanvas(canvas, payload, { width: 160, margin: 1 }));
      }
      const label = settings.promptpayName ? settings.promptpayName + ' · ' : '';
      document.getElementById('managerQrLabel').textContent = label + '฿' + fmt(total);
      qrSection.classList.remove('hidden');
    } catch (err) {
      console.error('QR render error:', err);
      qrSection.classList.add('hidden');
    }
  }

  function loadQrLibrary(callback) {
    if (window.QRCode) { callback(); return; }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js';
    script.onload = callback;
    document.head.appendChild(script);
  }

  // ====== Member lookup ======
  async function lookupMember() {
    const phoneEl = document.getElementById('memberPhoneInput');
    const phone = phoneEl.value.trim();
    if (!phone) return;
    try {
      const member = await callApi('getMemberByPhone', { params: { phone } });
      const info = document.getElementById('memberInfo');
      if (member) {
        currentMember = member;
        info.innerHTML = `✓ ${escapeHtml(member.name)} · แต้ม ${member.points}`;
        info.className = 'text-xs text-blue-600 mt-1';
      } else {
        currentMember = null;
        info.innerHTML = `ไม่พบสมาชิก · <a class="underline cursor-pointer" id="quickAddMemberLink">เพิ่มใหม่</a>`;
        info.className = 'text-xs text-orange-600 mt-1';
        document.getElementById('quickAddMemberLink').addEventListener('click', () => quickAddMember(phone));
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function quickAddMember(phone) {
    const name = prompt('ชื่อสมาชิก:');
    if (!name) return;
    try {
      await callApi('saveMember', { body: { name, phone } });
      lookupMember();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  // ====== Checkout ======
  async function checkout() {
    if (!cart.length) {
      POS.feedback.playScanError();
      showToast('ตะกร้าว่าง', 'error');
      return;
    }

    const payload = {
      items: cart.map(i => ({ barcode: i.barcode, qty: i.qty, unit_price: i.unit_price })),
      discount: 0,
      payment_method: document.getElementById('paymentMethod').value,
      member_id: currentMember ? currentMember.member_id : '',
      note: ''
    };

    // Snapshot cart BEFORE clearing — we need it for the receipt and customer display
    const cartSnapshot = cart.map(i => ({ ...i }));
    const totalSnapshot = cartSnapshot.reduce((s, i) => s + i.unit_price * i.qty, 0);

    setCheckoutLoading(true);
    try {
      const result = await callApi('createSale', { body: payload });
      POS.feedback.playCheckoutSuccess();

      // Use API total if valid, else fall back to local calc.
      // (API can return total as string; coerce to number)
      const finalTotal = Number(result.total) > 0 ? Number(result.total) : totalSnapshot;

      // Clear cart FIRST (resets manager UI) then publish Paid to customer.
      // Order matters: clearCart triggers publishIdle, so publishPaid must come AFTER.
      clearCart({ skipPublish: true });
      POS.customerDisplay.publishPaid(result.sale_id, cartSnapshot, finalTotal, payload.payment_method);
      POS.receipts.show(result, cartSnapshot, payload);
      showToast('ขายสำเร็จ ' + result.sale_id);
      POS.products.loadAll();
    } catch (err) {
      POS.feedback.playScanError();
      showToast(err.message, 'error');
    } finally {
      setCheckoutLoading(false);
    }
  }

  function setCheckoutLoading(isLoading) {
    const btn = document.getElementById('checkoutBtn');
    if (!btn) return;
    btn.disabled = isLoading;
    btn.innerHTML = isLoading
      ? '<span class="inline-block animate-spin">⏳</span> กำลังบันทึก...'
      : '✓ คิดเงิน (F2)';
    btn.classList.toggle('opacity-60', isLoading);
  }

  // POS scanner handler
  POS.scanner.registerHandler('pos', (code) => addToCartByBarcode(code));

  // F2 hotkey
  document.addEventListener('keydown', (e) => {
    if (e.key === 'F2') {
      e.preventDefault();
      if (!document.getElementById('tab-pos').classList.contains('hidden')) checkout();
    }
  });

  window.POS = window.POS || {};
  window.POS.pos = { renderTab, clearCart, checkout, lookupMember, focusScanInput: () => {
    const el = document.getElementById('posScanInput');
    if (el) el.focus();
  }};
})();
