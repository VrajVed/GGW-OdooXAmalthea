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
}

// Helper function for API calls
export const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
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

    const data = await response.json()
    return data
  } catch (error) {
    console.error('API call error:', error)
    throw error
  }
}

// Auth helpers
export const saveUser = (user) => {
  localStorage.setItem('user', JSON.stringify(user))
}

export const getUser = () => {
  const user = localStorage.getItem('user')
  return user ? JSON.parse(user) : null
}

export const removeUser = () => {
  localStorage.removeItem('user')
}

export const isAuthenticated = () => {
  return !!getUser()
}

// Project API functions
export const projectApi = {
  // Get all projects
  getAll: async () => {
    return await apiCall(API_ENDPOINTS.projects, {
      method: 'GET',
    })
  },

  // Get single project
  getById: async (id) => {
    return await apiCall(`${API_ENDPOINTS.projects}/${id}`, {
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
  // Get all tasks for a project
  getAll: async (projectId) => {
    return await apiCall(API_ENDPOINTS.tasks(projectId), {
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
