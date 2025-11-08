import { useState } from 'react'
import { Filter, X } from 'lucide-react'

export default function PurchaseOrderFilters({ filters, projects, onFilterChange }) {
  const [showFilters, setShowFilters] = useState(false)

  const handleFilterChange = (key, value) => {
    onFilterChange({ [key]: value })
  }

  const clearFilters = () => {
    onFilterChange({})
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
      >
        <Filter className="w-4 h-4" />
        Filters
      </button>

      {showFilters && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowFilters(false)}
          />
          <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-20 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">Filters</h3>
              <button
                onClick={() => setShowFilters(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                <select
                  value={filters.project_id || ''}
                  onChange={(e) => handleFilterChange('project_id', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">All Projects</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={Array.isArray(filters.status) ? filters.status[0] : (filters.status || '')}
                  onChange={(e) => handleFilterChange('status', e.target.value ? [e.target.value] : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">All Statuses</option>
                  <option value="draft">Draft</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="fulfilled">Fulfilled</option>
                  <option value="closed">Closed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
                <input
                  type="date"
                  value={filters.date_from || ''}
                  onChange={(e) => handleFilterChange('date_from', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
                <input
                  type="date"
                  value={filters.date_to || ''}
                  onChange={(e) => handleFilterChange('date_to', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={clearFilters}
                  className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Clear
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className="flex-1 px-3 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90"
                  style={{ backgroundColor: '#714b67' }}
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

