// ====================================
// vat.js — VAT calculations (Thai 7%)
// Prices are VAT-inclusive (e.g. 100฿ already contains VAT)
// ====================================
(function () {
  'use strict';

  const VAT_RATE = 0.07;
  const VAT_DIVISOR = 1 + VAT_RATE;  // 1.07

  /**
   * Extract VAT components from a VAT-inclusive amount.
   * Example: 107 → { netAmount: 100, vatAmount: 7, grossAmount: 107 }
   */
  function fromInclusive(grossAmount) {
    const gross = Number(grossAmount) || 0;
    const net = gross / VAT_DIVISOR;
    const vat = gross - net;
    return {
      netAmount: roundMoney(net),
      vatAmount: roundMoney(vat),
      grossAmount: roundMoney(gross)
    };
  }

  /**
   * Add VAT to a VAT-exclusive amount.
   * Example: 100 → { netAmount: 100, vatAmount: 7, grossAmount: 107 }
   */
  function fromExclusive(netAmount) {
    const net = Number(netAmount) || 0;
    const vat = net * VAT_RATE;
    const gross = net + vat;
    return {
      netAmount: roundMoney(net),
      vatAmount: roundMoney(vat),
      grossAmount: roundMoney(gross)
    };
  }

  function roundMoney(n) {
    return Math.round(Number(n) * 100) / 100;
  }

  function formatMoney(n) {
    return Number(n).toLocaleString('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  // Export
  window.POS = window.POS || {};
  window.POS.vat = {
    VAT_RATE,
    fromInclusive,
    fromExclusive,
    roundMoney,
    formatMoney
  };
})();
