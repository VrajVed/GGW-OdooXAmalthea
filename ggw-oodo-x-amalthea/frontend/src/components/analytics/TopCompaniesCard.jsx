import { TrendingUp, TrendingDown } from 'lucide-react'

const companies = [
  { name: 'Product Hunt', logo: 'P', value: 5, change: 'up', color: 'bg-orange-500' },
  { name: 'Google', logo: 'G', value: 2, change: 'up', color: 'bg-blue-500' },
  { name: 'Wordpress', logo: 'W', value: 1, change: 'up', color: 'bg-blue-600' },
  { name: 'Tripadvisor', logo: 'T', value: 3, change: 'down', color: 'bg-green-500' },
  { name: 'Slack', logo: 'S', value: 2, change: 'down', color: 'bg-purple-500' },
  { name: 'Zendesk', logo: 'Z', value: 3, change: 'down', color: 'bg-gray-900' },
]

function TopCompaniesCard() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Top Companies</h3>
      <div className="space-y-3">
        {companies.map((company, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-500">{index + 1}.</span>
              <div className={`w-8 h-8 ${company.color} rounded flex items-center justify-center`}>
                <span className="text-white font-bold text-sm">{company.logo}</span>
              </div>
              <span className="text-sm font-medium text-gray-900">{company.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-900">{company.value}</span>
              {company.change === 'up' ? (
                <TrendingUp className="w-4 h-4 text-green-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TopCompaniesCard

