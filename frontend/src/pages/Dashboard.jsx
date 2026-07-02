import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { dashboardAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import {
  FolderKanban,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  AlertCircle,
  Warehouse,
  CheckCircle2,
} from 'lucide-react'

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    dashboardAPI.getSummary()
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-center py-12">Loading dashboard...</div>

  const stats = [
    {
      label: 'Total Projects',
      value: data?.projects?.total || 0,
      icon: FolderKanban,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      label: 'Active Projects',
      value: data?.projects?.active || 0,
      icon: TrendingUp,
      color: 'bg-green-100 text-green-600',
    },
    {
      label: 'Revenue (Paid)',
      value: `$${(data?.finance?.total_revenue || 0).toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-emerald-100 text-emerald-600',
    },
    {
      label: 'Pending Invoices',
      value: `$${(data?.finance?.pending_invoices || 0).toLocaleString()}`,
      icon: AlertCircle,
      color: 'bg-amber-100 text-amber-600',
    },
    {
      label: 'Open POs',
      value: data?.procurement?.open_pos || 0,
      icon: ShoppingCart,
      color: 'bg-purple-100 text-purple-600',
    },
    {
      label: 'Stock Items',
      value: data?.warehouse?.stock_items_available || 0,
      icon: Warehouse,
      color: 'bg-cyan-100 text-cyan-600',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Welcome back, {user?.full_name} ({user?.role?.replace('_', ' ')})
          </p>
        </div>
        <Link to="/projects" className="btn-primary">
          View Projects
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card flex items-center gap-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{label}</p>
              <p className="text-xl font-bold text-gray-900">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Pending Approvals */}
      {(data?.approvals?.boqs_pending > 0 || data?.procurement?.pending_prs > 0) && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pending Approvals</h2>
          <div className="space-y-3">
            {data?.approvals?.boqs_pending > 0 && (
              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  <span className="text-sm font-medium text-amber-800">
                    {data.approvals.boqs_pending} BOQ(s) awaiting management approval
                  </span>
                </div>
                <Link to="/projects" className="text-sm text-amber-700 font-medium hover:underline">
                  Review
                </Link>
              </div>
            )}
            {data?.procurement?.pending_prs > 0 && (
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <ShoppingCart className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium text-purple-800">
                    {data.procurement.pending_prs} Purchase Request(s) pending approval
                  </span>
                </div>
                <Link to="/procurement" className="text-sm text-purple-700 font-medium hover:underline">
                  Review
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Projects by Status */}
      {data?.projects?.by_status && Object.keys(data.projects.by_status).length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Projects by Status</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(data.projects.by_status).map(([status, count]) => (
              <div key={status} className="p-3 bg-gray-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-gray-900">{count}</p>
                <p className="text-xs text-gray-500 capitalize mt-1">{status.replace('_', ' ')}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
