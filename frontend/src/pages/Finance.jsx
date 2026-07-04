import { useState, useEffect } from 'react'
import { financeAPI } from '../services/api'
import { DollarSign, FileText, Calendar } from 'lucide-react'

export default function Finance() {
  const [tab, setTab] = useState('invoices')
  const [invoices, setInvoices] = useState([])
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [invRes, schRes] = await Promise.all([
        financeAPI.listInvoices(),
        financeAPI.listSchedules(),
      ])
      setInvoices(invRes.data)
      setSchedules(schRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkPaid = async (invoiceId) => {
    try {
      await financeAPI.updateInvoice(invoiceId, {
        status: 'paid',
        paid_date: new Date().toISOString().split('T')[0],
      })
      loadData()
    } catch (err) {
      alert(err.response?.data?.detail || 'Error')
    }
  }

  if (loading) return <div className="text-center py-12">Loading...</div>

  const totalInvoiced = invoices.reduce((s, i) => s + parseFloat(i.amount), 0)
  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + parseFloat(i.amount), 0)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Finance</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Invoiced</p>
              <p className="text-xl font-bold">${totalInvoiced.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Paid</p>
              <p className="text-xl font-bold text-green-600">${totalPaid.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Outstanding</p>
              <p className="text-xl font-bold text-amber-600">${(totalInvoiced - totalPaid).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button onClick={() => setTab('invoices')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${tab === 'invoices' ? 'bg-white shadow-sm' : 'text-gray-600'}`}>
          Invoices
        </button>
        <button onClick={() => setTab('schedules')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${tab === 'schedules' ? 'bg-white shadow-sm' : 'text-gray-600'}`}>
          Payment Schedules
        </button>
      </div>

      {tab === 'invoices' && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Invoices</h2>
          {invoices.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-6">No invoices yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 font-medium text-gray-500">Invoice #</th>
                    <th className="text-right py-2 px-3 font-medium text-gray-500">Amount</th>
                    <th className="text-right py-2 px-3 font-medium text-gray-500">%</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-500">Status</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-500">Due Date</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map(inv => (
                    <tr key={inv.id} className="border-b border-gray-100">
                      <td className="py-2 px-3 font-mono text-xs">{inv.invoice_number}</td>
                      <td className="py-2 px-3 text-right font-medium">${parseFloat(inv.amount).toLocaleString()}</td>
                      <td className="py-2 px-3 text-right">{parseFloat(inv.percentage)}%</td>
                      <td className="py-2 px-3 text-center">
                        <span className={`badge ${
                          inv.status === 'paid' ? 'bg-green-100 text-green-700' :
                          inv.status === 'overdue' ? 'bg-red-100 text-red-700' :
                          inv.status === 'issued' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>{inv.status}</span>
                      </td>
                      <td className="py-2 px-3 text-gray-500">{inv.due_date || '-'}</td>
                      <td className="py-2 px-3 text-center">
                        {inv.status === 'issued' && (
                          <button onClick={() => handleMarkPaid(inv.id)} className="text-xs text-green-600 font-medium hover:underline">
                            Mark Paid
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'schedules' && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Payment Schedules</h2>
          {schedules.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-6">No payment schedules yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 font-medium text-gray-500">Milestone</th>
                    <th className="text-right py-2 px-3 font-medium text-gray-500">%</th>
                    <th className="text-right py-2 px-3 font-medium text-gray-500">Amount</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-500">Status</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-500">Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map(s => (
                    <tr key={s.id} className="border-b border-gray-100">
                      <td className="py-2 px-3 font-medium">{s.milestone_name}</td>
                      <td className="py-2 px-3 text-right">{parseFloat(s.percentage)}%</td>
                      <td className="py-2 px-3 text-right">${parseFloat(s.amount).toLocaleString()}</td>
                      <td className="py-2 px-3 text-center">
                        <span className={`badge ${
                          s.status === 'paid' ? 'bg-green-100 text-green-700' :
                          s.status === 'invoiced' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>{s.status}</span>
                      </td>
                      <td className="py-2 px-3 text-gray-500">{s.due_date || '-'}</td>
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
