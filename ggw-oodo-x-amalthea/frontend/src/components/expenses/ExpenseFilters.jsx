import { useState } from 'react'
import { Filter, X, ChevronDown } from 'lucide-react'

export default function ExpenseFilters({ filters, projects, employees, categories, onFilterChange, onSavedViewChange }) {
  const [isOpen, setIsOpen] = useState(false)

  const savedViews = [
    { id: 'my-team', label: 'My Team', filters: { status: ['submitted', 'draft'] } },
    { id: 'billable-only', label: 'Billable Only', filters: { is_billable: 'true' } },
    { id: 'missing-receipts', label: 'Missing Receipts', filters: { missing_receipt: 'true' } },
  ]

  const quickFilters = [
    { key: 'missing_receipt', label: 'Missing Receipt', value: 'true' },
    { key: 'over_policy', label: 'Over Policy', value: 'true' },
    { key: 'is_billable', label: 'Billable', value: 'true' },
    { key: 'this_week', label: 'This Week', value: getThisWeekRange() },
    { key: 'this_month', label: 'This Month', value: getThisMonthRange() },
  ]

  function getThisWeekRange() {
    const today = new Date()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay())
    return {
      date_from: startOfWeek.toISOString().split('T')[0],
      date_to: today.toISOString().split('T')[0],
    }
  }

  function getThisMonthRange() {
    const today = new Date()
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    return {
      date_from: startOfMonth.toISOString().split('T')[0],
      date_to: today.toISOString().split('T')[0],
    }
  }

  const handleQuickFilter = (filter) => {
    if (filter.value === 'true') {
      onFilterChange({ [filter.key]: filter.value })
    } else if (typeof filter.value === 'object') {
      onFilterChange(filter.value)
    }
  }

  const clearFilter = (key) => {
    // Explicitly set the key to undefined so handleFilterChange knows to remove it
    onFilterChange({ [key]: undefined })
  }

  // Count active filters, excluding empty values and default date range
  const activeFiltersCount = Object.keys(filters).filter(key => {
    const value = filters[key]
    // Skip if undefined, empty string, or null
    if (value === undefined || value === '' || value === null) return false
    // Skip if empty array
    if (Array.isArray(value) && value.length === 0) return false
    return true
  }).length

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
      >
        <Filter className="w-4 h-4" />
        <span>Filters</span>
        {activeFiltersCount > 0 && (
          <span className="px-2 py-0.5 text-xs font-semibold text-white rounded-full" style={{ backgroundColor: '#714b67' }}>
            {activeFiltersCount}
          </span>
        )}
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>
          <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-20">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900">Filters</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Saved Views */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 mb-2">Saved Views</label>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      const view = savedViews.find(v => v.id === e.target.value)
                      if (view) {
                        onSavedViewChange(view.filters)
                      }
                    }
                    e.target.value = ''
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select a view...</option>
                  {savedViews.map(view => (
                    <option key={view.id} value={view.id}>{view.label}</option>
                  ))}
                </select>
              </div>

              {/* Quick Filters */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 mb-2">Quick Filters</label>
                <div className="flex flex-wrap gap-2">
                  {quickFilters.map(filter => (
                    <button
                      key={filter.key}
                      onClick={() => handleQuickFilter(filter)}
                      className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
              {/* Project Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Project</label>
                <select
                  value={filters.project_id || ''}
                  onChange={(e) => onFilterChange({ project_id: e.target.value || undefined })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">All Projects</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={Array.isArray(filters.status) ? filters.status[0] || '' : filters.status || ''}
                  onChange={(e) => {
                    const value = e.target.value
                    onFilterChange({ status: value ? [value] : undefined })
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">All Statuses</option>
                  <option value="draft">Draft</option>
                  <option value="submitted">Submitted</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="reimbursed">Reimbursed</option>
                  <option value="paid">Paid</option>
                </select>
              </div>

              {/* Employee Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Employee</label>
                <select
                  value={filters.user_id || ''}
                  onChange={(e) => onFilterChange({ user_id: e.target.value || undefined })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">All Employees</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={filters.category || ''}
                  onChange={(e) => onFilterChange({ category: e.target.value || undefined })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Billable Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Billable</label>
                <select
                  value={filters.is_billable || ''}
                  onChange={(e) => onFilterChange({ is_billable: e.target.value || undefined })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">All</option>
                  <option value="true">Billable</option>
                  <option value="false">Not Billable</option>
                </select>
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Date From</label>
                <input
                  type="date"
                  value={filters.date_from || ''}
                  onChange={(e) => onFilterChange({ date_from: e.target.value || undefined })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Date To</label>
                <input
                  type="date"
                  value={filters.date_to || ''}
                  onChange={(e) => onFilterChange({ date_to: e.target.value || undefined })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Amount Range */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Amount Min</label>
                <input
                  type="number"
                  value={filters.amount_min || ''}
                  onChange={(e) => onFilterChange({ amount_min: e.target.value || undefined })}
                  placeholder="0"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Amount Max</label>
                <input
                  type="number"
                  value={filters.amount_max || ''}
                  onChange={(e) => onFilterChange({ amount_max: e.target.value || undefined })}
                  placeholder="100000"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>

            {/* Active Filters */}
            {activeFiltersCount > 0 && (
              <div className="p-4 border-t border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-700">Active Filters</span>
                  <button
                    onClick={() => onFilterChange({})}
                    className="text-xs hover:underline"
                    style={{ color: '#714b67' }}
                  >
                    Clear All
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(filters).map(key => {
                    const value = filters[key]
                    // Skip if undefined, empty string, null, or empty array
                    if (value === undefined || value === '' || value === null) return null
                    if (Array.isArray(value) && value.length === 0) return null
                    
                    // Format the display value
                    let displayValue = value
                    if (Array.isArray(value)) {
                      displayValue = value.join(', ')
                    }
                    
                    // Format the key name for display
                    const keyLabel = key
                      .replace(/_/g, ' ')
                      .replace(/\b\w/g, l => l.toUpperCase())
                    
                    return (
                      <span
                        key={key}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                      >
                        <span>{keyLabel}: {displayValue}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            clearFilter(key)
                          }}
                          className="text-gray-500 hover:text-gray-700 ml-1"
                          type="button"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

