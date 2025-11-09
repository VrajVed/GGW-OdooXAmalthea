import { useState, useEffect } from 'react'
import { X, CheckCircle2, XCircle, Clock, Edit } from 'lucide-react'
import { timesheetsApi, getUser } from '../../lib/api'

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

export default function TimesheetDrawer({ timesheet, onClose, onUpdate, onApprove, onReject }) {
  const [timesheetData, setTimesheetData] = useState(timesheet)
  const [loading, setLoading] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    setCurrentUser(getUser())
    if (timesheet?.id) {
      loadTimesheetDetails()
    } else {
      setTimesheetData(timesheet)
    }
  }, [timesheet])

  const loadTimesheetDetails = async () => {
    setLoading(true)
    try {
      const result = await timesheetsApi.getById(timesheet.id)
      if (result.success) {
        setTimesheetData(result.data)
      }
    } catch (error) {
      console.error('Error loading timesheet details:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount, currency = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const formatDateTime = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleString('en-IN', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatHours = (hours) => {
    if (!hours) return '0h'
    const h = Math.floor(hours)
    const m = Math.round((hours - h) * 60)
    if (m === 0) return `${h}h`
    return `${h}h ${m}m`
  }

  const getStatusPill = (status) => {
    const StatusIcon = status === 'pending' ? Clock : status === 'approved' ? CheckCircle2 : XCircle
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${STATUS_COLORS[status] || STATUS_COLORS.pending}`}>
        <StatusIcon className="w-4 h-4" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const canApprove = timesheetData?.status === 'pending'
  const canReject = timesheetData?.status === 'pending' || timesheetData?.status === 'approved'
  const canEdit = timesheetData?.status === 'pending'

  const handleApprove = async () => {
    try {
      const result = await timesheetsApi.approve(timesheetData.id)
      if (result.success) {
        onApprove(timesheetData.id)
        onUpdate()
        onClose()
      } else {
        alert(result.message || 'Failed to approve timesheet')
      }
    } catch (error) {
      console.error('Error approving timesheet:', error)
      alert(error.message || 'Failed to approve timesheet')
    }
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) return
    try {
      const result = await timesheetsApi.reject(timesheetData.id, rejectReason)
      if (result.success) {
        onReject(timesheetData.id)
        onUpdate()
        setShowRejectModal(false)
        setRejectReason('')
        onClose()
      } else {
        alert(result.message || 'Failed to reject timesheet')
      }
    } catch (error) {
      console.error('Error rejecting timesheet:', error)
      alert(error.message || 'Failed to reject timesheet')
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black bg-opacity-30" onClick={onClose}></div>
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-xl z-50 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
              <p className="text-gray-600">Loading timesheet details...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getStatusPill(timesheetData?.status)}
                <div>
                  <div className="text-2xl font-semibold text-gray-900">
                    {formatHours(timesheetData?.hours || 0)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatCurrency(timesheetData?.cost || 0)}
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Core Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Project</label>
                  <p className="text-sm font-medium text-gray-900">{timesheetData?.projectName || '-'}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Task</label>
                  <p className="text-sm font-medium text-gray-900">{timesheetData?.taskTitle || '-'}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Employee</label>
                  <p className="text-sm font-medium text-gray-900">{timesheetData?.userName || '-'}</p>
                  {timesheetData?.userEmail && (
                    <p className="text-xs text-gray-500">{timesheetData.userEmail}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Date Worked</label>
                  <p className="text-sm font-medium text-gray-900">{formatDate(timesheetData?.workedOn)}</p>
                </div>
                {timesheetData?.startTime && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Start Time</label>
                    <p className="text-sm font-medium text-gray-900">{formatDateTime(timesheetData.startTime)}</p>
                  </div>
                )}
                {timesheetData?.endTime && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">End Time</label>
                    <p className="text-sm font-medium text-gray-900">{formatDateTime(timesheetData.endTime)}</p>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Hours</label>
                  <p className="text-sm font-medium text-gray-900">{formatHours(timesheetData?.hours || 0)}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Billable</label>
                  <p className="text-sm font-medium text-gray-900">
                    {timesheetData?.isBillable ? 'Yes' : 'No'}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Cost Rate</label>
                  <p className="text-sm font-medium text-gray-900">
                    {timesheetData?.costRate ? formatCurrency(timesheetData.costRate) + '/hr' : '-'}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Total Cost</label>
                  <p className="text-sm font-medium text-gray-900">
                    {formatCurrency(timesheetData?.cost || 0)}
                  </p>
                </div>
              </div>

              {/* Notes */}
              {timesheetData?.note && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{timesheetData.note}</p>
                </div>
              )}

              {/* Approval Info */}
              {timesheetData?.approvedBy && (
                <div className="border-t border-gray-200 pt-4">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Approved By</label>
                  <p className="text-sm font-medium text-gray-900">{timesheetData.approverName || '-'}</p>
                  {timesheetData.approvedAt && (
                    <p className="text-xs text-gray-500 mt-1">{formatDateTime(timesheetData.approvedAt)}</p>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                {canApprove && (
                  <button
                    onClick={handleApprove}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Approve
                  </button>
                )}
                {canReject && (
                  <button
                    onClick={() => setShowRejectModal(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reject Timesheet</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for rejecting this timesheet.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              rows={4}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
            />
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false)
                  setRejectReason('')
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

