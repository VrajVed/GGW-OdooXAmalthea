// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export const API_ENDPOINTS = {
  register: '/api/users/register',
  login: '/api/users/login',
  users: '/api/users',
  projects: '/api/projects',
  tasks: (projectId) => `/api/projects/${projectId}/tasks`,
  expenses: '/api/expenses',
  timesheets: '/api/timesheets',
  salesOrders: '/api/sales-orders',
  purchaseOrders: '/api/purchase-orders',
  customerInvoices: '/api/customer-invoices',
  vendorBills: '/api/vendor-bills',
  dashboard: {
    stats: '/api/dashboard/stats',
    projects: '/api/dashboard/projects'
  },
  calendar: {
    authUrl: '/api/calendar/auth-url',
    callback: '/api/calendar/callback',
    calendars: '/api/calendar/calendars',
    events: '/api/calendar/events',
    status: '/api/calendar/status',
    disconnect: '/api/calendar/disconnect',
    upcomingEvents: '/api/calendar/upcoming-events'
  }
}

// Auth helpers (must be defined before apiCall uses them)
export const saveUser = (user) => {
  localStorage.setItem('user', JSON.stringify(user))
}

export const getUser = () => {
  const user = localStorage.getItem('user')
  return user ? JSON.parse(user) : null
}

export const saveToken = (token) => {
  localStorage.setItem('token', token)
}

export const getToken = () => {
  return localStorage.getItem('token')
}

export const removeUser = () => {
  localStorage.removeItem('user')
  localStorage.removeItem('token')
}

// Helper function for API calls
export const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`
  
  // Get token from localStorage
  const token = getToken()
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  }

  // Add Authorization header if token exists
  if (token) {
    defaultOptions.headers['Authorization'] = `Bearer ${token}`
  }

  try {
    const response = await fetch(url, {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers,
      },
    })

    // Handle 401 Unauthorized - token expired or invalid
    if (response.status === 401) {
      removeUser()
      // Redirect to login if we're in the browser
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
      throw new Error('Authentication required. Please login again.')
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('API call error:', error)
    throw error
  }
}

export const isAuthenticated = () => {
  return !!getUser() && !!getToken()
}

// Project API functions
export const projectApi = {
  // Get all projects (optional: filter by user_id for employee view)
  getAll: async (filters = {}) => {
    const queryParams = new URLSearchParams()
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        queryParams.append(key, filters[key])
      }
    })
    const queryString = queryParams.toString()
    return await apiCall(`${API_ENDPOINTS.projects}${queryString ? '?' + queryString : ''}`, {
      method: 'GET',
    })
  },

  // Get single project
  getById: async (id, filters = {}) => {
    const queryParams = new URLSearchParams()
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        queryParams.append(key, filters[key])
      }
    })
    const queryString = queryParams.toString()
    return await apiCall(`${API_ENDPOINTS.projects}/${id}${queryString ? '?' + queryString : ''}`, {
      method: 'GET',
    })
  },

  // Create project
  create: async (projectData) => {
    return await apiCall(API_ENDPOINTS.projects, {
      method: 'POST',
      body: JSON.stringify(projectData),
    })
  },

  // Update project
  update: async (id, projectData) => {
    return await apiCall(`${API_ENDPOINTS.projects}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(projectData),
    })
  },

  // Delete project
  delete: async (id) => {
    return await apiCall(`${API_ENDPOINTS.projects}/${id}`, {
      method: 'DELETE',
    })
  },
}

// Expenses API functions
export const expensesApi = {
  // Get all expenses with filters
  getAll: async (filters = {}) => {
    const queryParams = new URLSearchParams()
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        if (Array.isArray(filters[key])) {
          filters[key].forEach(val => queryParams.append(key, val))
        } else {
          queryParams.append(key, filters[key])
        }
      }
    })
    const queryString = queryParams.toString()
    return await apiCall(`${API_ENDPOINTS.expenses}${queryString ? '?' + queryString : ''}`, {
      method: 'GET',
    })
  },

  // Get expense stats
  getStats: async (filters = {}) => {
    const queryParams = new URLSearchParams()
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        queryParams.append(key, filters[key])
      }
    })
    const queryString = queryParams.toString()
    return await apiCall(`${API_ENDPOINTS.expenses}/stats${queryString ? '?' + queryString : ''}`, {
      method: 'GET',
    })
  },

  // Get single expense
  getById: async (id) => {
    return await apiCall(`${API_ENDPOINTS.expenses}/${id}`, {
      method: 'GET',
    })
  },

  // Create expense
  create: async (expenseData) => {
    return await apiCall(API_ENDPOINTS.expenses, {
      method: 'POST',
      body: JSON.stringify(expenseData),
    })
  },

  // Update expense
  update: async (id, expenseData) => {
    return await apiCall(`${API_ENDPOINTS.expenses}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(expenseData),
    })
  },

  // Approve expense
  approve: async (id) => {
    return await apiCall(`${API_ENDPOINTS.expenses}/${id}/approve`, {
      method: 'PATCH',
    })
  },

  // Reject expense
  reject: async (id, reason) => {
    return await apiCall(`${API_ENDPOINTS.expenses}/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    })
  },

  // Add to invoice
  addToInvoice: async (id, invoiceData) => {
    return await apiCall(`${API_ENDPOINTS.expenses}/${id}/add-to-invoice`, {
      method: 'PATCH',
      body: JSON.stringify(invoiceData),
    })
  },

  // Bulk approve
  bulkApprove: async (expenseIds) => {
    return await apiCall(`${API_ENDPOINTS.expenses}/bulk-approve`, {
      method: 'POST',
      body: JSON.stringify({ expense_ids: expenseIds }),
    })
  },

  // Bulk reject
  bulkReject: async (expenseIds, reason) => {
    return await apiCall(`${API_ENDPOINTS.expenses}/bulk-reject`, {
      method: 'POST',
      body: JSON.stringify({ expense_ids: expenseIds, reason }),
    })
  },

  // Upload receipt
  uploadReceipt: async (file) => {
    const formData = new FormData()
    formData.append('receipt', file)
    const url = `${API_BASE_URL}${API_ENDPOINTS.expenses}/upload-receipt`
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      })
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Receipt upload error:', error)
      throw error
    }
  },
}

// User API functions
export const userApi = {
  // Get all users
  getAll: async () => {
    return await apiCall(API_ENDPOINTS.users, {
      method: 'GET',
    })
  },

  // Get single user
  getByEmail: async (email) => {
    return await apiCall(`${API_ENDPOINTS.users}/${email}`, {
      method: 'GET',
    })
  },
}

// Task API functions
export const taskApi = {
  // Get all tasks for a project (optional: filter by user_id for employee view)
  getAll: async (projectId, filters = {}) => {
    const queryParams = new URLSearchParams()
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        queryParams.append(key, filters[key])
      }
    })
    const queryString = queryParams.toString()
    return await apiCall(`${API_ENDPOINTS.tasks(projectId)}${queryString ? '?' + queryString : ''}`, {
      method: 'GET',
    })
  },

  // Create task
  create: async (projectId, taskData) => {
    return await apiCall(API_ENDPOINTS.tasks(projectId), {
      method: 'POST',
      body: JSON.stringify(taskData),
    })
  },

  // Update task
  update: async (projectId, taskId, taskData) => {
    return await apiCall(`${API_ENDPOINTS.tasks(projectId)}/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(taskData),
    })
  },
}

// Timesheets API functions
export const timesheetsApi = {
  // Get all timesheets with filters
  getAll: async (filters = {}) => {
    const queryParams = new URLSearchParams()
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        if (Array.isArray(filters[key])) {
          filters[key].forEach(val => queryParams.append(key, val))
        } else {
          queryParams.append(key, filters[key])
        }
      }
    })
    const queryString = queryParams.toString()
    return await apiCall(`${API_ENDPOINTS.timesheets}${queryString ? '?' + queryString : ''}`, {
      method: 'GET',
    })
  },

  // Get timesheet stats
  getStats: async (filters = {}) => {
    const queryParams = new URLSearchParams()
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        queryParams.append(key, filters[key])
      }
    })
    const queryString = queryParams.toString()
    return await apiCall(`${API_ENDPOINTS.timesheets}/stats${queryString ? '?' + queryString : ''}`, {
      method: 'GET',
    })
  },

  // Get single timesheet
  getById: async (id) => {
    return await apiCall(`${API_ENDPOINTS.timesheets}/${id}`, {
      method: 'GET',
    })
  },

  // Create timesheet
  create: async (timesheetData) => {
    return await apiCall(API_ENDPOINTS.timesheets, {
      method: 'POST',
      body: JSON.stringify(timesheetData),
    })
  },

  // Update timesheet
  update: async (id, timesheetData) => {
    return await apiCall(`${API_ENDPOINTS.timesheets}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(timesheetData),
    })
  },

  // Approve timesheet
  approve: async (id) => {
    return await apiCall(`${API_ENDPOINTS.timesheets}/${id}/approve`, {
      method: 'PATCH',
    })
  },

  // Reject timesheet
  reject: async (id, reason) => {
    return await apiCall(`${API_ENDPOINTS.timesheets}/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    })
  },

  // Bulk approve
  bulkApprove: async (timesheetIds) => {
    return await apiCall(`${API_ENDPOINTS.timesheets}/bulk-approve`, {
      method: 'POST',
      body: JSON.stringify({ timesheet_ids: timesheetIds }),
    })
  },

  // Bulk reject
  bulkReject: async (timesheetIds, reason) => {
    return await apiCall(`${API_ENDPOINTS.timesheets}/bulk-reject`, {
      method: 'POST',
      body: JSON.stringify({ timesheet_ids: timesheetIds, reason }),
    })
  },

  // Get user rates
  getUserRates: async (userId, date) => {
    const queryParams = new URLSearchParams()
    if (date) {
      queryParams.append('date', date)
    }
    const queryString = queryParams.toString()
    return await apiCall(`${API_ENDPOINTS.timesheets}/user-rates/${userId}${queryString ? '?' + queryString : ''}`, {
      method: 'GET',
    })
  },
}

// Sales Orders API functions
export const salesOrdersApi = {
  // Get all sales orders with filters
  getAll: async (filters = {}) => {
    const queryParams = new URLSearchParams()
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        if (Array.isArray(filters[key])) {
          filters[key].forEach(val => queryParams.append(key, val))
        } else {
          queryParams.append(key, filters[key])
        }
      }
    })
    const queryString = queryParams.toString()
    return await apiCall(`${API_ENDPOINTS.salesOrders}${queryString ? '?' + queryString : ''}`, {
      method: 'GET',
    })
  },

  // Get sales order stats
  getStats: async (filters = {}) => {
    const queryParams = new URLSearchParams()
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        queryParams.append(key, filters[key])
      }
    })
    const queryString = queryParams.toString()
    return await apiCall(`${API_ENDPOINTS.salesOrders}/stats${queryString ? '?' + queryString : ''}`, {
      method: 'GET',
    })
  },

  // Get single sales order
  getById: async (id) => {
    return await apiCall(`${API_ENDPOINTS.salesOrders}/${id}`, {
      method: 'GET',
    })
  },

  // Create sales order
  create: async (salesOrderData) => {
    return await apiCall(API_ENDPOINTS.salesOrders, {
      method: 'POST',
      body: JSON.stringify(salesOrderData),
    })
  },

  // Update sales order
  update: async (id, salesOrderData) => {
    return await apiCall(`${API_ENDPOINTS.salesOrders}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(salesOrderData),
    })
  },

  // Confirm sales order
  confirm: async (id) => {
    return await apiCall(`${API_ENDPOINTS.salesOrders}/${id}/confirm`, {
      method: 'PATCH',
    })
  },

  // Cancel sales order
  cancel: async (id) => {
    return await apiCall(`${API_ENDPOINTS.salesOrders}/${id}/cancel`, {
      method: 'PATCH',
    })
  },
}

// Purchase Orders API functions
export const purchaseOrdersApi = {
  // Get all purchase orders with filters
  getAll: async (filters = {}) => {
    const queryParams = new URLSearchParams()
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        if (Array.isArray(filters[key])) {
          filters[key].forEach(val => queryParams.append(key, val))
        } else {
          queryParams.append(key, filters[key])
        }
      }
    })
    const queryString = queryParams.toString()
    return await apiCall(`${API_ENDPOINTS.purchaseOrders}${queryString ? '?' + queryString : ''}`, {
      method: 'GET',
    })
  },

  // Get purchase order stats
  getStats: async (filters = {}) => {
    const queryParams = new URLSearchParams()
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        queryParams.append(key, filters[key])
      }
    })
    const queryString = queryParams.toString()
    return await apiCall(`${API_ENDPOINTS.purchaseOrders}/stats${queryString ? '?' + queryString : ''}`, {
      method: 'GET',
    })
  },

  // Get single purchase order
  getById: async (id) => {
    return await apiCall(`${API_ENDPOINTS.purchaseOrders}/${id}`, {
      method: 'GET',
    })
  },

  // Create purchase order
  create: async (purchaseOrderData) => {
    return await apiCall(API_ENDPOINTS.purchaseOrders, {
      method: 'POST',
      body: JSON.stringify(purchaseOrderData),
    })
  },

  // Update purchase order
  update: async (id, purchaseOrderData) => {
    return await apiCall(`${API_ENDPOINTS.purchaseOrders}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(purchaseOrderData),
    })
  },

  // Confirm purchase order
  confirm: async (id) => {
    return await apiCall(`${API_ENDPOINTS.purchaseOrders}/${id}/confirm`, {
      method: 'PATCH',
    })
  },

  // Cancel purchase order
  cancel: async (id) => {
    return await apiCall(`${API_ENDPOINTS.purchaseOrders}/${id}/cancel`, {
      method: 'PATCH',
    })
  },
}

// Customer Invoices API functions
export const customerInvoicesApi = {
  // Get all customer invoices with filters
  getAll: async (filters = {}) => {
    const queryParams = new URLSearchParams()
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        if (Array.isArray(filters[key])) {
          filters[key].forEach(val => queryParams.append(key, val))
        } else {
          queryParams.append(key, filters[key])
        }
      }
    })
    const queryString = queryParams.toString()
    return await apiCall(`${API_ENDPOINTS.customerInvoices}${queryString ? '?' + queryString : ''}`, {
      method: 'GET',
    })
  },

  // Get customer invoice stats
  getStats: async (filters = {}) => {
    const queryParams = new URLSearchParams()
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        queryParams.append(key, filters[key])
      }
    })
    const queryString = queryParams.toString()
    return await apiCall(`${API_ENDPOINTS.customerInvoices}/stats${queryString ? '?' + queryString : ''}`, {
      method: 'GET',
    })
  },

  // Get single customer invoice
  getById: async (id) => {
    return await apiCall(`${API_ENDPOINTS.customerInvoices}/${id}`, {
      method: 'GET',
    })
  },

  // Create customer invoice
  create: async (invoiceData) => {
    return await apiCall(API_ENDPOINTS.customerInvoices, {
      method: 'POST',
      body: JSON.stringify(invoiceData),
    })
  },

  // Update customer invoice
  update: async (id, invoiceData) => {
    return await apiCall(`${API_ENDPOINTS.customerInvoices}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(invoiceData),
    })
  },

  // Post customer invoice
  post: async (id) => {
    return await apiCall(`${API_ENDPOINTS.customerInvoices}/${id}/post`, {
      method: 'PATCH',
    })
  },

  // Cancel customer invoice
  cancel: async (id) => {
    return await apiCall(`${API_ENDPOINTS.customerInvoices}/${id}/cancel`, {
      method: 'PATCH',
    })
  },
}

// Vendor Bills API functions
export const vendorBillsApi = {
  // Get all vendor bills with filters
  getAll: async (filters = {}) => {
    const queryParams = new URLSearchParams()
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        if (Array.isArray(filters[key])) {
          filters[key].forEach(val => queryParams.append(key, val))
        } else {
          queryParams.append(key, filters[key])
        }
      }
    })
    const queryString = queryParams.toString()
    return await apiCall(`${API_ENDPOINTS.vendorBills}${queryString ? '?' + queryString : ''}`, {
      method: 'GET',
    })
  },

  // Get vendor bill stats
  getStats: async (filters = {}) => {
    const queryParams = new URLSearchParams()
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        queryParams.append(key, filters[key])
      }
    })
    const queryString = queryParams.toString()
    return await apiCall(`${API_ENDPOINTS.vendorBills}/stats${queryString ? '?' + queryString : ''}`, {
      method: 'GET',
    })
  },

  // Get single vendor bill
  getById: async (id) => {
    return await apiCall(`${API_ENDPOINTS.vendorBills}/${id}`, {
      method: 'GET',
    })
  },

  // Create vendor bill
  create: async (billData) => {
    return await apiCall(API_ENDPOINTS.vendorBills, {
      method: 'POST',
      body: JSON.stringify(billData),
    })
  },

  // Update vendor bill
  update: async (id, billData) => {
    return await apiCall(`${API_ENDPOINTS.vendorBills}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(billData),
    })
  },

  // Post vendor bill
  post: async (id) => {
    return await apiCall(`${API_ENDPOINTS.vendorBills}/${id}/post`, {
      method: 'PATCH',
    })
  },

  // Cancel vendor bill
  cancel: async (id) => {
    return await apiCall(`${API_ENDPOINTS.vendorBills}/${id}/cancel`, {
      method: 'PATCH',
    })
  },
}

// Dashboard API functions
export const dashboardApi = {
  // Get dashboard statistics (KPIs)
  getStats: async () => {
    return await apiCall(API_ENDPOINTS.dashboard.stats, {
      method: 'GET',
    })
  },

  // Get dashboard projects with optional filter
  getProjects: async (statusFilter = null) => {
    const queryParams = new URLSearchParams()
    if (statusFilter) {
      queryParams.append('status', statusFilter)
    }
    const queryString = queryParams.toString()
    return await apiCall(`${API_ENDPOINTS.dashboard.projects}${queryString ? '?' + queryString : ''}`, {
      method: 'GET',
    })
  },
}

// Calendar API functions
export const calendarApi = {
  // Get Google OAuth URL (frontend calls this)
  getAuthUrl: async (userId) => {
    const queryParams = new URLSearchParams()
    if (userId) {
      queryParams.append('user_id', userId)
    }
    const queryString = queryParams.toString()
    return await apiCall(`${API_ENDPOINTS.calendar.authUrl}${queryString ? '?' + queryString : ''}`, {
      method: 'GET',
    })
  },

  // Check connection status
  getStatus: async (userId) => {
    const queryParams = new URLSearchParams()
    if (userId) {
      queryParams.append('user_id', userId)
    }
    const queryString = queryParams.toString()
    return await apiCall(`${API_ENDPOINTS.calendar.status}${queryString ? '?' + queryString : ''}`, {
      method: 'GET',
    })
  },

  // Get user's calendars
  getCalendars: async (userId) => {
    const queryParams = new URLSearchParams()
    if (userId) {
      queryParams.append('user_id', userId)
    }
    const queryString = queryParams.toString()
    return await apiCall(`${API_ENDPOINTS.calendar.calendars}${queryString ? '?' + queryString : ''}`, {
      method: 'GET',
    })
  },

  // Get calendar events with filters
  getEvents: async (filters = {}, userId) => {
    const queryParams = new URLSearchParams()
    if (userId) {
      queryParams.append('user_id', userId)
    }
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        if (Array.isArray(filters[key])) {
          filters[key].forEach(val => queryParams.append(key, val))
        } else {
          queryParams.append(key, filters[key])
        }
      }
    })
    const queryString = queryParams.toString()
    return await apiCall(`${API_ENDPOINTS.calendar.events}${queryString ? '?' + queryString : ''}`, {
      method: 'GET',
    })
  },

  // Disconnect Google Calendar
  disconnect: async (userId) => {
    return await apiCall(API_ENDPOINTS.calendar.disconnect, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    })
  },

  // Get upcoming events for notifications
  getUpcomingEvents: async (userId) => {
    const queryParams = new URLSearchParams()
    if (userId) {
      queryParams.append('user_id', userId)
    }
    const queryString = queryParams.toString()
    return await apiCall(`${API_ENDPOINTS.calendar.upcomingEvents}${queryString ? '?' + queryString : ''}`, {
      method: 'GET',
    })
  },

}
