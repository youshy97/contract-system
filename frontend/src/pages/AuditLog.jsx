import { useState, useEffect } from 'react'
import { auditAPI } from '../services/api'
import { ClipboardList, Filter } from 'lucide-react'

export default function AuditLog() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ entity_type: '', project_id: '' })

  useEffect(() => {
    loadLogs()
  }, [])

  const loadLogs = (params = {}) => {
    setLoading(true)
    auditAPI.getLogs(params)
      .then(res => setLogs(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  const handleFilter = () => {
    const params = {}
    if (filters.entity_type) params.entity_type = filters.entity_type
    if (filters.project_id) params.project_id = parseInt(filters.project_id)
    loadLogs(params)
  }

  const actionColors = {
    create: 'bg-green-100 text-green-700',
    update: 'bg-blue-100 text-blue-700',
    delete: 'bg-red-100 text-red-700',
    approve: 'bg-emerald-100 text-emerald-700',
    reject: 'bg-red-100 text-red-700',
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>

      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <Filter className="w-4 h-4 text-gray-500" />
          <select className="input-field w-auto" value={filters.entity_type}
            onChange={e => setFilters({...filters, entity_type: e.target.value})}>
            <option value="">All Entities</option>
            <option value="project">Project</option>
            <option value="boq">BOQ</option>
            <option value="boq_item">BOQ Item</option>
            <option value="purchase_request">Purchase Request</option>
            <option value="purchase_order">Purchase Order</option>
            <option value="grn">GRN</option>
            <option value="material_issue">Material Issue</option>
            <option value="execution_phase">Execution Phase</option>
            <option value="invoice">Invoice</option>
          </select>
          <input className="input-field w-32" type="number" placeholder="Project ID"
            value={filters.project_id}
            onChange={e => setFilters({...filters, project_id: e.target.value})} />
          <button onClick={handleFilter} className="btn-primary text-sm">Filter</button>
        </div>

        {loading ? (
          <div className="text-center py-6">Loading...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8">
            <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No audit logs found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 font-medium text-gray-500">Timestamp</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-500">Entity</th>
                  <th className="text-center py-2 px-3 font-medium text-gray-500">Action</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-500">Field</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-500">Old Value</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-500">New Value</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-500">Reason</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id} className="border-b border-gray-100">
                    <td className="py-2 px-3 text-xs text-gray-500 whitespace-nowrap">
                      {log.created_at ? new Date(log.created_at).toLocaleString() : '-'}
                    </td>
                    <td className="py-2 px-3">
                      <span className="text-xs font-mono">{log.entity_type}#{log.entity_id}</span>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className={`badge ${actionColors[log.action] || 'bg-gray-100 text-gray-700'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-xs">{log.field_changed || '-'}</td>
                    <td className="py-2 px-3 text-xs text-red-600 max-w-32 truncate">{log.old_value || '-'}</td>
                    <td className="py-2 px-3 text-xs text-green-600 max-w-32 truncate">{log.new_value || '-'}</td>
                    <td className="py-2 px-3 text-xs text-gray-500 max-w-32 truncate">{log.reason || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
