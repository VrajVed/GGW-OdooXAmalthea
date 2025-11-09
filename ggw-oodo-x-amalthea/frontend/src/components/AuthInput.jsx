import React from 'react'

export default function AuthInput({ label, type = 'text', name, placeholder = '', ...props }) {
  return (
    <label className="block mb-4 text-sm text-gray-700">
      <div className="mb-2 text-gray-600">{label}</div>
      <input
        className="auth-input w-full rounded-md border border-gray-300 px-4 py-2 bg-white text-gray-900 placeholder-gray-400"
        type={type}
        name={name}
        placeholder={placeholder}
        {...props}
      />
    </label>
  )
}
