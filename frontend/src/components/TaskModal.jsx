import { X, ChevronUp, MoreVertical, Paperclip, Send, Calendar, Plus } from 'lucide-react'

function TaskModal({ isOpen, onClose }) {
  if (!isOpen) return null

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
  <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-900">Monthly Product Discussion</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="flex">
            <div className="flex-1 p-6 border-r border-gray-200">
              
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-sm text-gray-600">
                  Monthly Product Discussion by Design and Marketing Teams with CEO to Plan our future products sales and reports
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
              
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Member</h3>
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {["Floyd Miles", "Dianne Russell", "Annette Black"].map((name, index) => (
                      <div
                        key={index}
                        className={`w-8 h-8 ${getAvatarColor(name)} rounded-full flex items-center justify-center border-2 border-white`}
                        title={name}
                      >
                        <span className="text-xs font-semibold text-white">
                          {getInitials(name)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <button className="w-8 h-8 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Due Date</h3>
                <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700 flex-1">24 Jan 2023</span>
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

