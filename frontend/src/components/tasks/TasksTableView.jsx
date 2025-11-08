import { MessageCircle, Heart, MoreVertical, ChevronDown } from 'lucide-react'

function TasksTableView({ allTasks }) {
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

  // Flatten all tasks from different columns
  const tasks = [
    ...allTasks.planned.map(t => ({ ...t, status: 'Planned' })),
    ...allTasks.upcoming.map(t => ({ ...t, status: 'Upcoming' })),
    ...allTasks.completed.map(t => ({ ...t, status: 'Completed' })),
  ]

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left py-3 px-4">
                <input type="checkbox" className="w-4 h-4 text-gray-600 border-gray-300 rounded" />
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700">
                Task <ChevronDown className="w-3 h-3 inline" />
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700">
                Status <ChevronDown className="w-3 h-3 inline" />
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700">
                Due Date <ChevronDown className="w-3 h-3 inline" />
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700">
                Progress <ChevronDown className="w-3 h-3 inline" />
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700">
                Assigned <ChevronDown className="w-3 h-3 inline" />
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700">
                Engagement <ChevronDown className="w-3 h-3 inline" />
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task, index) => (
              <tr key={task.id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="py-3 px-4">
                  <input type="checkbox" className="w-4 h-4 text-gray-600 border-gray-300 rounded" />
                </td>
                <td className="py-3 px-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">{task.title}</h3>
                    <div className="flex flex-wrap gap-1">
                      {task.badges.map((badge) => (
                        <span
                          key={badge}
                          className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
                        >
                          {badge}
                        </span>
                      ))}
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      task.status === 'Planned'
                        ? 'bg-blue-100 text-blue-700'
                        : task.status === 'Upcoming'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {task.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm text-gray-700">{task.dueDate}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-gray-600 h-1.5 rounded-full transition-all"
                        style={{
                          width: `${(task.progress.current / task.progress.total) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-gray-600">
                      {task.progress.current}/{task.progress.total}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center -space-x-2">
                    {task.assignedUsers.map((user, idx) => (
                      <div
                        key={idx}
                        className={`w-6 h-6 ${getAvatarColor(user.name)} rounded-full flex items-center justify-center border-2 border-white`}
                        title={user.name}
                      >
                        <span className="text-xs font-semibold text-white">
                          {getInitials(user.name)}
                        </span>
                      </div>
                    ))}
                  </div>
                </td>
                <td className="py-3 px-4">
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
                </td>
                <td className="py-3 px-4">
                  <button className="text-gray-400 hover:text-gray-600 transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default TasksTableView

