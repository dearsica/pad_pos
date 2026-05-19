// ====================================
// settings.js — Shop settings (stored in localStorage)
// ====================================
(function () {
  'use strict';

  const SHOP_SETTINGS_KEY = 'pos_shop_settings';

  const DEFAULT_SETTINGS = {
    shopName: 'ร้านถั่วน้อย',
    shopAddress: '',
    shopPhone: '',
    shopTaxId: '',
    shopBranch: 'สำนักงานใหญ่',
    shopFooter: 'ขอบคุณที่ใช้บริการ',
    vatEnabled: false,
    receiptHeader: ''
  };

  function getSettings() {
    try {
      const raw = localStorage.getItem(SHOP_SETTINGS_KEY);
      if (!raw) return { ...DEFAULT_SETTINGS };
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  function saveSettings(settings) {
    localStorage.setItem(SHOP_SETTINGS_KEY, JSON.stringify(settings));
  }

  // ====== UI ======
  function render() {
    const s = getSettings();
    document.getElementById('tab-settings').innerHTML = `
      <div class="bg-white rounded-lg p-4 shadow max-w-2xl">
        <h2 class="text-lg font-bold mb-2">⚙️ ตั้งค่าร้าน</h2>
        <p class="text-sm text-slate-500 mb-4">ข้อมูลนี้แสดงในใบเสร็จและใบกำกับภาษี · เก็บไว้ในเบราว์เซอร์เครื่องนี้</p>

        <div class="space-y-3">
          <div>
            <label class="text-sm font-medium">ชื่อร้าน *</label>
            <input id="setShopName" value="${escapeHtml(s.shopName)}" class="w-full border rounded px-3 py-2">
          </div>
          <div>
            <label class="text-sm font-medium">ที่อยู่ร้าน</label>
            <textarea id="setShopAddress" rows="3" placeholder="123 ม.1 ต.บางเขน อ.เมือง จ.กรุงเทพ 10220"
                      class="w-full border rounded px-3 py-2">${escapeHtml(s.shopAddress)}</textarea>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="text-sm font-medium">เบอร์โทร</label>
              <input id="setShopPhone" type="tel" value="${escapeHtml(s.shopPhone)}"
                     placeholder="08x-xxx-xxxx" class="w-full border rounded px-3 py-2">
            </div>
            <div>
              <label class="text-sm font-medium">สาขา</label>
              <input id="setShopBranch" value="${escapeHtml(s.shopBranch)}"
                     class="w-full border rounded px-3 py-2">
            </div>
          </div>
        </div>

        <h3 class="font-bold text-sm mt-6 mb-2 text-slate-700">📑 ภาษี (VAT)</h3>
        <div class="bg-slate-50 p-3 rounded space-y-3">
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" id="setVatEnabled" ${s.vatEnabled ? 'checked' : ''} class="w-5 h-5">
            <span class="text-sm">ร้านนี้จดทะเบียน VAT (ออกใบกำกับภาษี)</span>
          </label>
          <div>
            <label class="text-sm font-medium">เลขประจำตัวผู้เสียภาษี (13 หลัก)</label>
            <input id="setShopTaxId" value="${escapeHtml(s.shopTaxId)}" placeholder="0-1234-56789-01-2"
                   class="w-full border rounded px-3 py-2 font-mono">
          </div>
          <p class="text-xs text-slate-500">
            • ราคาขายในระบบ <strong>รวม VAT 7%</strong> แล้ว<br>
            • ใบกำกับภาษีจะแยกแสดง: ราคาก่อน VAT + VAT + รวม<br>
            • เลขที่ใบกำกับภาษีจะออกแบบต่อเนื่อง (รูปแบบ YYYY/MM/NNNN)
          </p>
        </div>

        <h3 class="font-bold text-sm mt-6 mb-2 text-slate-700">🧾 ใบเสร็จ</h3>
        <div class="space-y-3">
          <div>
            <label class="text-sm font-medium">ข้อความหัวใบเสร็จ (เช่น สโลแกน)</label>
            <input id="setReceiptHeader" value="${escapeHtml(s.receiptHeader)}"
                   placeholder="ไม่บังคับ" class="w-full border rounded px-3 py-2">
          </div>
          <div>
            <label class="text-sm font-medium">ข้อความท้ายใบเสร็จ</label>
            <input id="setShopFooter" value="${escapeHtml(s.shopFooter)}"
                   class="w-full border rounded px-3 py-2">
          </div>
        </div>

        <div class="flex gap-2 mt-4 flex-wrap">
          <button onclick="saveShopSettings()" class="bg-blue-600 text-white px-6 py-2 rounded font-medium hover:bg-blue-700">
            💾 บันทึก
          </button>
          <button onclick="POS.receipts.preview()" class="border px-4 py-2 rounded hover:bg-slate-50">
            👁️ ดูตัวอย่างใบเสร็จ
          </button>
        </div>

        <div class="mt-6 pt-4 border-t">
          <h3 class="font-bold text-sm mb-2 text-slate-600">การตั้งค่าระบบ</h3>
          <button onclick="openSetup()" class="text-sm text-blue-600 hover:underline">
            🔧 เปลี่ยน Google Apps Script URL
          </button>
        </div>

        <div class="mt-6 pt-4 border-t">
          <h3 class="font-bold text-sm mb-2 text-slate-600">เกี่ยวกับเวอร์ชัน</h3>
          <div class="text-sm space-y-1">
            <div>เวอร์ชัน: <span class="font-mono font-bold text-blue-600">v${window.APP_VERSION || '?'}</span></div>
            <div>วันที่ build: <span class="font-mono">${window.APP_BUILD_DATE || '?'}</span></div>
          </div>
          <button onclick="forceRefresh()" class="mt-3 text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">
            🔄 โหลดเวอร์ชันใหม่ (ล้าง cache)
          </button>
        </div>
      </div>
    `;
  }

  function save() {
    const settings = {
      shopName: document.getElementById('setShopName').value.trim() || DEFAULT_SETTINGS.shopName,
      shopAddress: document.getElementById('setShopAddress').value.trim(),
      shopPhone: document.getElementById('setShopPhone').value.trim(),
      shopBranch: document.getElementById('setShopBranch').value.trim() || DEFAULT_SETTINGS.shopBranch,
      shopTaxId: document.getElementById('setShopTaxId').value.trim(),
      vatEnabled: document.getElementById('setVatEnabled').checked,
      receiptHeader: document.getElementById('setReceiptHeader').value.trim(),
      shopFooter: document.getElementById('setShopFooter').value.trim()
    };
    saveSettings(settings);
    applyShopNameToHeader(settings.shopName);
    showToast('บันทึกการตั้งค่าแล้ว');
  }

  function applyShopNameToHeader(shopName) {
    document.getElementById('headerShopName').textContent = '🛒 ' + shopName;
    document.title = 'POS ' + shopName;
  }

  window.POS = window.POS || {};
  window.POS.settings = { getSettings, render, save, applyShopNameToHeader };
  window.saveShopSettings = save;
})();
