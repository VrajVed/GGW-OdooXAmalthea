import { useState, useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { X, CheckCircle2, XCircle, FileText, Edit, Download, AlertTriangle, Clock } from 'lucide-react'
import { expensesApi, getUser } from '../../lib/api'

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-700',
  submitted: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  reimbursed: 'bg-blue-100 text-blue-700',
  paid: 'bg-purple-100 text-purple-700',
}

export default function ExpenseDrawer({ expense, onClose, onUpdate, onApprove, onReject, onAddToInvoice }) {
  const location = useLocation()
  const [expenseData, setExpenseData] = useState(expense)
  const [loading, setLoading] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    const user = getUser()
    setCurrentUser(user)
    if (expense?.id && !expense.activityLog) {
      loadExpenseDetails()
    } else {
      setExpenseData(expense)
    }
  }, [expense])

  const loadExpenseDetails = async () => {
    setLoading(true)
    try {
      const result = await expensesApi.getById(expense.id)
      if (result.success) {
        setExpenseData(result.data)
      }
    } catch (error) {
      console.error('Error loading expense details:', error)
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

  const getStatusPill = (status) => {
    const StatusIcon = status === 'submitted' ? Clock : status === 'approved' ? CheckCircle2 : status === 'rejected' ? XCircle : FileText
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${STATUS_COLORS[status] || STATUS_COLORS.draft}`}>
        <StatusIcon className="w-4 h-4" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  // Check if current user is a manager or admin
  // Also check if we're on the manager route (/app/expenses) as fallback
  const isManagerRoute = location.pathname.startsWith('/app')
  const isManager = useMemo(() => {
    if (currentUser) {
      const userRole = currentUser.role
      return userRole === 'project_manager' || userRole === 'admin'
    }
    // Fallback: If on manager route, assume manager (for cases where user not loaded yet)
    return isManagerRoute
  }, [currentUser, isManagerRoute])
  
  // Debug logging (can be removed later)
  useEffect(() => {
    console.log('ExpenseDrawer Full Debug:', {
      expenseStatus: expenseData?.status,
      expenseStatusType: typeof expenseData?.status,
      userRole: currentUser?.role,
      isManager,
      isManagerRoute,
      currentUser: currentUser,
      pathname: location.pathname,
      shouldShowButtons: expenseData?.status === 'submitted' && (isManagerRoute || isManager),
      expenseData: expenseData
    })
  }, [expenseData?.status, currentUser, isManager, isManagerRoute, location.pathname])

  // Add to Invoice: Only for approved expenses that are billable
  const canAddToInvoice = expenseData?.status === 'approved' && expenseData?.isBillable && !expenseData?.invoiceLineId
  
  // Edit: Only for draft or rejected expenses (by the owner)
  const canEdit = (expenseData?.status === 'draft' || expenseData?.status === 'rejected') &&
                  expenseData?.userId === currentUser?.id

  const handleApprove = async () => {
    try {
      const result = await expensesApi.approve(expenseData.id)
      if (result.success) {
        onApprove(expenseData.id)
        onUpdate() // Refresh the list
        onClose() // Close drawer
      } else {
        alert(result.message || 'Failed to approve expense')
      }
    } catch (error) {
      console.error('Error approving expense:', error)
      alert(error.message || 'Failed to approve expense')
    }
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) return
    try {
      const result = await expensesApi.reject(expenseData.id, rejectReason)
      if (result.success) {
        onReject(expenseData.id)
        onUpdate() // Refresh the list
        setShowRejectModal(false)
        setRejectReason('')
        onClose() // Close drawer
      } else {
        alert(result.message || 'Failed to reject expense')
      }
    } catch (error) {
      console.error('Error rejecting expense:', error)
      alert(error.message || 'Failed to reject expense')
    }
  }

  const handleAddToInvoice = () => {
    onAddToInvoice([expenseData])
  }

  // Build receipt URL from storage_url in database
  const receiptUrl = expenseData?.receiptUrl 
    ? (expenseData.receiptUrl.startsWith('http') 
        ? expenseData.receiptUrl 
        : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${expenseData.receiptUrl}`)
    : null
  const receiptIsImage = expenseData?.receiptMimeType?.startsWith('image/')

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black bg-opacity-30" onClick={onClose}></div>
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-xl z-50 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
              <p className="text-gray-600">Loading expense details...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getStatusPill(expenseData?.status)}
                <div>
                  <div className="text-2xl font-semibold text-gray-900">
                    {formatCurrency(expenseData?.amount || 0, expenseData?.currency)}
                  </div>
                  <div className="text-sm text-gray-500">{expenseData?.currency}</div>
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
                  <p className="text-sm font-medium text-gray-900">{expenseData?.projectName || '-'}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
                  <p className="text-sm font-medium text-gray-900">{expenseData?.category || '-'}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Employee</label>
                  <p className="text-sm font-medium text-gray-900">{expenseData?.employeeName || '-'}</p>
                  {expenseData?.employeeEmail && (
                    <p className="text-xs text-gray-500">{expenseData.employeeEmail}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Expense Date</label>
                  <p className="text-sm font-medium text-gray-900">{formatDate(expenseData?.spentOn)}</p>
                </div>
                {expenseData?.merchant && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Merchant/Vendor</label>
                    <p className="text-sm font-medium text-gray-900">{expenseData.merchant}</p>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Payment Method</label>
                  <p className="text-sm font-medium text-gray-900">
                    {expenseData?.paymentMethod ? expenseData.paymentMethod.charAt(0).toUpperCase() + expenseData.paymentMethod.slice(1).replace('_', ' ') : '-'}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Tax</label>
                  <p className="text-sm font-medium text-gray-900">
                    {formatCurrency(expenseData?.taxAmount || 0, expenseData?.currency)}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Billable</label>
                  <p className="text-sm font-medium text-gray-900">
                    {expenseData?.isBillable ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        Yes
                      </span>
                    ) : (
                      <span className="text-gray-400">No</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Description/Notes */}
              {expenseData?.note && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Description/Notes</label>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{expenseData.note}</p>
                </div>
              )}

              {/* Policy Flags */}
              {expenseData?.amount > 500 && !expenseData?.receiptFileId && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">Receipt Required</p>
                      <p className="text-xs text-yellow-700 mt-1">
                        Expenses over ₹500 require a receipt for approval.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Duplicates Hint */}
              {expenseData?.duplicates && expenseData.duplicates.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">Possible Duplicate</p>
                      <p className="text-xs text-blue-700 mt-1">
                        Found {expenseData.duplicates.length} similar expense(s) from the same employee on the same date with the same amount.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Receipt */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">Receipt</label>
                {expenseData?.receiptFileId ? (
                  <div className="border border-gray-200 rounded-lg p-4">
                    {receiptIsImage && receiptUrl ? (
                      <img 
                        src={receiptUrl} 
                        alt="Receipt" 
                        className="max-w-full rounded-lg mb-2"
                      />
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FileText className="w-5 h-5" />
                        <span>{expenseData.receiptFilename || 'Receipt file'}</span>
                      </div>
                    )}
                    {receiptUrl && (
                      <a
                        href={receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 mt-2 text-sm text-purple-600 hover:text-purple-700"
                      >
                        <Download className="w-4 h-4" />
                        Download Receipt
                      </a>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No receipt attached</p>
                )}
              </div>

              {/* Linked Invoice */}
              {expenseData?.invoiceNumber && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Linked Invoice</label>
                  <a
                    href={`/app/invoices/${expenseData.invoiceId}`}
                    className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    {expenseData.invoiceNumber}
                  </a>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
                {/* Debug info - remove after testing */}
                {expenseData?.status === 'submitted' && (
                  <div className="w-full mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                    Debug: status="{expenseData?.status}", route="{location.pathname}", isManagerRoute={isManagerRoute ? 'true' : 'false'}, isManager={isManager ? 'true' : 'false'}
                  </div>
                )}
                
                {/* Submitted: Show Approve and Reject buttons for managers */}
                {/* Show buttons if on /app/expenses route and status is submitted */}
                {expenseData?.status === 'submitted' && isManagerRoute && (
                  <>
                    <button
                      onClick={handleApprove}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => setShowRejectModal(true)}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </>
                )}
                  
                {/* Approved: Show only Add to Invoice button */}
                {expenseData?.status === 'approved' && canAddToInvoice && (
                  <button
                    onClick={handleAddToInvoice}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                  >
                    <FileText className="w-4 h-4" />
                    Add to Invoice
                  </button>
                )}
                
                {/* Draft or Rejected: Show Edit button for owner */}
                {(expenseData?.status === 'draft' || expenseData?.status === 'rejected') && canEdit && (
                  <button
                    onClick={() => {/* TODO: Edit expense */}}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                )}
              </div>

              {/* Activity Log */}
              {expenseData?.activityLog && expenseData.activityLog.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2">Activity Log</label>
                  <div className="space-y-3">
                    {expenseData.activityLog.map((activity, idx) => (
                      <div key={idx} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0">
                        <div className="flex-shrink-0 w-2 h-2 rounded-full bg-purple-600 mt-2"></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900">
                            <span className="font-medium">{activity.actorName || 'System'}</span>
                            {' '}
                            {activity.operation === 'I' && 'created'}
                            {activity.operation === 'U' && 'updated'}
                            {activity.operation === 'D' && 'deleted'}
                            {' this expense'}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">{formatDateTime(activity.timestamp)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reject Expense</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for rejecting this expense.
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

