// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export const API_ENDPOINTS = {
  register: '/api/users/register',
  login: '/api/users/login',
  users: '/api/users',
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
