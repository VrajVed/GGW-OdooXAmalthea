import { MessageCircle, Heart } from 'lucide-react'

function TaskCard({ task }) {
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getAvatarColor = (name) => {
    const colors = [
      'bg-gray-400',
      'bg-gray-500',
      'bg-gray-600',
      'bg-gray-700',
      'bg-gray-800',
    ]
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[index % colors.length]
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer">
  <div className="flex flex-wrap gap-2 mb-3">
        {task.badges.map((badge) => (
          <span
            key={badge}
            className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
          >
            {badge}
          </span>
        ))}
      </div>

  <h3 className="text-sm font-semibold text-gray-900 mb-3">
        {task.title}
      </h3>

  <div className="mb-3">
        <span className="text-xs text-gray-500">
          Due Date {task.dueDate}
        </span>
      </div>

  <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-600">
            {task.progress.current}/{task.progress.total}
          </span>
          <span className="text-xs text-gray-500">
            {Math.round((task.progress.current / task.progress.total) * 100)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div
            className="bg-gray-600 h-1.5 rounded-full transition-all"
            style={{ width: `${(task.progress.current / task.progress.total) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        
        <div className="flex items-center -space-x-2">
          {task.assignedUsers.map((user, index) => (
            <div
              key={index}
              className={`w-6 h-6 ${getAvatarColor(user.name)} rounded-full flex items-center justify-center border-2 border-white`}
              title={user.name}
            >
              <span className="text-xs font-semibold text-white">
                {getInitials(user.name)}
              </span>
            </div>
          ))}
        </div>

        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <MessageCircle className="w-3.5 h-3.5" />
            <span>{task.comments}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Heart className="w-3.5 h-3.5" />
            <span>{task.likes}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TaskCard

