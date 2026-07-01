'use strict';

/**
 * Data persistence layer using localStorage.
 */
const STORE_KEY = 'erp_v3';

function loadData() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : seedData();
  } catch (e) {
    return seedData();
  }
}

function saveData(data) {
  localStorage.setItem(STORE_KEY, JSON.stringify(data));
}

function seedData() {
  const data = {
    projects: [
      {
        id: 'p1',
        name: 'Riyadh Smart City Core Phase 1',
        contractNo: 'CN-2026-001',
        estimatedCost: 12000000,
        contractCost: 10500000,
        beneficiary: 'أمانة منطقة الرياض',
        company: 'شركة نيوم للتقنية',
        manager: 'John Doe',
        purchaseContracts: [
          {
            id: 'pc1',
            vendor: 'Samsung Electronics',
            po: 'PO-2026-0042',
            contractNo: 'SC-001',
            description: 'أجهزة وشبكات ذكية',
            installments: [
              { id: 'i1', no: 1, amount: 500000, currency: 'USD', dueDate: '2026-05-01', paymentStatus: 'paid', shipmentStatus: 'delivered' },
              { id: 'i2', no: 2, amount: 500000, currency: 'USD', dueDate: '2026-07-15', paymentStatus: 'unpaid', shipmentStatus: 'jebel_ali' },
              { id: 'i3', no: 3, amount: 300000, currency: 'USD', dueDate: '2026-09-01', paymentStatus: 'unpaid', shipmentStatus: 'in_transit' },
            ]
          },
          {
            id: 'pc2',
            vendor: 'Cisco Systems',
            po: 'PO-2026-0087',
            contractNo: 'SC-002',
            description: 'معدات شبكية وتراخيص برمجية',
            installments: [
              { id: 'i4', no: 1, amount: 200000, currency: 'USD', dueDate: '2026-06-10', paymentStatus: 'paid', shipmentStatus: 'warehouse' },
            ]
          },
        ]
      },
      {
        id: 'p2',
        name: 'NEOM Infrastructure Expansion',
        contractNo: 'CN-2026-002',
        estimatedCost: 9400000,
        contractCost: 8500000,
        beneficiary: 'هيئة نيوم',
        company: 'بكتل العالمية',
        manager: 'John Doe',
        purchaseContracts: [
          {
            id: 'pc3',
            vendor: 'Siemens AG',
            po: 'PO-2026-0055',
            contractNo: 'SC-003',
            description: 'معدات كهربائية ثقيلة',
            installments: [
              { id: 'i5', no: 1, amount: 850000, currency: 'USD', dueDate: '2026-06-30', paymentStatus: 'unpaid', shipmentStatus: 'in_transit' },
              { id: 'i6', no: 2, amount: 850000, currency: 'USD', dueDate: '2026-08-30', paymentStatus: 'unpaid', shipmentStatus: 'in_transit' },
            ]
          },
        ]
      },
    ]
  };
  saveData(data);
  return data;
}

function generateId() {
  return 'id_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
}
