function CompletedTaskCard() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Completed Task</h3>
      </div>
      <div className="mb-4">
        <p className="text-3xl font-bold text-gray-900">21 Task</p>
      </div>
      <button 
        className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white rounded-lg hover:bg-gray-50 transition-colors"
        style={{ border: '1.5px solid #714b67' }}
      >
        View All
      </button>
    </div>
  )
}

export default CompletedTaskCard

