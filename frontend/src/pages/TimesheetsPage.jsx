import { useState, useEffect, useRef } from 'react'
import { Search, Plus, Clock, Download } from 'lucide-react'
import * as XLSX from 'xlsx'
import { timesheetsApi, projectApi } from '../lib/api'
import TimesheetsTable from '../components/timesheets/TimesheetsTable'
import TimesheetFilters from '../components/timesheets/TimesheetFilters'
import TimesheetBulkActions from '../components/timesheets/TimesheetBulkActions'
import TimesheetDrawer from '../components/timesheets/TimesheetDrawer'
import TimesheetModal from '../components/timesheets/TimesheetModal'

export default function TimesheetsPage() {
  const [timesheets, setTimesheets] = useState([])
  const [projects, setProjects] = useState([])
  const [stats, setStats] = useState({
    totalHours: 0,
    billableHours: 0,
    pendingApprovals: 0,
    totalCost: 0,
  })
  const [filters, setFilters] = useState({
    date_from: getDate90DaysAgo(),
    date_to: new Date().toISOString().split('T')[0],
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState([])
  const [selectedTimesheet, setSelectedTimesheet] = useState(null)
  const [showDrawer, setShowDrawer] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editTimesheet, setEditTimesheet] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  function getDate90DaysAgo() {
    const date = new Date()
    date.setDate(date.getDate() - 90)
    return date.toISOString().split('T')[0]
  }

  
  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load projects
      const projectsResult = await projectApi.getAll()
      if (projectsResult.success) {
        setProjects(projectsResult.data)
      }

      // Load timesheets
      const timesheetsResult = await timesheetsApi.getAll(filters)
      if (timesheetsResult.success) {
        setTimesheets(timesheetsResult.data)
      } else {
        setError(timesheetsResult.message || 'Failed to load timesheets')
      }

      // Load stats
      const statsResult = await timesheetsApi.getStats(filters)
      if (statsResult.success) {
        setStats(statsResult.data)
      }
    } catch (err) {
      console.error('Error loading data:', err)
      setError('Unable to connect to server. Please try again.')
    } finally {
      setLoading(false)
    }
  }


  useEffect(() => {
    loadData()
  }, [filters])


  const handleFilterChange = (newFilters) => {
    if (Object.keys(newFilters).length === 0) {
      setFilters({
        date_from: getDate90DaysAgo(),
        date_to: new Date().toISOString().split('T')[0],
      })
    } else {
      setFilters(prev => {
        const updated = { ...prev }
        Object.keys(newFilters).forEach(key => {
          const value = newFilters[key]
          if (value === undefined || value === '' || value === null || 
              (Array.isArray(value) && value.length === 0)) {
            delete updated[key]
          } else {
            updated[key] = value
          }
        })
        return updated
      })
    }
    setSelectedIds([])
  }

  const handleSavedViewChange = (viewFilters) => {
    setFilters(viewFilters)
    setSelectedIds([])
  }

  const handleSelect = (id, checked) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id])
    } else {
      setSelectedIds(prev => prev.filter(i => i !== id))
    }
  }

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(timesheets.map(t => t.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleRowClick = (timesheet) => {
    setSelectedTimesheet(timesheet)
    setShowDrawer(true)
  }

  const handleBulkApprove = async () => {
    try {
      const result = await timesheetsApi.bulkApprove(selectedIds)
      if (result.success) {
        setSelectedIds([])
        loadData()
      }
    } catch (error) {
      console.error('Error bulk approving:', error)
    }
  }

  const handleBulkReject = async (reason) => {
    try {
      const result = await timesheetsApi.bulkReject(selectedIds, reason)
      if (result.success) {
        setSelectedIds([])
        loadData()
      }
    } catch (error) {
      console.error('Error bulk rejecting:', error)
    }
  }

  const getExportData = () => {
    const dataToExport = selectedIds.length > 0 
      ? timesheets.filter(t => selectedIds.includes(t.id))
      : filteredTimesheets
    
    return dataToExport.map(t => ({
      'Date': t.workedOn || '',
      'Employee': t.userName || '',
      'Email': t.userEmail || '',
      'Project': t.projectName || '',
      'Task': t.taskTitle || '',
      'Hours': t.hours || 0,
      'Billable': t.isBillable ? 'Yes' : 'No',
      'Bill Rate': t.billRate || '',
      'Cost Rate': t.costRate || '',
      'Cost': t.cost || 0,
      'Status': t.status || 'pending',
      'Note': t.note || '',
      'Approved By': t.approverName || '',
      'Approved At': t.approvedAt || '',
    }))
  }

  const handleExportCSV = () => {
    const data = getExportData()
    if (data.length === 0) {
      alert('No data to export. Please select timesheets or adjust your filters.')
      return
    }
    
    const headers = Object.keys(data[0] || {})
    const rows = data.map(row => headers.map(header => row[header] || ''))

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `timesheets-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleExportExcel = () => {
    const data = getExportData()
    if (data.length === 0) {
      alert('No data to export. Please select timesheets or adjust your filters.')
      return
    }
    
    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Timesheets')
    
    // Auto-size columns
    const maxWidth = 15
    const wscols = Object.keys(data[0] || {}).map(() => ({ wch: maxWidth }))
    worksheet['!cols'] = wscols
    
    XLSX.writeFile(workbook, `timesheets-${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const handleApprove = (id) => {
    setSelectedIds(prev => prev.filter(i => i !== id))
    loadData()
  }

  const handleReject = (id) => {
    setSelectedIds(prev => prev.filter(i => i !== id))
    loadData()
  }

  const handleSave = () => {
    loadData()
    setShowModal(false)
    setEditTimesheet(null)
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatHours = (hours) => {
    if (!hours) return '0h'
    const h = Math.floor(hours)
    const m = Math.round((hours - h) * 60)
    if (m === 0) return `${h}h`
    return `${h}h ${m}m`
  }

  // Filter timesheets by search query
  const filteredTimesheets = timesheets.filter(timesheet => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      timesheet.userName?.toLowerCase().includes(query) ||
      timesheet.projectName?.toLowerCase().includes(query) ||
      timesheet.taskTitle?.toLowerCase().includes(query) ||
      timesheet.note?.toLowerCase().includes(query)
    )
  })

  // Get unique employees for filters
  const employees = timesheets.reduce((acc, t) => {
    if (t.userId && !acc.find(emp => emp.id === t.userId)) {
      acc.push({ id: t.userId, name: t.userName || 'Unknown' })
    }
    return acc
  }, [])

  return (
    <div className="h-full bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-5 flex-1">
            <h1 className="text-2xl font-semibold text-gray-900">Timesheets</h1>
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                type="text"
                placeholder="Search timesheets..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent text-sm"
                disabled={loading}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              title="Export as CSV"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">CSV</span>
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              title="Export as Excel"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Excel</span>
            </button>
            <TimesheetFilters
              filters={filters}
              projects={projects}
              employees={employees}
              onFilterChange={handleFilterChange}
              onSavedViewChange={handleSavedViewChange}
            />
            <button
              onClick={() => {
                setEditTimesheet(null)
                setShowModal(true)
              }}
              className="px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              style={{ backgroundColor: '#714b67' }}
              disabled={loading}
            >
              <Plus className="inline w-4 h-4 mr-2" /> New Timesheet
            </button>
          </div>
        </div>

        {/* Stats Widgets */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm text-gray-600 mb-1">Total Hours</div>
            <div className="text-xl font-semibold" style={{ color: '#714b67' }}>{formatHours(stats.totalHours)}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm text-gray-600 mb-1">Billable Hours</div>
            <div className="text-xl font-semibold text-gray-900">{formatHours(stats.billableHours)}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm text-gray-600 mb-1">Pending Approvals</div>
            <div className="text-xl font-semibold text-gray-900">{stats.pendingApprovals}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm text-gray-600 mb-1">Total Cost</div>
            <div className="text-xl font-semibold text-gray-900">{formatCurrency(stats.totalCost)}</div>
          </div>
        </div>

        {/* Quick Status Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleFilterChange({ status: 'pending' })}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              filters.status === 'pending'
                ? 'text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
            style={filters.status === 'pending' ? { backgroundColor: '#714b67' } : {}}
          >
            Pending
          </button>
          <button
            onClick={() => handleFilterChange({ status: 'approved' })}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              filters.status === 'approved'
                ? 'text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
            style={filters.status === 'approved' ? { backgroundColor: '#714b67' } : {}}
          >
            Approved
          </button>
          <button
            onClick={() => handleFilterChange({ status: 'rejected' })}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              filters.status === 'rejected'
                ? 'text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
            style={filters.status === 'rejected' ? { backgroundColor: '#714b67' } : {}}
          >
            Rejected
          </button>
          <button
            onClick={() => handleFilterChange({ status: undefined })}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              !filters.status
                ? 'text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
            style={!filters.status ? { backgroundColor: '#714b67' } : {}}
          >
            All
          </button>
        </div>
      </header>

      <div className="p-6">
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900 mb-3"></div>
              <p className="text-sm text-gray-600">Loading timesheets...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                </svg>
                <span className="text-sm text-red-800 font-medium">{error}</span>
              </div>
              <button onClick={loadData} className="text-sm text-red-600 hover:text-red-800 font-medium">
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Bulk Actions */}
        {!loading && !error && (
          <TimesheetBulkActions
            selectedCount={selectedIds.length}
            onBulkApprove={handleBulkApprove}
            onBulkReject={handleBulkReject}
            onExportCSV={handleExportCSV}
            onExportExcel={handleExportExcel}
          />
        )}

        {/* Timesheets Table */}
        {!loading && !error && (
          <>
            {filteredTimesheets.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No timesheets found</h3>
                <p className="text-sm text-gray-500 mb-4">
                  {filters.status ? `No timesheets with status: ${filters.status}` : 'Try adjusting your filters or create a new timesheet entry.'}
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      // Clear all filters including dates
                      const allFilterKeys = Object.keys(filters)
                      const clearFilters = {}
                      allFilterKeys.forEach(key => {
                        clearFilters[key] = undefined
                      })
                      clearFilters.date_from = undefined
                      clearFilters.date_to = undefined
                      handleFilterChange(clearFilters)
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Clear Filters
                  </button>
                  <button
                    onClick={() => {
                      setEditTimesheet(null)
                      setShowModal(true)
                    }}
                    className="px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90"
                    style={{ backgroundColor: '#714b67' }}
                  >
                    New Timesheet
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <TimesheetsTable
                  timesheets={filteredTimesheets}
                  selectedIds={selectedIds}
                  onSelect={handleSelect}
                  onSelectAll={handleSelectAll}
                  onRowClick={handleRowClick}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Timesheet Drawer */}
      {showDrawer && selectedTimesheet && (
        <TimesheetDrawer
          timesheet={selectedTimesheet}
          onClose={() => {
            setShowDrawer(false)
            setSelectedTimesheet(null)
          }}
          onUpdate={async () => {
            await loadData()
            if (selectedTimesheet?.id) {
              try {
                const result = await timesheetsApi.getById(selectedTimesheet.id)
                if (result.success) {
                  setSelectedTimesheet(result.data)
                }
              } catch (err) {
                console.error('Error refreshing timesheet:', err)
              }
            }
          }}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}

      {/* Timesheet Modal */}
      {showModal && (
        <TimesheetModal
          timesheet={editTimesheet}
          projects={projects}
          employees={employees}
          onClose={() => {
            setShowModal(false)
            setEditTimesheet(null)
          }}
          onSave={handleSave}
        />
      )}
    </div>
  )
}

