import { Plus } from 'lucide-react'
import TaskCard from './TaskCard'

function KanbanColumn({ title, count, tasks, isCompleted = false, onTaskClick }) {
  return (
    <div className="flex-shrink-0 w-[400px]">
      <div className="bg-gray-50 rounded-lg p-4 h-full">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900">
              {title}
            </h3>
            <span className="text-sm text-gray-500 bg-white px-2.5 py-1 rounded-full">
              {count}
            </span>
          </div>
        </div>

        {/* Tasks */}
        <div className="space-y-4">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default KanbanColumn

