import { useState } from 'react'
import { Calendar, Clock, MapPin, ExternalLink, CheckCircle2, AlertCircle, X } from 'lucide-react'

function NotificationCard({ notification, isRead, onMarkAsRead, formatEventTime }) {
  const [isHovered, setIsHovered] = useState(false)

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'urgent':
        return 'bg-red-100 border-red-300'
      case 'soon':
        return 'bg-orange-100 border-orange-300'
      case 'upcoming':
        return 'bg-blue-100 border-blue-300'
      case 'normal':
        return 'bg-gray-100 border-gray-300'
      case 'past':
        return 'bg-gray-50 border-gray-200'
      default:
        return 'bg-white border-gray-200'
    }
  }

  const getUrgencyIcon = (urgency) => {
    switch (urgency) {
      case 'urgent':
      case 'soon':
        return <AlertCircle className="w-5 h-5 text-red-600" />
      case 'upcoming':
      case 'normal':
        return <Calendar className="w-5 h-5 text-blue-600" />
      case 'past':
        return <CheckCircle2 className="w-5 h-5 text-gray-500" />
      default:
        return <Calendar className="w-5 h-5 text-gray-600" />
    }
  }

  const getUrgencyTextColor = (urgency) => {
    switch (urgency) {
      case 'urgent':
        return 'text-red-700'
      case 'soon':
        return 'text-orange-700'
      case 'upcoming':
        return 'text-blue-700'
      case 'normal':
        return 'text-gray-700'
      case 'past':
        return 'text-gray-500'
      default:
        return 'text-gray-700'
    }
  }

  return (
    <div
      className={`rounded-lg border-2 p-5 transition-all ${
        isRead ? 'opacity-75' : ''
      } ${getUrgencyColor(notification.urgency)}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start gap-4">
        {/* Unread indicator */}
        {!isRead && (
          <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0 bg-blue-600" />
        )}
        {isRead && <div className="w-2 flex-shrink-0" />}

        {/* Icon */}
        <div className="flex-shrink-0 mt-1">
          {getUrgencyIcon(notification.urgency)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className={`text-lg font-semibold mb-1 ${getUrgencyTextColor(notification.urgency)}`}>
                {notification.title}
              </h3>

              {notification.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {notification.description}
                </p>
              )}

              {/* Event details */}
              <div className="space-y-2 mb-3">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">{formatEventTime(notification)}</span>
                  {notification.timeLabel && (
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${getUrgencyTextColor(notification.urgency)} bg-white`}>
                      {notification.timeLabel}
                    </span>
                  )}
                </div>

                {notification.location && (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span>{notification.location}</span>
            </div>
          )}
          
                {notification.allDay && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    <span>All-day event</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 mt-4">
                {notification.htmlLink && (
                  <a
                    href={notification.htmlLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open in Calendar
                  </a>
                )}
                
                {!isRead && (
                  <button
                    onClick={onMarkAsRead}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Mark as Read
                  </button>
                )}
              </div>
            </div>

            {/* Mark as read button (appears on hover) */}
            {isHovered && !isRead && (
              <button
                onClick={onMarkAsRead}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors p-1"
                title="Mark as read"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotificationCard
