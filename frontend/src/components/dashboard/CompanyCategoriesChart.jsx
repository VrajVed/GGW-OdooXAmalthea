import { useState } from 'react'

const categories = [
  { name: 'Agency', value: 120, color: '#1f2937' },
  { name: 'Marketing', value: 85, color: '#374151' },
  { name: 'Communication', value: 65, color: '#4b5563' },
  { name: 'Web Development', value: 45, color: '#6b7280' },
  { name: 'Travel', value: 26, color: '#9ca3af' },
]

const total = categories.reduce((sum, cat) => sum + cat.value, 0)

function CompanyCategoriesChart() {
  const [hoveredIndex, setHoveredIndex] = useState(null)

  const getPathData = (value, startAngle) => {
    const percentage = value / total
    const angle = percentage * 360
    const endAngle = startAngle + angle

    const innerRadius = 40
    const outerRadius = 60
    const centerX = 80
    const centerY = 80

    const startAngleRad = (startAngle - 90) * (Math.PI / 180)
    const endAngleRad = (endAngle - 90) * (Math.PI / 180)

    const x1 = centerX + innerRadius * Math.cos(startAngleRad)
    const y1 = centerY + innerRadius * Math.sin(startAngleRad)
    const x2 = centerX + innerRadius * Math.cos(endAngleRad)
    const y2 = centerY + innerRadius * Math.sin(endAngleRad)
    const x3 = centerX + outerRadius * Math.cos(endAngleRad)
    const y3 = centerY + outerRadius * Math.sin(endAngleRad)
    const x4 = centerX + outerRadius * Math.cos(startAngleRad)
    const y4 = centerY + outerRadius * Math.sin(startAngleRad)

    const largeArcFlag = angle > 180 ? 1 : 0

    return [
      `M ${x1} ${y1}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      `L ${x3} ${y3}`,
      `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}`,
      'Z'
    ].join(' ')
  }

  let currentAngle = 0
  const paths = categories.map((category) => {
    const startAngle = currentAngle
    const pathData = getPathData(category.value, startAngle)
    currentAngle += (category.value / total) * 360
    return { pathData, category }
  })

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-6">Company Categories</h3>
      
      <div className="flex items-center justify-center">
        <div className="relative">
          <svg width="160" height="160" viewBox="0 0 160 160">
            {paths.map((item, index) => {
              const isHovered = hoveredIndex === index
              
              return (
                <path
                  key={index}
                  d={item.pathData}
                  fill={isHovered ? '#714b67' : item.category.color}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="cursor-pointer transition-all duration-200"
                  style={{
                    opacity: hoveredIndex !== null && hoveredIndex !== index ? 0.5 : 1,
                  }}
                />
              )
            })}
          </svg>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
            <p className="text-2xl font-bold text-gray-900">{total}</p>
            <p className="text-xs text-gray-500">Companies</p>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 space-y-2">
        {paths.map((item, index) => {
          const isHovered = hoveredIndex === index
          const category = item.category
          return (
            <div
              key={index}
              className="flex items-center justify-between p-2 rounded hover:bg-gray-50 cursor-pointer transition-colors"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: isHovered ? '#714b67' : category.color,
                  }}
                />
                <span className="text-sm text-gray-700">{category.name}</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{category.value}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default CompanyCategoriesChart

