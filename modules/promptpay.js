// ====================================
// promptpay.js — Thai PromptPay QR generator
// Implements EMV QR Code standard for Thailand
// Refs: BOT (Bank of Thailand) PromptPay specification
// ====================================
(function () {
  'use strict';

  // EMV Tag IDs
  const TAG_PAYLOAD_FORMAT = '00';
  const TAG_POI_METHOD = '01';
  const TAG_MERCHANT_ACCOUNT = '29';
  const TAG_COUNTRY = '58';
  const TAG_CURRENCY = '53';
  const TAG_AMOUNT = '54';
  const TAG_CRC = '63';

  const PROMPTPAY_AID = 'A000000677010111';
  const COUNTRY_TH = 'TH';
  const CURRENCY_THB = '764';

  /**
   * Generate PromptPay QR payload string.
   * @param {string} target - phone (10 digits) or national ID (13 digits) or ewallet (15 digits)
   * @param {number} amount - amount in THB (optional)
   * @returns {string} EMV-formatted payload
   */
  function generatePayload(target, amount) {
    const cleanTarget = String(target).replace(/[^0-9]/g, '');
    const targetField = formatTarget(cleanTarget);

    const merchantAccount = tlv('00', PROMPTPAY_AID) + tlv(getTargetTag(cleanTarget), targetField);

    const fields = [
      tlv(TAG_PAYLOAD_FORMAT, '01'),
      tlv(TAG_POI_METHOD, amount > 0 ? '12' : '11'),  // 12 = dynamic, 11 = static
      tlv(TAG_MERCHANT_ACCOUNT, merchantAccount),
      tlv(TAG_COUNTRY, COUNTRY_TH),
      tlv(TAG_CURRENCY, CURRENCY_THB)
    ];

    if (amount > 0) {
      fields.push(tlv(TAG_AMOUNT, Number(amount).toFixed(2)));
    }

    const payloadWithoutCrc = fields.join('') + TAG_CRC + '04';
    const crc = computeCrc16(payloadWithoutCrc);
    return payloadWithoutCrc + crc;
  }

  function tlv(tag, value) {
    const len = String(value.length).padStart(2, '0');
    return tag + len + value;
  }

  /**
   * Format target according to its type.
   * Phone (10 digits): "0812345678" → "0066812345678" (with country code, drop leading 0)
   * National ID (13 digits): kept as-is
   * E-wallet (15 digits): kept as-is
   */
  function formatTarget(cleanTarget) {
    if (cleanTarget.length === 10) {
      // Phone number: prepend "0066" and drop leading 0
      return '0066' + cleanTarget.substring(1);
    }
    return cleanTarget;
  }

  /**
   * Get sub-tag for the target type within the merchant account field.
   * 01 = phone, 02 = national ID, 03 = ewallet
   */
  function getTargetTag(cleanTarget) {
    if (cleanTarget.length === 10) return '01';
    if (cleanTarget.length === 13) return '02';
    if (cleanTarget.length === 15) return '03';
    throw new Error('Invalid PromptPay target: must be 10, 13, or 15 digits');
  }

  /**
   * CRC-16/CCITT-FALSE (used by EMV QR).
   * Polynomial: 0x1021, Initial: 0xFFFF, no reflection, no XOR out.
   */
  function computeCrc16(input) {
    let crc = 0xFFFF;
    for (let i = 0; i < input.length; i++) {
      crc ^= input.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++) {
        crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) & 0xFFFF : (crc << 1) & 0xFFFF;
      }
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
  }

  /**
   * Validate a target string.
   * @returns {string|null} error message or null if valid
   */
  function validateTarget(target) {
    const clean = String(target).replace(/[^0-9]/g, '');
    if (![10, 13, 15].includes(clean.length)) {
      return 'ต้องเป็นเบอร์โทร 10 หลัก, เลขบัตรประชาชน 13 หลัก, หรือ e-wallet 15 หลัก';
    }
    return null;
  }

  window.POS = window.POS || {};
  window.POS.promptpay = { generatePayload, validateTarget };
})();
