import { useState, useMemo, useEffect } from 'react'
import { Search, Plus, ChevronDown } from 'lucide-react'
import ProjectCard from '../components/ProjectCard'
import ProjectModal from '../components/ProjectModal'
import ProjectDetails from '../components/ProjectDetails'
import { projectApi } from '../lib/api'

const STATUSES = ['New','In Progress','Completed']

function ProjectsPage() {
  const [projects, setProjects] = useState([])
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState('Newest')
  const [modalOpen, setModalOpen] = useState(false)
  const [editProject, setEditProject] = useState(null)
  const [selectedProject, setSelectedProject] = useState(null)
  const [toast, setToast] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Load projects from database on component mount
  useEffect(() => {
    fetchProjects()
  }, [])

  async function fetchProjects() {
    try {
      setLoading(true)
      setError(null)
      const response = await projectApi.getAll()
      
      if (response.success) {
        setProjects(response.data)
      } else {
        setError(response.message || 'Failed to load projects')
      }
    } catch (err) {
      console.error('Error fetching projects:', err)
      setError('Unable to connect to server. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function openNew() {
    setEditProject(null)
    setModalOpen(true)
  }

  async function handleCreate(project) {
    try {
      const response = await projectApi.create(project)
      
      if (response.success) {
        // Refresh projects from server
        await fetchProjects()
        setModalOpen(false)
        setToast('Project created successfully')
        setTimeout(() => setToast(null), 2800)
      } else {
        setToast(response.message || 'Failed to create project')
        setTimeout(() => setToast(null), 3000)
      }
    } catch (err) {
      console.error('Error creating project:', err)
      setToast('Failed to create project. Please try again.')
      setTimeout(() => setToast(null), 3000)
    }
  }

  async function handleEdit(updated) {
    try {
      const response = await projectApi.update(updated.id, updated)
      
      if (response.success) {
        // Refresh projects from server
        await fetchProjects()
        setModalOpen(false)
        setToast('Project updated successfully')
        setTimeout(() => setToast(null), 2200)
      } else {
        setToast(response.message || 'Failed to update project')
        setTimeout(() => setToast(null), 3000)
      }
    } catch (err) {
      console.error('Error updating project:', err)
      setToast('Failed to update project. Please try again.')
      setTimeout(() => setToast(null), 3000)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this project? This action cannot be undone.')) return
    
    try {
      const response = await projectApi.delete(id)
      
      if (response.success) {
        // Refresh projects from server
        await fetchProjects()
        setSelectedProject(null)
        setToast('Project deleted successfully')
        setTimeout(() => setToast(null), 2000)
      } else {
        setToast(response.message || 'Failed to delete project')
        setTimeout(() => setToast(null), 3000)
      }
    } catch (err) {
      console.error('Error deleting project:', err)
      setToast('Failed to delete project. Please try again.')
      setTimeout(() => setToast(null), 3000)
    }
  }

  // simple search over name + description
  const filtered = projects.filter(p => {
    const q = query.trim().toLowerCase()
    if (!q) return true
    return (`${p.name} ${p.description || ''}`).toLowerCase().includes(q)
  })

  function sortProjects(list) {
    if (sortBy === 'Name') return list.sort((a,b)=>a.name.localeCompare(b.name))
    if (sortBy === 'Progress') return list.sort((a,b)=>b.tasks - a.tasks)
    if (sortBy === 'Due') return list.sort((a,b)=> new Date(a.due||0) - new Date(b.due||0))
    // Newest
    return list.sort((a,b)=> new Date(b.start||0) - new Date(a.start||0))
  }

  return (
    <div className="h-full bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6 flex-1">
            <h1 className="text-2xl font-semibold text-gray-900">Projects</h1>

            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={query}
                onChange={e=>setQuery(e.target.value)}
                type="text"
                placeholder="Search projects"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent text-sm"
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Tag filter removed per request - tags still editable in modal but not shown in list UI */}

            <select value={sortBy} onChange={e=>setSortBy(e.target.value)} className="px-3 py-2 rounded-lg text-sm border border-gray-200 bg-white" disabled={loading}>
              <option>Newest</option>
              <option>Name</option>
              <option>Progress</option>
              <option>Due</option>
            </select>

            <button onClick={openNew} className="px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50" style={{ backgroundColor: '#714b67' }} disabled={loading}>
              <Plus className="inline w-4 h-4 mr-2" /> New Project
            </button>
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
              <p className="text-gray-600">Loading projects...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                </svg>
                <span className="text-red-800 font-medium">{error}</span>
              </div>
              <button onClick={fetchProjects} className="text-red-600 hover:text-red-800 font-medium text-sm">
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Projects List */}
        {!loading && !error && (
          <div className="flex gap-6 overflow-x-auto pb-6">
            {STATUSES.map(status => {
              const list = sortProjects(filtered.filter(p => p.status === status))
              return (
                <div key={status} className="min-w-[300px] flex-shrink-0">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-medium text-gray-900">{status}</h3>
                    <div className="text-sm text-gray-600">{list.length}</div>
                  </div>
                  <div className="space-y-4">
                    {list.map(p => (
                      <ProjectCard
                        key={p.id}
                        project={p}
                        onEdit={() => { setEditProject(p); setModalOpen(true) }}
                        onDelete={() => handleDelete(p.id)}
                        onOpen={() => setSelectedProject(p)}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {modalOpen && (
        <ProjectModal
          project={editProject}
          onClose={() => setModalOpen(false)}
          onCreate={handleCreate}
          onUpdate={handleEdit}
        />
      )}

      {selectedProject && (
        <ProjectDetails
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
          onEdit={(p) => { setEditProject(p); setModalOpen(true); setSelectedProject(null) }}
          onDelete={(id) => handleDelete(id)}
        />
      )}

      {toast && (
        <div className="fixed right-6 bottom-6 bg-gray-900 text-white px-4 py-2 rounded shadow">{toast}</div>
      )}
    </div>
  )
}

export default ProjectsPage
