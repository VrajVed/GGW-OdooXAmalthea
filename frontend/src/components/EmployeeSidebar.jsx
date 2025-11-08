import { Link, useLocation, useNavigate } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Bell, 
  FileText, 
  CheckSquare, 
  Mail, 
  Calendar,
  Clock,
  Receipt
} from 'lucide-react'
import { cn } from '../lib/utils'
import { removeUser } from '../lib/api'
import logo from '../images/logo.png'

const navigationItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Bell, label: 'Notifications', path: '/notifications' },
  { icon: FileText, label: 'Notes', path: '/notes' },
  { icon: CheckSquare, label: 'Tasks', path: '/tasks' },
  { icon: Receipt, label: 'Expenses', path: '/expenses' },
  { icon: Mail, label: 'Emails', path: '/emails' },
  { icon: Calendar, label: 'Calendars', path: '/calendars' },
  { icon: Clock, label: 'Timesheets', path: '/timesheets' },
]

function EmployeeSidebar() {
  const location = useLocation()
  const navigate = useNavigate()

  const isActive = (path) => {
    const full = `/employee${path}`
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
        to={`/employee${item.path}`}
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
      <div className="px-6 py-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <img 
            src={logo} 
            alt="OneFlow Logo" 
            className="h-32 w-auto cursor-pointer" 
            onClick={handleLogoClick}
            title="Logout"
          />
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1">
        {navigationItems.map((item) => (
          <NavItem
            key={item.path}
            item={item}
            isActive={isActive(item.path)}
          />
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-gray-200">
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-50 cursor-pointer">
          <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-sm">E</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">Employee</p>
          </div>
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </aside>
  )
}

export default EmployeeSidebar
