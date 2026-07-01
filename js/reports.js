'use strict';

/**
 * Reports view rendering.
 */

function renderReports() {
  var el = document.getElementById('reportsContent');
  var html = '<div class="grid grid-cols-3 gap-4 mb-6">';

  db.projects.forEach(function (p) {
    var allInst = p.purchaseContracts.flatMap(function (pc) { return pc.installments; });
    var paid = allInst.filter(function (i) { return i.paymentStatus === 'paid'; })
      .reduce(function (s, i) { return s + i.amount; }, 0);
    var total = allInst.reduce(function (s, i) { return s + i.amount; }, 0);
    var pct = total ? Math.round(paid / total * 100) : 0;

    html += '<div class="card p-4">' +
      '<div class="font-bold text-white text-sm mb-3 truncate">' + p.name + '</div>' +
      '<div class="space-y-2 text-xs">' +
        '<div class="flex justify-between"><span style="color:#6b7a90">عقد الشراء</span><span class="text-white">' + p.contractNo + '</span></div>' +
        '<div class="flex justify-between"><span style="color:#6b7a90">كلفة العقد</span><span class="text-white">$' + formatNumber(p.contractCost) + '</span></div>' +
        '<div class="flex justify-between"><span style="color:#6b7a90">المدفوع</span><span style="color:#22c55e">$' + formatNumber(paid) + '</span></div>' +
        '<div class="flex justify-between"><span style="color:#6b7a90">المتبقي</span><span style="color:#ef4444">$' + formatNumber(total - paid) + '</span></div>' +
        '<div class="flex justify-between"><span style="color:#6b7a90">عقود الشراء</span><span class="text-white">' + p.purchaseContracts.length + '</span></div>' +
      '</div>' +
      '<div class="mt-3">' +
        '<div style="height:4px;background:#1e2a40;border-radius:99px;overflow:hidden">' +
          '<div style="height:100%;width:' + pct + '%;background:#22c55e;border-radius:99px"></div>' +
        '</div>' +
        '<div class="text-right text-[10px] mt-1" style="color:#22c55e">' + pct + '% مكتمل</div>' +
      '</div>' +
    '</div>';
  });

  html += '</div>';

  // Detailed table
  var tableHeaders = ['المشروع', 'المورد', 'رقم PO', 'الدفعة', 'المبلغ', 'تاريخ الاستحقاق', 'حالة الدفع', 'حالة الشحن'];
  var headerCells = tableHeaders.map(function (h) {
    return '<th class="text-right px-4 py-3 text-[11px] font-semibold" style="color:#4a5568">' + h + '</th>';
  }).join('');

  var tableRows = db.projects.flatMap(function (p) {
    return p.purchaseContracts.flatMap(function (pc) {
      return pc.installments.map(function (i) {
        var amountDisplay = i.currency === 'IQD'
          ? formatNumber(i.amount) + ' د.ع'
          : '$' + formatNumber(i.amount);
        return '<tr class="table-row text-sm">' +
          '<td class="px-4 py-2.5 font-semibold" style="color:#c9d5e8;max-width:150px"><div class="truncate">' + p.name + '</div></td>' +
          '<td class="px-4 py-2.5" style="color:#8899aa">' + pc.vendor + '</td>' +
          '<td class="px-4 py-2.5 font-mono text-xs" style="color:#6b7a90">' + pc.po + '</td>' +
          '<td class="px-4 py-2.5"><span class="badge-no">#' + i.no + '</span></td>' +
          '<td class="px-4 py-2.5 font-bold text-white">' + amountDisplay + '</td>' +
          '<td class="px-4 py-2.5 text-xs" style="color:#8899aa">' + i.dueDate + '</td>' +
          '<td class="px-4 py-2.5">' + paymentBadge(i.paymentStatus) + '</td>' +
          '<td class="px-4 py-2.5">' + shipmentBadge(i.shipmentStatus) + '</td>' +
        '</tr>';
      });
    });
  }).join('');

  html += '<div class="card overflow-hidden">' +
    '<div class="px-5 py-3 border-b font-bold text-white text-sm" style="border-color:#1e2a40;background:#141b2d">جدول عقود الشراء التفصيلي</div>' +
    '<div class="overflow-x-auto">' +
      '<table style="width:100%;border-collapse:collapse">' +
        '<thead>' +
          '<tr style="background:#0d1117;border-bottom:1px solid #1e2a40">' + headerCells + '</tr>' +
        '</thead>' +
        '<tbody>' + tableRows + '</tbody>' +
      '</table>' +
    '</div>' +
  '</div>';

  el.innerHTML = html;
  lucide.createIcons();
}
