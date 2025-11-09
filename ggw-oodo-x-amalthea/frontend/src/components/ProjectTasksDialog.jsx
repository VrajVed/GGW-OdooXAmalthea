import { X, Plus, Edit2, Trash2 } from 'lucide-react'
import { useState } from 'react'

function ProjectTasksDialog({ project, isOpen, onClose, onAddTask, onEditTask, onDeleteTask }) {
  if (!isOpen || !project) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm text-gray-500">Project:</span>
              <h2 className="text-xl font-semibold text-gray-900">{project.project || project.title}</h2>
            </div>
            <p className="text-sm text-gray-600">{project.description}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors ml-4"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Task List */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Tasks</h3>
            <button
              onClick={() => onAddTask(project)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#714b67' }}
            >
              <Plus className="w-4 h-4" />
              Add Task
            </button>
          </div>

          <div className="space-y-3">
            {project.taskList && project.taskList.length > 0 ? (
              project.taskList.map((task, index) => (
                <div
                  key={task.id || index}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900">{task.title}</h4>
                    <p className="text-xs text-gray-600 mt-1">{task.description}</p>
                    {task.deadline && (
                      <span className="text-xs text-gray-500 mt-1 inline-block">
                        Due: {new Date(task.deadline).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onEditTask(task, project)}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
                      title="Edit Task"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {onDeleteTask && (
                      <button
                        onClick={() => onDeleteTask(task.id, project.projectId)}
                        className="p-2 text-red-600 hover:text-red-900 hover:bg-red-100 rounded transition-colors"
                        title="Delete Task"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No tasks yet. Click "Add Task" to create one.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProjectTasksDialog
