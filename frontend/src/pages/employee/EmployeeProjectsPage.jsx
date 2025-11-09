import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import ProjectCard from '../../components/ProjectCard'
import { projectApi, getUser } from '../../lib/api'

const STATUSES = ['New','In Progress','Completed']

function EmployeeProjectsPage() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState('Newest')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const currentUser = getUser()

  // Load projects from database on component mount
  useEffect(() => {
    fetchProjects()
  }, [])

  async function fetchProjects() {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch only projects where current user is a member
      const filters = currentUser?.id ? { user_id: currentUser.id } : {}
      const response = await projectApi.getAll(filters)
      
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
            <select value={sortBy} onChange={e=>setSortBy(e.target.value)} className="px-3 py-2 rounded-lg text-sm border border-gray-200 bg-white" disabled={loading}>
              <option>Newest</option>
              <option>Name</option>
              <option>Progress</option>
              <option>Due</option>
            </select>
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
                        onOpen={() => navigate(`/employee/projects/${p.id}`)}
                        readOnly={true}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default EmployeeProjectsPage
