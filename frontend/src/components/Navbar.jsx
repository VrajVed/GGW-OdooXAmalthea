import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Bell, 
  FileText, 
  CheckSquare, 
  Calendar,
  BarChart3,
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
  { icon: Bell, label: 'Notifications', path: '/notifications' },
  { icon: FileText, label: 'Projects', path: '/projects' },
  { icon: CheckSquare, label: 'Tasks', path: '/tasks' },
  { icon: Receipt, label: 'Expenses', path: '/expenses' },
  { icon: Calendar, label: 'Calendars', path: '/calendars' },
]

const databaseItems = [
  { icon: BarChart3, label: 'Analytics', path: '/analytics' },
  { icon: Users, label: 'Contacts', path: '/contacts' },
  { icon: Briefcase, label: 'Companies', path: '/companies' },
]

const otherItems = [
  { icon: Settings, label: 'Settings', path: '/settings' },
]

function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const [databaseOpen, setDatabaseOpen] = useState(false)
  const dropdownRef = useRef(null)
  const buttonRef = useRef(null)

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

  useEffect(() => {
    if (!databaseOpen) return

    const handleClickOutside = (e) => {
      const dropdown = document.querySelector('.database-dropdown')
      if (dropdown && !dropdown.contains(e.target)) {
        setDatabaseOpen(false)
      }
    }

    setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 0)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [databaseOpen])

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

          <div className="relative database-dropdown" ref={dropdownRef} style={{ zIndex: 1000 }}>
            <button
              ref={buttonRef}
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setDatabaseOpen(!databaseOpen)
              }}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm",
                databaseOpen
                  ? "bg-gray-100 text-gray-900 font-medium"
                  : "text-gray-700 hover:bg-gray-50"
              )}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Database</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${databaseOpen ? 'rotate-180' : ''}`} />
            </button>
            {databaseOpen && buttonRef.current && createPortal(
              <div 
                className="fixed bg-white border border-gray-200 rounded-lg shadow-xl py-2 min-w-[180px]"
                style={{ 
                  zIndex: 1000,
                  top: buttonRef.current.getBoundingClientRect().bottom + 4,
                  left: buttonRef.current.getBoundingClientRect().left,
                }}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
                {databaseItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.path}
                      to={`/app${item.path}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        setDatabaseOpen(false)
                      }}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 text-sm transition-colors block",
                        isActive(item.path)
                          ? "bg-gray-100 text-gray-900 font-medium"
                          : "text-gray-700 hover:bg-gray-50"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </div>,
              document.body
            )}
          </div>

          {otherItems.map((item) => (
            <NavItem
              key={item.path}
              item={item}
              isActive={isActive(item.path)}
            />
          ))}
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

