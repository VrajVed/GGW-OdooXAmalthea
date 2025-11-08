import { X } from 'lucide-react'

export default function ProjectDetails({ project, onClose, onEdit, onDelete }){
  if (!project) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-6">
      <div className="absolute inset-0 bg-black opacity-30" onClick={onClose}></div>
      <div className="relative bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 z-10">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">{project.name}</h3>
            <div className="text-sm text-gray-500 mt-1">{project.start} • {project.due} • {project.tasks} tasks</div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={()=>onEdit && onEdit(project)} className="px-3 py-1 rounded bg-white border">Edit</button>
            <button onClick={()=>onDelete && onDelete(project.id)} className="px-3 py-1 rounded bg-red-50 text-red-600 border">Delete</button>
            <button onClick={onClose} className="p-2 rounded"><X className="w-5 h-5 text-gray-600" /></button>
          </div>
        </div>

        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700">Description</h4>
          <p className="mt-2 text-sm text-gray-600 whitespace-pre-wrap">{project.description}</p>
        </div>

        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700">Progress</h4>
          <div className="mt-2 w-full bg-gray-100 rounded h-3 overflow-hidden">
            <div className="h-3 bg-purple-600" style={{ width: `${project.progress ?? 0}%` }} />
          </div>
          <div className="text-xs text-gray-500 mt-1">{project.progress ?? 0}% complete</div>
        </div>

      </div>
    </div>
  )
}
