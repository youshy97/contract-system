'use strict';

/**
 * Projects list view and project detail view rendering.
 */

function renderProjectsList() {
  var el = document.getElementById('projectsList');
  if (!db.projects.length) {
    el.innerHTML = '<div class="card p-12 text-center">' +
      '<i data-lucide="folder-plus" style="width:40px;height:40px;color:#2d3a52;margin:0 auto 12px"></i>' +
      '<p style="color:#4a5568">لا توجد مشاريع. أضف مشروعاً جديداً.</p></div>';
    lucide.createIcons();
    return;
  }

  el.innerHTML = db.projects.map(function (p) {
    var pcs = p.purchaseContracts;
    var allInst = pcs.flatMap(function (pc) { return pc.installments; });
    var paid = allInst.filter(function (i) { return i.paymentStatus === 'paid'; })
      .reduce(function (s, i) { return s + i.amount; }, 0);
    var total = allInst.reduce(function (s, i) { return s + i.amount; }, 0);
    var pct = total ? Math.round(paid / total * 100) : 0;
    var progressColor = pct >= 75 ? '#22c55e' : pct >= 40 ? '#f59e0b' : '#ef4444';

    return '<div class="card p-5 cursor-pointer hover:border-blue-800 transition-colors" style="border-color:#1e2a40" onclick="openProjectDetail(\'' + p.id + '\')">' +
      '<div class="flex items-start justify-between mb-4">' +
        '<div class="flex-1">' +
          '<div class="flex items-center gap-3 mb-1">' +
            '<span class="w-2 h-2 rounded-full" style="background:' + progressColor + ';flex-shrink:0"></span>' +
            '<h3 class="text-white font-bold text-base">' + p.name + '</h3>' +
          '</div>' +
          '<div class="flex items-center gap-3 text-xs" style="color:#6b7a90;padding-right:20px">' +
            '<span>' + p.contractNo + '</span>' +
            '<span>&middot;</span><span>' + p.beneficiary + '</span>' +
            '<span>&middot;</span><span>م.م: ' + p.manager + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="flex items-center gap-2">' +
          '<span class="text-xs px-3 py-1 rounded-full font-semibold" style="background:rgba(59,111,212,.12);color:#4d82e8">' + pcs.length + ' عقد شراء</span>' +
          '<button onclick="event.stopPropagation();deleteProject(\'' + p.id + '\')" class="btn-danger text-xs px-2 py-1"><i data-lucide="trash-2" style="width:13px;height:13px"></i></button>' +
        '</div>' +
      '</div>' +
      '<div class="grid grid-cols-4 gap-4 mb-4">' +
        '<div class="card-sm p-3">' +
          '<div class="text-[10px] font-semibold mb-1" style="color:#6b7a90">الكلفة التخمينية</div>' +
          '<div class="font-bold text-sm text-white">$' + formatNumber(p.estimatedCost) + '</div>' +
        '</div>' +
        '<div class="card-sm p-3">' +
          '<div class="text-[10px] font-semibold mb-1" style="color:#6b7a90">كلفة العقد</div>' +
          '<div class="font-bold text-sm text-white">$' + formatNumber(p.contractCost) + '</div>' +
        '</div>' +
        '<div class="card-sm p-3">' +
          '<div class="text-[10px] font-semibold mb-1" style="color:#6b7a90">إجمالي مدفوع</div>' +
          '<div class="font-bold text-sm" style="color:#22c55e">$' + formatNumber(paid) + '</div>' +
        '</div>' +
        '<div class="card-sm p-3">' +
          '<div class="text-[10px] font-semibold mb-1" style="color:#6b7a90">الشركة المنفذة</div>' +
          '<div class="font-bold text-sm text-white truncate">' + p.company + '</div>' +
        '</div>' +
      '</div>' +
      '<div>' +
        '<div class="flex justify-between text-[11px] mb-1.5" style="color:#6b7a90">' +
          '<span>نسبة السداد</span><span style="color:' + progressColor + '">' + pct + '%</span>' +
        '</div>' +
        '<div style="height:5px;background:#1e2a40;border-radius:99px;overflow:hidden">' +
          '<div style="height:100%;width:' + pct + '%;background:' + progressColor + ';border-radius:99px;transition:.5s"></div>' +
        '</div>' +
      '</div>' +
    '</div>';
  }).join('');

  lucide.createIcons();
}

function openProjectDetail(id) {
  currentProjectId = id;
  setView('project-detail');
  var p = db.projects.find(function (x) { return x.id === id; });
  if (!p) return;

  document.getElementById('detailProjectName').textContent = p.name;
  document.getElementById('contractsBadge').textContent = p.purchaseContracts.length + ' عقد';

  // Header Card
  var allInst = p.purchaseContracts.flatMap(function (pc) { return pc.installments; });
  var paid = allInst.filter(function (i) { return i.paymentStatus === 'paid'; })
    .reduce(function (s, i) { return s + i.amount; }, 0);

  document.getElementById('detailProjectCard').innerHTML =
    '<div class="grid grid-cols-3 gap-6 mb-5">' +
      '<div>' +
        '<div class="text-[10px] font-semibold mb-1" style="color:#6b7a90">اسم المشروع</div>' +
        '<div class="font-bold text-white">' + p.name + '</div>' +
      '</div>' +
      '<div>' +
        '<div class="text-[10px] font-semibold mb-1" style="color:#6b7a90">رقم العقد الرئيسي</div>' +
        '<div class="font-bold" style="color:#4d82e8">' + p.contractNo + '</div>' +
      '</div>' +
      '<div>' +
        '<div class="text-[10px] font-semibold mb-1" style="color:#6b7a90">الجهة المستفيدة</div>' +
        '<div class="font-bold text-white">' + p.beneficiary + '</div>' +
      '</div>' +
    '</div>' +
    '<div class="grid grid-cols-4 gap-4 mb-5">' +
      '<div class="card-sm p-3">' +
        '<div class="text-[10px] mb-1" style="color:#6b7a90">الكلفة التخمينية</div>' +
        '<div class="font-bold text-white">$' + formatNumber(p.estimatedCost) + '</div>' +
      '</div>' +
      '<div class="card-sm p-3">' +
        '<div class="text-[10px] mb-1" style="color:#6b7a90">كلفة العقد</div>' +
        '<div class="font-bold" style="color:#4d82e8">$' + formatNumber(p.contractCost) + '</div>' +
      '</div>' +
      '<div class="card-sm p-3">' +
        '<div class="text-[10px] mb-1" style="color:#6b7a90">المدفوع من المشتريات</div>' +
        '<div class="font-bold" style="color:#22c55e">$' + formatNumber(paid) + '</div>' +
      '</div>' +
      '<div class="card-sm p-3">' +
        '<div class="text-[10px] mb-1" style="color:#6b7a90">الشركة المنفذة</div>' +
        '<div class="font-bold text-white text-xs truncate">' + p.company + '</div>' +
      '</div>' +
    '</div>' +
    '<div class="flex items-center gap-6 text-sm" style="color:#8899aa">' +
      '<span>مدير المشروع: <span class="text-white font-semibold">' + p.manager + '</span></span>' +
    '</div>';

  renderPurchaseContracts(p);
  lucide.createIcons();
}

function renderPurchaseContracts(p) {
  var el = document.getElementById('purchaseContractsList');
  if (!p.purchaseContracts.length) {
    el.innerHTML = '<div class="card p-10 text-center"><p style="color:#4a5568">لا توجد عقود شراء. أضف عقد شراء جديد.</p></div>';
    lucide.createIcons();
    return;
  }

  el.innerHTML = p.purchaseContracts.map(function (pc) {
    var instTotal = pc.installments.reduce(function (s, i) { return s + i.amount; }, 0);
    var paidCount = pc.installments.filter(function (i) { return i.paymentStatus === 'paid'; }).length;

    var installmentRows = pc.installments.map(function (i) {
      var due = daysUntil(i.dueDate);
      var isDue = due !== null && due <= 3 && i.paymentStatus !== 'paid';
      var amountDisplay = i.currency === 'IQD'
        ? formatNumber(i.amount) + ' د.ع'
        : '$' + formatNumber(i.amount);
      var dueDateColor = isDue ? '#ef4444' : '#8899aa';
      var dueDateIndicator = isDue
        ? '<span style="display:inline-block;width:6px;height:6px;border-radius:99px;background:#ef4444;margin-left:6px;animation:pulse 1.5s infinite"></span>'
        : '';

      return '<tr class="table-row">' +
        '<td class="px-4 py-3"><span class="badge-no">#' + i.no + '</span></td>' +
        '<td class="px-4 py-3 font-bold text-white text-sm">' + amountDisplay + '</td>' +
        '<td class="px-4 py-3 text-sm" style="color:' + dueDateColor + '">' + dueDateIndicator + i.dueDate + '</td>' +
        '<td class="px-4 py-3">' + paymentBadge(i.paymentStatus) + '</td>' +
        '<td class="px-4 py-3">' + shipmentBadge(i.shipmentStatus) + '</td>' +
        '<td class="px-4 py-3 text-left">' +
          '<button onclick="openUpdateStatus(\'' + p.id + '\',\'' + pc.id + '\',\'' + i.id + '\')" ' +
            'class="text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors" ' +
            'style="background:rgba(59,111,212,.1);color:#4d82e8;border:1px solid rgba(59,111,212,.2);cursor:pointer">' +
            'تحديث الحالة</button>' +
        '</td>' +
      '</tr>';
    }).join('');

    return '<div class="card overflow-hidden">' +
      '<div class="flex items-center justify-between px-5 py-4 border-b" style="border-color:#1e2a40;background:#141b2d">' +
        '<div class="flex items-center gap-3">' +
          '<div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background:rgba(59,111,212,.15)">' +
            '<i data-lucide="file-text" style="width:15px;height:15px;color:#4d82e8"></i>' +
          '</div>' +
          '<div>' +
            '<div class="font-bold text-white text-sm">' + pc.vendor + '</div>' +
            '<div class="text-[11px] mt-0.5" style="color:#6b7a90">PO: ' + pc.po + ' &nbsp;|&nbsp; ' + (pc.contractNo || '—') + ' &nbsp;|&nbsp; ' + (pc.description || '') + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="flex items-center gap-3">' +
          '<div class="text-right">' +
            '<div class="font-bold text-white">$' + formatNumber(instTotal) + '</div>' +
            '<div class="text-[11px]" style="color:#22c55e">مدفوع ' + paidCount + '/' + pc.installments.length + '</div>' +
          '</div>' +
          '<button onclick="confirmDeletePC(\'' + p.id + '\',\'' + pc.id + '\')" class="btn-danger text-xs p-1.5">' +
            '<i data-lucide="trash-2" style="width:13px;height:13px"></i>' +
          '</button>' +
        '</div>' +
      '</div>' +
      '<div class="overflow-x-auto">' +
        '<table style="width:100%;border-collapse:collapse">' +
          '<thead>' +
            '<tr style="background:#0d1117;border-bottom:1px solid #1e2a40">' +
              '<th class="text-right px-4 py-2.5 text-[11px] font-semibold" style="color:#4a5568">رقم الدفعة</th>' +
              '<th class="text-right px-4 py-2.5 text-[11px] font-semibold" style="color:#4a5568">المبلغ</th>' +
              '<th class="text-right px-4 py-2.5 text-[11px] font-semibold" style="color:#4a5568">تاريخ الاستحقاق</th>' +
              '<th class="text-right px-4 py-2.5 text-[11px] font-semibold" style="color:#4a5568">حالة الدفعة</th>' +
              '<th class="text-right px-4 py-2.5 text-[11px] font-semibold" style="color:#4a5568">حالة الشحنة</th>' +
              '<th class="px-4 py-2.5"></th>' +
            '</tr>' +
          '</thead>' +
          '<tbody>' + installmentRows + '</tbody>' +
        '</table>' +
      '</div>' +
    '</div>';
  }).join('');

  lucide.createIcons();
}
