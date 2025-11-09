export default function VendorBillBulkActions({ selectedCount, onBulkConfirm, onBulkCancel }) {
  if (selectedCount === 0) return null

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-blue-900">
          {selectedCount} bill{selectedCount !== 1 ? 's' : ''} selected
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onBulkConfirm}
          className="px-3 py-1.5 text-sm font-medium text-white rounded-lg hover:opacity-90"
          style={{ backgroundColor: '#714b67' }}
        >
          Post
        </button>
        <button
          onClick={onBulkCancel}
          className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

