import React from 'react'
import { useNavigate } from 'react-router-dom'
import AuthBox from '../components/AuthBox'
import AuthInput from '../components/AuthInput'
import AuthNavbar from '../components/AuthNavbar'

export default function SignupPage() {
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-white">
      <AuthNavbar variant="signup" />
      <div className="flex items-center justify-center p-6">
        <div className="max-w-3xl w-full">
          <AuthBox title="Create an account">
            <form className="space-y-2" onSubmit={handleSubmit}>
              <AuthInput label="First name" name="firstName" placeholder="John" />
              <AuthInput label="Last name" name="lastName" placeholder="Doe" />
              <AuthInput label="Work Email" name="email" type="email" placeholder="you@company.com" />
              <AuthInput label="Password" name="password" type="password" placeholder="••••••••" />

              <label className="flex items-center text-sm text-gray-600 mt-2">
                <input type="checkbox" className="mr-2" />
                <span>I agree to the Terms of Service and Privacy Policy.</span>
              </label>

              <div className="pt-4">
                <button type="submit" className="auth-btn w-full text-white font-medium py-2 rounded-md">Create an account</button>
              </div>
            </form>
          </AuthBox>
        </div>
      </div>
    </div>
  )
}
