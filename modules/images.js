// ====================================
// images.js — Image upload, resize, preview
// ====================================
(function () {
  'use strict';

  const IMAGE_MAX_DIMENSION = 400;
  const IMAGE_QUALITY = 0.75;

  function resizeImageFile(file, maxDimension = IMAGE_MAX_DIMENSION, quality = IMAGE_QUALITY) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('อ่านไฟล์ไม่สำเร็จ'));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('ไม่ใช่รูปภาพที่ถูกต้อง'));
        img.onload = () => resolve(canvasResize(img, maxDimension, quality));
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function canvasResize(img, maxDimension, quality) {
    const ratio = Math.min(maxDimension / img.width, maxDimension / img.height, 1);
    const width = Math.round(img.width * ratio);
    const height = Math.round(img.height * ratio);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d').drawImage(img, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', quality);
  }

  function renderThumbnail(imgData, sizeCls = 'w-10 h-10') {
    if (!imgData) {
      return `<div class="${sizeCls} bg-slate-100 rounded flex items-center justify-center text-slate-300 text-xs">—</div>`;
    }
    return `<img src="${imgData}" class="${sizeCls} object-cover rounded cursor-pointer"
                 data-image-preview="${escapeAttr(imgData)}">`;
  }

  function openImageModal(src) {
    if (!src) return;
    ensureModalMount();
    document.getElementById('imageModalImg').src = src;
    document.getElementById('imageModal').classList.remove('hidden');
  }

  function closeImageModal() {
    const modal = document.getElementById('imageModal');
    if (modal) modal.classList.add('hidden');
  }

  function ensureModalMount() {
    if (document.getElementById('imageModal')) return;
    const root = document.getElementById('modalRoot');
    root.insertAdjacentHTML('beforeend', `
      <div id="imageModal" class="fixed inset-0 bg-black/90 flex items-center justify-center z-50 hidden p-4">
        <img id="imageModalImg" class="max-w-full max-h-full rounded-lg" alt="รูปสินค้า">
      </div>
    `);
    document.getElementById('imageModal').addEventListener('click', closeImageModal);
  }

  // Global delegation: click any thumbnail → open modal
  document.addEventListener('click', (e) => {
    const thumb = e.target.closest('[data-image-preview]');
    if (thumb) {
      e.stopPropagation();
      openImageModal(thumb.dataset.imagePreview);
    }
  });

  window.POS = window.POS || {};
  window.POS.images = {
    resizeImageFile,
    renderThumbnail,
    openImageModal,
    closeImageModal
  };

  window.renderThumbnail = renderThumbnail;
  window.openImageModal = openImageModal;
})();
