import { useState } from 'react'
import { Search, Filter, ArrowUpDown, MessageCircle, Heart, Plus, List, LayoutGrid, Table } from 'lucide-react'
import KanbanColumn from '../components/KanbanColumn'
import TaskModal from '../components/TaskModal'
import TasksListView from '../components/tasks/TasksListView'
import TasksTableView from '../components/tasks/TasksTableView'

const tasksData = {
  planned: [
    {
      id: 1,
      title: "Monthly Product Discussion",
      badges: ["Internal", "Marketing", "Urgent"],
      dueDate: "24 Jan 2023",
      progress: { current: 10, total: 124 },
      assignedUsers: [
        { name: "Floyd Miles", initials: "FM" },
        { name: "Dianne Russell", initials: "DR" },
        { name: "Annette Black", initials: "AB" },
      ],
      comments: 5,
      likes: 19,
    },
    {
      id: 2,
      title: "Update New Social Media Post",
      badges: ["Marketing", "Event", "Urgent"],
      dueDate: "18 Jan 2023",
      progress: { current: 12, total: 52 },
      assignedUsers: [
        { name: "Robert Fox", initials: "RF" },
        { name: "Brooklyn Simmons", initials: "BS" },
      ],
      comments: 1,
      likes: 1,
    },
    {
      id: 3,
      title: "Input Data for Monthly Sales Revenue",
      badges: ["Internal", "Document", "Marketing"],
      dueDate: "31 Jan 2023",
      progress: { current: 4, total: 5 },
      assignedUsers: [
        { name: "Cameron Williamson", initials: "CW" },
        { name: "Dianne Russell", initials: "DR" },
      ],
      comments: 2,
      likes: 0,
    },
  ],
  upcoming: [
    {
      id: 4,
      title: "Create Monthly Revenue Recap for All Product Linear",
      badges: ["Report", "Event", "Urgent"],
      dueDate: "11 Jan 2023",
      progress: { current: 4, total: 12 },
      assignedUsers: [
        { name: "Ronald Richards", initials: "RR" },
      ],
      comments: 0,
      likes: 1,
    },
    {
      id: 5,
      title: "Uploading New Items to Marketplace",
      badges: ["Report", "Document", "Marketing"],
      dueDate: "09 Jan 2023",
      progress: { current: 12, total: 64 },
      assignedUsers: [
        { name: "Albert Flores", initials: "AF" },
      ],
      comments: 1,
      likes: 23,
    },
    {
      id: 6,
      title: "Monthly Product Discussion",
      badges: ["Internal", "Marketing", "Urgent"],
      dueDate: "12 Jan 2023",
      progress: { current: 3, total: 4 },
      assignedUsers: [
        { name: "Floyd Miles", initials: "FM" },
        { name: "Dianne Russell", initials: "DR" },
        { name: "Annette Black", initials: "AB" },
        { name: "Robert Fox", initials: "RF" },
      ],
      comments: 2,
      likes: 51,
    },
    {
      id: 7,
      title: "Update New Social Media Post",
      badges: ["Marketing", "Event", "Urgent"],
      dueDate: "15 Jan 2023",
      progress: { current: 0, total: 12 },
      assignedUsers: [
        { name: "Brooklyn Simmons", initials: "BS" },
        { name: "Cameron Williamson", initials: "CW" },
        { name: "Ronald Richards", initials: "RR" },
        { name: "Albert Flores", initials: "AF" },
      ],
      comments: 4,
      likes: 3,
    },
    {
      id: 8,
      title: "Input Data for Monthly Sales Revenue",
      badges: ["Marketing", "Event", "Urgent"],
      dueDate: "15 Jan 2023",
      progress: { current: 3, total: 4 },
      assignedUsers: [
        { name: "Floyd Miles", initials: "FM" },
        { name: "Dianne Russell", initials: "DR" },
        { name: "Annette Black", initials: "AB" },
        { name: "Robert Fox", initials: "RF" },
      ],
      comments: 1,
      likes: 15,
    },
  ],
  completed: [
    {
      id: 9,
      title: "Uploading New Items to Marketplace",
      badges: ["Report", "Document", "Marketing"],
      dueDate: "09 Jan 2023",
      progress: { current: 2, total: 15 },
      assignedUsers: [
        { name: "Albert Flores", initials: "AF" },
      ],
      comments: 12,
      likes: 1,
    },
    {
      id: 10,
      title: "Input Data for Monthly Sales Revenue",
      badges: ["Internal", "Document", "Marketing"],
      dueDate: "13 Jan 2023",
      progress: { current: 1, total: 53 },
      assignedUsers: [
        { name: "Cameron Williamson", initials: "CW" },
        { name: "Dianne Russell", initials: "DR" },
      ],
      comments: 2,
      likes: 21,
    },
  ],
}

function TasksPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [viewMode, setViewMode] = useState('kanban')

  const allTasks = {
    planned: tasksData.planned,
    upcoming: tasksData.upcoming,
    completed: tasksData.completed,
  }

  return (
    <div className="h-full bg-gray-50">
      <TaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <header className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-6 flex-1">
            <h1 className="text-2xl font-semibold text-gray-900">
              Tasks {viewMode === 'kanban' ? '(Kanban)' : viewMode === 'list' ? '(List)' : '(Table)'}
            </h1>
            
            
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Q Search"
                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent text-sm"
              />
            </div>

            <a href="#" className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1">
              <span>Help Center</span>
              <span className="text-gray-400">?</span>
            </a>
          </div>
 
          
          <div className="flex items-center gap-4">
            
            <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded-lg px-3 py-2">
              <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">BF</span>
              </div>
              <span className="text-sm font-medium text-gray-900">Brian F.</span>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

  <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 text-sm font-medium pb-2 border-b-2 transition-colors ${
                viewMode === 'list'
                  ? 'text-gray-900'
                  : 'text-gray-600 hover:text-gray-900 border-transparent hover:border-gray-300'
              }`}
              style={viewMode === 'list' ? { borderBottomColor: '#714b67' } : {}}
            >
              <List className="w-4 h-4" />
              List
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-2 text-sm font-medium pb-2 border-b-2 transition-colors ${
                viewMode === 'kanban'
                  ? 'text-gray-900'
                  : 'text-gray-600 hover:text-gray-900 border-transparent hover:border-gray-300'
              }`}
              style={viewMode === 'kanban' ? { borderBottomColor: '#714b67' } : {}}
            >
              <LayoutGrid className="w-4 h-4" />
              Kanban
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-2 text-sm font-medium pb-2 border-b-2 transition-colors ${
                viewMode === 'table'
                  ? 'text-gray-900'
                  : 'text-gray-600 hover:text-gray-900 border-transparent hover:border-gray-300'
              }`}
              style={viewMode === 'table' ? { borderBottomColor: '#714b67' } : {}}
            >
              <Table className="w-4 h-4" />
              Table
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button 
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white rounded-lg hover:bg-gray-50"
              style={{ border: '1.5px solid #714b67' }}
            >
              <ArrowUpDown className="w-4 h-4" />
              Sort By
            </button>
            <button 
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white rounded-lg hover:bg-gray-50"
              style={{ border: '1.5px solid #714b67' }}
            >
              <Filter className="w-4 h-4" />
              Filter
            </button>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-opacity" 
              style={{ backgroundColor: '#714b67' }}
            >
              <Plus className="w-4 h-4" />
              Add Task
            </button>
          </div>
        </div>
      </header>

  <div className="p-8">
        {viewMode === 'kanban' && (
          <div className="flex gap-6 overflow-x-auto pb-4">
            <KanbanColumn
              title="Planned"
              count={tasksData.planned.length}
              tasks={tasksData.planned}
            />
            <KanbanColumn
              title="Upcoming"
              count={tasksData.upcoming.length}
              tasks={tasksData.upcoming}
            />
            <KanbanColumn
              title="Completed"
              count={tasksData.completed.length}
              tasks={tasksData.completed}
              isCompleted={true}
            />
          </div>
        )}

        {viewMode === 'list' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Planned ({tasksData.planned.length})</h2>
              <TasksListView tasks={tasksData.planned} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Upcoming ({tasksData.upcoming.length})</h2>
              <TasksListView tasks={tasksData.upcoming} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Completed ({tasksData.completed.length})</h2>
              <TasksListView tasks={tasksData.completed} />
            </div>
          </div>
        )}

        {viewMode === 'table' && (
          <TasksTableView allTasks={allTasks} />
        )}
      </div>
    </div>
  )
}

export default TasksPage

