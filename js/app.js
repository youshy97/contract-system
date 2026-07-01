'use strict';

/**
 * Main application entry: state initialization, view router, sidebar, search.
 */

/* ===================== STATE ===================== */
var db = loadData();
var currentProjectId = null;
var updateTargetKey = null; // 'projectId|pcId|instId'

/* ===================== VIEW ROUTER ===================== */
function setView(viewName) {
  var views = ['dashboard', 'projects', 'project-detail', 'reports'];
  views.forEach(function (v) {
    var el = document.getElementById('view-' + v);
    if (el) {
      el.classList.add('hidden');
      el.classList.remove('fade-in');
    }
  });

  var target = document.getElementById('view-' + viewName);
  if (target) {
    target.classList.remove('hidden');
    void target.offsetWidth; // trigger reflow for animation
    target.classList.add('fade-in');
  }

  var sidebarKeys = ['dashboard', 'projects', 'reports'];
  sidebarKeys.forEach(function (s) {
    var btn = document.getElementById('sb-' + s);
    if (btn) btn.classList.toggle('active', s === viewName);
  });

  if (viewName === 'dashboard') renderDashboard();
  if (viewName === 'projects') renderProjectsList();
  if (viewName === 'reports') renderReports();
  renderSidebarProjects();
}

/* ===================== SIDEBAR ===================== */
function renderSidebarProjects() {
  var el = document.getElementById('sidebarProjects');
  el.innerHTML = db.projects.map(function (p) {
    return '<button onclick="openProjectDetail(\'' + p.id + '\')" class="sidebar-item w-full text-right" style="font-size:12px">' +
      '<i data-lucide="folder" style="width:13px;height:13px;flex-shrink:0"></i>' +
      '<span class="truncate">' + p.name + '</span>' +
    '</button>';
  }).join('');
  lucide.createIcons();
}

/* ===================== GLOBAL SEARCH ===================== */
function globalSearch(query) {
  if (!query) {
    setView('projects');
    return;
  }

  var q = query.toLowerCase();
  setView('projects');

  var filtered = db.projects.filter(function (p) {
    return p.name.toLowerCase().includes(q) ||
      p.contractNo.toLowerCase().includes(q) ||
      p.beneficiary.toLowerCase().includes(q) ||
      p.company.toLowerCase().includes(q) ||
      p.purchaseContracts.some(function (pc) {
        return pc.vendor.toLowerCase().includes(q) || pc.po.toLowerCase().includes(q);
      });
  });

  var el = document.getElementById('projectsList');
  if (!filtered.length) {
    el.innerHTML = '<div class="card p-10 text-center" style="color:#4a5568">لا نتائج لـ "' + query + '"</div>';
    return;
  }

  // Render filtered results without mutating db
  el.innerHTML = filtered.map(function (p) {
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

/* ===================== INIT ===================== */
document.addEventListener('DOMContentLoaded', function () {
  lucide.createIcons();
  renderSidebarProjects();
  setView('dashboard');
});

// Close modals on backdrop click
document.querySelectorAll('.modal-bg').forEach(function (modal) {
  modal.addEventListener('click', function (e) {
    if (e.target === modal) modal.classList.add('hidden');
  });
});
