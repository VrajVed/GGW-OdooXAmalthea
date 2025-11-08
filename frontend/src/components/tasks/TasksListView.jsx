import { MessageCircle, Heart, MoreVertical } from 'lucide-react'

function TasksListView({ tasks }) {
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
    <div className="space-y-2">
      {tasks.map((task) => (
        <div
          key={task.id}
          className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-4">
            <input type="checkbox" className="w-4 h-4 text-gray-600 border-gray-300 rounded flex-shrink-0" />
            
            
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 truncate">{task.title}</h3>
            </div>
            
            
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {task.badges.map((badge) => (
                <span
                  key={badge}
                  className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 whitespace-nowrap"
                >
                  {badge}
                </span>
              ))}
            </div>
            
            
            <div className="text-sm text-gray-700 whitespace-nowrap flex-shrink-0 w-24">
              {task.dueDate}
            </div>
            
            
            <div className="flex items-center gap-2 flex-shrink-0 w-20">
              <div className="w-12 bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-gray-600 h-1.5 rounded-full transition-all"
                  style={{ width: `${(task.progress.current / task.progress.total) * 100}%` }}
                />
              </div>
              <span className="text-xs text-gray-600 whitespace-nowrap">
                {task.progress.current}/{task.progress.total}
              </span>
            </div>

            
            
            <div className="flex items-center -space-x-2 flex-shrink-0">
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
            
            
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <MessageCircle className="w-3.5 h-3.5" />
                <span>{task.comments}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Heart className="w-3.5 h-3.5" />
                <span>{task.likes}</span>
              </div>
            </div>
            
            <button className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

export default TasksListView

