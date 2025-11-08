import { Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Bell, 
  FileText, 
  CheckSquare, 
  Mail, 
  Calendar,
  BarChart3,
  Users,
  Briefcase,
  Puzzle,
  Settings
} from 'lucide-react'
import { cn } from '../lib/utils'

const navigationItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Bell, label: 'Notifications', path: '/notifications' },
  { icon: FileText, label: 'Notes', path: '/notes' },
  { icon: CheckSquare, label: 'Tasks', path: '/tasks' },
  { icon: Mail, label: 'Emails', path: '/emails' },
  { icon: Calendar, label: 'Calendars', path: '/calendars' },
]

const databaseItems = [
  { icon: BarChart3, label: 'Analytics', path: '/analytics' },
  { icon: Users, label: 'Contacts', path: '/contacts' },
  { icon: Briefcase, label: 'Companies', path: '/companies' },
]

const otherItems = [
  { icon: Puzzle, label: 'Integrations', path: '/integrations' },
  { icon: Settings, label: 'Settings', path: '/settings' },
]

function Sidebar() {
  const location = useLocation()

  const isActive = (path) => {
    if (path === '/notes' && location.pathname === '/') return true
    return location.pathname === path
  }

  const NavItem = ({ item, isActive: active }) => {
    const Icon = item.icon
    return (
      <Link
        to={item.path}
        className={cn(
          "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm",
          active
            ? "bg-gray-100 text-gray-900 font-medium"
            : "text-gray-700 hover:bg-gray-50"
        )}
      >
        <Icon className="w-5 h-5" />
        <span>{item.label}</span>
      </Link>
    )
  }

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#714b67' }}>
            <span className="text-white font-bold text-lg">V</span>
          </div>
          <span className="text-xl font-semibold text-gray-900">Venture</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navigationItems.map((item) => (
          <NavItem
            key={item.path}
            item={item}
            isActive={isActive(item.path)}
          />
        ))}

        {/* Database Section */}
        <div className="pt-6 pb-2">
          <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Database
          </h3>
          <div className="space-y-1">
            {databaseItems.map((item) => (
              <NavItem
                key={item.path}
                item={item}
                isActive={isActive(item.path)}
              />
            ))}
          </div>
        </div>

        {/* Other Items */}
        <div className="pt-4 space-y-1">
          {otherItems.map((item) => (
            <NavItem
              key={item.path}
              item={item}
              isActive={isActive(item.path)}
            />
          ))}
        </div>
      </nav>

      {/* Bottom Section */}
      <div className="px-4 py-4 border-t border-gray-200">
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-50 cursor-pointer">
          <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-sm">M</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">Marketing Team's</p>
          </div>
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar

