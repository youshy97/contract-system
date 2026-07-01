'use strict';

/**
 * Shared utility functions.
 */

/** Get trimmed value of an input element by ID. */
function getFieldValue(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

/** Get numeric value of an input element by ID. */
function getFieldNumber(id) {
  return Number(document.getElementById(id)?.value) || 0;
}

/** Format a number for display (K/M abbreviation). */
function formatNumber(n) {
  if (!n) return '0';
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
  return n.toLocaleString();
}

/** Close a modal by adding the 'hidden' class. */
function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
}

/** Clear values of multiple input fields by their IDs. */
function clearFields(ids) {
  ids.forEach(function (id) {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
}

/** Calculate days until a given date string. Returns null for invalid dates. */
function daysUntil(dateStr) {
  if (!dateStr || dateStr === '—') return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr);
  due.setHours(0, 0, 0, 0);
  return Math.round((due - today) / 86400000);
}

/** Return HTML for a payment status badge. */
function paymentBadge(status) {
  if (status === 'paid') {
    return '<span class="pill pill-paid">مدفوعة</span>';
  }
  return '<span class="pill pill-unpaid">غير مدفوعة</span>';
}

/** Return HTML for a shipment status badge. */
function shipmentBadge(status) {
  var map = {
    'in_transit': ['pill-transit', 'أثناء الشحن'],
    'jebel_ali': ['pill-jebel', 'جمبل علي'],
    'warehouse': ['pill-warehouse', 'في المخزن'],
    'delivered': ['pill-delivered', 'تم التسليم']
  };
  var entry = map[status] || ['pill-transit', status];
  return '<span class="pill ' + entry[0] + '">' + entry[1] + '</span>';
}

/** Return a readable label for a shipment status key. */
function shipmentLabel(status) {
  var labels = {
    'in_transit': 'أثناء الشحن',
    'jebel_ali': 'جمبل علي',
    'warehouse': 'في المخزن',
    'delivered': 'تم التسليم'
  };
  return labels[status] || status;
}

/** Show a toast notification. */
function showToast(msg, type) {
  type = type || 'info';
  var toast = document.getElementById('toast');
  var toastMsg = document.getElementById('toastMsg');
  var colors = {
    success: 'color:#22c55e;border-color:rgba(34,197,94,.3)',
    error: 'color:#ef4444;border-color:rgba(239,68,68,.3)',
    info: 'color:#4d82e8;border-color:rgba(77,130,232,.3)'
  };
  toastMsg.style.cssText = 'background:#1a2236;border:1px solid #2d3a52;' +
    (colors[type] || colors.info) +
    ';box-shadow:0 8px 32px rgba(0,0,0,.5);border-radius:12px;padding:12px 20px;font-size:14px;font-family:Cairo,sans-serif;display:flex;align-items:center;gap:8px';
  toastMsg.textContent = msg;
  toast.classList.remove('hidden');
  setTimeout(function () {
    toast.classList.add('hidden');
  }, 2800);
}
