// ====================================
// customer-display.js — Sync cart state to customer-facing screen
// Uses localStorage events for cross-tab communication.
// ====================================
(function () {
  'use strict';

  const STATE_KEY = 'pos_customer_display_state';

  /**
   * Publish current state to the customer screen.
   * @param {object} state - { mode, items, total, settings, paid }
   *   mode: 'cart' | 'paid' | 'idle'
   */
  function publish(state) {
    try {
      localStorage.setItem(STATE_KEY, JSON.stringify({
        ...state,
        timestamp: Date.now()
      }));
    } catch (err) {
      console.warn('Failed to publish customer display state:', err);
    }
  }

  function publishCart(items, paymentMethod) {
    const total = items.reduce((s, i) => s + (i.unit_price * i.qty), 0);
    publish({
      mode: 'cart',
      items: items.map(i => ({
        name: i.name,
        qty: i.qty,
        unit_price: i.unit_price,
        image: i.image || ''
      })),
      total: POS.vat.roundMoney(total),
      paymentMethod,
      settings: POS.settings.getSettings()
    });
  }

  function publishPaid(saleId, items, total, paymentMethod) {
    publish({
      mode: 'paid',
      saleId,
      items: items.map(i => ({
        name: i.name,
        qty: i.qty,
        unit_price: i.unit_price,
        image: i.image || ''
      })),
      total: POS.vat.roundMoney(total),
      paymentMethod,
      settings: POS.settings.getSettings()
    });
  }

  function publishIdle() {
    publish({
      mode: 'idle',
      settings: POS.settings.getSettings()
    });
  }

  function openCustomerWindow() {
    const win = window.open('customer.html', 'customerDisplay', 'width=1024,height=768');
    if (!win) {
      showToast('ไม่สามารถเปิดหน้าต่างใหม่ — โปรดอนุญาต popup', 'error');
      return null;
    }
    // Publish initial state right after window loads
    setTimeout(() => publishIdle(), 500);
    return win;
  }

  window.POS = window.POS || {};
  window.POS.customerDisplay = {
    publishCart,
    publishPaid,
    publishIdle,
    openCustomerWindow,
    STATE_KEY
  };
})();
