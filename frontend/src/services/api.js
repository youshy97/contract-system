import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1'

const api = axios.create({ baseURL: API_BASE })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('erp_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('erp_token')
      localStorage.removeItem('erp_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  login: (email, password) => api.post('/auth/login', new URLSearchParams({ username: email, password })),
  register: (data) => api.post('/auth/register', data),
}

export const projectsAPI = {
  list: (params) => api.get('/projects', { params }),
  get: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
}

export const boqAPI = {
  listByProject: (projectId) => api.get(`/boq/project/${projectId}`),
  get: (id) => api.get(`/boq/${id}`),
  create: (data) => api.post('/boq', data),
  newVersion: (id, data) => api.post(`/boq/${id}/new-version`, data),
  addSection: (boqId, data) => api.post(`/boq/${boqId}/sections`, data),
  addItem: (boqId, sectionId, data) => api.post(`/boq/${boqId}/sections/${sectionId}/items`, data),
  updateItem: (itemId, data) => api.put(`/boq/items/${itemId}`, data),
  submitReview: (id) => api.post(`/boq/${id}/submit-review`),
  approve: (id) => api.post(`/boq/${id}/approve`),
  reject: (id, reason) => api.post(`/boq/${id}/reject`, null, { params: { reason } }),
  sendToCustomer: (id) => api.post(`/boq/${id}/send-to-customer`),
}

export const procurementAPI = {
  listSuppliers: (params) => api.get('/procurement/suppliers', { params }),
  createSupplier: (data) => api.post('/procurement/suppliers', data),
  listPR: (params) => api.get('/procurement/pr', { params }),
  createPR: (data) => api.post('/procurement/pr', data),
  approvePR: (id) => api.post(`/procurement/pr/${id}/approve`),
  listPO: (params) => api.get('/procurement/po', { params }),
  createPO: (data) => api.post('/procurement/po', data),
  updatePO: (id, data) => api.put(`/procurement/po/${id}`, data),
  listComparisons: (prId) => api.get(`/procurement/comparison/${prId}`),
  createComparison: (data) => api.post('/procurement/comparison', data),
}

export const warehouseAPI = {
  listGRN: (params) => api.get('/warehouse/grn', { params }),
  createGRN: (data) => api.post('/warehouse/grn', data),
  updateGRN: (id, data) => api.put(`/warehouse/grn/${id}`, data),
  listStock: (params) => api.get('/warehouse/stock', { params }),
  listIssues: (params) => api.get('/warehouse/issues', { params }),
  issueMaterial: (data) => api.post('/warehouse/issues', data),
}

export const executionAPI = {
  listPhases: (projectId) => api.get(`/execution/project/${projectId}`),
  createPhase: (data) => api.post('/execution/phases', data),
  updatePhase: (id, data) => api.put(`/execution/phases/${id}`, data),
}

export const financeAPI = {
  listInvoices: (params) => api.get('/finance/invoices', { params }),
  createInvoice: (data) => api.post('/finance/invoices', data),
  updateInvoice: (id, data) => api.put(`/finance/invoices/${id}`, data),
  listSchedules: (params) => api.get('/finance/payment-schedules', { params }),
  createSchedule: (data) => api.post('/finance/payment-schedules', data),
}

export const dashboardAPI = {
  getSummary: () => api.get('/dashboard/summary'),
  getProjectSummary: (id) => api.get(`/dashboard/project/${id}/summary`),
}

export const auditAPI = { getLogs: (params) => api.get('/audit/logs', { params }) }
export const usersAPI = { getMe: () => api.get('/users/me'), list: () => api.get('/users') }
export default api
