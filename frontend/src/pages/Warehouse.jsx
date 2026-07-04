import { useState, useEffect } from 'react'
import { warehouseAPI } from '../services/api'
import { Package, ArrowRight, Warehouse as WarehouseIcon } from 'lucide-react'

export default function Warehouse() {
  const [tab, setTab] = useState('stock')
  const [stock, setStock] = useState([])
  const [grns, setGRNs] = useState([])
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [stockRes, grnRes, issueRes] = await Promise.all([
        warehouseAPI.listStock(),
        warehouseAPI.listGRN(),
        warehouseAPI.listIssues(),
      ])
      setStock(stockRes.data)
      setGRNs(grnRes.data)
      setIssues(issueRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="text-center py-12">Loading...</div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Warehouse</h1>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {[
          { key: 'stock', label: 'Current Stock' },
          { key: 'grn', label: 'Goods Receipt (GRN)' },
          { key: 'issues', label: 'Material Issues' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'stock' && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Current Stock</h2>
          {stock.length === 0 ? (
            <div className="text-center py-8">
              <WarehouseIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No stock items yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 font-medium text-gray-500">Item</th>
                    <th className="text-right py-2 px-3 font-medium text-gray-500">Total Qty</th>
                    <th className="text-right py-2 px-3 font-medium text-gray-500">Issued</th>
                    <th className="text-right py-2 px-3 font-medium text-gray-500">Available</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-500">Unit</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-500">Location</th>
                  </tr>
                </thead>
                <tbody>
                  {stock.map(s => (
                    <tr key={s.id} className="border-b border-gray-100">
                      <td className="py-2 px-3">{s.item_description}</td>
                      <td className="py-2 px-3 text-right">{parseFloat(s.quantity).toLocaleString()}</td>
                      <td className="py-2 px-3 text-right">{parseFloat(s.quantity_issued).toLocaleString()}</td>
                      <td className="py-2 px-3 text-right font-medium text-green-600">
                        {parseFloat(s.quantity_available).toLocaleString()}
                      </td>
                      <td className="py-2 px-3 text-center">{s.unit || '-'}</td>
                      <td className="py-2 px-3">{s.location || 'Main Warehouse'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'grn' && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Goods Receipt Notes</h2>
          {grns.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-6">No GRNs yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 font-medium text-gray-500">GRN Number</th>
                    <th className="text-right py-2 px-3 font-medium text-gray-500">Received</th>
                    <th className="text-right py-2 px-3 font-medium text-gray-500">Accepted</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-500">Inspection</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-500">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {grns.map(grn => (
                    <tr key={grn.id} className="border-b border-gray-100">
                      <td className="py-2 px-3 font-mono text-xs">{grn.grn_number}</td>
                      <td className="py-2 px-3 text-right">{parseFloat(grn.quantity_received).toLocaleString()}</td>
                      <td className="py-2 px-3 text-right">{parseFloat(grn.quantity_accepted).toLocaleString()}</td>
                      <td className="py-2 px-3 text-center">
                        <span className={`badge ${
                          grn.inspection_status === 'passed' ? 'bg-green-100 text-green-700' :
                          grn.inspection_status === 'failed' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>{grn.inspection_status}</span>
                      </td>
                      <td className="py-2 px-3 text-gray-500">
                        {new Date(grn.received_date).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'issues' && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Material Issues</h2>
          {issues.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-6">No material issues yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 font-medium text-gray-500">Issue #</th>
                    <th className="text-right py-2 px-3 font-medium text-gray-500">Quantity</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-500">Issued To</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-500">Purpose</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-500">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {issues.map(issue => (
                    <tr key={issue.id} className="border-b border-gray-100">
                      <td className="py-2 px-3 font-mono text-xs">{issue.issue_number}</td>
                      <td className="py-2 px-3 text-right">{parseFloat(issue.quantity_issued).toLocaleString()}</td>
                      <td className="py-2 px-3">{issue.issued_to || '-'}</td>
                      <td className="py-2 px-3">{issue.purpose || '-'}</td>
                      <td className="py-2 px-3 text-gray-500">
                        {new Date(issue.issue_date).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
