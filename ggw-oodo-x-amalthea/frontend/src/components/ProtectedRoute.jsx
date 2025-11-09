import { Navigate } from 'react-router-dom'
import { getUser, isAuthenticated } from '../lib/api'

/**
 * ProtectedRoute - Role-based route protection
 * @param {React.Component} children - The component to render if authorized
 * @param {string[]} allowedRoles - Array of roles that can access this route
 * @param {string} redirectTo - Where to redirect if unauthorized (default: based on role)
 */
export default function ProtectedRoute({ children, allowedRoles, redirectTo = null }) {
  // Check if user is authenticated
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }

  const user = getUser()
  const userRole = user?.role

  // Check if user has required role
  if (!userRole || !allowedRoles.includes(userRole)) {
    // Redirect based on user's actual role
    if (!redirectTo) {
      if (userRole === 'project_manager' || userRole === 'admin') {
        return <Navigate to="/dashboard/pm" replace />
      } else {
        return <Navigate to="/dashboard/employee" replace />
      }
    }
    return <Navigate to={redirectTo} replace />
  }

  // User is authenticated and has the correct role
  return children
}

