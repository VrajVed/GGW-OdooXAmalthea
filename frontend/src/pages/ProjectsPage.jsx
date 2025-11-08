import { useState, useMemo, useEffect } from 'react'
import { Search, Plus, ChevronDown } from 'lucide-react'
import ProjectCard from '../components/ProjectCard'
import ProjectModal from '../components/ProjectModal'
import ProjectDetails from '../components/ProjectDetails'

const initialProjects = [
  {
    id: 'p1',
    name: 'RD Services',
    status: 'New',
    start: '2022-03-21',
    due: '2022-04-08',
    tasks: 10,
    progress: 20,
    manager: { name: 'Gaurav' },
    description: 'Service delivery and customer care improvements for Q2 focusing on onboarding and SLA.',
  },
  {
    id: 'p2',
    name: 'RD Sales',
    status: 'In Progress',
    start: '2022-03-21',
    due: '2022-06-18',
    tasks: 200,
    progress: 70,
    manager: { name: 'Drashti' },
    description: 'Sales enablement project to improve payment flows and help center integration.',
  }
]

const STATUSES = ['New','In Progress','Completed']

function ProjectsPage() {
  const [projects, setProjects] = useState(initialProjects)
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState('Newest')
  const [modalOpen, setModalOpen] = useState(false)
  const [editProject, setEditProject] = useState(null)
  const [selectedProject, setSelectedProject] = useState(null)
  const [toast, setToast] = useState(null)

  // load projects from localStorage if present
  useEffect(()=>{
    try {
      const raw = localStorage.getItem('projects_v1')
      if (raw) {
        setProjects(JSON.parse(raw))
      }
    } catch(e){}
  }, [])

  useEffect(()=>{
    // persist projects to localStorage so changes are immediate and survive reloads
    try { localStorage.setItem('projects_v1', JSON.stringify(projects)) } catch(e){}
  },[projects])

  function openNew() {
    setEditProject(null)
    setModalOpen(true)
  }

  function handleCreate(project) {
    // optimistic insert at top of status column
    setProjects(prev => [{ ...project, id: `p_${Date.now()}` }, ...prev])
    setModalOpen(false)
    setToast('Project created')
    setTimeout(() => setToast(null), 2800)
  }

  function handleEdit(updated) {
    setProjects(prev => {
      const others = prev.filter(p => p.id !== updated.id)
      // put updated project on top of its status column
      return [updated, ...others]
    })
    setModalOpen(false)
    setToast('Project updated')
    setTimeout(() => setToast(null), 2200)
  }

  function handleDelete(id) {
    if (!window.confirm('Delete this project?')) return
    setProjects(prev => prev.filter(p => p.id !== id))
    setSelectedProject(null)
    setToast('Project deleted')
    setTimeout(() => setToast(null), 2000)
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
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Tag filter removed per request - tags still editable in modal but not shown in list UI */}

            <select value={sortBy} onChange={e=>setSortBy(e.target.value)} className="px-3 py-2 rounded-lg text-sm border border-gray-200 bg-white">
              <option>Newest</option>
              <option>Name</option>
              <option>Progress</option>
              <option>Due</option>
            </select>

            <button onClick={openNew} className="px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-opacity" style={{ backgroundColor: '#714b67' }}>
              <Plus className="inline w-4 h-4 mr-2" /> New Project
            </button>
          </div>
        </div>
      </header>

      <div className="p-6">
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
