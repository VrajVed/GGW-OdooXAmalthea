import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthBox from '../components/AuthBox'
import AuthInput from '../components/AuthInput'
import AuthNavbar from '../components/AuthNavbar'
import { apiCall, API_ENDPOINTS, saveUser, saveToken } from '../lib/api'

export default function LoginPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    workEmail: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    // Clear error when user starts typing
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = await apiCall(API_ENDPOINTS.login, {
        method: 'POST',
        body: JSON.stringify(formData)
      })

      if (data.success) {
        // Store user data and token in localStorage
        saveUser(data.data.user)
        if (data.data.token) {
          saveToken(data.data.token)
        }
        
        // Navigate based on user role
        const userRole = data.data.user.role
        if (userRole === 'project_manager' || userRole === 'admin') {
          navigate('/dashboard/pm')
        } else if (userRole === 'team_member') {
          navigate('/dashboard/employee')
        } else {
          // Default fallback for other roles (finance, etc.)
          navigate('/dashboard/employee')
        }
      } else {
        setError(data.message || 'Login failed. Please try again.')
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('Unable to connect to server. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <AuthNavbar variant="login" />
      <div className="flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <AuthBox title="Login into account">
            <form className="space-y-2" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}
              
              <AuthInput 
                label="Work Email" 
                name="workEmail" 
                type="email" 
                placeholder="you@company.com"
                value={formData.workEmail}
                onChange={handleChange}
                required
              />
              <AuthInput 
                label="Password" 
                name="password" 
                type="password" 
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />

              <div className="text-sm text-purple-600 mt-2">Forget password?</div>

              <div className="pt-4">
                <button 
                  type="submit" 
                  className="auth-btn w-full text-white font-medium py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading ? 'Logging in...' : 'Login'}
                </button>
              </div>
            </form>
          </AuthBox>
        </div>
      </div>
    </div>
  )
}
