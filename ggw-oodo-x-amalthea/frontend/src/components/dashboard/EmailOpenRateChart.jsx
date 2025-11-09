import { useState } from 'react'
import { TrendingUp, Calendar, ChevronDown } from 'lucide-react'

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const openRateData = [45, 52, 48, 60, 55, 58, 64.23, 62, 59, 65, 58, 61]

function EmailOpenRateChart() {
  const [hoveredIndex, setHoveredIndex] = useState(6)
  const maxValue = 100

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Average Email Open Rate</h3>

      <div className="mb-4">
        <div className="flex items-baseline gap-2 mb-1">
          <p className="text-3xl font-bold text-gray-900">64,23%</p>
          <div className="flex items-center gap-1 text-green-600">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-semibold">12%</span>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <button 
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white rounded-lg hover:bg-gray-50"
            style={{ border: '1.5px solid #714b67' }}
          >
            January, 2023 - December, 2023
            <ChevronDown className="w-3 h-3" />
          </button>
          <button 
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white rounded-lg hover:bg-gray-50"
            style={{ border: '1.5px solid #714b67' }}
          >
            Month
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>
      </div>

          <div className="relative">
        
        
        <div className="absolute left-0 top-0 bottom-12 flex flex-col justify-between text-xs text-gray-500" style={{ width: '30px' }}>
          <span>100%</span>
          <span>75%</span>
          <span>50%</span>
          <span>25%</span>
          <span>0%</span>
        </div>

        <div className="ml-8">
          <div className="flex items-end justify-between h-48 gap-1 relative">
            {openRateData.map((value, index) => {
              const height = (value / maxValue) * 100
              const isHovered = hoveredIndex === index
              
              return (
                <div
                  key={index}
                  className="flex-1 flex flex-col items-center group cursor-pointer relative h-full"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  
                  {isHovered && (
                    <div 
                      className="absolute bottom-full mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-20 whitespace-nowrap"
                      style={{ left: '50%', transform: 'translateX(-50%)', marginBottom: '8px' }}
                    >
                      <div className="flex items-center gap-1 mb-1">
                        <Calendar className="w-3 h-3" />
                        <span>{months[index]} 2023</span>
                      </div>
                      <div>Open Rate {value.toFixed(2)}%</div>
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                    </div>
                  )}

                  
                  <div className="w-full h-full flex items-end">
                    <div
                      className="w-full rounded-t transition-all duration-200 relative z-0"
                      style={{
                        height: `${height}%`,
                        backgroundColor: isHovered ? '#714b67' : '#9ca3af',
                        minHeight: '8px',
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex justify-between mt-2 text-xs text-gray-500">
            {months.map((month, index) => (
              <span key={index} className="flex-1 text-center">
                {month}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default EmailOpenRateChart

