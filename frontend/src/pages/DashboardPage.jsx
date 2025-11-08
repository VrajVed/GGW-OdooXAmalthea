import KeyMetricsCards from '../components/dashboard/KeyMetricsCards'
import UpcomingAgenda from '../components/dashboard/UpcomingAgenda'
import EmailOpenRateChart from '../components/dashboard/EmailOpenRateChart'
import PeopleTable from '../components/dashboard/PeopleTable'
import CompaniesTable from '../components/dashboard/CompaniesTable'
import CompanyCategoriesChart from '../components/dashboard/CompanyCategoriesChart'

function DashboardPage() {
  return (
    <div className="h-full bg-gray-50">
      <div className="w-full bg-white min-h-full">
        {/* Header */}
        <div className="border-b border-gray-200 px-8 py-6">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Key Metrics Cards */}
          <KeyMetricsCards />

          {/* Second Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <UpcomingAgenda />
            <EmailOpenRateChart />
          </div>

          {/* People Table */}
          <div className="mt-6">
            <PeopleTable />
          </div>

          {/* Companies Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <div className="lg:col-span-2">
              <CompaniesTable />
            </div>
            <div>
              <CompanyCategoriesChart />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage

