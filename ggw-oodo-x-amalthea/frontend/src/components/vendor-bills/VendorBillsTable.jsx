import { CheckCircle2, XCircle, FileText, Clock } from 'lucide-react'

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-700',
  posted: 'bg-green-100 text-green-700',
  fulfilled: 'bg-blue-100 text-blue-700',
  closed: 'bg-purple-100 text-purple-700',
  cancelled: 'bg-red-100 text-red-700',
}

const STATUS_ICONS = {
  draft: FileText,
  posted: CheckCircle2,
  fulfilled: Clock,
  closed: CheckCircle2,
  cancelled: XCircle,
}

export default function VendorBillsTable({ vendorBills, selectedIds, onSelect, onSelectAll, onRowClick }) {
  const allSelected = vendorBills.length > 0 && selectedIds.length === vendorBills.length
  const someSelected = selectedIds.length > 0 && selectedIds.length < vendorBills.length

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

  if (vendorBills.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No vendor bills found</p>
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
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Number</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Vendor</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Project</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Reference</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {vendorBills.map((order) => (
            <tr
              key={order.id}
              onClick={() => onRowClick(order)}
              className="hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(order.id)}
                  onChange={(e) => {
                    e.stopPropagation()
                    onSelect(order.id, e.target.checked)
                  }}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
              </td>
              <td className="px-4 py-3 text-sm font-medium text-gray-900">{order.number || '-'}</td>
              <td className="px-4 py-3 text-sm text-gray-900">{formatDate(order.billDate)}</td>
              <td className="px-4 py-3 text-sm text-gray-900">{order.vendorName || '-'}</td>
              <td className="px-4 py-3 text-sm text-gray-900">{order.projectName || '-'}</td>
              <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                {formatCurrency(order.grandTotal, order.currency)}
              </td>
              <td className="px-4 py-3">{getStatusPill(order.status)}</td>
              <td className="px-4 py-3 text-sm text-gray-500">{order.reference || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

