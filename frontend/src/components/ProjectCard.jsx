import { useState } from 'react'
import { MoreVertical } from 'lucide-react'

export default function ProjectCard({ project, onEdit, onDelete, onOpen }){
  const [open, setOpen] = useState(false)
  return (
  <div onClick={(e)=>{ try { if (e.target instanceof Element && e.target.closest('.kebab')) return } catch(_){}; onOpen && onOpen() }} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-transform transform hover:-translate-y-1 p-4 cursor-pointer w-full">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* tags intentionally not shown per request */}
        </div>
        <div className="relative kebab">
          <button onClick={(ev)=>{ ev.stopPropagation(); setOpen(o=>!o) }} className="p-1 rounded hover:bg-gray-100">
            <MoreVertical className="w-4 h-4 text-gray-600" />
          </button>
          {open && (
            <div onClick={(ev)=>ev.stopPropagation()} className="absolute right-0 mt-2 bg-white border rounded shadow z-20">
              <button onClick={()=>{ setOpen(false); onOpen && onOpen() }} className="block px-4 py-2 text-sm">Open</button>
              <button onClick={()=>{ setOpen(false); onEdit && onEdit() }} className="block px-4 py-2 text-sm">Edit</button>
              <button onClick={()=>{ setOpen(false); onDelete && onDelete() }} className="block px-4 py-2 text-sm text-red-600">Delete</button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-3">
        <h4 className="text-md font-semibold text-gray-900">{project.name}</h4>
        <p className="mt-3 text-sm text-gray-600 leading-relaxed">{project.description}</p>
      </div>

      <div className="mt-4">
        <div className="w-full bg-gray-100 rounded h-2 overflow-hidden">
          <div className="h-2 bg-purple-600" style={{ width: `${project.progress ?? 0}%` }} />
        </div>
        <div className="flex items-center justify-between mt-2 text-sm text-gray-600">
          <div>
            <div>{project.start} • {project.due}</div>
            <div className="text-xs text-gray-500">{project.tasks} tasks</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gray-700 text-white flex items-center justify-center text-sm">{(project.manager?.name||'').split(' ').map(s=>s[0]).join('').slice(0,2)}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
