import { X, Upload, Trash2, Plus, ChevronDown } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

// Dummy database of available assignees
const AVAILABLE_ASSIGNEES = [
  { id: 1, name: 'Alex User', initials: 'AU', email: 'alex@example.com' },
  { id: 2, name: 'Floyd Miles', initials: 'FM', email: 'floyd@example.com' },
  { id: 3, name: 'Dianne Russell', initials: 'DR', email: 'dianne@example.com' },
  { id: 4, name: 'Annette Black', initials: 'AB', email: 'annette@example.com' },
  { id: 5, name: 'Unknown User', initials: 'U', email: 'unknown@example.com' },
  { id: 6, name: 'Frank Edward', initials: 'FE', email: 'frank@example.com' },
  { id: 7, name: 'James Wong', initials: 'JW', email: 'james@example.com' },
]

function TaskEditDialog({ task, project, isOpen, onClose, onSave }) {
  const [activeTab, setActiveTab] = useState('description')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: [],
    deadline: '',
    coverImage: null,
    assignee: '',
  })
  const [newTag, setNewTag] = useState('')
  const [timesheets, setTimesheets] = useState([])
  const [isTracking, setIsTracking] = useState(false)
  const [currentSessionStart, setCurrentSessionStart] = useState(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false)
  const timerRef = useRef(null)
  const fileInputRef = useRef(null)
  const assigneeDropdownRef = useRef(null)

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        tags: task.tags || [],
        deadline: task.deadline || '',
        coverImage: task.coverImage || null,
        assignee: task.assignee || '',
      })
      setTimesheets(task.timesheets || [])
    }
  }, [task])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (assigneeDropdownRef.current && !assigneeDropdownRef.current.contains(event.target)) {
        setShowAssigneeDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Timer effect for tracking
  useEffect(() => {
    if (isTracking) {
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1)
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isTracking])

  const handleStartTracking = () => {
    const now = new Date()
    setCurrentSessionStart(now)
    setIsTracking(true)
    setElapsedTime(0)
  }

  const handleStopTracking = () => {
    if (currentSessionStart) {
      const now = new Date()
      const duration = Math.floor((now - currentSessionStart) / 1000) // Duration in seconds
      
      const newTimesheet = {
        id: Date.now(),
        employee: formData.assignee || 'Current User',
        loginTime: currentSessionStart.toLocaleString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit',
          hour12: true 
        }),
        logoutTime: now.toLocaleString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit',
          hour12: true 
        }),
        timeLogged: duration,
        date: now.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        }),
        fullLoginDateTime: currentSessionStart.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        }),
        fullLogoutDateTime: now.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        }),
      }
      
      setTimesheets([...timesheets, newTimesheet])
      setIsTracking(false)
      setCurrentSessionStart(null)
      setElapsedTime(0)
    }
  }

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours}h ${minutes}m ${secs}s`
  }

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  const getTotalTime = () => {
    const total = timesheets.reduce((acc, ts) => acc + ts.timeLogged, 0)
    return formatDuration(total)
  }

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, newTag.trim()] })
      setNewTag('')
    }
  }

  const handleRemoveTag = (tagToRemove) => {
    setFormData({ ...formData, tags: formData.tags.filter(tag => tag !== tagToRemove) })
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData({ ...formData, coverImage: reader.result })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setFormData({ ...formData, coverImage: null })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSave = () => {
    const updatedTask = {
      ...task,
      ...formData,
      timesheets,
      lastModified: new Date().toISOString(),
      lastModifiedBy: formData.assignee || 'Current User',
    }
    onSave(updatedTask)
  }

  const handleSelectAssignee = (assignee) => {
    setFormData({ ...formData, assignee: assignee.name })
    setShowAssigneeDropdown(false)
  }

  const getSelectedAssignee = () => {
    return AVAILABLE_ASSIGNEES.find(a => a.name === formData.assignee)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>{project?.project || project?.title || 'Project'}</span>
            <span>&gt;</span>
            <span className="font-medium text-gray-900">Edit Task</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Discard
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90"
              style={{ backgroundColor: '#714b67' }}
            >
              Save
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Task Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter task title"
              />
            </div>

            {/* Assignee */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assignee
              </label>
              <div className="relative" ref={assigneeDropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-left flex items-center justify-between"
                >
                  <span className="text-gray-900">
                    {formData.assignee || 'Select assignee'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>
                
                {showAssigneeDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                    {AVAILABLE_ASSIGNEES.map((assignee) => (
                      <button
                        key={assignee.id}
                        type="button"
                        onClick={() => handleSelectAssignee(assignee)}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors"
                      >
                        <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-semibold text-white">
                            {assignee.initials}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{assignee.name}</p>
                          <p className="text-xs text-gray-500">{assignee.email}</p>
                        </div>
                        {formData.assignee === assignee.name && (
                          <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Deadline */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deadline
              </label>
              <input
                type="datetime-local"
                value={formData.deadline}
                min={new Date().toISOString().slice(0, 16)}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cover Image
              </label>
              {formData.coverImage ? (
                <div className="relative">
                  <img
                    src={formData.coverImage}
                    alt="Cover"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <button
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-2">Upload cover image</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer inline-block"
                  >
                    Choose File
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-8 border-t border-gray-200">
            <div className="flex gap-4 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('description')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'description'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Description
              </button>
              <button
                onClick={() => setActiveTab('timesheets')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'timesheets'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Timesheets
              </button>
              <button
                onClick={() => setActiveTab('taskinfo')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'taskinfo'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Task Info
              </button>
            </div>

            <div className="py-6">
              {activeTab === 'description' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Task Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[200px]"
                    placeholder="Enter task description..."
                  />
                </div>
              )}

              {activeTab === 'timesheets' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <h3 className="text-sm font-semibold text-gray-900">Time Tracking</h3>
                      {isTracking && (
                        <span className="text-sm text-green-600 font-medium">
                          Running: {formatTime(elapsedTime)}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {!isTracking ? (
                        <button
                          onClick={handleStartTracking}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                        >
                          Start Tracking
                        </button>
                      ) : (
                        <button
                          onClick={handleStopTracking}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                        >
                          Stop Tracking
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      Total Time Logged: <span className="font-semibold text-gray-900">{getTotalTime()}</span>
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full border border-gray-200 rounded-lg">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            Employee
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            Login Time
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            Logout Time
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            Time Logged
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            Date
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {timesheets.length > 0 ? (
                          timesheets.map((sheet, index) => (
                            <tr key={sheet.id || index} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm text-gray-900">{sheet.employee}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {sheet.fullLoginDateTime || sheet.loginTime}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {sheet.fullLogoutDateTime || sheet.logoutTime}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                                {formatDuration(sheet.timeLogged)}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">{sheet.date}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5" className="px-4 py-8 text-center text-sm text-gray-500">
                              No time logged yet. Start tracking to begin.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'taskinfo' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900">Task Information</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Created:</span>
                      <span className="text-sm text-gray-900 font-medium">
                        {new Date(task?.created || Date.now()).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Last Modified:</span>
                      <span className="text-sm text-gray-900 font-medium">
                        {task?.lastModified
                          ? new Date(task.lastModified).toLocaleString()
                          : 'Never'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Last Modified By:</span>
                      <span className="text-sm text-gray-900 font-medium">
                        {task?.lastModifiedBy || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Status:</span>
                      <span className="text-sm text-gray-900 font-medium">
                        {task?.status || 'In Progress'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Change History</h4>
                    <div className="space-y-2">
                      {task?.changeHistory && task.changeHistory.length > 0 ? (
                        task.changeHistory.map((change, index) => (
                          <div key={index} className="p-3 bg-gray-50 rounded border border-gray-200">
                            <p className="text-sm text-gray-900">{change.description}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(change.timestamp).toLocaleString()} by {change.user}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">No change history available</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TaskEditDialog
