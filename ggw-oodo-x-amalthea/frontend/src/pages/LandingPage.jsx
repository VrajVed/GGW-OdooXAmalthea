import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-8">
      <div className="max-w-4xl text-center">
        <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">From Planning to Payout Seamlessly</h1>
        <p className="text-lg text-gray-600 mb-8">Track pipelines, close more deals, and nurture long-term growth.</p>

        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => navigate('/signup')}
            className="auth-btn px-6 py-3 text-lg shadow-md"
          >
            Start For Free
          </button>

          <button
            onClick={() => navigate('/login')}
            className="border border-gray-300 px-6 py-3 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Login
          </button>
        </div>
      </div>
    </div>
  )
}
