import { TrendingUp, ChevronDown } from 'lucide-react'

const departments = [
  { name: 'Agency', value: 57 },
  { name: 'Development', value: 38 },
  { name: 'Marketing', value: 25 },
  { name: 'Communication', value: 38 },
  { name: 'Web Development', value: 13 },
  { name: 'Travel Agency', value: 11 },
]

const maxValue = Math.max(...departments.map(d => d.value))

function ActiveCompaniesCard() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Active Companies</h3>
        <button 
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white rounded-lg hover:bg-gray-50"
          style={{ border: '1.5px solid #714b67' }}
        >
          Year
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>

      <div className="mb-4">
        <div className="flex items-baseline gap-2 mb-1">
          <p className="text-3xl font-bold text-gray-900">341 Companies</p>
          <div className="flex items-center gap-1 text-green-600">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-semibold">12%</span>
          </div>
        </div>
        <p className="text-sm text-gray-500">This Years</p>
      </div>

      {/* Progress Bars */}
      <div className="space-y-3">
        {departments.map((dept, index) => {
          const percentage = (dept.value / maxValue) * 100
          return (
            <div key={index}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-700">{dept.name}</span>
                <span className="text-sm font-semibold text-gray-900">{dept.value}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gray-800 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ActiveCompaniesCard

