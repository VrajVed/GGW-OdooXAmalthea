import { useState, useEffect, useCallback } from 'react'
import { Bell, Calendar, Clock, MapPin, ExternalLink, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { calendarApi, getUser } from '../lib/api'
import NotificationCard from '../components/NotificationCard'

function NotificationsPage() {
  const [activeTab, setActiveTab] = useState('all')
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [readNotifications, setReadNotifications] = useState(new Set())

  const user = getUser()
  const userId = user?.id

  // Fetch upcoming calendar events
  const fetchNotifications = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      setError('Please log in to view notifications')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const result = await calendarApi.getUpcomingEvents(userId)
      
      if (result.success) {
        const events = result.data || []
        
        // Transform events into notifications (extract name and time)
        const eventNotifications = events.map((event) => ({
          id: event.id,
          type: 'calendar-event',
          title: event.title,
          description: event.description,
          start: event.start,
          end: event.end,
          startDate: event.startDate,
          endDate: event.endDate,
          allDay: event.allDay,
          location: event.location,
          htmlLink: event.htmlLink,
          urgency: event.urgency,
          timeLabel: event.timeLabel,
          hoursUntil: event.hoursUntil,
          daysUntil: event.daysUntil,
          minutesUntil: event.minutesUntil,
          isRead: readNotifications.has(event.id),
        }))

        setNotifications(eventNotifications)
      } else {
        if (result.message?.includes('not connected')) {
          setError('Google Calendar is not connected. Please connect your calendar to see event notifications.')
        } else {
          setError(result.message || 'Failed to load calendar notifications')
        }
        setNotifications([])
      }
    } catch (err) {
      console.error('Error fetching notifications:', err)
      setError('Failed to load calendar notifications')
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }, [userId, readNotifications])

  useEffect(() => {
    fetchNotifications()
    
    // Refresh notifications every 5 minutes
    const interval = setInterval(() => {
      fetchNotifications()
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [fetchNotifications])

  // Filter notifications by tab
  const filteredNotifications = notifications.filter((notification) => {
    if (activeTab === 'all') return true
    if (activeTab === 'urgent') return notification.urgency === 'urgent' || notification.urgency === 'soon'
    if (activeTab === 'upcoming') return notification.urgency === 'upcoming' || notification.urgency === 'normal'
    if (activeTab === 'past') return notification.urgency === 'past'
    return true
  })

  // Group notifications by urgency
  const urgentNotifications = notifications.filter(n => n.urgency === 'urgent' || n.urgency === 'soon')
  const upcomingNotifications = notifications.filter(n => n.urgency === 'upcoming' || n.urgency === 'normal')
  const pastNotifications = notifications.filter(n => n.urgency === 'past')

  const unreadCount = notifications.filter(n => !readNotifications.has(n.id)).length
  const urgentCount = urgentNotifications.filter(n => !readNotifications.has(n.id)).length

  // Mark notification as read
  const markAsRead = (notificationId) => {
    setReadNotifications(prev => new Set([...prev, notificationId]))
  }

  // Mark all as read
  const markAllAsRead = () => {
    const allIds = notifications.map(n => n.id)
    setReadNotifications(new Set(allIds))
  }

  // Format time for display
  const formatEventTime = (notification) => {
    if (notification.allDay) {
      const date = new Date(notification.startDate)
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      })
    }
    
    const startDate = new Date(notification.startDate)
    const endDate = new Date(notification.endDate)
    
    const startTime = startDate.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
    const endTime = endDate.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
    
    return `${startTime} - ${endTime}`
  }

  if (loading) {
    return (
      <div className="h-full bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Loading calendar notifications...</p>
        </div>
      </div>
    )
  }

  if (error && !notifications.length) {
    return (
      <div className="h-full bg-gray-50">
        <div className="w-full bg-white min-h-full">
          <div className="border-b border-gray-200 px-8 py-6">
            <h1 className="text-2xl font-semibold text-gray-900">Calendar Notifications</h1>
          </div>
          <div className="p-8">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
              <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
              <p className="text-gray-700 mb-4">{error}</p>
              <div className="flex items-center justify-center gap-4">
                {error.includes('not connected') && (
                  <a 
                    href="/app/calendars" 
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    Connect Google Calendar
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-gray-50">
      <div className="w-full bg-white min-h-full">
        <div className="border-b border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Calendar Notifications</h1>
            {notifications.length > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white rounded-lg hover:bg-gray-50 transition-colors border border-gray-300"
              >
                Mark All as Read
            </button>
            )}
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
                <span className="ml-1 px-1.5 py-0.5 text-xs font-semibold text-white rounded-full bg-blue-600">
                  {unreadCount}
                </span>
              )}
              {activeTab === 'all' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('urgent')}
              className={`flex items-center gap-2 pb-4 px-1 relative ${
                activeTab === 'urgent'
                  ? 'text-gray-900'
                  : 'text-gray-600 hover:text-gray-900'
              } transition-colors`}
            >
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Urgent</span>
              {urgentCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs font-semibold text-white rounded-full bg-red-600">
                  {urgentCount}
                </span>
              )}
              {activeTab === 'urgent' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('upcoming')}
              className={`flex items-center gap-2 pb-4 px-1 relative ${
                activeTab === 'upcoming'
                  ? 'text-gray-900'
                  : 'text-gray-600 hover:text-gray-900'
              } transition-colors`}
            >
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-medium">Upcoming</span>
              {activeTab === 'upcoming' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>

            <button 
              onClick={() => setActiveTab('past')}
              className={`flex items-center gap-2 pb-4 px-1 relative ${
                activeTab === 'past'
                  ? 'text-gray-900'
                  : 'text-gray-600 hover:text-gray-900'
              } transition-colors`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-sm font-medium">Past</span>
              {activeTab === 'past' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-600" />
              )}
            </button>
          </div>
        </div>

  <div className="p-8">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">No {activeTab === 'all' ? '' : activeTab} notifications</p>
              <p className="text-gray-400 text-sm">
                {activeTab === 'all' 
                  ? 'You have no upcoming calendar events in the next 7 days.'
                  : `You have no ${activeTab} calendar events.`}
              </p>
            </div>
          ) : (
          <div className="space-y-4">
              {filteredNotifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                  isRead={readNotifications.has(notification.id)}
                  onMarkAsRead={() => markAsRead(notification.id)}
                  formatEventTime={formatEventTime}
              />
            ))}
          </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default NotificationsPage
