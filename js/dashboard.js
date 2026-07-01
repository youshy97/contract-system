'use strict';

/**
 * Dashboard view: KPI cards, logistics pipeline, charts, recent activity.
 */

var barChartInstance = null;
var donutChartInstance = null;

function renderDashboard() {
  var projects = db.projects;
  var allPCs = projects.flatMap(function (p) { return p.purchaseContracts; });
  var allInst = allPCs.flatMap(function (pc) { return pc.installments; });

  // KPIs
  var totalContractValue = projects.reduce(function (s, p) { return s + Number(p.contractCost); }, 0);
  var vendorCount = new Set(allPCs.map(function (pc) { return pc.vendor; })).size;
  var activeProjects = projects.length;
  var unpaid = allInst.filter(function (i) { return i.paymentStatus === 'unpaid'; }).length;

  document.getElementById('kpiCards').innerHTML =
    '<div class="stat-card sc-orange">' +
      '<div class="flex items-center justify-between mb-3">' +
        '<span class="text-xs font-semibold" style="color:#6b7a90">عقود الموردين</span>' +
        '<div class="w-9 h-9 rounded-lg flex items-center justify-center" style="background:rgba(245,158,11,.12)">' +
          '<i data-lucide="truck" style="width:17px;height:17px;color:#f59e0b"></i>' +
        '</div>' +
      '</div>' +
      '<div class="text-3xl font-extrabold text-white">' + allPCs.length + '</div>' +
      '<div class="text-xs mt-1" style="color:#6b7a90">إجمالي عقود الشراء النشطة</div>' +
    '</div>' +
    '<div class="stat-card sc-blue">' +
      '<div class="flex items-center justify-between mb-3">' +
        '<span class="text-xs font-semibold" style="color:#6b7a90">قيمة العقود الرئيسية</span>' +
        '<div class="w-9 h-9 rounded-lg flex items-center justify-center" style="background:rgba(59,111,212,.12)">' +
          '<i data-lucide="dollar-sign" style="width:17px;height:17px;color:#4d82e8"></i>' +
        '</div>' +
      '</div>' +
      '<div class="text-3xl font-extrabold text-white">$' + formatNumber(totalContractValue) + '</div>' +
      '<div class="text-xs mt-1" style="color:#6b7a90">إجمالي قيمة عقود المشاريع</div>' +
    '</div>' +
    '<div class="stat-card sc-green">' +
      '<div class="flex items-center justify-between mb-3">' +
        '<span class="text-xs font-semibold" style="color:#6b7a90">المشاريع النشطة</span>' +
        '<div class="w-9 h-9 rounded-lg flex items-center justify-center" style="background:rgba(34,197,94,.12)">' +
          '<i data-lucide="zap" style="width:17px;height:17px;color:#22c55e"></i>' +
        '</div>' +
      '</div>' +
      '<div class="text-3xl font-extrabold text-white">' + activeProjects + '</div>' +
      '<div class="text-xs mt-1" style="color:#6b7a90">مشاريع قيد التنفيذ</div>' +
    '</div>' +
    '<div class="stat-card sc-purple">' +
      '<div class="flex items-center justify-between mb-3">' +
        '<span class="text-xs font-semibold" style="color:#6b7a90">دفعات معلقة</span>' +
        '<div class="w-9 h-9 rounded-lg flex items-center justify-center" style="background:rgba(239,68,68,.12)">' +
          '<i data-lucide="alert-triangle" style="width:17px;height:17px;color:#ef4444"></i>' +
        '</div>' +
      '</div>' +
      '<div class="text-3xl font-extrabold text-white">' + unpaid + '</div>' +
      '<div class="text-xs mt-1" style="color:#6b7a90">دفعات غير مدفوعة</div>' +
    '</div>';

  // Logistics pipeline
  var statuses = [
    { key: 'in_transit', label: 'قيد الشحن الدولي', icon: 'plane', color: '#4d82e8' },
    { key: 'jebel_ali', label: 'في الميناء', icon: 'anchor', color: '#f59e0b' },
    { key: 'warehouse', label: 'التخليص الجمركي', icon: 'package-check', color: '#06b6d4' },
    { key: 'delivered', label: 'داخل المستودع', icon: 'warehouse', color: '#22c55e' },
    { key: 'total', label: 'إجمالي الشحنات', icon: 'boxes', color: '#8b5cf6' },
  ];

  document.getElementById('logisticsPipeline').innerHTML = statuses.map(function (s) {
    var count = s.key === 'total'
      ? allInst.length
      : allInst.filter(function (i) { return i.shipmentStatus === s.key; }).length;
    return '<div class="card-sm p-4 text-center">' +
      '<div class="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center" style="background:' + s.color + '18">' +
        '<i data-lucide="' + s.icon + '" style="width:18px;height:18px;color:' + s.color + '"></i>' +
      '</div>' +
      '<div class="text-2xl font-extrabold text-white">' + count + '</div>' +
      '<div class="text-[11px] mt-0.5" style="color:#6b7a90">' + s.label + '</div>' +
    '</div>';
  }).join('');

  // Bar Chart
  var barData = [
    allInst.filter(function (i) { return i.shipmentStatus === 'in_transit'; }).length,
    allInst.filter(function (i) { return i.shipmentStatus === 'warehouse'; }).length,
    allInst.filter(function (i) { return i.shipmentStatus === 'jebel_ali'; }).length,
    allInst.filter(function (i) { return i.paymentStatus === 'unpaid'; }).length,
    allInst.filter(function (i) { return i.paymentStatus === 'paid'; }).length,
    allInst.filter(function (i) { return i.shipmentStatus === 'delivered'; }).length,
  ];
  var barLabels = ['أثناء الشحن', 'في المخزن', 'جمبل علي', 'غير مدفوع', 'مدفوع', 'تم التسليم'];
  var barColors = ['#4d82e8', '#06b6d4', '#f59e0b', '#ef4444', '#22c55e', '#22c55e'];

  if (barChartInstance) barChartInstance.destroy();
  var barCtx = document.getElementById('barChart').getContext('2d');
  barChartInstance = new Chart(barCtx, {
    type: 'bar',
    data: {
      labels: barLabels,
      datasets: [{
        data: barData,
        backgroundColor: barColors.map(function (c) { return c + '99'; }),
        borderColor: barColors,
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: function (c) { return 'العدد: ' + c.raw; } } }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255,255,255,.04)', drawBorder: false },
          ticks: { color: '#6b7a90', font: { size: 10, family: 'Cairo' } }
        },
        y: {
          grid: { color: 'rgba(255,255,255,.04)', drawBorder: false },
          ticks: { color: '#6b7a90', stepSize: 1, font: { size: 10 } },
          beginAtZero: true
        },
      }
    }
  });

  // Donut Chart
  var totalVendors = allInst.reduce(function (s, i) { return s + Number(i.amount); }, 0);
  var totalMain = totalContractValue;
  if (donutChartInstance) donutChartInstance.destroy();
  var donutCtx = document.getElementById('donutChart').getContext('2d');
  donutChartInstance = new Chart(donutCtx, {
    type: 'doughnut',
    data: {
      labels: ['قيمة العقد الرئيسية', 'حق الموردين'],
      datasets: [{
        data: [totalMain, totalVendors],
        backgroundColor: ['#4d82e8cc', '#f59e0bcc'],
        borderColor: ['#4d82e8', '#f59e0b'],
        borderWidth: 2,
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '68%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#8899aa', font: { size: 11, family: 'Cairo' }, boxWidth: 12, padding: 16 }
        },
        tooltip: { callbacks: { label: function (c) { return '$' + formatNumber(c.raw); } } }
      }
    }
  });

  // Recent Activity
  var acts = [];
  db.projects.forEach(function (p) {
    p.purchaseContracts.forEach(function (pc) {
      pc.installments.forEach(function (i) {
        acts.push({
          project: p.name,
          event: pc.vendor + ' — الدفعة #' + i.no + ' — ' + shipmentLabel(i.shipmentStatus),
          user: 'John Doe',
          date: i.dueDate
        });
      });
    });
  });
  acts.sort(function (a, b) { return b.date.localeCompare(a.date); });

  document.getElementById('activityRows').innerHTML = acts.slice(0, 6).map(function (a) {
    return '<div class="grid items-center px-5 py-3 table-row text-sm" style="grid-template-columns:2fr 3fr 1fr 1fr">' +
      '<span class="font-semibold truncate" style="color:#c9d5e8;max-width:180px">' + a.project + '</span>' +
      '<span style="color:#8899aa;font-size:12px">' + a.event + '</span>' +
      '<span style="color:#6b7a90;font-size:12px">' + a.user + '</span>' +
      '<span class="text-left" style="color:#4a5568;font-size:11px;font-family:monospace">' + a.date + '</span>' +
    '</div>';
  }).join('') || '<div class="px-5 py-8 text-center text-sm" style="color:#4a5568">لا توجد نشاطات</div>';

  lucide.createIcons();
}
