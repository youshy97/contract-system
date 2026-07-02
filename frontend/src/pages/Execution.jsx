import { useState, useEffect } from 'react'
import { executionAPI, projectsAPI } from '../services/api'
import { HardHat, Plus } from 'lucide-react'

export default function Execution() {
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [phases, setPhases] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    projectsAPI.list({ status: 'execution' })
      .then(res => {
        setProjects(res.data)
        if (res.data.length > 0) {
          setSelectedProject(res.data[0].id)
          return executionAPI.listPhases(res.data[0].id)
        }
      })
      .then(res => { if (res) setPhases(res.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (selectedProject) {
      executionAPI.listPhases(selectedProject)
        .then(res => setPhases(res.data))
        .catch(console.error)
    }
  }, [selectedProject])

  const handleUpdateProgress = async (phaseId, progress) => {
    try {
      await executionAPI.updatePhase(phaseId, {
        progress_percentage: progress,
        status: progress >= 100 ? 'completed' : 'in_progress',
      })
      const res = await executionAPI.listPhases(selectedProject)
      setPhases(res.data)
    } catch (err) {
      alert(err.response?.data?.detail || 'Error')
    }
  }

  if (loading) return <div className="text-center py-12">Loading...</div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Execution & Progress Tracking</h1>

      {projects.length === 0 ? (
        <div className="card text-center py-12">
          <HardHat className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No projects in execution phase yet.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-4">
            <select
              className="input-field w-auto"
              value={selectedProject || ''}
              onChange={e => setSelectedProject(parseInt(e.target.value))}
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.project_code} - {p.project_name}</option>
              ))}
            </select>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Execution Phases</h2>
            {phases.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-6">No phases defined yet.</p>
            ) : (
              <div className="space-y-4">
                {phases.map(phase => (
                  <div key={phase.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="font-medium text-gray-900">Phase {phase.phase_number}: {phase.phase_name}</span>
                        <span className={`ml-3 badge ${
                          phase.status === 'completed' ? 'bg-green-100 text-green-700' :
                          phase.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                          phase.status === 'on_hold' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>{phase.status?.replace('_', ' ')}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {parseFloat(phase.progress_percentage)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all ${
                          parseFloat(phase.progress_percentage) >= 100 ? 'bg-green-500' :
                          parseFloat(phase.progress_percentage) >= 50 ? 'bg-blue-500' :
                          'bg-amber-500'
                        }`}
                        style={{ width: `${Math.min(parseFloat(phase.progress_percentage), 100)}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      {[25, 50, 75, 100].map(val => (
                        <button
                          key={val}
                          onClick={() => handleUpdateProgress(phase.id, val)}
                          className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600"
                        >
                          {val}%
                        </button>
                      ))}
                    </div>
                    {phase.description && (
                      <p className="text-sm text-gray-500 mt-2">{phase.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
