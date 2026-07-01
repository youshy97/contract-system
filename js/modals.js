'use strict';

/**
 * Modal logic: Add Project, Add Purchase Contract, Update Status.
 */

/* ===================== ADD PROJECT ===================== */
function openAddProject() {
  document.getElementById('modalAddProject').classList.remove('hidden');
}

function saveProject() {
  var name = getFieldValue('pj_name');
  if (!name) { showToast('اسم المشروع مطلوب', 'error'); return; }

  var contractNo = getFieldValue('pj_contract_no');
  if (!contractNo) { showToast('رقم العقد مطلوب', 'error'); return; }

  db.projects.push({
    id: generateId(),
    name: name,
    contractNo: contractNo,
    estimatedCost: getFieldNumber('pj_estimated_cost'),
    contractCost: getFieldNumber('pj_contract_cost'),
    beneficiary: getFieldValue('pj_beneficiary'),
    company: getFieldValue('pj_company'),
    manager: getFieldValue('pj_manager'),
    purchaseContracts: [],
  });

  saveData(db);
  closeModal('modalAddProject');
  clearFields(['pj_name', 'pj_contract_no', 'pj_estimated_cost', 'pj_contract_cost', 'pj_beneficiary', 'pj_company', 'pj_manager']);
  showToast('تم إضافة المشروع بنجاح', 'success');
  renderProjectsList();
  renderSidebarProjects();
}

function deleteProject(id) {
  if (!confirm('هل أنت متأكد من حذف هذا المشروع وجميع عقود الشراء المرتبطة به؟')) return;
  db.projects = db.projects.filter(function (p) { return p.id !== id; });
  saveData(db);
  renderProjectsList();
  renderSidebarProjects();
  showToast('تم حذف المشروع', 'success');
}

/* ===================== ADD PURCHASE CONTRACT ===================== */
function openAddPurchaseContract() {
  document.getElementById('modalAddPurchase').classList.remove('hidden');
  renderInstallmentInputs();
}

function renderInstallmentInputs() {
  var n = Number(document.getElementById('pc_installments_count').value);
  var container = document.getElementById('installmentInputs');
  var html = '<div class="text-xs font-bold pt-2 mb-1" style="color:#4d82e8">تفاصيل الدفعات</div>';

  for (var i = 0; i < n; i++) {
    html += '<div class="card-sm p-3">' +
      '<div class="text-xs font-semibold mb-2" style="color:#6b7a90">الدفعة ' + (i + 1) + '</div>' +
      '<div class="grid grid-cols-3 gap-3">' +
        '<div>' +
          '<label class="block text-[10px] mb-1" style="color:#4a5568">المبلغ</label>' +
          '<input class="inst-amount" type="number" placeholder="0">' +
        '</div>' +
        '<div>' +
          '<label class="block text-[10px] mb-1" style="color:#4a5568">العملة</label>' +
          '<select class="inst-currency">' +
            '<option value="USD">دولار USD</option>' +
            '<option value="IQD">دينار IQD</option>' +
          '</select>' +
        '</div>' +
        '<div>' +
          '<label class="block text-[10px] mb-1" style="color:#4a5568">تاريخ الاستحقاق</label>' +
          '<input class="inst-date" type="date">' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  container.innerHTML = html;
}

function savePurchaseContract() {
  var vendor = getFieldValue('pc_vendor');
  if (!vendor) { showToast('اسم المورد مطلوب', 'error'); return; }

  var po = getFieldValue('pc_po');
  if (!po) { showToast('رقم PO مطلوب', 'error'); return; }

  var p = db.projects.find(function (x) { return x.id === currentProjectId; });
  if (!p) return;

  var amounts = Array.from(document.querySelectorAll('.inst-amount')).map(function (el) { return Number(el.value) || 0; });
  var currencies = Array.from(document.querySelectorAll('.inst-currency')).map(function (el) { return el.value; });
  var dates = Array.from(document.querySelectorAll('.inst-date')).map(function (el) { return el.value; });

  var installments = amounts.map(function (amount, idx) {
    return {
      id: generateId(),
      no: idx + 1,
      amount: amount,
      currency: currencies[idx],
      dueDate: dates[idx] || '—',
      paymentStatus: 'unpaid',
      shipmentStatus: 'in_transit',
    };
  });

  p.purchaseContracts.push({
    id: generateId(),
    vendor: vendor,
    po: po,
    contractNo: getFieldValue('pc_contract_no'),
    description: getFieldValue('pc_description'),
    installments: installments
  });

  saveData(db);
  closeModal('modalAddPurchase');
  clearFields(['pc_vendor', 'pc_po', 'pc_contract_no', 'pc_description']);
  showToast('تم إضافة عقد الشراء', 'success');
  document.getElementById('contractsBadge').textContent = p.purchaseContracts.length + ' عقد';
  renderPurchaseContracts(p);
}

function confirmDeletePC(projectId, pcId) {
  if (!confirm('حذف عقد الشراء وجميع دفعاته؟')) return;
  var p = db.projects.find(function (x) { return x.id === projectId; });
  if (!p) return;
  p.purchaseContracts = p.purchaseContracts.filter(function (x) { return x.id !== pcId; });
  saveData(db);
  document.getElementById('contractsBadge').textContent = p.purchaseContracts.length + ' عقد';
  renderPurchaseContracts(p);
  showToast('تم حذف عقد الشراء', 'success');
}

/* ===================== UPDATE STATUS ===================== */
function openUpdateStatus(projectId, pcId, instId) {
  updateTargetKey = projectId + '|' + pcId + '|' + instId;
  var p = db.projects.find(function (x) { return x.id === projectId; });
  var pc = p ? p.purchaseContracts.find(function (x) { return x.id === pcId; }) : null;
  var inst = pc ? pc.installments.find(function (x) { return x.id === instId; }) : null;
  if (!inst) return;
  document.getElementById('us_payment_status').value = inst.paymentStatus;
  document.getElementById('us_shipment_status').value = inst.shipmentStatus;
  document.getElementById('modalUpdateStatus').classList.remove('hidden');
}

function saveInstallmentStatus() {
  if (!updateTargetKey) return;
  var parts = updateTargetKey.split('|');
  var projectId = parts[0];
  var pcId = parts[1];
  var instId = parts[2];
  var p = db.projects.find(function (x) { return x.id === projectId; });
  var pc = p ? p.purchaseContracts.find(function (x) { return x.id === pcId; }) : null;
  var inst = pc ? pc.installments.find(function (x) { return x.id === instId; }) : null;
  if (!inst) return;
  inst.paymentStatus = document.getElementById('us_payment_status').value;
  inst.shipmentStatus = document.getElementById('us_shipment_status').value;
  saveData(db);
  closeModal('modalUpdateStatus');
  showToast('تم تحديث الحالة', 'success');
  renderPurchaseContracts(p);
}
