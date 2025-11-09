const agendaItems = [
  {
    time: '11:00 - 12:00',
    date: 'Feb 2, 2019',
    title: 'Meeting with Client',
    description: 'This monthly progress agenda',
  },
  {
    time: '11:00 - 12:00',
    date: 'Feb 2, 2019',
    title: 'Meeting with Client',
    description: 'This monthly progress agenda',
  },
  {
    time: '11:00 - 12:00',
    date: 'Feb 2, 2019',
    title: 'Meeting with Client',
    description: 'This monthly progress agenda',
  },
  {
    time: '11:00 - 12:00',
    date: 'Feb 2, 2019',
    title: 'Meeting with Client',
    description: 'This monthly progress agenda',
  },
]

function UpcomingAgenda() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Upcoming Agenda</h3>
      <div className="space-y-0">
        {agendaItems.map((item, index) => (
          <div
            key={index}
            className={`py-4 ${index !== agendaItems.length - 1 ? 'border-b border-gray-200' : ''}`}
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <p className="text-sm font-medium" style={{ color: '#714b67' }}>
                  {item.time}
                </p>
                <p className="text-xs text-gray-500 mt-1">{item.date}</p>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{item.title}</p>
                <p className="text-xs text-gray-500 mt-1">{item.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default UpcomingAgenda

