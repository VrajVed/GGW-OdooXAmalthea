// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export const API_ENDPOINTS = {
  register: '/api/users/register',
  login: '/api/users/login',
  users: '/api/users',
  projects: '/api/projects',
  tasks: (projectId) => `/api/projects/${projectId}/tasks`,
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
