import { Plus } from 'lucide-react'
import TaskCard from './TaskCard'

function KanbanColumn({ title, count, tasks, isCompleted = false }) {
  const getDotColor = () => {
    if (title === "Planned") return "bg-blue-500"
    if (title === "Upcoming") return "bg-yellow-500"
    if (title === "Completed") return "bg-green-500"
    return "bg-gray-500"
  }

  return (
    <div className="flex-shrink-0 w-80">
      <div className="bg-white rounded-lg border border-gray-200 p-4 h-full">
        {/* Column Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${getDotColor()}`}></div>
              <h3 className="text-sm font-semibold text-gray-900">
                {title}
              </h3>
            </div>
            <span className="text-xs text-gray-500">
              {count} {isCompleted ? 'completed' : 'open'} {count === 1 ? 'task' : 'tasks'}
            </span>
          </div>
          <button 
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            style={{ border: '1.5px solid #714b67' }}
          >
            <Plus className="w-4 h-4" />
            Create Task
          </button>
        </div>

        {/* Task Cards */}
        <div className="space-y-3">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default KanbanColumn

