import React from 'react'

export default function AuthBox({ title, children, className = '' }) {
  return (
    <div className={`auth-box ${className} p-6 rounded-2xl bg-white border border-gray-200 shadow-sm`}>
      {title && <h2 className="auth-title text-2xl font-semibold mb-6 text-gray-900">{title}</h2>}
      {children}
    </div>
  )
}
