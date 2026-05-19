// ====================================
// api.js — Google Apps Script API calls
// ====================================
(function () {
  'use strict';

  const STORAGE_KEY_API_URL = 'pos_api_url';

  let apiUrl = localStorage.getItem(STORAGE_KEY_API_URL) || '';

  function getApiUrl() { return apiUrl; }
  function setApiUrl(url) {
    apiUrl = url;
    localStorage.setItem(STORAGE_KEY_API_URL, url);
  }

  async function callApi(action, options = {}) {
    if (!apiUrl) {
      showToast('ยังไม่ได้ตั้งค่า API URL', 'error');
      window.openSetup && window.openSetup();
      throw new Error('No API URL');
    }

    const params = new URLSearchParams({ action, ...(options.params || {}) });
    const url = apiUrl + '?' + params.toString();
    const config = options.body
      ? { method: 'POST', body: JSON.stringify(options.body) }
      : { method: 'GET' };

    const res = await fetch(url, config);
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || 'API error');
    return json.data;
  }

  window.POS = window.POS || {};
  window.POS.api = { callApi, getApiUrl, setApiUrl };
  window.callApi = callApi;
})();
