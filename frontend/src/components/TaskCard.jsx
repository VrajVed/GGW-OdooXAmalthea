function TaskCard({ task, onClick }) {
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
      'bg-gray-600',
      'bg-gray-700',
      'bg-slate-600',
      'bg-zinc-600',
      'bg-neutral-600',
    ]
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[index % colors.length]
  }

  return (
    <div 
      className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all cursor-pointer overflow-hidden"
      onClick={onClick}
    >
      {/* Cover Image */}
      {task.coverImage ? (
        <div className="h-32 overflow-hidden">
          <img 
            src={task.coverImage} 
            alt={task.title}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="h-32 bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
          <span className="text-4xl opacity-30">🎨</span>
        </div>
      )}

      <div className="p-5">
        {/* Project Badge */}
        {task.project && (
          <div className="mb-2">
            <span className="text-xs font-medium text-gray-600">
              Project: <span className="text-gray-900">{task.project}</span>
            </span>
          </div>
        )}

        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {task.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {task.description}
        </p>

        {/* Date Range */}
        <div className="mb-4">
          <span className="text-xs text-gray-500">
            {task.dueDate}
          </span>
        </div>

        {/* Tasks count */}
        <div className="mb-4">
          <span className="text-xs text-gray-600">
            {task.taskList?.length || task.tasks || 0} tasks
          </span>
        </div>

        {/* Footer with User Avatar */}
        <div className="flex items-center justify-start pt-3 border-t border-gray-100">
          <div className="flex items-center -space-x-2">
            {task.assignedUsers.map((user, index) => (
              <div
                key={index}
                className={`w-8 h-8 ${getAvatarColor(user.name)} rounded-full flex items-center justify-center border-2 border-white`}
                title={user.name}
              >
                <span className="text-xs font-semibold text-white">
                  {user.initials}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TaskCard

