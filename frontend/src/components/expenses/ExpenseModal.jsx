import { useState, useEffect } from 'react'
import { X, Upload, FileText } from 'lucide-react'
import { expensesApi, getUser } from '../../lib/api'

const PAYMENT_METHODS = ['cash', 'bank_transfer', 'card', 'upi', 'other']
const CATEGORIES = [
  'Travel', 'Meals', 'Accommodation', 'Transport', 'Office Supplies',
  'Software', 'Hardware', 'Training', 'Marketing', 'Other'
]

export default function ExpenseModal({ expense, projects, users, onClose, onSave }) {
  const [formData, setFormData] = useState({
    user_id: expense?.userId || '',
    project_id: expense?.projectId || '',
    category: expense?.category || '',
    amount: expense?.amount || '',
    tax_amount: expense?.taxAmount || 0,
    currency: expense?.currency || 'INR',
    is_billable: expense?.isBillable || false,
    spent_on: expense?.spentOn || new Date().toISOString().split('T')[0],
    merchant: expense?.merchant || '',
    payment_method: expense?.paymentMethod || 'other',
    note: expense?.note || '',
  })
  const [receiptFile, setReceiptFile] = useState(null)
  const [receiptPreview, setReceiptPreview] = useState(expense?.receiptUrl || null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (expense?.receiptUrl) {
      setReceiptPreview(expense.receiptUrl)
    }
  }, [expense])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, receipt: 'Only PDF, PNG, and JPG files are allowed' }))
      return
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, receipt: 'File size must be less than 10MB' }))
      return
    }

    setReceiptFile(file)
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors.receipt
      return newErrors
    })

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => setReceiptPreview(e.target.result)
      reader.readAsDataURL(file)
    } else {
      setReceiptPreview(null)
    }
  }

  const handleSubmit = async (e, status = 'draft') => {
    e.preventDefault()
    
    // Validation
    const newErrors = {}
    if (!formData.user_id) newErrors.user_id = 'Employee is required'
    if (!formData.category) newErrors.category = 'Category is required'
    if (!formData.amount || parseFloat(formData.amount) <= 0) newErrors.amount = 'Valid amount is required'
    if (!formData.spent_on) newErrors.spent_on = 'Expense date is required'
    
    // Check receipt requirement for amounts over ₹500
    if (parseFloat(formData.amount) > 500 && !receiptFile && !expense?.receiptFileId) {
      newErrors.receipt = 'Receipt required for expenses over ₹500'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setSaving(true)
    try {
      let receiptFileId = expense?.receiptFileId

      // Upload receipt if new file selected
      if (receiptFile) {
        setUploading(true)
        try {
          const uploadResult = await expensesApi.uploadReceipt(receiptFile)
          if (uploadResult.success && uploadResult.data?.fileId) {
            receiptFileId = uploadResult.data.fileId
            console.log('Receipt uploaded, fileId:', receiptFileId)
          } else {
            throw new Error(uploadResult.message || 'Failed to upload receipt')
          }
        } catch (uploadError) {
          console.error('Receipt upload error:', uploadError)
          throw new Error(uploadError.message || 'Failed to upload receipt')
        } finally {
          setUploading(false)
        }
      }

      const expenseData = {
        ...formData,
        amount: parseFloat(formData.amount),
        tax_amount: parseFloat(formData.tax_amount || 0),
        receipt_file_id: receiptFileId,
        status: status,
        // user_id will be determined by backend if not provided
      }

      let result
      if (expense) {
        result = await expensesApi.update(expense.id, expenseData)
      } else {
        result = await expensesApi.create(expenseData)
      }

      if (result.success) {
        onSave(result.data)
        onClose()
      } else {
        setErrors({ submit: result.message || 'Failed to save expense' })
      }
    } catch (error) {
      console.error('Error saving expense:', error)
      setErrors({ submit: error.message || 'Failed to save expense' })
    } finally {
      setSaving(false)
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {expense ? 'Edit Expense' : 'New Expense'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={(e) => handleSubmit(e, 'draft')} className="p-6 space-y-4">
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
              {errors.submit}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Project */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project <span className="text-red-500">*</span>
              </label>
              <select
                name="project_id"
                value={formData.project_id}
                onChange={handleChange}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.project_id ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select project...</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
            </div>

            {/* Employee */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Employee <span className="text-red-500">*</span>
              </label>
              <select
                name="user_id"
                value={formData.user_id}
                onChange={handleChange}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.user_id ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select employee...</option>
                {users && users.map(user => (
                  <option key={user.id} value={user.id}>{user.full_name}</option>
                ))}
              </select>
              {errors.user_id && (
                <p className="mt-1 text-xs text-red-600">{errors.user_id}</p>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.category ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select category...</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-xs text-red-600">{errors.category}</p>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                step="0.01"
                min="0"
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.amount ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.amount && (
                <p className="mt-1 text-xs text-red-600">{errors.amount}</p>
              )}
            </div>

            {/* Tax Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tax Amount</label>
              <input
                type="number"
                name="tax_amount"
                value={formData.tax_amount}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Currency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>

            {/* Expense Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expense Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="spent_on"
                value={formData.spent_on}
                onChange={handleChange}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.spent_on ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.spent_on && (
                <p className="mt-1 text-xs text-red-600">{errors.spent_on}</p>
              )}
            </div>

            {/* Merchant */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Merchant/Vendor</label>
              <input
                type="text"
                name="merchant"
                value={formData.merchant}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
              <select
                name="payment_method"
                value={formData.payment_method}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {PAYMENT_METHODS.map(method => (
                  <option key={method} value={method}>
                    {method.charAt(0).toUpperCase() + method.slice(1).replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Billable */}
          <div className="flex items-center">
            <input
              type="checkbox"
              name="is_billable"
              id="is_billable"
              checked={formData.is_billable}
              onChange={handleChange}
              className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
            />
            <label htmlFor="is_billable" className="ml-2 text-sm font-medium text-gray-700">
              Billable to customer
            </label>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description/Notes</label>
            <textarea
              name="note"
              value={formData.note}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Receipt Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Receipt {parseFloat(formData.amount) > 500 && <span className="text-red-500">*</span>}
            </label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                <Upload className="w-4 h-4" />
                Upload Receipt
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              {receiptFile && (
                <span className="text-sm text-gray-600">{receiptFile.name}</span>
              )}
              {expense?.receiptFilename && !receiptFile && (
                <span className="text-sm text-gray-600 flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  {expense.receiptFilename}
                </span>
              )}
            </div>
            {errors.receipt && (
              <p className="mt-1 text-xs text-red-600">{errors.receipt}</p>
            )}
            {receiptPreview && receiptPreview.startsWith('data:image') && (
              <div className="mt-2">
                <img src={receiptPreview} alt="Receipt preview" className="max-w-xs rounded-lg border border-gray-300" />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            {!expense && (
              <button
                type="button"
                onClick={(e) => handleSubmit(e, 'draft')}
                disabled={saving || uploading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                {saving || uploading ? 'Saving...' : 'Save as Draft'}
              </button>
            )}
            <button
              type="submit"
              onClick={(e) => handleSubmit(e, 'submitted')}
              disabled={saving || uploading}
              className="px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: '#714b67' }}
            >
              {saving || uploading ? 'Submitting...' : expense ? 'Update' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

