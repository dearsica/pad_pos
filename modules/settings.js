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
    receiptHeader: '',
    promptpayTarget: '',
    promptpayName: ''
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

  // ====== Sub-tabs ======
  const SUB_TABS = [
    { id: 'shop',     label: '🏪 ข้อมูลร้าน',   render: renderShopInfo },
    { id: 'vat',      label: '📑 ภาษี (VAT)',  render: renderVatSettings },
    { id: 'promptpay', label: '💰 PromptPay',  render: renderPromptpay },
    { id: 'display',  label: '📺 หน้าจอลูกค้า', render: renderCustomerDisplay },
    { id: 'system',   label: '🔧 ระบบ',        render: renderSystem }
  ];

  let activeSubTab = 'shop';

  function render() {
    document.getElementById('tab-settings').innerHTML = `
      <div class="bg-white rounded-lg shadow max-w-3xl">
        <div class="p-4 border-b">
          <h2 class="text-lg font-bold">⚙️ ตั้งค่าร้าน</h2>
          <p class="text-xs text-slate-500">ข้อมูลเก็บไว้ในเบราว์เซอร์เครื่องนี้</p>
        </div>

        <div class="border-b bg-slate-50 px-2 pt-2 overflow-x-auto">
          <div class="flex gap-1 min-w-max">
            ${SUB_TABS.map(t => `
              <button data-sub-tab="${t.id}"
                      class="sub-tab-btn px-4 py-2 text-sm rounded-t-lg whitespace-nowrap ${activeSubTab === t.id ? 'bg-white border border-b-0 border-slate-200 font-medium text-blue-600' : 'text-slate-600 hover:bg-white/60'}">
                ${t.label}
              </button>
            `).join('')}
          </div>
        </div>

        <div id="settingsSubContent" class="p-4"></div>
      </div>
    `;

    document.querySelectorAll('.sub-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => switchSubTab(btn.dataset.subTab));
    });

    renderActiveSubTab();
  }

  function switchSubTab(id) {
    activeSubTab = id;
    render();
  }

  function renderActiveSubTab() {
    const tab = SUB_TABS.find(t => t.id === activeSubTab) || SUB_TABS[0];
    tab.render();
  }

  // ====== Sub-tab: Shop Info ======
  function renderShopInfo() {
    const s = getSettings();
    document.getElementById('settingsSubContent').innerHTML = `
      <div class="space-y-3 max-w-xl">
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
        ${renderSaveBar()}
      </div>
    `;
  }

  // ====== Sub-tab: VAT ======
  function renderVatSettings() {
    const s = getSettings();
    document.getElementById('settingsSubContent').innerHTML = `
      <div class="space-y-3 max-w-xl">
        <label class="flex items-center gap-2 cursor-pointer bg-blue-50 p-3 rounded">
          <input type="checkbox" id="setVatEnabled" ${s.vatEnabled ? 'checked' : ''} class="w-5 h-5">
          <span class="text-sm font-medium">ร้านนี้จดทะเบียน VAT (ออกใบกำกับภาษี)</span>
        </label>

        <div>
          <label class="text-sm font-medium">เลขประจำตัวผู้เสียภาษี (13 หลัก)</label>
          <input id="setShopTaxId" value="${escapeHtml(s.shopTaxId)}" placeholder="0-1234-56789-01-2"
                 class="w-full border rounded px-3 py-2 font-mono">
        </div>

        <div class="bg-amber-50 border border-amber-200 p-3 rounded text-xs space-y-1">
          <div class="font-bold text-amber-900">📌 หมายเหตุ</div>
          <div>• ราคาขายในระบบ <strong>รวม VAT 7%</strong> แล้ว</div>
          <div>• ใบกำกับภาษีจะแยกแสดง: ราคาก่อน VAT + VAT + รวม</div>
          <div>• เลขที่ใบกำกับภาษีจะออกแบบต่อเนื่อง (รูปแบบ YYYY/MM/NNNN)</div>
          <div>• กดดูตัวอย่างใบเสร็จเพื่อตรวจรูปแบบก่อนใช้จริง</div>
        </div>

        ${renderSaveBar(true)}
      </div>
    `;
  }

  // ====== Sub-tab: PromptPay ======
  function renderPromptpay() {
    const s = getSettings();
    document.getElementById('settingsSubContent').innerHTML = `
      <div class="space-y-3 max-w-xl">
        <div>
          <label class="text-sm font-medium">เบอร์พร้อมเพย์ / เลขบัตร ปชช.</label>
          <input id="setPromptpayTarget" value="${escapeHtml(s.promptpayTarget)}"
                 placeholder="0812345678 หรือ 1234567890123"
                 class="w-full border rounded px-3 py-2 font-mono">
          <p class="text-xs text-slate-500 mt-1">
            เบอร์โทร 10 หลัก, เลขบัตร ปชช. 13 หลัก, หรือ e-wallet 15 หลัก
          </p>
        </div>
        <div>
          <label class="text-sm font-medium">ชื่อผู้รับเงิน (แสดงใต้ QR)</label>
          <input id="setPromptpayName" value="${escapeHtml(s.promptpayName)}"
                 placeholder="ร้านถั่วน้อย" class="w-full border rounded px-3 py-2">
        </div>
        <div class="bg-blue-50 border border-blue-200 p-3 rounded text-xs space-y-1">
          <div class="font-bold text-blue-900">💡 วิธีใช้</div>
          <div>• QR Code จะสร้างอัตโนมัติตามยอดเมื่อลูกค้าเลือก "📱 โอน/พร้อมเพย์"</div>
          <div>• แสดงในหน้าจอลูกค้า (จอที่ 2) และในหน้า cashier</div>
          <div>• ลูกค้าสแกนเห็นยอดอัตโนมัติ ไม่ต้องพิมพ์เอง</div>
        </div>
        ${renderSaveBar()}
      </div>
    `;
  }

  // ====== Sub-tab: Customer Display ======
  function renderCustomerDisplay() {
    document.getElementById('settingsSubContent').innerHTML = `
      <div class="space-y-3 max-w-xl">
        <div class="bg-purple-50 border border-purple-200 p-4 rounded">
          <h3 class="font-bold mb-2">📺 หน้าจอลูกค้า</h3>
          <p class="text-sm text-slate-600 mb-3">
            แสดงรายการสินค้า + ยอดรวม + QR PromptPay บนจอที่หันหาลูกค้า
          </p>
          <button onclick="POS.customerDisplay.openCustomerWindow()" class="bg-purple-600 text-white px-6 py-3 rounded font-medium hover:bg-purple-700">
            🖥️ เปิดหน้าจอลูกค้า (แท็บใหม่)
          </button>
        </div>

        <div class="bg-slate-50 p-3 rounded text-xs space-y-2">
          <div class="font-bold text-slate-700">📝 วิธีตั้งค่า</div>
          <div>1. กดเปิดหน้าจอลูกค้า — จะได้หน้าต่างใหม่</div>
          <div>2. <strong>ลากแท็บ</strong>ออกจาก browser → ได้หน้าต่างเดี่ยว</div>
          <div>3. ลากหน้าต่างไปจอที่ 2 (จอลูกค้า)</div>
          <div>4. กดปุ่มขยายเต็มจอ (Fullscreen — F11)</div>
        </div>

        <div class="bg-amber-50 border border-amber-200 p-3 rounded text-xs space-y-1">
          <div class="font-bold text-amber-900">⚠️ ข้อจำกัด</div>
          <div>• ต้องเปิดทั้ง 2 หน้าใน browser เดียวกัน</div>
          <div>• ถ้า browser ปิด → หน้าลูกค้าจะหยุด sync</div>
        </div>
      </div>
    `;
  }

  // ====== Sub-tab: System ======
  function renderSystem() {
    document.getElementById('settingsSubContent').innerHTML = `
      <div class="space-y-4 max-w-xl">
        <div>
          <h3 class="font-bold text-sm mb-2 text-slate-700">การเชื่อมต่อ</h3>
          <button onclick="openSetup()" class="text-sm text-blue-600 hover:underline">
            🔧 เปลี่ยน Google Apps Script URL
          </button>
        </div>

        <div class="pt-4 border-t">
          <h3 class="font-bold text-sm mb-2 text-slate-700">เกี่ยวกับเวอร์ชัน</h3>
          <div class="text-sm space-y-1 bg-slate-50 p-3 rounded">
            <div>เวอร์ชัน: <span class="font-mono font-bold text-blue-600">v${window.APP_VERSION || '?'}</span></div>
            <div>วันที่ build: <span class="font-mono">${window.APP_BUILD_DATE || '?'}</span></div>
          </div>
          <button onclick="forceRefresh()" class="mt-3 text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">
            🔄 โหลดเวอร์ชันใหม่ (ล้าง cache)
          </button>
          <p class="text-xs text-slate-500 mt-2">
            ถ้าอัปเดตเว็บแล้วยังเห็นเวอร์ชันเก่า ให้กดปุ่มนี้
          </p>
        </div>

        <div class="pt-4 border-t">
          <h3 class="font-bold text-sm mb-2 text-slate-700">ดูตัวอย่าง</h3>
          <button onclick="POS.receipts.preview()" class="border px-4 py-2 rounded hover:bg-slate-50 text-sm">
            👁️ ดูตัวอย่างใบเสร็จ
          </button>
        </div>
      </div>
    `;
  }

  // ====== Save bar (shared component) ======
  function renderSaveBar(showPreview = false) {
    return `
      <div class="flex gap-2 mt-4 pt-3 border-t flex-wrap">
        <button onclick="saveShopSettings()" class="bg-blue-600 text-white px-6 py-2 rounded font-medium hover:bg-blue-700">
          💾 บันทึก
        </button>
        ${showPreview ? `
          <button onclick="POS.receipts.preview()" class="border px-4 py-2 rounded hover:bg-slate-50">
            👁️ ดูตัวอย่างใบเสร็จ
          </button>
        ` : ''}
      </div>
    `;
  }

  function save() {
    // Read only fields present in DOM, merge with existing settings.
    // This way switching sub-tabs doesn't lose data from other sub-tabs.
    const current = getSettings();
    const updates = {};

    const fieldMap = {
      setShopName: 'shopName',
      setShopAddress: 'shopAddress',
      setShopPhone: 'shopPhone',
      setShopBranch: 'shopBranch',
      setShopTaxId: 'shopTaxId',
      setReceiptHeader: 'receiptHeader',
      setShopFooter: 'shopFooter',
      setPromptpayTarget: 'promptpayTarget',
      setPromptpayName: 'promptpayName'
    };

    Object.keys(fieldMap).forEach(elId => {
      const el = document.getElementById(elId);
      if (el) updates[fieldMap[elId]] = el.value.trim();
    });

    const vatCheckbox = document.getElementById('setVatEnabled');
    if (vatCheckbox) updates.vatEnabled = vatCheckbox.checked;

    // Validate PromptPay if changed
    if (updates.promptpayTarget) {
      const error = POS.promptpay.validateTarget(updates.promptpayTarget);
      if (error) {
        showToast('PromptPay: ' + error, 'error');
        return;
      }
    }

    const merged = { ...current, ...updates };
    if (!merged.shopName) merged.shopName = DEFAULT_SETTINGS.shopName;
    if (!merged.shopBranch) merged.shopBranch = DEFAULT_SETTINGS.shopBranch;

    saveSettings(merged);
    applyShopNameToHeader(merged.shopName);
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
