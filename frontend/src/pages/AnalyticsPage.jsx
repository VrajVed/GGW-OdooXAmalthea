import { useState } from 'react'
import { DollarSign, Clock, ChevronDown } from 'lucide-react'
import CompletedTaskCard from '../components/analytics/CompletedTaskCard'
import ActiveProjectsCard from '../components/analytics/ActiveProjectsCard'
import TopCompaniesCard from '../components/analytics/TopCompaniesCard'
import ActiveCompaniesCard from '../components/analytics/ActiveCompaniesCard'
import CompletedProjectTargetCard from '../components/analytics/CompletedProjectTargetCard'

function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState('analytics')

  return (
    <div className="h-full bg-gray-50">
      <div className="w-full bg-white min-h-full">
        <div className="border-b border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
          </div>
          <div className="flex items-center gap-6 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`pb-4 px-1 relative ${
                activeTab === 'analytics'
                  ? 'text-gray-900 font-medium'
                  : 'text-gray-600 hover:text-gray-900'
              } transition-colors`}
            >
              <span className="text-sm">Analytics</span>
              {activeTab === 'analytics' && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ backgroundColor: '#714b67' }}
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab('sales')}
              className={`flex items-center gap-2 pb-4 px-1 relative ${
                activeTab === 'sales'
                  ? 'text-gray-900 font-medium'
                  : 'text-gray-600 hover:text-gray-900'
              } transition-colors`}
            >
              <DollarSign className="w-4 h-4" />
              <span className="text-sm">Sales</span>
              {activeTab === 'sales' && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ backgroundColor: '#714b67' }}
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`flex items-center gap-2 pb-4 px-1 relative ${
                activeTab === 'activity'
                  ? 'text-gray-900 font-medium'
                  : 'text-gray-600 hover:text-gray-900'
              } transition-colors`}
            >
              <Clock className="w-4 h-4" />
              <span className="text-sm">Activity</span>
              {activeTab === 'activity' && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ backgroundColor: '#714b67' }}
                />
              )}
            </button>
          </div>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-9">
              <ActiveProjectsCard />
            </div>

            <div className="lg:col-span-3 space-y-6">
              <CompletedTaskCard />
              <TopCompaniesCard />
            </div>

            <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-6">
              <ActiveCompaniesCard />
              <CompletedProjectTargetCard />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AnalyticsPage

