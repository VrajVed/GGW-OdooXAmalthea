import { useState, useEffect } from 'react'
import { X, Upload, Trash2 } from 'lucide-react'

export default function ProjectModal({ project, onClose, onCreate, onUpdate }){
  const [form, setForm] = useState({
    name: '', status: 'New', start: '', due: '', tasks: 0, progress: 0, manager: { name: '' }, description: '', image: null
  })
  const [imagePreview, setImagePreview] = useState(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  useEffect(()=>{
    if (project) {
      setForm({ ...project })
      // Set preview if project has an image
      if (project.image?.base64) {
        setImagePreview(project.image.base64)
      } else if (project.image?.url) {
        setImagePreview(`http://localhost:5000${project.image.url}`)
      }
    }
  },[project])

  function toggleTag(t){
    setForm(f=> ({...f, tags: f.tags.includes(t) ? f.tags.filter(x=>x!==t) : [...f.tags, t]}))
  }

  function handleImageUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return

    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB')
      return
    }

    setUploadingImage(true)

    // Convert to base64
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result
      setImagePreview(base64String)
      setForm(f => ({
        ...f,
        image: {
          base64: base64String,
          filename: file.name,
          mimetype: file.type,
          size: file.size
        }
      }))
      setUploadingImage(false)
    }
    reader.onerror = () => {
      alert('Failed to read image file')
      setUploadingImage(false)
    }
    reader.readAsDataURL(file)
  }

  function removeImage() {
    setImagePreview(null)
    setForm(f => ({ ...f, image: null }))
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

          {/* Image Upload Section */}
          <div className="md:col-span-2">
            <label className="block text-sm text-gray-700 mb-2">Project Image</label>
            
            {imagePreview ? (
              <div className="relative">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="w-full h-48 object-cover rounded-lg border-2 border-gray-200"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                  title="Remove image"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-10 h-10 mb-3 text-gray-400" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                />
              </label>
            )}
            
            {uploadingImage && (
              <p className="mt-2 text-sm text-gray-500">Uploading image...</p>
            )}
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
