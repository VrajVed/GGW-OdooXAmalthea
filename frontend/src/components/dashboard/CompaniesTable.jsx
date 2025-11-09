import { Search, Filter, ArrowUpDown, ChevronDown } from 'lucide-react'

const companiesData = [
  {
    name: 'Product Hunt',
    logo: 'P',
    logoColor: 'bg-orange-500',
    industry: 'Web Design',
    location: 'New York City, NY',
    status: 'Active',
    statusColor: 'text-blue-600',
    statusDot: 'bg-blue-600',
  },
  {
    name: 'Google',
    logo: 'G',
    logoColor: 'bg-blue-500',
    industry: 'Technology',
    location: 'Mountain View, CA',
    status: 'Lead',
    statusColor: 'text-orange-600',
    statusDot: 'bg-orange-600',
  },
  {
    name: 'Wordpress',
    logo: 'W',
    logoColor: 'bg-blue-600',
    industry: 'Web Development',
    location: 'San Francisco, CA',
    status: 'Active',
    statusColor: 'text-blue-600',
    statusDot: 'bg-blue-600',
  },
  {
    name: 'Tripadvisor',
    logo: 'T',
    logoColor: 'bg-green-500',
    industry: 'Travel',
    location: 'Needham, MA',
    status: 'Active',
    statusColor: 'text-blue-600',
    statusDot: 'bg-blue-600',
  },
  {
    name: 'Slack',
    logo: 'S',
    logoColor: 'bg-purple-500',
    industry: 'Communication',
    location: 'San Francisco, CA',
    status: 'Lead',
    statusColor: 'text-orange-600',
    statusDot: 'bg-orange-600',
  },
]

function CompaniesTable() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Companies</h3>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search"
              className="pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent text-sm w-64"
            />
            <span className="absolute right-10 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 bg-gray-100 px-1 rounded">F</span>
          </div>
          <button 
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white rounded-lg hover:bg-gray-50"
            style={{ border: '1.5px solid #714b67' }}
          >
            <ArrowUpDown className="w-4 h-4" />
            Sort By
          </button>
          <button 
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white rounded-lg hover:bg-gray-50"
            style={{ border: '1.5px solid #714b67' }}
          >
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>
      </div>

  <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700">
                Companies Name <ChevronDown className="w-3 h-3 inline" />
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700">
                Industry <ChevronDown className="w-3 h-3 inline" />
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700">
                Location <ChevronDown className="w-3 h-3 inline" />
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700">
                Status <ChevronDown className="w-3 h-3 inline" />
              </th>
            </tr>
          </thead>
          <tbody>
            {companiesData.map((company, index) => (
              <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 ${company.logoColor} rounded flex items-center justify-center`}>
                      <span className="text-white font-bold text-sm">{company.logo}</span>
                    </div>
                    <span className="text-sm text-gray-900">{company.name}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm text-gray-700">{company.industry}</td>
                <td className="py-3 px-4 text-sm text-gray-700">{company.location}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${company.statusDot}`}></div>
                    <span className={`text-sm font-medium ${company.statusColor}`}>
                      {company.status}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default CompaniesTable

