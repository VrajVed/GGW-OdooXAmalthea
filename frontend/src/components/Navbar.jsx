import { useState } from 'react'
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
  Receipt
} from 'lucide-react'
import { cn } from '../lib/utils'
import { removeUser } from '../lib/api'
import logo from '../images/logo.png'

const navigationItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: FileText, label: 'Projects', path: '/projects' },
  { icon: CheckSquare, label: 'Tasks', path: '/tasks' },
  { icon: Receipt, label: 'Expenses', path: '/expenses' },
  { icon: Calendar, label: 'Calendars', path: '/calendars' },
  { icon: Clock, label: 'Timesheets', path: '/timesheets' },
]

// database dropdown removed; replaced by Timesheets

const otherItems = [
  { icon: Settings, label: 'Settings', path: '/settings' },
]

function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()

  const isActive = (path) => {
    const full = `/app${path}`
    return location.pathname === full
  }

  const handleLogoClick = () => {
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

  // database dropdown logic removed

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

          {/* Database dropdown removed; Timesheets added in navigationItems */}

          {otherItems.map((item) => (
            <NavItem
              key={item.path}
              item={item}
              isActive={isActive(item.path)}
            />
          ))}

          {/* Notifications moved to the end after Settings */}
          <NavItem
            key="/notifications"
            item={{ icon: Bell, label: 'Notifications', path: '/notifications' }}
            isActive={isActive('/notifications')}
          />
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer">
            <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">M</span>
            </div>
            <span className="text-sm font-medium text-gray-900 hidden sm:inline">Marketing Team's</span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar

