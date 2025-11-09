import { Search, Filter, ArrowUpDown, Phone, MessageSquare } from 'lucide-react'
import { ChevronDown } from 'lucide-react'

const peopleData = [
  {
    name: 'Robert Fox',
    email: 'robertfox@example.com',
    phone: '(671) 555-0110',
    category: 'Employee',
    categoryColor: 'bg-purple-100 text-purple-700',
    location: 'Austin',
    gender: 'M',
  },
  {
    name: 'Dianne Russell',
    email: 'diannerussell@example.com',
    phone: '(671) 555-0110',
    category: 'Customers',
    categoryColor: 'bg-blue-100 text-blue-700',
    location: 'New York',
    gender: 'F',
  },
  {
    name: 'Floyd Miles',
    email: 'floydmiles@example.com',
    phone: '(671) 555-0110',
    category: 'Partners',
    categoryColor: 'bg-orange-100 text-orange-700',
    location: 'Los Angeles',
    gender: 'M',
  },
  {
    name: 'Annette Black',
    email: 'annetteblack@example.com',
    phone: '(671) 555-0110',
    category: 'Employee',
    categoryColor: 'bg-purple-100 text-purple-700',
    location: 'Chicago',
    gender: 'F',
  },
  {
    name: 'Cameron Williamson',
    email: 'cameronwilliamson@example.com',
    phone: '(671) 555-0110',
    category: 'Customers',
    categoryColor: 'bg-blue-100 text-blue-700',
    location: 'Miami',
    gender: 'M',
  },
]

const getInitials = (name) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const getAvatarColor = (name) => {
  const colors = [
    'bg-gray-400',
    'bg-gray-500',
    'bg-gray-600',
    'bg-gray-700',
    'bg-gray-800',
  ]
  const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return colors[index % colors.length]
}

function PeopleTable() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">People</h3>
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
              <th className="text-left py-3 px-4">
                <input type="checkbox" className="w-4 h-4 text-gray-600 border-gray-300 rounded" />
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700">
                Name <ChevronDown className="w-3 h-3 inline" />
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700">
                Email <ChevronDown className="w-3 h-3 inline" />
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700">
                Phone <ChevronDown className="w-3 h-3 inline" />
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700">
                Category <ChevronDown className="w-3 h-3 inline" />
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700">
                Location <ChevronDown className="w-3 h-3 inline" />
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700">
                Gender <ChevronDown className="w-3 h-3 inline" />
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {peopleData.map((person, index) => (
              <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="py-3 px-4">
                  <input type="checkbox" className="w-4 h-4 text-gray-600 border-gray-300 rounded" />
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 ${getAvatarColor(person.name)} rounded-full flex items-center justify-center`}>
                      <span className="text-xs font-semibold text-white">
                        {getInitials(person.name)}
                      </span>
                    </div>
                    <span className="text-sm text-gray-900">{person.name}</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <a href="#" className="text-sm text-gray-900 underline hover:text-gray-700">
                    {person.email}
                  </a>
                </td>
                <td className="py-3 px-4 text-sm text-gray-700">{person.phone}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${person.categoryColor}`}>
                    {person.category}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm text-gray-700">{person.location}</td>
                <td className="py-3 px-4 text-sm text-gray-700">{person.gender}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <button className="p-1.5 border border-gray-300 rounded hover:bg-gray-50">
                      <Phone className="w-3.5 h-3.5 text-gray-600" />
                    </button>
                    <button className="p-1.5 border border-gray-300 rounded hover:bg-gray-50">
                      <MessageSquare className="w-3.5 h-3.5 text-gray-600" />
                    </button>
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

export default PeopleTable

