// ====================================
// members.js — Members & loyalty points
// ====================================
(function () {
  'use strict';

  const fmt = POS.vat.formatMoney;

  function renderTab() {
    document.getElementById('tab-members').innerHTML = `
      <div class="bg-white rounded-lg p-4 shadow">
        <div class="flex items-center gap-2 mb-4">
          <h2 class="text-lg font-bold mr-auto">👥 สมาชิก</h2>
          <button onclick="POS.members.openForm()" class="bg-blue-600 text-white px-4 py-2 rounded text-sm">+ เพิ่มสมาชิก</button>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-slate-100">
              <tr>
                <th class="text-left p-2">รหัส</th>
                <th class="text-left p-2">ชื่อ</th>
                <th class="text-left p-2">เบอร์โทร</th>
                <th class="text-right p-2">แต้มสะสม</th>
                <th class="text-right p-2">ยอดใช้จ่ายรวม</th>
              </tr>
            </thead>
            <tbody id="membersTable"></tbody>
          </table>
        </div>
      </div>
    `;
    load();
  }

  async function load() {
    try {
      const members = await callApi('getMembers');
      document.getElementById('membersTable').innerHTML = members.map(m => `
        <tr class="border-b">
          <td class="p-2 text-xs">${escapeHtml(m.member_id)}</td>
          <td class="p-2">${escapeHtml(m.name)}</td>
          <td class="p-2">${escapeHtml(m.phone)}</td>
          <td class="p-2 text-right">${m.points}</td>
          <td class="p-2 text-right">${fmt(m.total_spent)}</td>
        </tr>
      `).join('') || '<tr><td colspan="5" class="text-center p-4 text-slate-400">ยังไม่มีสมาชิก</td></tr>';
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  function ensureFormModal() {
    if (document.getElementById('memberFormModal')) return;
    document.getElementById('modalRoot').insertAdjacentHTML('beforeend', `
      <div id="memberFormModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 hidden">
        <div class="bg-white rounded-lg p-6 max-w-md w-11/12">
          <h3 class="text-lg font-bold mb-3">เพิ่มสมาชิก</h3>
          <div class="space-y-2">
            <div><label class="text-sm">ชื่อ *</label><input id="mfName" class="w-full border rounded px-3 py-2"></div>
            <div><label class="text-sm">เบอร์โทร *</label><input id="mfPhone" type="tel" class="w-full border rounded px-3 py-2"></div>
          </div>
          <div class="flex gap-2 mt-4">
            <button onclick="POS.members.saveForm()" class="flex-1 bg-blue-600 text-white py-2 rounded">บันทึก</button>
            <button onclick="POS.members.closeForm()" class="px-4 py-2 border rounded">ยกเลิก</button>
          </div>
        </div>
      </div>
    `);
  }

  function openForm() {
    ensureFormModal();
    document.getElementById('mfName').value = '';
    document.getElementById('mfPhone').value = '';
    document.getElementById('memberFormModal').classList.remove('hidden');
  }

  function closeForm() {
    document.getElementById('memberFormModal').classList.add('hidden');
  }

  async function saveForm() {
    const name = document.getElementById('mfName').value.trim();
    const phone = document.getElementById('mfPhone').value.trim();
    if (!name || !phone) { showToast('กรอกชื่อและเบอร์โทร', 'error'); return; }
    try {
      await callApi('saveMember', { body: { name, phone } });
      showToast('บันทึกสมาชิกแล้ว');
      closeForm();
      load();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  window.POS = window.POS || {};
  window.POS.members = { renderTab, load, openForm, closeForm, saveForm };
})();
