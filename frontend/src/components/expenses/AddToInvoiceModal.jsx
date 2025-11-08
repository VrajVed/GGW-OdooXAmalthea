import { useState, useEffect } from 'react'
import { X, Plus } from 'lucide-react'
import { expensesApi } from '../../lib/api'

export default function AddToInvoiceModal({ expenses, onClose, onSave }) {
  const [invoiceMode, setInvoiceMode] = useState('new') // 'new' or 'existing'
  const [existingInvoiceId, setExistingInvoiceId] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    // Get customer from first expense's project
    if (expenses.length > 0 && expenses[0].projectId) {
      // TODO: Fetch customer from project
      // For now, set a placeholder
      setCustomerId('')
    }
  }, [expenses])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})

    if (invoiceMode === 'existing' && !existingInvoiceId) {
      setErrors({ invoice: 'Please select an invoice' })
      return
    }

    setSaving(true)
    try {
      // Process each expense
      const results = []
      for (const expense of expenses) {
        const invoiceData = {
          invoice_id: invoiceMode === 'existing' ? existingInvoiceId : null,
          customer_id: customerId,
        }

        const result = await expensesApi.addToInvoice(expense.id, invoiceData)
        results.push({ expenseId: expense.id, success: result.success, data: result.data })
      }

      const allSuccess = results.every(r => r.success)
      if (allSuccess) {
        onSave(results)
        onClose()
      } else {
        setErrors({ submit: 'Some expenses could not be added to invoice' })
      }
    } catch (error) {
      console.error('Error adding to invoice:', error)
      setErrors({ submit: error.message || 'Failed to add expenses to invoice' })
    } finally {
      setSaving(false)
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

  const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount + (exp.taxAmount || 0), 0)
  const currency = expenses[0]?.currency || 'INR'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Add to Invoice</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
              {errors.submit}
            </div>
          )}

          {/* Invoice Mode Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Invoice</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="invoiceMode"
                  value="new"
                  checked={invoiceMode === 'new'}
                  onChange={(e) => setInvoiceMode(e.target.value)}
                  className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                />
                <span className="ml-2 text-sm text-gray-700">Create New Invoice</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="invoiceMode"
                  value="existing"
                  checked={invoiceMode === 'existing'}
                  onChange={(e) => setInvoiceMode(e.target.value)}
                  className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                />
                <span className="ml-2 text-sm text-gray-700">Add to Existing Invoice</span>
              </label>
            </div>
          </div>

          {/* Existing Invoice Selection */}
          {invoiceMode === 'existing' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Invoice <span className="text-red-500">*</span>
              </label>
              <select
                value={existingInvoiceId}
                onChange={(e) => setExistingInvoiceId(e.target.value)}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.invoice ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select invoice...</option>
                {/* TODO: Fetch and populate draft invoices */}
                <option value="placeholder">Invoice #INV-001 (Draft)</option>
              </select>
              {errors.invoice && (
                <p className="mt-1 text-xs text-red-600">{errors.invoice}</p>
              )}
            </div>
          )}

          {/* Customer Info */}
          {invoiceMode === 'new' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
              <input
                type="text"
                value={customerId || 'Customer from project'}
                disabled
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
              />
              <p className="mt-1 text-xs text-gray-500">Customer will be prefilled from project</p>
            </div>
          )}

          {/* Expense Lines Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Expense Lines</label>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Description</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Amount</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Tax</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {expenses.map((expense) => {
                    const description = `Expense – ${expense.category} – ${expense.employeeName || 'Employee'} – ${expense.spentOn}`
                    const total = expense.amount + (expense.taxAmount || 0)
                    return (
                      <tr key={expense.id}>
                        <td className="px-4 py-2 text-sm text-gray-900">{description}</td>
                        <td className="px-4 py-2 text-sm text-right text-gray-900">
                          {formatCurrency(expense.amount, expense.currency)}
                        </td>
                        <td className="px-4 py-2 text-sm text-right text-gray-900">
                          {formatCurrency(expense.taxAmount || 0, expense.currency)}
                        </td>
                        <td className="px-4 py-2 text-sm text-right font-medium text-gray-900">
                          {formatCurrency(total, expense.currency)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={3} className="px-4 py-2 text-sm font-semibold text-gray-900 text-right">
                      Total:
                    </td>
                    <td className="px-4 py-2 text-sm font-semibold text-gray-900 text-right">
                      {formatCurrency(totalAmount, currency)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Validation Message */}
          {expenses.length > 1 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              <p className="font-medium mb-1">Note:</p>
              <p>All expenses must be from the same project and customer. Selected expenses will be added as separate invoice lines.</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: '#714b67' }}
            >
              {invoiceMode === 'new' && <Plus className="w-4 h-4" />}
              {saving ? 'Adding...' : invoiceMode === 'new' ? 'Create Invoice' : 'Add to Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

