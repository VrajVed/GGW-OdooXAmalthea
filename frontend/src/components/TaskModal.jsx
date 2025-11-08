import { X, ChevronUp, MoreVertical, Paperclip, Send, Calendar, Plus, Star, Image as ImageIcon } from 'lucide-react'
import { useState } from 'react'

function TaskModal({ isOpen, onClose, task }) {
  const [showMenu, setShowMenu] = useState(false)
  const [priority, setPriority] = useState(2) // 0-5 stars

  if (!isOpen) return null

  // Use default data if no task is provided
  const taskData = task || {
    title: "Monthly Product Discussion",
    description: "Monthly Product Discussion by Design and Marketing Teams with CEO to Plan our future products sales and reports",
    project: "RD Sales",
    badges: ["Feedback", "Bug"],
    dueDate: "24 Jan 2023",
    assignedUsers: [
      { name: "Floyd Miles", initials: "FM" },
      { name: "Dianne Russell", initials: "DR" },
      { name: "Annette Black", initials: "AB" },
    ],
  }

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex-1">
            {/* Project Name and Badges */}
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Project:</span>
                <span className="text-sm font-semibold text-gray-900">
                  {taskData.project || taskData.title}
                </span>
              </div>
              
              {/* Priority Stars */}
              <div className="flex items-center gap-1 ml-auto mr-4">
                {[...Array(5)].map((_, index) => (
                  <Star
                    key={index}
                    className={`w-4 h-4 cursor-pointer ${
                      index < priority
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                    onClick={() => setPriority(index + 1)}
                  />
                ))}
              </div>

              {/* Menu Button */}
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
                
                {showMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                    <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">
                      Edit
                    </button>
                    <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">
                      Delete
                    </button>
                    <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">
                      Change Cover
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Badges */}
            {taskData.badges && taskData.badges.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {taskData.badges.map((badge, index) => (
                  <span
                    key={index}
                    className={`px-3 py-1 rounded-md text-xs font-medium ${
                      badge.toLowerCase() === 'feedback'
                        ? 'bg-green-100 text-green-700'
                        : badge.toLowerCase() === 'bug'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {badge}
                  </span>
                ))}
              </div>
            )}

            {/* Task Title */}
            <h2 className="text-xl font-semibold text-gray-900">
              {taskData.title}
            </h2>
          </div>
          
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors ml-4"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="flex">
            <div className="flex-1 p-6 border-r border-gray-200">
              {/* Cover Image */}
              <div className="mb-6">
                <div className="relative bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg overflow-hidden h-48 flex items-center justify-center group">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ImageIcon className="w-12 h-12 text-purple-300" />
                  </div>
                  <button className="absolute bottom-4 right-4 bg-white px-4 py-2 rounded-lg text-sm font-medium text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:shadow-lg">
                    Change Cover
                  </button>
                </div>
              </div>
              
              {/* Description */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-sm text-gray-600">
                  {taskData.description || "No description available"}
                </p>
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                    <h3 className="text-sm font-semibold text-gray-900">Task Checklist</h3>
                  </div>
                </div>
                <div className="space-y-2 mb-3">
                  {["Prepare Design Document", "Document Signature", "Pitch Deck Presentation Design"].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        <input type="checkbox" className="w-4 h-4 text-gray-600 border-gray-300 rounded" />
                        <span className="text-sm text-gray-700">{item}</span>
                      </div>
                      <button className="text-gray-400 hover:text-gray-600">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <button className="text-sm text-gray-600 hover:text-gray-900 font-medium">
                  + Add Item
                </button>
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                    <h3 className="text-sm font-semibold text-gray-900">Daily Sprint</h3>
                  </div>
                </div>
                <div className="space-y-2 mb-3">
                  {["Prepare Design Document", "Document Signature"].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        <input type="checkbox" className="w-4 h-4 text-gray-600 border-gray-300 rounded" />
                        <span className="text-sm text-gray-700">{item}</span>
                      </div>
                      <button className="text-gray-400 hover:text-gray-600">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <button className="text-sm text-gray-600 hover:text-gray-900 font-medium">
                  + Add Item
                </button>
              </div>

              <div className="mb-6">
                <button className="w-full py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-opacity" style={{ backgroundColor: '#714b67' }}>
                  + Add New Checklist
                </button>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-900 mb-2">Add Your Comment</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Add Your Comment"
                    className="w-full px-4 py-2 pr-20 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent text-sm"
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                    <button className="text-gray-400 hover:text-gray-600">
                      <Paperclip className="w-4 h-4" />
                    </button>
                    <button className="text-gray-400 hover:text-gray-600">
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-900">Activity</h3>
                  <button className="text-sm text-gray-600 hover:text-gray-900 font-medium">
                    Hide Activity Details
                  </button>
                </div>
                <div className="space-y-4">
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold text-white">FE</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Frank Edward</span> mentioned you in a comment in Design Team Reports <span className="font-medium">@brianf</span> have you update this design so we can use it on next meeting?
                      </p>
                      <p className="text-xs text-gray-500 mt-1">3 hours ago | Design Team</p>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>

                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold text-white">JW</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">James Wong</span> Changed the due date of Monthly Team Meeting to Sep 12
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Aug 24 | Design Team</p>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-64 p-6 bg-gray-50">
              {/* Member */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Member</h3>
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {(taskData.assignedUsers || []).map((user, index) => (
                      <div
                        key={index}
                        className={`w-8 h-8 ${getAvatarColor(user.name)} rounded-full flex items-center justify-center border-2 border-white`}
                        title={user.name}
                      >
                        <span className="text-xs font-semibold text-white">
                          {user.initials || getInitials(user.name)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <button className="w-8 h-8 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Due Date */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Due Date</h3>
                <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700 flex-1">
                    {taskData.dueDate || "No due date"}
                  </span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900">Labels</h3>
                  <button className="text-gray-400 hover:text-gray-600">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                    Internal
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Marketing
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900">Attachment</h3>
                  <button className="text-gray-400 hover:text-gray-600">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TaskModal

