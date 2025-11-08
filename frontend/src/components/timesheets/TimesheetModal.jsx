import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { timesheetsApi } from '../../lib/api'

export default function TimesheetModal({ timesheet, projects, employees, onClose, onSave }) {
  const [formData, setFormData] = useState({
    project_id: timesheet?.projectId || '',
    task_id: timesheet?.taskId || '',
    user_id: timesheet?.userId || '',
    worked_on: timesheet?.workedOn || new Date().toISOString().split('T')[0],
    start_time: timesheet?.startTime ? timesheet.startTime.slice(0, 16) : '',
    end_time: timesheet?.endTime ? timesheet.endTime.slice(0, 16) : '',
    hours: timesheet?.hours || '',
    is_billable: timesheet?.isBillable !== undefined ? timesheet.isBillable : true,
    note: timesheet?.note || '',
  })
  const [tasks, setTasks] = useState([])
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [calculatedHours, setCalculatedHours] = useState(null)

  useEffect(() => {
    if (formData.start_time && formData.end_time) {
      const start = new Date(formData.start_time)
      const end = new Date(formData.end_time)
      const diffHours = (end - start) / (1000 * 60 * 60)
      if (diffHours > 0) {
        setCalculatedHours(diffHours.toFixed(2))
        if (!formData.hours) {
          setFormData(prev => ({ ...prev, hours: diffHours.toFixed(2) }))
        }
      }
    }
  }, [formData.start_time, formData.end_time])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const newErrors = {}
    if (!formData.project_id) newErrors.project_id = 'Project is required'
    if (!formData.user_id) newErrors.user_id = 'Employee is required'
    if (!formData.worked_on) newErrors.worked_on = 'Date worked is required'
    if (!formData.hours || parseFloat(formData.hours) <= 0) {
      newErrors.hours = 'Valid hours are required'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setSaving(true)
    try {
      const timesheetData = {
        ...formData,
        hours: parseFloat(formData.hours),
        start_time: formData.start_time || undefined,
        end_time: formData.end_time || undefined,
        task_id: formData.task_id || undefined,
      }

      let result
      if (timesheet) {
        result = await timesheetsApi.update(timesheet.id, timesheetData)
      } else {
        result = await timesheetsApi.create(timesheetData)
      }

      if (result.success) {
        onSave(result.data)
        onClose()
      } else {
        setErrors({ submit: result.message || 'Failed to save timesheet' })
      }
    } catch (error) {
      console.error('Error saving timesheet:', error)
      setErrors({ submit: error.message || 'Failed to save timesheet' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {timesheet ? 'Edit Timesheet' : 'New Timesheet'}
          </h2>
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
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 ${
                  errors.project_id ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select project...</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
              {errors.project_id && (
                <p className="mt-1 text-xs text-red-600">{errors.project_id}</p>
              )}
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
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 ${
                  errors.user_id ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select employee...</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
              {errors.user_id && (
                <p className="mt-1 text-xs text-red-600">{errors.user_id}</p>
              )}
            </div>

            {/* Date Worked */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Worked <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="worked_on"
                value={formData.worked_on}
                onChange={handleChange}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 ${
                  errors.worked_on ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.worked_on && (
                <p className="mt-1 text-xs text-red-600">{errors.worked_on}</p>
              )}
            </div>

            {/* Hours */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hours <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="hours"
                value={formData.hours}
                onChange={handleChange}
                step="0.25"
                min="0"
                max="24"
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 ${
                  errors.hours ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {calculatedHours && formData.start_time && formData.end_time && (
                <p className="mt-1 text-xs text-gray-500">
                  Calculated: {calculatedHours} hours
                </p>
              )}
              {errors.hours && (
                <p className="mt-1 text-xs text-red-600">{errors.hours}</p>
              )}
            </div>

            {/* Start Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <input
                type="datetime-local"
                name="start_time"
                value={formData.start_time}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
            </div>

            {/* End Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <input
                type="datetime-local"
                name="end_time"
                value={formData.end_time}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
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
              className="w-4 h-4 text-gray-600 rounded focus:ring-gray-500"
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
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
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
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: '#714b67' }}
            >
              {saving ? 'Saving...' : timesheet ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

