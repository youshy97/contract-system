import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { boqAPI } from '../services/api'
import { ArrowLeft, Plus } from 'lucide-react'

export default function BOQDetail() {
  const { id } = useParams()
  const [boq, setBOQ] = useState(null)
  const [loading, setLoading] = useState(true)
  const [addItemSection, setAddItemSection] = useState(null)
  const [itemForm, setItemForm] = useState({
    description: '', quantity: 0, unit: '', unit_cost: 0, selling_price: 0,
  })

  useEffect(() => {
    loadBOQ()
  }, [id])

  const loadBOQ = () => {
    boqAPI.get(id)
      .then(res => setBOQ(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  const handleAddItem = async (e) => {
    e.preventDefault()
    try {
      const profitPct = itemForm.unit_cost > 0 
        ? ((itemForm.selling_price - itemForm.unit_cost) / itemForm.unit_cost * 100).toFixed(2)
        : 0
      await boqAPI.addItem(boq.id, addItemSection, {
        ...itemForm,
        profit_percentage: parseFloat(profitPct),
      })
      setAddItemSection(null)
      setItemForm({ description: '', quantity: 0, unit: '', unit_cost: 0, selling_price: 0 })
      loadBOQ()
    } catch (err) {
      alert(err.response?.data?.detail || 'Error adding item')
    }
  }

  if (loading) return <div className="text-center py-12">Loading...</div>
  if (!boq) return <div className="text-center py-12">BOQ not found</div>

  const isEditable = boq.status === 'draft' || boq.status === 'repricing'

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to={`/projects/${boq.project_id}`} className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">BOQ Version {boq.version}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className={`badge ${
              boq.status === 'approved' ? 'bg-green-100 text-green-700' :
              boq.status === 'rejected' ? 'bg-red-100 text-red-700' :
              'bg-gray-100 text-gray-700'
            }`}>{boq.status}</span>
            {boq.change_reason && (
              <span className="text-sm text-gray-500">Change: {boq.change_reason}</span>
            )}
          </div>
        </div>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card text-center">
          <p className="text-sm text-gray-500">Total Cost</p>
          <p className="text-xl font-bold text-gray-900">${parseFloat(boq.total_cost).toLocaleString()}</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-500">Total Selling</p>
          <p className="text-xl font-bold text-gray-900">${parseFloat(boq.total_selling).toLocaleString()}</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-500">Profit</p>
          <p className="text-xl font-bold text-green-600">${parseFloat(boq.profit).toLocaleString()}</p>
        </div>
      </div>

      {/* Sections & Items */}
      {boq.sections?.map(section => (
        <div key={section.id} className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">{section.section_name}</h3>
            {isEditable && (
              <button
                onClick={() => setAddItemSection(section.id)}
                className="btn-secondary text-xs flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Item
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 font-medium text-gray-500">Description</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-500">Qty</th>
                  <th className="text-center py-2 px-3 font-medium text-gray-500">Unit</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-500">Unit Cost</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-500">Selling Price</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-500">Total Cost</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-500">Total Selling</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-500">Profit %</th>
                </tr>
              </thead>
              <tbody>
                {section.items?.map(item => (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-3">{item.description}</td>
                    <td className="py-2 px-3 text-right">{parseFloat(item.quantity).toLocaleString()}</td>
                    <td className="py-2 px-3 text-center">{item.unit || '-'}</td>
                    <td className="py-2 px-3 text-right">${parseFloat(item.unit_cost).toLocaleString()}</td>
                    <td className="py-2 px-3 text-right">${parseFloat(item.selling_price).toLocaleString()}</td>
                    <td className="py-2 px-3 text-right font-medium">
                      ${(parseFloat(item.quantity) * parseFloat(item.unit_cost)).toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-right font-medium">
                      ${(parseFloat(item.quantity) * parseFloat(item.selling_price)).toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-right text-green-600">
                      {parseFloat(item.profit_percentage).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add Item Form */}
          {addItemSection === section.id && (
            <form onSubmit={handleAddItem} className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium mb-3">Add New Item</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="md:col-span-2">
                  <input className="input-field" placeholder="Description" value={itemForm.description}
                    onChange={e => setItemForm({...itemForm, description: e.target.value})} required />
                </div>
                <input className="input-field" type="number" placeholder="Qty" value={itemForm.quantity}
                  onChange={e => setItemForm({...itemForm, quantity: parseFloat(e.target.value) || 0})} />
                <input className="input-field" placeholder="Unit" value={itemForm.unit}
                  onChange={e => setItemForm({...itemForm, unit: e.target.value})} />
                <input className="input-field" type="number" placeholder="Unit Cost" value={itemForm.unit_cost}
                  onChange={e => setItemForm({...itemForm, unit_cost: parseFloat(e.target.value) || 0})} />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-3">
                <input className="input-field" type="number" placeholder="Selling Price" value={itemForm.selling_price}
                  onChange={e => setItemForm({...itemForm, selling_price: parseFloat(e.target.value) || 0})} />
                <div className="flex gap-2 md:col-span-4">
                  <button type="submit" className="btn-primary text-xs">Add Item</button>
                  <button type="button" onClick={() => setAddItemSection(null)} className="btn-secondary text-xs">Cancel</button>
                </div>
              </div>
            </form>
          )}
        </div>
      ))}
    </div>
  )
}
