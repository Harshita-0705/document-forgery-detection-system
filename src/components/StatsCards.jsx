import { useEffect, useState } from 'react'

export default function StatsCards({ report }) {
  const [animatedStats, setAnimatedStats] = useState({
    issues: 0,
    checks: 0,
    confidence: 0
  })

  useEffect(() => {
    // Issues: 0 if authentic (class_id 0), 1 if forgery detected
    // Handle both response formats: class_id (from simple_server) or status (from main.py)
    const classId = report.class_id ?? (report.class_name === 'real' || report.class_name === 'authentic' ? 0 : 1)
    const isAuthentic = classId === 0
    const issues = isAuthentic ? 0 : 1
    
    // Checks: Always 3 (image analysis, edge detection, model inference)
    const checks = 3
    
    // Confidence: Use actual model confidence (not inverted)
    const score = report.score ?? 50
    const modelConfidence = report.confidence ? Math.round(report.confidence * 100) : Math.max(0, 100 - score)

    const animate = (key, target) => {
      let current = 0
      const increment = target / 30
      const timer = setInterval(() => {
        current += increment
        if (current >= target) {
          setAnimatedStats(prev => ({ ...prev, [key]: target }))
          clearInterval(timer)
        } else {
          setAnimatedStats(prev => ({ ...prev, [key]: Math.floor(current) }))
        }
      }, 30)
    }

    animate('issues', issues)
    animate('checks', checks)
    animate('confidence', modelConfidence)

    return () => {
      // Cleanup handled by individual intervals
    }
  }, [report])

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200 transform hover:scale-105 transition-transform">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-blue-600 font-medium mb-1">Issues Detected</p>
            <p className="text-3xl font-bold text-blue-900">{animatedStats.issues}</p>
          </div>
          <div className="bg-blue-200 rounded-full p-3">
            <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200 transform hover:scale-105 transition-transform">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-green-600 font-medium mb-1">Checks Performed</p>
            <p className="text-3xl font-bold text-green-900">{animatedStats.checks}</p>
          </div>
          <div className="bg-green-200 rounded-full p-3">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200 transform hover:scale-105 transition-transform">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-purple-600 font-medium mb-1">Confidence Level</p>
            <p className="text-3xl font-bold text-purple-900">{animatedStats.confidence}%</p>
          </div>
          <div className="bg-purple-200 rounded-full p-3">
            <svg className="w-8 h-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}

