import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthBox from '../components/AuthBox'
import AuthInput from '../components/AuthInput'
import AuthNavbar from '../components/AuthNavbar'
import { apiCall, API_ENDPOINTS, saveUser } from '../lib/api'

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
        // Store user data in localStorage
        saveUser(data.data.user)
        
        // Navigate based on user role
        const userRole = data.data.user.role
        if (userRole === 'project_manager' || userRole === 'admin') {
          navigate('/app')
        } else {
          // For team_member, finance, or any other role
          navigate('/employee')
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
      <div className="flex items-center justify-center p-8">
        <div className="max-w-xl w-full">
          <AuthBox title="Login into account">
            <form className="space-y-4" onSubmit={handleSubmit}>
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

              <div className="text-sm mt-2" style={{ color: '#714b67' }}>Forget password?</div>

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
