import { useState, useEffect } from 'react'
import { Search, Plus, FileCheck } from 'lucide-react'
import { customerInvoicesApi, projectApi } from '../lib/api'
import CustomerInvoicesTable from '../components/customer-invoices/CustomerInvoicesTable.jsx'
import CustomerInvoiceFilters from '../components/customer-invoices/CustomerInvoiceFilters.jsx'
import CustomerInvoiceBulkActions from '../components/customer-invoices/CustomerInvoiceBulkActions.jsx'
import CustomerInvoiceDrawer from '../components/customer-invoices/CustomerInvoiceDrawer.jsx'
import CustomerInvoiceModal from '../components/customer-invoices/CustomerInvoiceModal.jsx'

export default function CustomerInvoicesPage() {
  const [customerInvoices, setCustomerInvoices] = useState([])
  const [projects, setProjects] = useState([])
  const [stats, setStats] = useState({
    totalCount: 0,
    draftCount: 0,
    postedCount: 0,
    fulfilledCount: 0,
    totalAmount: 0,
    postedAmount: 0,
  })
  const [filters, setFilters] = useState({})
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState([])
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showDrawer, setShowDrawer] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editOrder, setEditOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  function getDate90DaysAgo() {
    const date = new Date()
    date.setDate(date.getDate() - 90)
    return date.toISOString().split('T')[0]
  }

  useEffect(() => {
    loadData()
  }, [filters])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      const projectsResult = await projectApi.getAll()
      if (projectsResult.success) {
        setProjects(projectsResult.data)
      }

      const ordersResult = await customerInvoicesApi.getAll(filters)
      if (ordersResult.success) {
        setCustomerInvoices(ordersResult.data)
      } else {
        setError(ordersResult.message || 'Failed to load customer invoices')
      }

      const statsResult = await customerInvoicesApi.getStats(filters)
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
    if (Object.keys(newFilters).length === 0) {
      setFilters({})
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

  const handleSelect = (id, checked) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id])
    } else {
      setSelectedIds(prev => prev.filter(i => i !== id))
    }
  }

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(customerInvoices.map(o => o.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleRowClick = (order) => {
    setSelectedOrder(order)
    setShowDrawer(true)
  }

  const handleBulkConfirm = async () => {
    try {
      for (const id of selectedIds) {
        await customerInvoicesApi.post(id)
      }
      setSelectedIds([])
      loadData()
    } catch (error) {
      console.error('Error bulk posting:', error)
    }
  }

  const handleBulkCancel = async () => {
    try {
      for (const id of selectedIds) {
        await customerInvoicesApi.cancel(id)
      }
      setSelectedIds([])
      loadData()
    } catch (error) {
      console.error('Error bulk cancelling:', error)
    }
  }

  const handleSave = () => {
    loadData()
    setShowModal(false)
    setEditOrder(null)
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const filteredOrders = customerInvoices.filter(order => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      order.number?.toLowerCase().includes(query) ||
      order.customerName?.toLowerCase().includes(query) ||
      order.projectName?.toLowerCase().includes(query) ||
      order.reference?.toLowerCase().includes(query)
    )
  })

  return (
    <div className="h-full bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-6 flex-1">
            <h1 className="text-2xl font-semibold text-gray-900">Customer Invoices</h1>
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                type="text"
                placeholder="Search customer invoices..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent text-sm"
                disabled={loading}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CustomerInvoiceFilters
              filters={filters}
              projects={projects}
              onFilterChange={handleFilterChange}
            />
            <button
              onClick={() => {
                setEditOrder(null)
                setShowModal(true)
              }}
              className="px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              style={{ backgroundColor: '#714b67' }}
              disabled={loading}
            >
              <Plus className="inline w-4 h-4 mr-2" /> New Customer Invoice
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Total Orders</div>
            <div className="text-2xl font-semibold" style={{ color: '#714b67' }}>{stats.totalCount}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Draft</div>
            <div className="text-2xl font-semibold text-gray-900">{stats.draftCount}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Posted</div>
            <div className="text-2xl font-semibold text-gray-900">{stats.postedCount}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Total Amount</div>
            <div className="text-2xl font-semibold text-gray-900">{formatCurrency(stats.totalAmount)}</div>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <button
            onClick={() => handleFilterChange({ status: ['draft'] })}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              JSON.stringify(filters.status) === JSON.stringify(['draft'])
                ? 'text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
            style={JSON.stringify(filters.status) === JSON.stringify(['draft']) ? { backgroundColor: '#714b67' } : {}}
          >
            Draft
          </button>
          <button
            onClick={() => handleFilterChange({ status: ['posted'] })}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              JSON.stringify(filters.status) === JSON.stringify(['posted'])
                ? 'text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
            style={JSON.stringify(filters.status) === JSON.stringify(['posted']) ? { backgroundColor: '#714b67' } : {}}
          >
            Posted
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
        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
              <p className="text-gray-600">Loading customer invoices...</p>
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-red-800 font-medium">{error}</span>
              <button onClick={loadData} className="text-red-600 hover:text-red-800 font-medium text-sm">
                Retry
              </button>
            </div>
          </div>
        )}

        {!loading && !error && (
          <CustomerInvoiceBulkActions
            selectedCount={selectedIds.length}
            onBulkConfirm={handleBulkConfirm}
            onBulkCancel={handleBulkCancel}
          />
        )}

        {!loading && !error && (
          <>
            {filteredOrders.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <FileCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No customer invoices found</h3>
                <p className="text-sm text-gray-500 mb-4">Try adjusting your filters or create a new customer invoice.</p>
                <button
                  onClick={() => {
                    setEditOrder(null)
                    setShowModal(true)
                  }}
                  className="px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90"
                  style={{ backgroundColor: '#714b67' }}
                >
                  New Customer Invoice
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <CustomerInvoicesTable
                  customerInvoices={filteredOrders}
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

      {showDrawer && selectedOrder && (
        <CustomerInvoiceDrawer
          order={selectedOrder}
          onClose={() => {
            setShowDrawer(false)
            setSelectedOrder(null)
          }}
          onUpdate={async () => {
            await loadData()
            if (selectedOrder?.id) {
              try {
                const result = await customerInvoicesApi.getById(selectedOrder.id)
                if (result.success) {
                  setSelectedOrder(result.data)
                }
              } catch (err) {
                console.error('Error refreshing order:', err)
              }
            }
          }}
        />
      )}

      {showModal && (
        <CustomerInvoiceModal
          order={editOrder}
          projects={projects}
          onClose={() => {
            setShowModal(false)
            setEditOrder(null)
          }}
          onSave={handleSave}
        />
      )}
    </div>
  )
}

