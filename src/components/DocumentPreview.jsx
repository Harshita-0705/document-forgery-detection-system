export default function DocumentPreview({ highlights, uploadedFile }) {
  return (
    <div className="relative bg-white rounded-lg border-2 border-gray-200 p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Document Preview</h3>
        <span className="text-sm text-gray-500">{uploadedFile?.name || 'Sample Document'}</span>
      </div>
      
      {/* Mock document with highlighted regions */}
      <div className="relative bg-gray-50 rounded-lg p-8 min-h-[400px] border border-gray-200">
        {/* Mock document content */}
        <div className="space-y-4">
          <div className="h-8 bg-gray-300 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-20 bg-gray-200 rounded w-full mt-4"></div>
        </div>

        {/* Highlighted tampered regions */}
        {highlights && highlights.map((highlight, index) => {
          const [x, y, width, height] = highlight.bbox || [0, 0, 100, 50]
          return (
            <div
              key={index}
              className="absolute border-2 border-red-500 bg-red-500 bg-opacity-20 rounded animate-pulse"
              style={{
                left: `${x / 6}px`,
                top: `${y / 2}px`,
                width: `${(width - x) / 6}px`,
                height: `${(height - y) / 2}px`,
              }}
            >
              <div className="absolute -top-6 left-0 bg-red-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                Issue #{index + 1}
              </div>
            </div>
          )
        })}
      </div>

      {highlights && highlights.length > 0 && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">
            <strong>{highlights.length}</strong> tampered region{highlights.length > 1 ? 's' : ''} detected
          </p>
        </div>
      )}
    </div>
  )
}

