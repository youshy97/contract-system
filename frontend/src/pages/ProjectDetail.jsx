import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { projectsAPI, boqAPI, dashboardAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import {
  ArrowLeft,
  FileSpreadsheet,
  Plus,
  CheckCircle2,
  XCircle,
  Send,
  Copy,
} from 'lucide-react'

export default function ProjectDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [project, setProject] = useState(null)
  const [boqs, setBOQs] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      projectsAPI.get(id),
      boqAPI.listByProject(id),
      dashboardAPI.getProjectSummary(id),
    ])
      .then(([projRes, boqRes, sumRes]) => {
        setProject(projRes.data)
        setBOQs(boqRes.data)
        setSummary(sumRes.data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  const handleCreateBOQ = async () => {
    try {
      const defaultSections = [
        { section_name: 'Materials', sort_order: 0, items: [] },
        { section_name: 'Civil Works', sort_order: 1, items: [] },
        { section_name: 'Installation', sort_order: 2, items: [] },
        { section_name: 'Logistics', sort_order: 3, items: [] },
      ]
      await boqAPI.create({ project_id: parseInt(id), sections: defaultSections })
      const res = await boqAPI.listByProject(id)
      setBOQs(res.data)
    } catch (err) {
      alert(err.response?.data?.detail || 'Error creating BOQ')
    }
  }

  const handleNewVersion = async (boqId) => {
    const reason = prompt('Reason for new version:')
    if (!reason) return
    try {
      await boqAPI.newVersion(boqId, { change_type: 'minor', change_reason: reason })
      const res = await boqAPI.listByProject(id)
      setBOQs(res.data)
    } catch (err) {
      alert(err.response?.data?.detail || 'Error')
    }
  }

  const handleBOQAction = async (boqId, action) => {
    try {
      if (action === 'submit') await boqAPI.submitReview(boqId)
      else if (action === 'approve') await boqAPI.approve(boqId)
      else if (action === 'reject') {
        const reason = prompt('Rejection reason:')
        await boqAPI.reject(boqId, reason || '')
      }
      else if (action === 'send') await boqAPI.sendToCustomer(boqId)
      const res = await boqAPI.listByProject(id)
      setBOQs(res.data)
    } catch (err) {
      alert(err.response?.data?.detail || 'Error')
    }
  }

  if (loading) return <div className="text-center py-12">Loading...</div>
  if (!project) return <div className="text-center py-12">Project not found</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/projects" className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono text-gray-500">{project.project_code}</span>
            <span className="badge bg-primary-100 text-primary-700">{project.status?.replace('_', ' ')}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{project.project_name}</h1>
        </div>
      </div>

      {/* Project Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Project Information</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-gray-500">Customer:</span> <span className="font-medium ml-2">{project.customer}</span></div>
            <div><span className="text-gray-500">Beneficiary:</span> <span className="font-medium ml-2">{project.beneficiary || '-'}</span></div>
            <div><span className="text-gray-500">Contact:</span> <span className="font-medium ml-2">{project.contact_name || '-'}</span></div>
            <div><span className="text-gray-500">Email:</span> <span className="font-medium ml-2">{project.contact_email || '-'}</span></div>
            <div><span className="text-gray-500">Exchange Rate:</span> <span className="font-medium ml-2">{project.exchange_rate || '-'}</span></div>
            <div><span className="text-gray-500">Created:</span> <span className="font-medium ml-2">{new Date(project.created_at).toLocaleDateString()}</span></div>
          </div>
          {project.description && (
            <p className="mt-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{project.description}</p>
          )}
        </div>

        {/* Summary Card */}
        {summary && (
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">BOQ Version</span>
                <span className="font-medium">V{summary.boq?.latest_version || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total Cost</span>
                <span className="font-medium">${(summary.boq?.total_cost || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total Selling</span>
                <span className="font-medium">${(summary.boq?.total_selling || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Profit</span>
                <span className="font-medium text-green-600">${(summary.boq?.profit || 0).toLocaleString()}</span>
              </div>
              <hr />
              <div className="flex justify-between">
                <span className="text-gray-500">Phases</span>
                <span className="font-medium">{summary.execution?.completed || 0}/{summary.execution?.phases || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Invoiced</span>
                <span className="font-medium">${(summary.finance?.total_invoiced || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Paid</span>
                <span className="font-medium text-green-600">${(summary.finance?.total_paid || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* BOQ Section */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Bill of Quantities (BOQ)</h2>
          <button onClick={handleCreateBOQ} className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> New BOQ
          </button>
        </div>

        {boqs.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">No BOQ versions yet.</p>
        ) : (
          <div className="space-y-3">
            {boqs.map(boq => (
              <div key={boq.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="w-5 h-5 text-primary-600" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Version {boq.version}</span>
                        <span className={`badge ${
                          boq.status === 'approved' ? 'bg-green-100 text-green-700' :
                          boq.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          boq.status === 'review' ? 'bg-yellow-100 text-yellow-700' :
                          boq.status === 'sent' ? 'bg-purple-100 text-purple-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>{boq.status}</span>
                      </div>
                      <p className="text-sm text-gray-500">
                        Cost: ${parseFloat(boq.total_cost).toLocaleString()} | 
                        Selling: ${parseFloat(boq.total_selling).toLocaleString()} | 
                        Profit: ${parseFloat(boq.profit).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link to={`/boq/${boq.id}`} className="btn-secondary text-xs">View Details</Link>
                    {boq.status === 'draft' && (
                      <button onClick={() => handleBOQAction(boq.id, 'submit')} className="btn-primary text-xs flex items-center gap-1">
                        <Send className="w-3 h-3" /> Submit
                      </button>
                    )}
                    {boq.status === 'review' && ['management', 'department_manager'].includes(user?.role) && (
                      <>
                        <button onClick={() => handleBOQAction(boq.id, 'approve')} className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700">
                          <CheckCircle2 className="w-3 h-3 inline mr-1" /> Approve
                        </button>
                        <button onClick={() => handleBOQAction(boq.id, 'reject')} className="text-xs px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700">
                          <XCircle className="w-3 h-3 inline mr-1" /> Reject
                        </button>
                      </>
                    )}
                    {boq.status === 'approved' && (
                      <button onClick={() => handleBOQAction(boq.id, 'send')} className="text-xs px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                        <Send className="w-3 h-3 inline mr-1" /> Send to Customer
                      </button>
                    )}
                    <button onClick={() => handleNewVersion(boq.id)} className="btn-secondary text-xs flex items-center gap-1">
                      <Copy className="w-3 h-3" /> New Version
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
