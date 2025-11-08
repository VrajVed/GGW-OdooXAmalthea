import { useState } from 'react'
import { Bell, Clipboard, Archive, Filter, Settings, X, MoreVertical, Reply, Check, X as XIcon } from 'lucide-react'
import NotificationCard from '../components/NotificationCard'

const notificationsData = {
  all: [
    {
      id: 1,
      isRead: false,
      user: {
        name: "Frank Edward",
        avatar: "FE",
      },
      type: "mention",
      message: "mentioned you in a comment in",
      project: "Design Team Reports",
      quotedComment: "@brianf have you update this design so we can use it on next meeting?",
      action: "reply",
      time: "3 hours ago",
      team: "Design Team",
    },
    {
      id: 2,
      isRead: false,
      user: {
        name: "Elsa Wright",
        avatar: "EW",
      },
      type: "access",
      message: "Asking for edit access in",
      project: "Monthly Team Progress",
      action: "accept-decline",
      time: "Yesterday",
      team: "Marketing Team",
    },
    {
      id: 3,
      isRead: true,
      user: {
        name: "James Wong",
        avatar: "JW",
      },
      type: "mention",
      message: "mentioned you in a comment in",
      project: "Monthly Team Meeting",
      quotedComment: "@brianf let's we plan all this event by now",
      action: "reply",
      time: "Aug 24",
      team: "Design Team",
    },
  ],
  tasks: [],
  archived: [],
}

function NotificationsPage() {
  const [activeTab, setActiveTab] = useState('all')
  const unreadCount = notificationsData.all.filter(n => !n.isRead).length

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
    <div className="h-full bg-gray-50">
      <div className="w-full bg-white min-h-full">
        <div className="border-b border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Notifications</h1>
            <button className="text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-8 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex items-center gap-2 pb-4 px-1 relative ${
                activeTab === 'all'
                  ? 'text-gray-900'
                  : 'text-gray-600 hover:text-gray-900'
              } transition-colors`}
            >
              <Bell className="w-4 h-4" />
              <span className="text-sm font-medium">All</span>
              {unreadCount > 0 && (
                <span
                  className="ml-1 px-1.5 py-0.5 text-xs font-semibold text-white rounded-full"
                  style={{ backgroundColor: '#714b67' }}
                >
                  {unreadCount}
                </span>
              )}
              {activeTab === 'all' && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ backgroundColor: '#714b67' }}
                />
              )}
            </button>

            <button
              onClick={() => setActiveTab('tasks')}
              className={`flex items-center gap-2 pb-4 px-1 relative ${
                activeTab === 'tasks'
                  ? 'text-gray-900'
                  : 'text-gray-600 hover:text-gray-900'
              } transition-colors`}
            >
              <Clipboard className="w-4 h-4" />
              <span className="text-sm font-medium">Tasks</span>
              {activeTab === 'tasks' && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ backgroundColor: '#714b67' }}
                />
              )}
            </button>

            <button
              onClick={() => setActiveTab('archived')}
              className={`flex items-center gap-2 pb-4 px-1 relative ${
                activeTab === 'archived'
                  ? 'text-gray-900'
                  : 'text-gray-600 hover:text-gray-900'
              } transition-colors`}
            >
              <Archive className="w-4 h-4" />
              <span className="text-sm font-medium">Archived</span>
              {activeTab === 'archived' && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ backgroundColor: '#714b67' }}
                />
              )}
            </button>
          </div>

          <div className="flex items-center justify-between mt-4">
            <button 
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white rounded-lg hover:bg-gray-50 transition-colors"
              style={{ border: '1.5px solid #714b67' }}
            >
              Mark All as Read
            </button>
            <div className="flex items-center gap-3">
              <button className="text-gray-400 hover:text-gray-600 transition-colors">
                <Filter className="w-5 h-5" />
              </button>
              <button className="text-gray-400 hover:text-gray-600 transition-colors">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

  <div className="p-8">
          <div className="space-y-4">
            {notificationsData[activeTab].map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                getInitials={getInitials}
                getAvatarColor={getAvatarColor}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotificationsPage

