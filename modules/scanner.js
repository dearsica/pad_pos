// ====================================
// scanner.js — Camera barcode scanner (shared modal)
// ====================================
(function () {
  'use strict';

  let scannerInstance = null;
  let scannerContext = null;
  const handlers = {};

  function registerHandler(context, fn) {
    handlers[context] = fn;
  }

  function openScanner(context) {
    scannerContext = context;
    ensureModalMount();
    document.getElementById('scannerModal').classList.remove('hidden');
    startScanner();
  }

  function closeScanner() {
    stopScanner();
    const modal = document.getElementById('scannerModal');
    if (modal) modal.classList.add('hidden');
    scannerContext = null;
  }

  function startScanner() {
    scannerInstance = new Html5Qrcode('scannerReader');
    scannerInstance.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 150 } },
      handleScannedCode,
      () => { /* ignore parse errors */ }
    ).catch(err => {
      showToast('เปิดกล้องไม่ได้: ' + err, 'error');
      closeScanner();
    });
  }

  function stopScanner() {
    if (!scannerInstance) return;
    scannerInstance.stop().then(() => scannerInstance.clear()).catch(() => {});
    scannerInstance = null;
  }

  function handleScannedCode(decoded) {
    const handler = handlers[scannerContext];
    if (handler) handler(decoded);

    if (scannerContext === 'pos') {
      scannerInstance.pause(true);
      setTimeout(() => scannerInstance && scannerInstance.resume(), 1500);
    } else {
      closeScanner();
    }
  }

  function ensureModalMount() {
    if (document.getElementById('scannerModal')) return;
    const root = document.getElementById('modalRoot');
    root.insertAdjacentHTML('beforeend', `
      <div id="scannerModal" class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 hidden p-4">
        <div class="bg-white rounded-lg p-4 max-w-md w-full">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-bold">📷 สแกนบาร์โค้ด</h3>
            <button id="scannerCloseBtn" class="text-2xl leading-none">&times;</button>
          </div>
          <div id="scannerReader" class="rounded-lg overflow-hidden bg-black"></div>
          <p class="text-xs text-slate-500 mt-2 text-center">หันกล้องไปที่บาร์โค้ด ระบบจะอ่านอัตโนมัติ</p>
        </div>
      </div>
    `);
    document.getElementById('scannerCloseBtn').addEventListener('click', closeScanner);
  }

  window.POS = window.POS || {};
  window.POS.scanner = { registerHandler, openScanner, closeScanner };
  window.openScanner = openScanner;
})();
