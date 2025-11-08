import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Bell, 
  FileText, 
  CheckSquare, 
  Calendar,
  BarChart3,
  Clock,
  Users,
  Briefcase,
  Settings,
  ChevronDown,
  Receipt,
  LogOut
} from 'lucide-react'
import { cn } from '../lib/utils'
import { removeUser, getUser } from '../lib/api'
import logo from '../images/logo.png'

const navigationItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: FileText, label: 'Projects', path: '/projects' },
  { icon: CheckSquare, label: 'Tasks', path: '/tasks' },
  { icon: Receipt, label: 'Expenses', path: '/expenses' },
  { icon: Calendar, label: 'Calendars', path: '/calendars' },
  { icon: Clock, label: 'Timesheets', path: '/timesheets' },
]

const otherItems = [
  { icon: Settings, label: 'Settings', path: '/settings' },
]

function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [user, setUser] = useState(null)
  const dropdownTimeoutRef = useState(null)

  useEffect(() => {
    const userData = getUser()
    setUser(userData)
  }, [])

  const handleMouseEnter = () => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current)
    }
    setShowUserDropdown(true)
  }

  const handleMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setShowUserDropdown(false)
    }, 100)
  }

  const getInitials = (fullName) => {
    if (!fullName) return 'U'
    const names = fullName.trim().split(' ')
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase()
    }
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase()
  }

  const getUserRole = () => {
    return user?.role || 'Project Manager'
  }

  const isActive = (path) => {
    const full = `/app${path}`
    return location.pathname === full
  }

  const handleLogoClick = () => {
    removeUser()
    navigate('/')
  }

  const handleLogout = () => {
    removeUser()
    navigate('/')
  }

  const NavItem = ({ item, isActive: active }) => {
    const Icon = item.icon
    return (
      <Link
        to={`/app${item.path}`}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm",
          active
            ? "bg-gray-100 text-gray-900 font-medium"
            : "text-gray-700 hover:bg-gray-50"
        )}
      >
        <Icon className="w-4 h-4" />
        <span>{item.label}</span>
      </Link>
    )
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 sticky top-0 z-40">
      <div className="flex items-center justify-between max-w-full">
        <div className="flex items-center gap-3 flex-shrink-0">
          <img 
            src={logo} 
            alt="OneFlow Logo" 
            className="h-20 w-auto cursor-pointer" 
            onClick={handleLogoClick}
            title="Logout"
          />
        </div>

        <div className="flex items-center gap-1 flex-1 justify-center overflow-x-auto overflow-y-visible">
          {navigationItems.map((item) => (
            <NavItem
              key={item.path}
              item={item}
              isActive={isActive(item.path)}
            />
          ))}

          {otherItems.map((item) => (
            <NavItem
              key={item.path}
              item={item}
              isActive={isActive(item.path)}
            />
          ))}

          <NavItem
            key="/notifications"
            item={{ icon: Bell, label: 'Notifications', path: '/notifications' }}
            isActive={isActive('/notifications')}
          />
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <div 
            className="relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer">
              <div className="w-9 h-9 bg-[#714b67] rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">{getInitials(user?.full_name)}</span>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>

            {showUserDropdown && (
              <div className="absolute right-0 top-full w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 mt-1">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900">{user?.full_name || 'User'}</p>
                  <p className="text-xs text-gray-500 mt-1">{getUserRole()}</p>
                  <p className="text-xs text-gray-400 mt-1">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar

