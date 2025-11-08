import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { vendorBillsApi } from '../../lib/api'

export default function VendorBillModal({ order, projects, onClose, onSave }) {
  const [formData, setFormData] = useState({
    project_id: '',
    vendor_partner_id: '',
    bill_date: new Date().toISOString().split('T')[0],
    currency: 'INR',
    lines: [{ description: '', quantity: 1, unit_price: 0 }]
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (order) {
      setFormData({
        project_id: order.projectId || '',
        vendor_partner_id: order.vendorPartnerId || '',
        bill_date: order.billDate || new Date().toISOString().split('T')[0],
        currency: order.currency || 'INR',
        lines: order.lines?.map(l => ({
          description: l.description,
          quantity: l.quantity,
          unit_price: l.unitPrice
        })) || [{ description: '', quantity: 1, unit_price: 0 }]
      })
    }
  }, [order])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (order) {
        await vendorBillsApi.update(order.id, formData)
      } else {
        await vendorBillsApi.create(formData)
      }
      onSave()
    } catch (error) {
      console.error('Error saving vendor bill:', error)
      alert('Failed to save vendor bill')
    } finally {
      setLoading(false)
    }
  }

  const addLine = () => {
    setFormData(prev => ({
      ...prev,
      lines: [...prev.lines, { description: '', quantity: 1, unit_price: 0 }]
    }))
  }

  const updateLine = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      lines: prev.lines.map((line, i) => 
        i === index ? { ...line, [field]: value } : line
      )
    }))
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {order ? 'Edit Vendor Bill' : 'New Vendor Bill'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                  <select
                    value={formData.project_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, project_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">Select Project</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bill Date</label>
                  <input
                    type="date"
                    value={formData.bill_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, bill_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Partner ID</label>
                <input
                  type="text"
                  value={formData.vendor_partner_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, vendor_partner_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="Enter vendor partner ID"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Line Items</label>
                  <button
                    type="button"
                    onClick={addLine}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    + Add Line
                  </button>
                </div>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Description</th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Quantity</th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Unit Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {formData.lines.map((line, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              value={line.description}
                              onChange={(e) => updateLine(index, 'description', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              required
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              value={line.quantity}
                              onChange={(e) => updateLine(index, 'quantity', parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-right"
                              min="0"
                              step="0.01"
                              required
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              value={line.unit_price}
                              onChange={(e) => updateLine(index, 'unit_price', parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-right"
                              min="0"
                              step="0.01"
                              required
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </form>

          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: '#714b67' }}
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

