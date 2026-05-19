// ====================================
// receipts.js — Print receipts & tax invoices
// Two formats: abbreviated (default) and full tax invoice (on request)
// ====================================
(function () {
  'use strict';

  const fmt = POS.vat.formatMoney;

  /**
   * Render and show a receipt modal.
   * @param result - { sale_id, total } from createSale API
   * @param items - cart items: { name, barcode, qty, unit_price, unit_cost }
   * @param payload - { discount, payment_method }
   * @param mode - 'abbreviated' (default) | 'full'
   * @param customer - optional { name, address, taxId } for full tax invoice
   */
  function show(result, items, payload, mode = 'abbreviated', customer = null) {
    ensureModalMount();
    const html = buildReceiptHtml(result, items, payload, mode, customer);
    document.getElementById('receiptContent').innerHTML = html;

    const isVatEnabled = POS.settings.getSettings().vatEnabled;
    document.getElementById('btnTaxInvoice').classList.toggle('hidden', !isVatEnabled || mode === 'full');
    document.getElementById('receiptModal').classList.remove('hidden');

    // Remember context so the "ออกใบกำกับภาษีเต็มรูป" button can re-render
    document.getElementById('receiptModal')._ctx = { result, items, payload };
  }

  function preview() {
    const sample = { sale_id: 'PREVIEW-2026/05/0001', total: 125.00 };
    const sampleItems = [
      { name: 'น้ำดื่ม 600ml', barcode: '8851111', qty: 2, unit_price: 10, unit_cost: 7 },
      { name: 'ขนมขบเคี้ยว', barcode: '8852222', qty: 5, unit_price: 7, unit_cost: 5 },
      { name: 'ไอศกรีม', barcode: '8853333', qty: 1, unit_price: 70, unit_cost: 50 }
    ];
    show(sample, sampleItems, { payment_method: 'CASH', discount: 0 }, 'abbreviated');
  }

  function buildReceiptHtml(result, items, payload, mode, customer) {
    const settings = POS.settings.getSettings();
    const totals = calculateTotals(items, Number(payload.discount) || 0, settings.vatEnabled);
    const dateStr = new Date().toLocaleString('th-TH');

    return `
      ${renderHeader(settings, mode, result.sale_id, dateStr)}
      ${mode === 'full' ? renderCustomerBlock(customer) : ''}
      <div class="receipt-line"></div>
      ${renderItems(items, settings.vatEnabled)}
      <div class="receipt-line"></div>
      ${renderTotals(totals, settings.vatEnabled, Number(payload.discount) || 0)}
      ${renderPayment(payload, result)}
      ${renderFooter(settings, mode)}
    `;
  }

  function calculateTotals(items, discount, vatEnabled) {
    const grossSubtotal = items.reduce((s, i) => s + i.unit_price * i.qty, 0);
    const grossTotal = grossSubtotal - discount;

    if (!vatEnabled) {
      return {
        subtotal: POS.vat.roundMoney(grossSubtotal),
        discount: POS.vat.roundMoney(discount),
        total: POS.vat.roundMoney(grossTotal),
        netAmount: null,
        vatAmount: null
      };
    }

    // Prices are VAT-inclusive: extract VAT
    const breakdown = POS.vat.fromInclusive(grossTotal);
    return {
      subtotal: POS.vat.roundMoney(grossSubtotal),
      discount: POS.vat.roundMoney(discount),
      total: breakdown.grossAmount,
      netAmount: breakdown.netAmount,
      vatAmount: breakdown.vatAmount
    };
  }

  function renderHeader(settings, mode, saleId, dateStr) {
    const title = mode === 'full' ? 'ใบกำกับภาษี / ใบเสร็จรับเงิน'
                : settings.vatEnabled ? 'ใบกำกับภาษีอย่างย่อ / ใบเสร็จรับเงิน'
                : 'ใบเสร็จรับเงิน';

    const lines = [
      `<div class="text-center font-bold text-sm">${escapeHtml(title)}</div>`,
      `<div class="text-center font-bold text-base mt-1">${escapeHtml(settings.shopName)}</div>`
    ];

    if (settings.receiptHeader) {
      lines.push(`<div class="text-center text-xs">${escapeHtml(settings.receiptHeader)}</div>`);
    }
    if (settings.shopAddress) {
      lines.push(`<div class="text-center text-xs whitespace-pre-line">${escapeHtml(settings.shopAddress)}</div>`);
    }
    if (settings.shopPhone) {
      lines.push(`<div class="text-center text-xs">โทร. ${escapeHtml(settings.shopPhone)}</div>`);
    }
    if (settings.shopTaxId) {
      lines.push(`<div class="text-center text-xs">เลขประจำตัวผู้เสียภาษี: ${escapeHtml(settings.shopTaxId)}</div>`);
      if (settings.shopBranch) {
        lines.push(`<div class="text-center text-xs">สาขา: ${escapeHtml(settings.shopBranch)}</div>`);
      }
    }

    lines.push(`<div class="text-xs mt-2 flex justify-between">
      <span>เลขที่: ${escapeHtml(saleId)}</span>
      <span>${dateStr}</span>
    </div>`);

    return lines.join('');
  }

  function renderCustomerBlock(customer) {
    if (!customer) return `
      <div class="receipt-line"></div>
      <div class="text-xs">
        <div>ลูกค้า: ............................................</div>
        <div>ที่อยู่: ............................................</div>
        <div>เลขผู้เสียภาษี: ........................................</div>
      </div>
    `;
    return `
      <div class="receipt-line"></div>
      <div class="text-xs">
        <div>ลูกค้า: ${escapeHtml(customer.name || '-')}</div>
        ${customer.address ? `<div>ที่อยู่: ${escapeHtml(customer.address)}</div>` : ''}
        ${customer.taxId ? `<div>เลขผู้เสียภาษี: ${escapeHtml(customer.taxId)}</div>` : ''}
      </div>
    `;
  }

  function renderItems(items, vatEnabled) {
    const note = vatEnabled
      ? '<div class="text-[10px] text-slate-500 mb-1">* ราคาสินค้ารวม VAT 7%</div>'
      : '';
    return note + items.map(i => `
      <div class="flex justify-between text-xs">
        <span class="flex-1 mr-2">${escapeHtml(i.name)}</span>
      </div>
      <div class="flex justify-between text-xs">
        <span class="pl-3">${i.qty} × ${fmt(i.unit_price)}</span>
        <span>${fmt(i.qty * i.unit_price)}</span>
      </div>
    `).join('');
  }

  function renderTotals(totals, vatEnabled, discount) {
    const rows = [];

    rows.push(`<div class="flex justify-between text-sm">
      <span>ยอดรวม:</span>
      <span>${fmt(totals.subtotal)}</span>
    </div>`);

    if (discount > 0) {
      rows.push(`<div class="flex justify-between text-sm">
        <span>ส่วนลด:</span>
        <span>-${fmt(totals.discount)}</span>
      </div>`);
    }

    if (vatEnabled) {
      rows.push(`<div class="flex justify-between text-sm">
        <span>มูลค่าก่อน VAT:</span>
        <span>${fmt(totals.netAmount)}</span>
      </div>`);
      rows.push(`<div class="flex justify-between text-sm">
        <span>VAT 7%:</span>
        <span>${fmt(totals.vatAmount)}</span>
      </div>`);
    }

    rows.push(`<div class="flex justify-between font-bold text-base receipt-double-line mt-1">
      <span>รวมทั้งสิ้น:</span>
      <span>${fmt(totals.total)}</span>
    </div>`);

    return rows.join('');
  }

  function renderPayment(payload, result) {
    const paymentLabels = { CASH: 'เงินสด', TRANSFER: 'โอน/พร้อมเพย์', CARD: 'บัตร' };
    const label = paymentLabels[payload.payment_method] || payload.payment_method;
    let html = `<div class="text-xs mt-2">วิธีจ่าย: ${escapeHtml(label)}</div>`;

    if (result.member_points_earned > 0) {
      html += `<div class="receipt-line"></div>`;
      html += `<div class="text-xs">แต้มที่ได้: +${result.member_points_earned}</div>`;
      html += `<div class="text-xs">แต้มสะสมรวม: ${result.member_points_balance}</div>`;
    }
    return html;
  }

  function renderFooter(settings, mode) {
    let html = '';
    if (settings.shopFooter) {
      html += `<div class="text-center text-xs mt-3">${escapeHtml(settings.shopFooter)}</div>`;
    }
    if (mode === 'full') {
      html += `<div class="text-xs mt-4">
        <div>ผู้รับเงิน: ........................................</div>
        <div class="mt-2">ผู้รับสินค้า: ........................................</div>
      </div>`;
    }
    return html;
  }

  // ====== Convert abbreviated to full tax invoice ======
  function requestFullTaxInvoice() {
    const ctx = document.getElementById('receiptModal')._ctx;
    if (!ctx) return;

    const name = prompt('ชื่อ-นามสกุล / ชื่อบริษัทของลูกค้า:');
    if (!name) return;
    const taxId = prompt('เลขประจำตัวผู้เสียภาษีของลูกค้า (13 หลัก ถ้ามี):');
    const address = prompt('ที่อยู่ลูกค้า:');

    show(ctx.result, ctx.items, ctx.payload, 'full', {
      name: name.trim(),
      taxId: (taxId || '').trim(),
      address: (address || '').trim()
    });
  }

  function closeReceipt() {
    const modal = document.getElementById('receiptModal');
    if (modal) modal.classList.add('hidden');
    const posInput = document.getElementById('posScanInput');
    if (posInput) posInput.focus();
  }

  function ensureModalMount() {
    if (document.getElementById('receiptModal')) return;
    const root = document.getElementById('modalRoot');
    root.insertAdjacentHTML('beforeend', `
      <div id="receiptModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 hidden no-print">
        <div class="bg-white rounded-lg p-6 max-w-sm w-11/12 max-h-[90vh] overflow-y-auto">
          <div id="receiptContent" class="font-mono text-sm"></div>
          <div class="flex flex-col gap-2 mt-4 no-print">
            <button onclick="window.print()" class="bg-blue-600 text-white py-2 rounded">🖨️ พิมพ์</button>
            <button id="btnTaxInvoice" onclick="POS.receipts.requestFullTaxInvoice()" class="border-2 border-blue-600 text-blue-600 py-2 rounded hidden">
              📑 ออกใบกำกับภาษีเต็มรูป
            </button>
            <button onclick="POS.receipts.close()" class="border py-2 rounded">ปิด</button>
          </div>
        </div>
      </div>
    `);
  }

  window.POS = window.POS || {};
  window.POS.receipts = { show, preview, requestFullTaxInvoice, close: closeReceipt };
})();
