import { Link, useLocation } from 'react-router-dom'
import { FileText, ShoppingCart, Receipt, FileCheck } from 'lucide-react'
import { cn } from '../lib/utils'

const settingsItems = [
  { 
    icon: ShoppingCart, 
    label: 'Sales Orders', 
    path: '/settings/sales-orders',
    description: 'Manage customer sales orders'
  },
  { 
    icon: FileText, 
    label: 'Purchase Orders', 
    path: '/settings/purchase-orders',
    description: 'Manage vendor purchase orders'
  },
  { 
    icon: FileCheck, 
    label: 'Invoices', 
    path: '/settings/invoices',
    description: 'Manage customer invoices'
  },
  { 
    icon: Receipt, 
    label: 'Vendor Bills', 
    path: '/settings/vendor-bills',
    description: 'Manage vendor bills'
  },
]

export default function SettingsPage() {
  const location = useLocation()

  const isActive = (path) => {
    const full = `/app${path}`
    return location.pathname === full
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {settingsItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.path)
            
            return (
              <Link
                key={item.path}
                to={`/app${item.path}`}
                className={cn(
                  "flex items-start gap-4 p-6 rounded-lg border-2 transition-all",
                  active
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md"
                )}
              >
                <div 
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: '#714b67' }}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className={cn(
                    "text-lg font-semibold mb-1",
                    active ? "text-blue-900" : "text-gray-900"
                  )}>
                    {item.label}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {item.description}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

