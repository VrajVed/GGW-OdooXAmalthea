import React from 'react'
import { Link } from 'react-router-dom'

export default function AuthNavbar({ variant = 'login' }) {
  return (
    <header className="w-full py-4 px-6 flex items-center justify-between border-b border-gray-100 bg-white">
      <div className="text-xl font-semibold">OneFlow</div>
      <div>
        {variant === 'login' ? (
          <Link to="/signup" className="px-4 py-2 rounded-md bg-purple-600 text-white hover:bg-purple-700">Sign Up</Link>
        ) : (
          <Link to="/login" className="px-4 py-2 rounded-md bg-purple-600 text-white hover:bg-purple-700">Login</Link>
        )}
      </div>
    </header>
  )
}
