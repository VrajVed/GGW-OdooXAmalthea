import { useState, useEffect, useRef } from 'react'
import { Search, Plus, Receipt } from 'lucide-react'
import { expensesApi, projectApi, userApi } from '../lib/api'
import ExpensesTable from '../components/expenses/ExpensesTable'
import ExpenseFilters from '../components/expenses/ExpenseFilters'
import ExpenseBulkActions from '../components/expenses/ExpenseBulkActions'
import ExpenseDrawer from '../components/expenses/ExpenseDrawer'
import ExpenseModal from '../components/expenses/ExpenseModal'
import AddToInvoiceModal from '../components/expenses/AddToInvoiceModal'

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([])
  const [projects, setProjects] = useState([])
  const [users, setUsers] = useState([])
  const [stats, setStats] = useState({
    pendingApprovals: 0,
    pendingAmount: 0,
    pendingBillableAmount: 0,
    missingReceipts: 0,
  })
  const [filters, setFilters] = useState({})
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState([])
  const [selectedExpense, setSelectedExpense] = useState(null)
  const [showDrawer, setShowDrawer] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editExpense, setEditExpense] = useState(null)
  const [showAddToInvoice, setShowAddToInvoice] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const pollingIntervalRef = useRef(null)

  function getDate90DaysAgo() {
    const date = new Date()
    date.setDate(date.getDate() - 90)
    return date.toISOString().split('T')[0]
  }

  useEffect(() => {
    loadData()
    
    // Set up real-time polling (every 5 seconds)
    pollingIntervalRef.current = setInterval(() => {
      loadData(false) // Don't show loading spinner during polling
    }, 5000)
    
    // Cleanup on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [filters])

  const loadData = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true)
      }
      setError(null)

      // Load projects
      const projectsResult = await projectApi.getAll()
      if (projectsResult.success) {
        setProjects(projectsResult.data)
      }

      // Load users
      const usersResult = await userApi.getAll()
      if (usersResult.success) {
        setUsers(usersResult.data.users)
      }

      // Load expenses
      const expensesResult = await expensesApi.getAll(filters)
      if (expensesResult.success) {
        setExpenses(expensesResult.data)
      } else {
        setError(expensesResult.message || 'Failed to load expenses')
      }

      // Load stats
      const statsResult = await expensesApi.getStats(filters)
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

  const handleFilterChange = (newFilters) => {
    // If newFilters is empty object, clear all filters
    if (Object.keys(newFilters).length === 0) {
      setFilters({})
    } else {
      // Merge new filters, removing undefined/null/empty values
      setFilters(prev => {
        const updated = { ...prev }
        Object.keys(newFilters).forEach(key => {
          const value = newFilters[key]
          // If value is undefined, null, or empty string, remove the key
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
      setSelectedIds(expenses.map(e => e.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleRowClick = (expense) => {
    setSelectedExpense(expense)
    setShowDrawer(true)
  }

  const handleBulkApprove = async () => {
    try {
      const result = await expensesApi.bulkApprove(selectedIds)
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
      const result = await expensesApi.bulkReject(selectedIds, reason)
      if (result.success) {
        setSelectedIds([])
        loadData()
      }
    } catch (error) {
      console.error('Error bulk rejecting:', error)
    }
  }

  const handleBulkAddToInvoice = () => {
    const selectedExpenses = expenses.filter(e => selectedIds.includes(e.id))
    if (selectedExpenses.length > 0) {
      setSelectedExpense(selectedExpenses[0])
      setShowAddToInvoice(true)
    }
  }

  const handleExportCSV = () => {
    const selectedExpenses = expenses.filter(e => selectedIds.includes(e.id))
    const headers = ['Date', 'Employee', 'Project', 'Category', 'Amount', 'Billable', 'Status', 'Invoice']
    const rows = selectedExpenses.map(e => [
      e.spentOn || '',
      e.employeeName || '',
      e.projectName || '',
      e.category || '',
      e.amount || 0,
      e.isBillable ? 'Yes' : 'No',
      e.status || '',
      e.invoiceNumber || '',
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `expenses-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
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
    setEditExpense(null)
  }

  const handleAddToInvoiceSave = () => {
    loadData()
    setShowAddToInvoice(false)
    setSelectedIds([])
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Filter expenses by search query
  const filteredExpenses = expenses.filter(expense => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      expense.employeeName?.toLowerCase().includes(query) ||
      expense.projectName?.toLowerCase().includes(query) ||
      expense.category?.toLowerCase().includes(query) ||
      expense.note?.toLowerCase().includes(query)
    )
  })

  // Get unique categories and employees for filters
  const categories = [...new Set(expenses.map(e => e.category).filter(Boolean))]
  const employees = expenses.reduce((acc, e) => {
    if (e.userId && !acc.find(emp => emp.id === e.userId)) {
      acc.push({ id: e.userId, name: e.employeeName || 'Unknown' })
    }
    return acc
  }, [])

  return (
    <div className="h-full bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-6 flex-1">
            <h1 className="text-2xl font-semibold text-gray-900">Expenses</h1>
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                type="text"
                placeholder="Search expenses..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent text-sm"
                disabled={loading}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ExpenseFilters
              filters={filters}
              projects={projects}
              employees={employees}
              categories={categories}
              onFilterChange={handleFilterChange}
              onSavedViewChange={handleSavedViewChange}
            />
            <button
              onClick={() => {
                setEditExpense(null)
                setShowModal(true)
              }}
              className="px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              style={{ backgroundColor: '#714b67' }}
              disabled={loading}
            >
              <Plus className="inline w-4 h-4 mr-2" /> New Expense
            </button>
          </div>
        </div>

        {/* Stats Widgets */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
            <div className="text-sm text-gray-600 mb-1">Pending Approvals</div>
            <div className="text-2xl font-semibold" style={{ color: '#714b67' }}>{stats.pendingApprovals}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
            <div className="text-sm text-gray-600 mb-1">₹ Pending</div>
            <div className="text-2xl font-semibold text-gray-900">{formatCurrency(stats.pendingAmount)}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
            <div className="text-sm text-gray-600 mb-1">₹ Pending (Billable)</div>
            <div className="text-2xl font-semibold text-gray-900">{formatCurrency(stats.pendingBillableAmount)}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
            <div className="text-sm text-gray-600 mb-1">Missing Receipts</div>
            <div className="text-2xl font-semibold text-gray-900">{stats.missingReceipts}</div>
          </div>
        </div>

        {/* Quick Status Filters */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <button
            onClick={() => handleFilterChange({ status: ['submitted', 'draft'] })}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              JSON.stringify(filters.status) === JSON.stringify(['submitted', 'draft'])
                ? 'text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
            style={JSON.stringify(filters.status) === JSON.stringify(['submitted', 'draft']) ? { backgroundColor: '#714b67' } : {}}
          >
            Pending
          </button>
          <button
            onClick={() => handleFilterChange({ status: ['approved'] })}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              JSON.stringify(filters.status) === JSON.stringify(['approved'])
                ? 'text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
            style={JSON.stringify(filters.status) === JSON.stringify(['approved']) ? { backgroundColor: '#714b67' } : {}}
          >
            Approved
          </button>
          <button
            onClick={() => handleFilterChange({ status: ['rejected'] })}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              JSON.stringify(filters.status) === JSON.stringify(['rejected'])
                ? 'text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
            style={JSON.stringify(filters.status) === JSON.stringify(['rejected']) ? { backgroundColor: '#714b67' } : {}}
          >
            Rejected
          </button>
          <button
            onClick={() => {
              const { status, ...restFilters } = filters
              handleFilterChange(restFilters)
            }}
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
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
              <p className="text-gray-600">Loading expenses...</p>
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
                <span className="text-red-800 font-medium">{error}</span>
              </div>
              <button onClick={loadData} className="text-red-600 hover:text-red-800 font-medium text-sm">
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Bulk Actions */}
        {!loading && !error && (
          <ExpenseBulkActions
            selectedCount={selectedIds.length}
            onBulkApprove={handleBulkApprove}
            onBulkReject={handleBulkReject}
            onBulkAddToInvoice={handleBulkAddToInvoice}
            onExportCSV={handleExportCSV}
          />
        )}

        {/* Expenses Table */}
        {!loading && !error && (
          <>
            {filteredExpenses.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No expenses found</h3>
                <p className="text-sm text-gray-500 mb-4">
                  {filters.status ? `No expenses with status: ${Array.isArray(filters.status) ? filters.status.join(', ') : filters.status}` : 'Try adjusting your filters or create a new expense.'}
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => setFilters({})}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Clear Filters
                  </button>
                  <button
                    onClick={() => {
                      setEditExpense(null)
                      setShowModal(true)
                    }}
                    className="px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90"
                    style={{ backgroundColor: '#714b67' }}
                  >
                    New Expense
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <ExpensesTable
                  expenses={filteredExpenses}
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

      {/* Expense Drawer */}
      {showDrawer && selectedExpense && (
        <ExpenseDrawer
          expense={selectedExpense}
          onClose={() => {
            setShowDrawer(false)
            setSelectedExpense(null)
          }}
          onUpdate={async () => {
            await loadData()
            // Refresh the selected expense after update
            if (selectedExpense?.id) {
              try {
                const result = await expensesApi.getById(selectedExpense.id)
                if (result.success) {
                  setSelectedExpense(result.data)
                }
              } catch (err) {
                console.error('Error refreshing expense:', err)
              }
            }
          }}
          onApprove={handleApprove}
          onReject={handleReject}
          onAddToInvoice={(expenses) => {
            setSelectedExpense(expenses[0])
            setShowAddToInvoice(true)
            setShowDrawer(false)
          }}
        />
      )}

      {/* Expense Modal */}
      {showModal && (
        <ExpenseModal
          expense={editExpense}
          projects={projects}
          users={users}
          onClose={() => {
            setShowModal(false)
            setEditExpense(null)
          }}
          onSave={handleSave}
        />
      )}

      {/* Add to Invoice Modal */}
      {showAddToInvoice && selectedExpense && (
        <AddToInvoiceModal
          expenses={selectedIds.length > 1 ? expenses.filter(e => selectedIds.includes(e.id)) : [selectedExpense]}
          onClose={() => {
            setShowAddToInvoice(false)
            setSelectedExpense(null)
          }}
          onSave={handleAddToInvoiceSave}
        />
      )}
    </div>
  )
}

