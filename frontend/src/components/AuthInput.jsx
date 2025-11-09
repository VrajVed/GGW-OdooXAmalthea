import React from 'react'

export default function AuthInput({ label, type = 'text', name, placeholder = '', ...props }) {
  return (
    <label className="block mb-4 text-base text-gray-700">
      <div className="mb-2 text-gray-600 font-medium">{label}</div>
      <input
        className="auth-input w-full rounded-md border border-gray-300 px-5 py-3 bg-white text-gray-900 placeholder-gray-400 text-base"
        type={type}
        name={name}
        placeholder={placeholder}
        {...props}
      />
    </label>
  )
}
