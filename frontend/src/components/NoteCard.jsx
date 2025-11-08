const badgeColors = {
  Weekly: "bg-gray-100 text-gray-700",
  Monthly: "bg-gray-100 text-gray-700",
  Product: "bg-gray-100 text-gray-700",
  Business: "bg-gray-100 text-gray-700",
  Personal: "bg-gray-100 text-gray-700",
}

function NoteCard({ note }) {
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

  const renderImage = () => {
    if (!note.image) return null

    if (note.image === "document") {
      return (
        <div className="mt-3 rounded-lg overflow-hidden bg-gray-100 h-32 flex items-center justify-center">
          <div className="text-center">
            <svg className="w-12 h-12 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-xs text-gray-500">Document</p>
          </div>
        </div>
      )
    }

    if (note.image === "chart") {
      return (
        <div className="mt-3 rounded-lg overflow-hidden bg-gray-100 h-32 flex items-center justify-center">
          <div className="w-full h-full p-4">
            <div className="flex items-end justify-between h-full gap-2">
              {[40, 60, 45, 80, 55, 70, 90].map((height, i) => (
                <div
                  key={i}
                  className="flex-1 bg-gray-600 rounded-t"
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
          </div>
        </div>
      )
    }

    if (note.image === "products") {
      return (
        <div className="mt-3 rounded-lg overflow-hidden bg-gray-100 h-32 flex items-center justify-center">
          <div className="grid grid-cols-3 gap-2 p-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="w-full h-12 bg-white rounded border border-gray-200" />
            ))}
          </div>
        </div>
      )
    }

    return null
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow cursor-pointer shadow-sm">
      {/* Badges */}
      <div className="flex flex-wrap gap-2 mb-3">
        {note.badges.map((badge) => (
          <span
            key={badge}
            className={`px-2.5 py-1 rounded-full text-xs font-medium ${
              badgeColors[badge] || "bg-gray-100 text-gray-700"
            }`}
          >
            {badge}
          </span>
        ))}
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {note.title}
      </h3>

      {/* Description */}
      {note.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-3">
          {note.description}
        </p>
      )}

      {/* Image */}
      {renderImage()}

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 ${getAvatarColor(note.user.name)} rounded-full flex items-center justify-center`}>
            <span className="text-xs font-semibold text-white">
              {getInitials(note.user.name)}
            </span>
          </div>
          <span className="text-sm text-gray-600">{note.user.name}</span>
        </div>
        <span className="text-xs text-gray-500">{note.date}</span>
      </div>
    </div>
  )
}

export default NoteCard

