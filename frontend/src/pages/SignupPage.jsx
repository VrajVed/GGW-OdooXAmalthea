import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthBox from '../components/AuthBox'
import AuthInput from '../components/AuthInput'
import AuthNavbar from '../components/AuthNavbar'
import { apiCall, API_ENDPOINTS } from '../lib/api'

export default function SignupPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    workEmail: '',
    password: ''
  })
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

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

    // Validate terms agreement
    if (!agreedToTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy')
      return
    }

    // Validate password length
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    setLoading(true)

    try {
      const data = await apiCall(API_ENDPOINTS.register, {
        method: 'POST',
        body: JSON.stringify(formData)
      })

      if (data.success) {
        setSuccess(true)
        
        // Show success message briefly then redirect
        setTimeout(() => {
          navigate('/login')
        }, 2000)
      } else {
        setError(data.message || 'Registration failed. Please try again.')
      }
    } catch (err) {
      console.error('Registration error:', err)
      setError('Unable to connect to server. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-white">
        <AuthNavbar variant="signup" />
        <div className="flex items-center justify-center p-6">
          <div className="max-w-3xl w-full">
            <AuthBox title="Account Created Successfully! 🎉">
              <div className="text-center py-6">
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm mb-4">
                  Your account has been created successfully!
                </div>
                <p className="text-gray-600 mb-4">Redirecting you to login page...</p>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              </div>
            </AuthBox>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <AuthNavbar variant="signup" />
      <div className="flex items-center justify-center p-6">
        <div className="max-w-3xl w-full">
          <AuthBox title="Create an account">
            <form className="space-y-2" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}
              
              <AuthInput 
                label="First name" 
                name="firstName" 
                placeholder="John"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
              <AuthInput 
                label="Last name" 
                name="lastName" 
                placeholder="Doe"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
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

              <label className="flex items-center text-sm text-gray-600 mt-2">
                <input 
                  type="checkbox" 
                  className="mr-2"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                />
                <span>I agree to the Terms of Service and Privacy Policy.</span>
              </label>

              <div className="pt-4">
                <button 
                  type="submit" 
                  className="auth-btn w-full text-white font-medium py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading ? 'Creating account...' : 'Create an account'}
                </button>
              </div>
            </form>
          </AuthBox>
        </div>
      </div>
    </div>
  )
}
