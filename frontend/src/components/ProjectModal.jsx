import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

export default function ProjectModal({ project, onClose, onCreate, onUpdate }){
  const [form, setForm] = useState({
    name: '', status: 'New', start: '', due: '', tasks: 0, progress: 0, manager: { name: '' }, description: ''
  })

  useEffect(()=>{
    if (project) setForm({ ...project })
  },[project])

  function toggleTag(t){
    setForm(f=> ({...f, tags: f.tags.includes(t) ? f.tags.filter(x=>x!==t) : [...f.tags, t]}))
  }

  function submit(e){
    e.preventDefault()
    const payload = { ...form }
    if (project && project.id) {
      onUpdate && onUpdate(payload)
    } else {
      onCreate && onCreate(payload)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-6">
      <div className="absolute inset-0 bg-black opacity-30" onClick={onClose}></div>
      <form onSubmit={submit} className="relative bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{project ? 'Edit Project' : 'New Project'}</h3>
          <button type="button" onClick={onClose}><X className="w-5 h-5 text-gray-600" /></button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-700">Name</label>
            <input required value={form.name} onChange={e=>setForm(f=>({...f, name:e.target.value}))} className="mt-1 w-full border rounded px-3 py-2" />
          </div>

          <div>
            <label className="block text-sm text-gray-700">Status</label>
            <select value={form.status} onChange={e=>setForm(f=>({...f, status: e.target.value}))} className="mt-1 w-full border rounded px-3 py-2">
              <option>New</option>
              <option>In Progress</option>
              <option>Completed</option>
            </select>
          </div>

          {/* tags removed per request */}

          <div>
            <label className="block text-sm text-gray-700">Start</label>
            <input type="date" value={form.start} onChange={e=>setForm(f=>({...f, start: e.target.value}))} className="mt-1 w-full border rounded px-3 py-2" />
          </div>

          <div>
            <label className="block text-sm text-gray-700">Due</label>
            <input type="date" value={form.due} onChange={e=>setForm(f=>({...f, due: e.target.value}))} className="mt-1 w-full border rounded px-3 py-2" />
          </div>

          <div>
            <label className="block text-sm text-gray-700">Tasks</label>
            <input type="number" min={0} value={form.tasks} onChange={e=>setForm(f=>({...f, tasks: Number(e.target.value)}))} className="mt-1 w-full border rounded px-3 py-2" />
          </div>

          <div>
            <label className="block text-sm text-gray-700">Manager Name</label>
            <input value={form.manager?.name||''} onChange={e=>setForm(f=>({...f, manager: {...f.manager, name: e.target.value}}))} className="mt-1 w-full border rounded px-3 py-2" />
          </div>

          <div>
            <label className="block text-sm text-gray-700">Progress (%)</label>
            <input type="number" min={0} max={100} value={form.progress} onChange={e=>setForm(f=>({...f, progress: Number(e.target.value)}))} className="mt-1 w-full border rounded px-3 py-2" />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm text-gray-700">Description</label>
            <textarea value={form.description} onChange={e=>setForm(f=>({...f, description: e.target.value}))} className="mt-1 w-full border rounded px-3 py-2 h-28" />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-white border">Cancel</button>
          <button type="submit" className="px-4 py-2 rounded text-white" style={{ backgroundColor: '#714b67' }}>{project ? 'Save' : 'Create'}</button>
        </div>
      </form>
    </div>
  )
}
