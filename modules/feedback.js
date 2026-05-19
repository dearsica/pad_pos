// ====================================
// feedback.js — Audio, haptic, visual feedback
// ====================================
(function () {
  'use strict';

  let audioCtx = null;

  function getAudioContext() {
    if (!audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) audioCtx = new AudioCtx();
    }
    return audioCtx;
  }

  function playTone(frequency, durationMs, volume = 0.3) {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.value = frequency;
    osc.type = 'sine';
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);

    osc.start();
    osc.stop(ctx.currentTime + durationMs / 1000);
  }

  function playScanSuccess() {
    playTone(1200, 100);
  }

  function playScanError() {
    playTone(300, 200, 0.4);
    setTimeout(() => playTone(250, 200, 0.4), 100);
  }

  function playCheckoutSuccess() {
    playTone(800, 120);
    setTimeout(() => playTone(1200, 200), 130);
  }

  // ====== Toast ======
  function showToast(msg, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.className = 'fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg z-50 ' +
      (type === 'error' ? 'bg-red-600 text-white' : 'bg-slate-900 text-white');
    toast.classList.remove('hidden');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.add('hidden'), 3000);
  }

  // ====== Ripple + Haptic (global) ======
  const HAPTIC_DURATION_MS = 15;

  document.addEventListener('pointerdown', (event) => {
    const button = event.target.closest('button');
    if (!button || button.disabled) return;
    createRippleEffect(button, event);
    triggerHapticFeedback();
  });

  function createRippleEffect(button, event) {
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);

    const ripple = document.createElement('span');
    ripple.className = 'ripple-effect';
    ripple.style.width = size + 'px';
    ripple.style.height = size + 'px';
    ripple.style.left = (event.clientX - rect.left - size / 2) + 'px';
    ripple.style.top = (event.clientY - rect.top - size / 2) + 'px';

    button.appendChild(ripple);
    setTimeout(() => ripple.remove(), 500);
  }

  function triggerHapticFeedback() {
    if (navigator.vibrate) navigator.vibrate(HAPTIC_DURATION_MS);
  }

  // ====== Utilities (used everywhere) ======
  function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  function escapeAttr(s) {
    return String(s ?? '').replace(/'/g, "\\'");
  }

  // Export to global
  window.POS = window.POS || {};
  window.POS.feedback = {
    playScanSuccess,
    playScanError,
    playCheckoutSuccess,
    showToast,
    escapeHtml,
    escapeAttr
  };

  // Convenience globals (used in HTML onclick)
  window.showToast = showToast;
  window.escapeHtml = escapeHtml;
  window.escapeAttr = escapeAttr;
})();
