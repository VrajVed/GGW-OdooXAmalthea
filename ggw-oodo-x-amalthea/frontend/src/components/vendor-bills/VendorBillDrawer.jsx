import { X } from 'lucide-react'
import { vendorBillsApi } from '../../lib/api'

export default function VendorBillDrawer({ order, onClose, onUpdate }) {
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

  const handlePost = async () => {
    try {
      await vendorBillsApi.post(order.id)
      onUpdate()
    } catch (error) {
      console.error('Error posting bill:', error)
    }
  }

  const handleCancel = async () => {
    try {
      await vendorBillsApi.cancel(order.id)
      onUpdate()
    } catch (error) {
      console.error('Error cancelling order:', error)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-2xl bg-white shadow-xl">
        <div className="h-full flex flex-col">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Vendor Bill Details</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Order Information</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Number:</span>
                    <span className="text-sm font-medium text-gray-900">{order.number || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Date:</span>
                    <span className="text-sm font-medium text-gray-900">{formatDate(order.billDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Vendor:</span>
                    <span className="text-sm font-medium text-gray-900">{order.vendorName || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Project:</span>
                    <span className="text-sm font-medium text-gray-900">{order.projectName || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    <span className="text-sm font-medium text-gray-900 capitalize">{order.status || '-'}</span>
                  </div>
                </div>
              </div>

              {order.lines && order.lines.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Line Items</h3>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Description</th>
                          <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Quantity</th>
                          <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Price</th>
                          <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {order.lines.map((line) => (
                          <tr key={line.id}>
                            <td className="px-4 py-2 text-sm text-gray-900">{line.description}</td>
                            <td className="px-4 py-2 text-sm text-right text-gray-900">{line.quantity}</td>
                            <td className="px-4 py-2 text-sm text-right text-gray-900">{formatCurrency(line.unitPrice, order.currency)}</td>
                            <td className="px-4 py-2 text-sm text-right font-medium text-gray-900">{formatCurrency(line.lineTotal, order.currency)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Totals</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Subtotal:</span>
                    <span className="text-sm font-medium text-gray-900">{formatCurrency(order.subtotal || 0, order.currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Tax:</span>
                    <span className="text-sm font-medium text-gray-900">{formatCurrency(order.taxTotal || 0, order.currency)}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-300 pt-2">
                    <span className="text-sm font-semibold text-gray-900">Grand Total:</span>
                    <span className="text-sm font-semibold text-gray-900">{formatCurrency(order.grandTotal || 0, order.currency)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
            {order.status === 'draft' && (
              <>
                <button
                  onClick={handlePost}
                  className="px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90"
                  style={{ backgroundColor: '#714b67' }}
                >
                  Post
                </button>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel Bill
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

