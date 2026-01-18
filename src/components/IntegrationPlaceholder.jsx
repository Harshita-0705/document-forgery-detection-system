import { useState } from 'react'

export default function IntegrationPlaceholder({ apiEnabled }) {
  const [codeExpanded, setCodeExpanded] = useState(false)

  const exampleCode = `// Example (placeholder) — do NOT execute by default:
// Sending file to server: frontend action
/*
const form = new FormData();
form.append('file', fileInput.files[0]);
fetch('https://yourserver.com/api/analyze', {
  method: 'POST',
  body: form,
  headers: {
    // 'Authorization': 'Bearer <YOUR_TOKEN>'  // set in server config
  }
}).then(r => r.json()).then(report => console.log(report));
*/`

  return (
    <section className="py-16 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-8">
          <div className="flex items-start space-x-4 mb-6">
            <svg className="w-8 h-8 text-yellow-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Integration (Coming Soon)</h2>
              <p className="text-gray-700 mb-4">
                API integration is not yet available. The current demo uses local mock analysis. 
                When the API is ready, you'll be able to integrate using the code snippet below.
              </p>
            </div>
          </div>

          {apiEnabled && (
            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-2">
                <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-semibold text-red-900">Warning: Live API Mode Enabled</p>
                  <p className="text-sm text-red-700 mt-1">
                    Enabling will send files to the configured server — do not enable on public networks.
                    This feature is for development only.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-gray-900 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Example API Integration Code</span>
              <button
                onClick={() => setCodeExpanded(!codeExpanded)}
                className="text-gray-400 hover:text-gray-300 text-sm"
              >
                {codeExpanded ? 'Collapse' : 'Expand'}
              </button>
            </div>
            {codeExpanded && (
              <pre className="text-green-400 text-xs overflow-x-auto">
                <code>{exampleCode}</code>
              </pre>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>To enable live API:</strong> Edit <code className="bg-blue-100 px-1 rounded">config.API_ENDPOINT</code> in <code className="bg-blue-100 px-1 rounded">src/config.js</code> and toggle "Enable live API (dev only)" in the app header.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

