import React from 'react'

export default function AuthBox({ title, children, className = '' }) {
  return (
    <div className={`auth-box ${className} p-10 rounded-2xl bg-white border border-gray-200 shadow-sm`}>
      {title && <h2 className="auth-title text-3xl font-semibold mb-8 text-gray-900">{title}</h2>}
      {children}
    </div>
  )
}
