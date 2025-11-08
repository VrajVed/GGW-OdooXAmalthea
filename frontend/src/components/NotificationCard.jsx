import { useState } from 'react'
import { MoreVertical, Reply, Check, X as XIcon, Send } from 'lucide-react'

function NotificationCard({ notification, getInitials, getAvatarColor }) {
  const [showReplyBox, setShowReplyBox] = useState(false)
  const [replyText, setReplyText] = useState('')

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        {!notification.isRead && (
          <div
            className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
            style={{ backgroundColor: '#714b67' }}
          />
        )}
        {notification.isRead && <div className="w-2 flex-shrink-0" />}
        <div className={`w-10 h-10 ${getAvatarColor(notification.user.name)} rounded-full flex items-center justify-center flex-shrink-0`}>
          <span className="text-sm font-semibold text-white">
            {getInitials(notification.user.name)}
          </span>
        </div>

        
        
        
        
        
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-700 mb-2">
            <span className="font-semibold text-gray-900">{notification.user.name}</span>{' '}
            {notification.message}{' '}
            <span className="font-semibold text-gray-900">{notification.project}</span>
          </p>
          
          
          
          
          {notification.quotedComment && (
            <div className="mb-3 pl-3 border-l-2 border-gray-300 bg-gray-50 rounded-r py-2">
              <p className="text-sm text-gray-600">{notification.quotedComment}</p>
            </div>
          )}
          
          
          
          <div className="mb-2">
            {notification.action === 'reply' && (
              <>
                {!showReplyBox ? (
                  <button
                    onClick={() => setShowReplyBox(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Reply className="w-3.5 h-3.5" />
                    Reply
                  </button>
                ) : (
                  <div className="space-y-2">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type your reply..."
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent resize-none"
                      rows="3"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setShowReplyBox(false)
                          setReplyText('')
                        }}
                        className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          setShowReplyBox(false)
                          setReplyText('')
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-opacity"
                        style={{ backgroundColor: '#714b67' }}
                      >
                        <Send className="w-3.5 h-3.5" />
                        Send
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
            {notification.action === 'accept-decline' && (
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <XIcon className="w-3.5 h-3.5" />
                  Decline
                </button>
                <button
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: '#714b67' }}
                >
                  <Check className="w-3.5 h-3.5" />
                  Accept
                </button>
              </div>
            )}
          </div>

          <p className="text-xs text-gray-500">
            {notification.time} | {notification.team}
          </p>
        </div>
        
        
        
        
        
        <button className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0">
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default NotificationCard

