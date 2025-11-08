import { Paperclip, CheckCircle2, XCircle, Clock, FileText } from 'lucide-react'

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-700',
  submitted: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  reimbursed: 'bg-blue-100 text-blue-700',
  paid: 'bg-purple-100 text-purple-700',
}

const STATUS_ICONS = {
  draft: FileText,
  submitted: Clock,
  approved: CheckCircle2,
  rejected: XCircle,
  reimbursed: CheckCircle2,
  paid: CheckCircle2,
}

export default function ExpensesTable({ expenses, selectedIds, onSelect, onSelectAll, onRowClick }) {
  const allSelected = expenses.length > 0 && selectedIds.length === expenses.length
  const someSelected = selectedIds.length > 0 && selectedIds.length < expenses.length

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

  const getStatusPill = (status) => {
    const StatusIcon = STATUS_ICONS[status] || FileText
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[status] || STATUS_COLORS.draft}`}>
        <StatusIcon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  if (expenses.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No expenses found</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="px-4 py-3 text-left">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(input) => {
                  if (input) input.indeterminate = someSelected
                }}
                onChange={(e) => onSelectAll(e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
              />
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Employee</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Project</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Billable</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Receipt</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Invoice</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Notes</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Updated</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {expenses.map((expense) => (
            <tr
              key={expense.id}
              onClick={() => onRowClick(expense)}
              className="hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(expense.id)}
                  onChange={(e) => {
                    e.stopPropagation()
                    onSelect(expense.id, e.target.checked)
                  }}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
              </td>
              <td className="px-4 py-3 text-sm text-gray-900">{formatDate(expense.spentOn)}</td>
              <td className="px-4 py-3 text-sm text-gray-900">
                <div>
                  <div className="font-medium">{expense.employeeName || 'Unknown'}</div>
                  {expense.employeeEmail && (
                    <div className="text-xs text-gray-500">{expense.employeeEmail}</div>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-gray-900">{expense.projectName || '-'}</td>
              <td className="px-4 py-3 text-sm text-gray-900">{expense.category}</td>
              <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                {formatCurrency(expense.amount, expense.currency)}
              </td>
              <td className="px-4 py-3 text-center">
                {expense.isBillable ? (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                    Yes
                  </span>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
              <td className="px-4 py-3">{getStatusPill(expense.status)}</td>
              <td className="px-4 py-3 text-center">
                {expense.receiptFileId ? (
                  <Paperclip className="w-4 h-4 text-gray-600 mx-auto" />
                ) : (
                  <span className="text-gray-300">-</span>
                )}
              </td>
              <td className="px-4 py-3 text-sm text-gray-900">
                {expense.invoiceNumber ? (
                  <span className="text-blue-600 hover:underline">{expense.invoiceNumber}</span>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
              <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">
                {expense.note || '-'}
              </td>
              <td className="px-4 py-3 text-sm text-gray-500">{formatDate(expense.updatedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

