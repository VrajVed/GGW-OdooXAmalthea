/**
 * Calendar Page - Google Calendar Integration
 * 
 * URL Flow:
 * 1. User clicks "Connect" -> Frontend calls: BACKEND/api/calendar/auth-url
 * 2. User redirected to: Google OAuth page
 * 3. Google redirects to: BACKEND/api/calendar/callback (backend receives OAuth code)
 * 4. Backend processes OAuth and redirects to: FRONTEND/app/calendars?connected=true
 * 5. This page loads and shows calendar events
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import React from 'react'
import { useSearchParams } from 'react-router-dom'
import { Calendar, Link2, Unlink, Loader2 } from 'lucide-react'
import { calendarApi, getUser, getToken } from '../lib/api'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
// FullCalendar CSS - imported via Vite
// FullCalendar CSS is loaded via CDN in index.html

export default function CalendarPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingEvents, setLoadingEvents] = useState(false)
  const [events, setEvents] = useState([])
  const [calendars, setCalendars] = useState([])
  const [currentView, setCurrentView] = useState('dayGridMonth')
  const [error, setError] = useState(null)

  const user = getUser()
  const userId = user?.id
  const hasCheckedConnection = useRef(false)
  const lastDateRange = useRef(null)
  const datesSetTimeoutRef = useRef(null)
  const isLoadingEventsRef = useRef(false)
  const calendarMountedRef = useRef(false)

  // Define all callbacks first before using them in useEffect
  const checkConnectionStatus = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      setError('Please log in to view your calendar')
      return
    }
    
    // Check if user has a token
    const token = getToken()
    if (!token) {
      setLoading(false)
      setError('Authentication required. Please log in again.')
      return
    }
    
    try {
      setLoading(true)
      setError(null)
      
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      )
      
      const result = await Promise.race([
        calendarApi.getStatus(userId),
        timeoutPromise
      ])
      
      if (result.success) {
        setConnected(result.data.connected)
      } else {
        setError(result.message || 'Failed to check connection status')
        setConnected(false)
      }
    } catch (err) {
      console.error('Error checking connection status:', err)
      if (err.message === 'Request timeout') {
        setError('Backend server is not responding. Please make sure it is running on port 5000.')
      } else {
        setError('Failed to check connection status. Make sure the backend server is running.')
      }
      setConnected(false)
    } finally {
      setLoading(false)
    }
  }, [userId])

  const loadCalendars = useCallback(async () => {
    if (!userId) return
    
    // Check if user has a token
    const token = getToken()
    if (!token) {
      setError('Authentication required. Please log in again.')
      return
    }
    
    try {
      const result = await calendarApi.getCalendars(userId)
      if (result.success) {
        setCalendars(result.data || [])
      } else {
        setError(result.message || 'Failed to load calendars')
      }
    } catch (err) {
      console.error('Error loading calendars:', err)
      setError('Failed to load calendars')
    }
  }, [userId])

  const loadEvents = useCallback(async (dateRange = null) => {
    if (!userId) return
    
    // Check if user has a token
    const token = getToken()
    if (!token) {
      setError('Authentication required. Please log in again.')
      return
    }
    
    // Prevent concurrent loading
    if (isLoadingEventsRef.current) {
      console.log('Already loading events, skipping...')
      return
    }
    
    // Prevent reloading if date range hasn't changed significantly
    if (dateRange) {
      const rangeKey = `${dateRange.start}-${dateRange.end}`
      if (lastDateRange.current === rangeKey) {
        console.log('Same date range, skipping load:', rangeKey)
        return // Skip if same date range
      }
      lastDateRange.current = rangeKey
    }
    
    try {
      isLoadingEventsRef.current = true
      setLoadingEvents(true)
      setError(null)

      const filters = {}
      if (dateRange) {
        filters.timeMin = dateRange.start
        filters.timeMax = dateRange.end
      } else {
        // Default to current month if no date range provided
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
        filters.timeMin = startOfMonth.toISOString()
        filters.timeMax = endOfMonth.toISOString()
      }

      console.log('Loading calendar events with filters:', filters)
      const result = await calendarApi.getEvents(filters, userId)
      
      console.log('Calendar events API response:', {
        success: result.success,
        eventCount: result.data?.length || 0,
        filters: filters
      })
      
      if (result.success) {
        const fetchedEvents = result.data || []
        console.log('Fetched events:', fetchedEvents.slice(0, 3)) // Log first 3 events
        setEvents(fetchedEvents)
      } else {
        console.error('Failed to load events:', result.message)
        setError(result.message || 'Failed to load events')
        setEvents([])
      }
    } catch (err) {
      console.error('Error loading events:', err)
      setError('Failed to load calendar events')
      setEvents([])
    } finally {
      setLoadingEvents(false)
      isLoadingEventsRef.current = false
    }
  }, [userId])

  const handleConnect = async () => {
    try {
      if (!userId) {
        setError('User not found. Please log in again.')
        return
      }

      // Check if user has a token
      const token = getToken()
      if (!token) {
        setError('Authentication required. Please log in again.')
        return
      }

      // Call BACKEND to get Google OAuth URL
      const result = await calendarApi.getAuthUrl(userId)
      
      if (result.success && result.data.authUrl) {
        // Redirect to Google OAuth (Google will redirect back to BACKEND/api/calendar/callback)
        window.location.href = result.data.authUrl
      } else {
        if (result.error === 'GOOGLE_CREDENTIALS_NOT_CONFIGURED') {
          setError(result.message || 'Google OAuth credentials are not configured.')
        } else {
          setError(result.message || 'Failed to get authentication URL')
        }
      }
    } catch (err) {
      console.error('Error connecting calendar:', err)
      setError('Failed to connect Google Calendar. Please try again.')
    }
  }

  const handleDisconnect = async () => {
    try {
      const result = await calendarApi.disconnect(userId)
      if (result.success) {
        setConnected(false)
        setCalendars([])
        setEvents([])
      } else {
        setError(result.message || 'Failed to disconnect')
      }
    } catch (err) {
      console.error('Error disconnecting calendar:', err)
      setError('Failed to disconnect Google Calendar')
    }
  }


  // Now define useEffect hooks after all callbacks
  // Check connection status on mount (only once)
  useEffect(() => {
    if (userId && !hasCheckedConnection.current) {
      hasCheckedConnection.current = true
      checkConnectionStatus()
    } else if (!userId) {
      setLoading(false)
      setError('Please log in to view your calendar')
    }
  }, [userId, checkConnectionStatus])

  // Handle OAuth callback (when redirected back from Google)
  useEffect(() => {
    const connectedParam = searchParams.get('connected')
    if (connectedParam === 'true') {
      setConnected(true)
      hasCheckedConnection.current = false // Allow re-check
      checkConnectionStatus()
      setSearchParams({}) // Clear query params
    } else if (connectedParam === 'false') {
      setError(searchParams.get('error') || 'Failed to connect Google Calendar')
      setSearchParams({}) // Clear query params
    }
  }, [searchParams, setSearchParams, checkConnectionStatus])

  // Load calendars when connected
  useEffect(() => {
    if (connected && userId) {
      loadCalendars()
      // Reset calendar mounted flag when connection changes
      calendarMountedRef.current = false
      lastDateRange.current = null
    }
  }, [connected, userId, loadCalendars])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (datesSetTimeoutRef.current) {
        clearTimeout(datesSetTimeoutRef.current)
      }
    }
  }, [])

  // Transform events for FullCalendar
  const calendarEvents = React.useMemo(() => {
    if (!events || events.length === 0) {
      console.log('No events to transform')
      return []
    }
    
    const transformed = events.map((event, index) => {
      try {
        // FullCalendar expects dates in ISO format
        // For all-day events: YYYY-MM-DD
        // For timed events: ISO datetime string
        let start = event.start
        let end = event.end
        
        if (!start) {
          console.warn(`Event ${index} missing start date:`, event)
          return null
        }
        
        // Ensure proper date formatting
        const startDate = new Date(start)
        if (isNaN(startDate.getTime())) {
          console.warn(`Event ${index} has invalid start date:`, start, event)
          return null
        }
        
        const isAllDay = event.allDay || !event.start?.includes('T')
        start = isAllDay ? startDate.toISOString().split('T')[0] : startDate.toISOString()
        
        if (end) {
          const endDate = new Date(end)
          if (isNaN(endDate.getTime())) {
            console.warn(`Event ${index} has invalid end date:`, end, event)
            // Use start date + 1 hour as fallback
            endDate.setTime(startDate.getTime() + 60 * 60 * 1000)
          }
          // For all-day events, end date should be exclusive (next day)
          if (isAllDay) {
            endDate.setDate(endDate.getDate() + 1)
            end = endDate.toISOString().split('T')[0]
          } else {
            end = endDate.toISOString()
          }
        } else {
          // No end date, use start + 1 hour
          const defaultEnd = new Date(startDate)
          defaultEnd.setHours(defaultEnd.getHours() + 1)
          end = isAllDay ? defaultEnd.toISOString().split('T')[0] : defaultEnd.toISOString()
        }
        
        return {
          id: event.id || `event-${index}-${Date.now()}`,
          title: event.title || '(No title)',
          start: start,
          end: end,
          allDay: isAllDay,
          backgroundColor: event.backgroundColor || '#3b82f6',
          borderColor: event.backgroundColor || '#3b82f6',
          textColor: '#ffffff',
          extendedProps: {
            description: event.description || '',
            location: event.location || '',
            htmlLink: event.htmlLink || '',
            calendarId: event.calendarId || '',
          },
        }
      } catch (err) {
        console.error(`Error transforming event ${index}:`, err, event)
        return null
      }
    }).filter(Boolean) // Remove any null entries from invalid dates
    
    console.log(`Transformed ${transformed.length} of ${events.length} events for FullCalendar`)
    return transformed
  }, [events])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400 mb-2" />
        <p className="text-sm text-gray-500">Checking calendar connection...</p>
      </div>
    )
  }

  if (!connected) {
    return (
      <div className="p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Connect Your Google Calendar</h2>
            <p className="text-gray-600 mb-6">
              Connect your Google Calendar to view and manage your events in one place.
            </p>
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm font-medium mb-1">Connection Error</p>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
            <button
              onClick={handleConnect}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Link2 className="w-5 h-5" />
              Connect Google Calendar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Calendar</h1>
            <p className="text-sm text-gray-600 mt-1">
              View and manage your Google Calendar events
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDisconnect}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Unlink className="w-4 h-4" />
              Disconnect
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm font-medium mb-1">Error</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        {loadingEvents ? (
          <div className="flex items-center justify-center h-96">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-500">Loading events...</span>
          </div>
        ) : (
          <div className="calendar-container">
            <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView={currentView}
            events={calendarEvents}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay',
            }}
            height="auto"
            eventClick={(info) => {
              const event = info.event
              const details = [
                `Title: ${event.title}`,
                event.extendedProps.description && `Description: ${event.extendedProps.description}`,
                event.extendedProps.location && `Location: ${event.extendedProps.location}`,
                `Time: ${event.start ? new Date(event.start).toLocaleString() : 'All day'}`,
                event.extendedProps.htmlLink && `View in Google Calendar`
              ].filter(Boolean).join('\n')
              alert(details)
            }}
            datesSet={(dateInfo) => {
              // Only load events if calendar is mounted and user is connected
              if (!userId || !calendarMountedRef.current) return
              
              // Clear previous timeout
              if (datesSetTimeoutRef.current) {
                clearTimeout(datesSetTimeoutRef.current)
              }
              
              // FullCalendar provides start and end dates
              // start is inclusive, end is exclusive
              const dateRange = {
                start: dateInfo.start.toISOString(),
                end: dateInfo.end.toISOString() // This is already exclusive
              }
              
              // Check if date range actually changed (with some tolerance for time precision)
              const rangeKey = `${dateRange.start}-${dateRange.end}`
              if (lastDateRange.current === rangeKey) {
                console.log('Same date range in datesSet, skipping:', rangeKey)
                return
              }
              
              console.log('FullCalendar datesSet:', {
                view: dateInfo.view.type,
                start: dateRange.start,
                end: dateRange.end
              })
              
              // Debounce to prevent rapid calls
              datesSetTimeoutRef.current = setTimeout(() => {
                loadEvents(dateRange)
                datesSetTimeoutRef.current = null
              }, 500)
            }}
            viewDidMount={(viewInfo) => {
              setCurrentView(viewInfo.view.type)
              calendarMountedRef.current = true
              
              // Load events on initial mount with the current view's date range
              if (userId && !isLoadingEventsRef.current) {
                const view = viewInfo.view
                const dateRange = {
                  start: view.activeStart.toISOString(),
                  end: view.activeEnd.toISOString()
                }
                console.log('Calendar mounted, loading initial events:', dateRange)
                loadEvents(dateRange)
              }
            }}
            weekends={true}
            eventDisplay="block"
            dayMaxEvents={3}
          />
          </div>
        )}
      </div>

      {events.length === 0 && !loadingEvents && !loading && (
        <div className="mt-4 text-center text-gray-500">
          <p>No events found for the selected date range.</p>
          <p className="text-xs mt-2 text-gray-400">
            Events loaded: {calendarEvents.length} | Raw events: {events.length}
          </p>
        </div>
      )}
    </div>
  )
}

