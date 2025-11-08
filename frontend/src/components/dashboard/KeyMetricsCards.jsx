import { Mail, Briefcase, Users, CheckSquare, ChevronRight } from 'lucide-react'

const metrics = [
  { icon: Mail, value: '1,251', label: 'Mail', title: 'Email Sent' },
  { icon: Briefcase, value: '43', label: 'Company', title: 'Active Company' },
  { icon: Users, value: '162', label: 'Contact', title: 'Total Contact' },
  { icon: CheckSquare, value: '5', label: 'Task', title: 'Ongoing Task' },
]

function KeyMetricsCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, index) => {
        const Icon = metric.icon
        return (
          <div
            key={index}
            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Icon className="w-6 h-6 text-gray-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {metric.value} {metric.label}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">{metric.title}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default KeyMetricsCards

