import { useState, useEffect } from 'react'
import { procurementAPI } from '../services/api'
import { Plus, ShoppingCart, Building, FileText } from 'lucide-react'

export default function Procurement() {
  const [tab, setTab] = useState('pr')
  const [prs, setPRs] = useState([])
  const [pos, setPOs] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateSupplier, setShowCreateSupplier] = useState(false)
  const [supplierForm, setSupplierForm] = useState({
    name: '', contact_person: '', email: '', phone: '', country: '', supplier_type: 'local',
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [prRes, poRes, supRes] = await Promise.all([
        procurementAPI.listPR(),
        procurementAPI.listPO(),
        procurementAPI.listSuppliers(),
      ])
      setPRs(prRes.data)
      setPOs(poRes.data)
      setSuppliers(supRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleApprovePR = async (id) => {
    try {
      await procurementAPI.approvePR(id)
      loadData()
    } catch (err) {
      alert(err.response?.data?.detail || 'Error')
    }
  }

  const handleCreateSupplier = async (e) => {
    e.preventDefault()
    try {
      await procurementAPI.createSupplier(supplierForm)
      setShowCreateSupplier(false)
      setSupplierForm({ name: '', contact_person: '', email: '', phone: '', country: '', supplier_type: 'local' })
      loadData()
    } catch (err) {
      alert(err.response?.data?.detail || 'Error')
    }
  }

  if (loading) return <div className="text-center py-12">Loading...</div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Procurement</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {[
          { key: 'pr', label: 'Purchase Requests', icon: FileText },
          { key: 'po', label: 'Purchase Orders', icon: ShoppingCart },
          { key: 'suppliers', label: 'Suppliers', icon: Building },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* Purchase Requests */}
      {tab === 'pr' && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Purchase Requests</h2>
          {prs.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-6">No purchase requests yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 font-medium text-gray-500">PR Number</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-500">Description</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-500">Type</th>
                    <th className="text-right py-2 px-3 font-medium text-gray-500">Estimated</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-500">Status</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {prs.map(pr => (
                    <tr key={pr.id} className="border-b border-gray-100">
                      <td className="py-2 px-3 font-mono text-xs">{pr.pr_number}</td>
                      <td className="py-2 px-3">{pr.description || '-'}</td>
                      <td className="py-2 px-3 capitalize">{pr.purchase_type}</td>
                      <td className="py-2 px-3 text-right">${parseFloat(pr.total_estimated).toLocaleString()}</td>
                      <td className="py-2 px-3 text-center">
                        <span className={`badge ${
                          pr.status === 'approved' ? 'bg-green-100 text-green-700' :
                          pr.status === 'submitted' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>{pr.status}</span>
                      </td>
                      <td className="py-2 px-3 text-center">
                        {pr.status === 'submitted' && (
                          <button onClick={() => handleApprovePR(pr.id)} className="text-xs text-green-600 font-medium hover:underline">
                            Approve
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

      {/* Purchase Orders */}
      {tab === 'po' && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Purchase Orders</h2>
          {pos.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-6">No purchase orders yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 font-medium text-gray-500">PO Number</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-500">Type</th>
                    <th className="text-right py-2 px-3 font-medium text-gray-500">Amount</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-500">Currency</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-500">Status</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-500">Expected</th>
                  </tr>
                </thead>
                <tbody>
                  {pos.map(po => (
                    <tr key={po.id} className="border-b border-gray-100">
                      <td className="py-2 px-3 font-mono text-xs">{po.po_number}</td>
                      <td className="py-2 px-3 capitalize">{po.purchase_type}</td>
                      <td className="py-2 px-3 text-right">${parseFloat(po.total_amount).toLocaleString()}</td>
                      <td className="py-2 px-3 text-center">{po.currency}</td>
                      <td className="py-2 px-3 text-center">
                        <span className={`badge ${
                          po.status === 'received' ? 'bg-green-100 text-green-700' :
                          po.status === 'issued' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>{po.status}</span>
                      </td>
                      <td className="py-2 px-3 text-center text-gray-500">
                        {po.expected_delivery || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Suppliers */}
      {tab === 'suppliers' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Suppliers</h2>
            <button onClick={() => setShowCreateSupplier(!showCreateSupplier)} className="btn-primary flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4" /> Add Supplier
            </button>
          </div>

          {showCreateSupplier && (
            <form onSubmit={handleCreateSupplier} className="mb-4 p-4 bg-gray-50 rounded-lg grid grid-cols-2 md:grid-cols-3 gap-3">
              <input className="input-field" placeholder="Name" value={supplierForm.name}
                onChange={e => setSupplierForm({...supplierForm, name: e.target.value})} required />
              <input className="input-field" placeholder="Contact Person" value={supplierForm.contact_person}
                onChange={e => setSupplierForm({...supplierForm, contact_person: e.target.value})} />
              <input className="input-field" placeholder="Email" value={supplierForm.email}
                onChange={e => setSupplierForm({...supplierForm, email: e.target.value})} />
              <input className="input-field" placeholder="Phone" value={supplierForm.phone}
                onChange={e => setSupplierForm({...supplierForm, phone: e.target.value})} />
              <input className="input-field" placeholder="Country" value={supplierForm.country}
                onChange={e => setSupplierForm({...supplierForm, country: e.target.value})} />
              <select className="input-field" value={supplierForm.supplier_type}
                onChange={e => setSupplierForm({...supplierForm, supplier_type: e.target.value})}>
                <option value="local">Local</option>
                <option value="international">International</option>
              </select>
              <div className="col-span-full flex gap-2">
                <button type="submit" className="btn-primary text-xs">Add Supplier</button>
                <button type="button" onClick={() => setShowCreateSupplier(false)} className="btn-secondary text-xs">Cancel</button>
              </div>
            </form>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 font-medium text-gray-500">Name</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-500">Contact</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-500">Country</th>
                  <th className="text-center py-2 px-3 font-medium text-gray-500">Type</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map(s => (
                  <tr key={s.id} className="border-b border-gray-100">
                    <td className="py-2 px-3 font-medium">{s.name}</td>
                    <td className="py-2 px-3">{s.contact_person || '-'}</td>
                    <td className="py-2 px-3">{s.country || '-'}</td>
                    <td className="py-2 px-3 text-center">
                      <span className={`badge ${s.supplier_type === 'international' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                        {s.supplier_type}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
