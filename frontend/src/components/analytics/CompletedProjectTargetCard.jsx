const weekData = [
  { day: 'Sun', target: 100, completed: 75 },
  { day: 'Mon', target: 100, completed: 85 },
  { day: 'Tue', target: 100, completed: 60 },
  { day: 'Wed', target: 100, completed: 90 },
  { day: 'Thu', target: 100, completed: 70 },
  { day: 'Fri', target: 100, completed: 80 },
  { day: 'Sat', target: 100, completed: 65 },
]

function CompletedProjectTargetCard() {
  const maxHeight = 120

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-6">Completed Project Target This Week</h3>
      
  <div className="flex items-end justify-between gap-2 h-32">
        {weekData.map((data, index) => {
          const targetHeight = (data.target / 100) * maxHeight
          const completedHeight = (data.completed / 100) * maxHeight
          
          return (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div className="relative w-full flex flex-col items-center justify-end" style={{ height: `${maxHeight}px` }}>
                <div
                  className="w-full bg-gray-200 rounded-t"
                  style={{ height: `${targetHeight}px` }}
                />
                <div
                  className="absolute w-full bg-gray-900 rounded-t bottom-0"
                  style={{ height: `${completedHeight}px` }}
                />
              </div>
              <span className="text-xs text-gray-500 mt-2">{data.day}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default CompletedProjectTargetCard

