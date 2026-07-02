import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { projectsAPI } from '../services/api'
import { Plus, Search, FolderKanban } from 'lucide-react'

const STATUS_COLORS = {
  intake: 'bg-gray-100 text-gray-700',
  requirements: 'bg-blue-100 text-blue-700',
  boq_preparation: 'bg-indigo-100 text-indigo-700',
  internal_review: 'bg-yellow-100 text-yellow-700',
  management_approval: 'bg-orange-100 text-orange-700',
  proposal_sent: 'bg-purple-100 text-purple-700',
  customer_response: 'bg-pink-100 text-pink-700',
  repricing: 'bg-red-100 text-red-700',
  procurement: 'bg-cyan-100 text-cyan-700',
  execution: 'bg-teal-100 text-teal-700',
  invoicing: 'bg-emerald-100 text-emerald-700',
  closure: 'bg-green-100 text-green-700',
}

export default function Projects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({
    project_code: '',
    project_name: '',
    customer: '',
    beneficiary: '',
    description: '',
  })

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = () => {
    projectsAPI.list()
      .then(res => setProjects(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      await projectsAPI.create(form)
      setShowCreate(false)
      setForm({ project_code: '', project_name: '', customer: '', beneficiary: '', description: '' })
      loadProjects()
    } catch (err) {
      alert(err.response?.data?.detail || 'Error creating project')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
        <button onClick={() => setShowCreate(!showCreate)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Create New Project</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project Code</label>
              <input className="input-field" value={form.project_code}
                onChange={e => setForm({...form, project_code: e.target.value})} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
              <input className="input-field" value={form.project_name}
                onChange={e => setForm({...form, project_name: e.target.value})} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
              <input className="input-field" value={form.customer}
                onChange={e => setForm({...form, customer: e.target.value})} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Beneficiary</label>
              <input className="input-field" value={form.beneficiary}
                onChange={e => setForm({...form, beneficiary: e.target.value})} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea className="input-field" rows="2" value={form.description}
                onChange={e => setForm({...form, description: e.target.value})} />
            </div>
            <div className="md:col-span-2 flex gap-2">
              <button type="submit" className="btn-primary">Create Project</button>
              <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Projects List */}
      {loading ? (
        <div className="text-center py-12">Loading projects...</div>
      ) : projects.length === 0 ? (
        <div className="card text-center py-12">
          <FolderKanban className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No projects yet. Create your first project.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {projects.map(project => (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="card hover:shadow-md transition-shadow flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                  <FolderKanban className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-gray-500">{project.project_code}</span>
                    <span className={`badge ${STATUS_COLORS[project.status] || 'bg-gray-100 text-gray-700'}`}>
                      {project.status?.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="font-medium text-gray-900 mt-0.5">{project.project_name}</p>
                  <p className="text-sm text-gray-500">{project.customer}</p>
                </div>
              </div>
              <div className="text-right text-sm text-gray-500">
                {new Date(project.created_at).toLocaleDateString()}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
