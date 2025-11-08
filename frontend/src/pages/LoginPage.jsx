import React from 'react'
import { useNavigate } from 'react-router-dom'
import AuthBox from '../components/AuthBox'
import AuthInput from '../components/AuthInput'
import AuthNavbar from '../components/AuthNavbar'

export default function LoginPage() {
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    navigate('/app')
  }

  return (
    <div className="min-h-screen bg-white">
      <AuthNavbar variant="login" />
      <div className="flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <AuthBox title="Login into account">
            <form className="space-y-2" onSubmit={handleSubmit}>
              <AuthInput label="Work Email" name="email" type="email" placeholder="you@company.com" />
              <AuthInput label="Password" name="password" type="password" placeholder="••••••••" />

              <div className="text-sm text-purple-600 mt-2">Forget password?</div>

              <div className="pt-4">
                <button type="submit" className="auth-btn w-full text-white font-medium py-2 rounded-md">Login</button>
              </div>
            </form>
          </AuthBox>
        </div>
      </div>
    </div>
  )
}
