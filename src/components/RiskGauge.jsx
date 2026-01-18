import { useEffect, useState } from 'react'

export default function RiskGauge({ score }) {
  const [animatedScore, setAnimatedScore] = useState(0)

  useEffect(() => {
    const duration = 1500
    const steps = 60
    const increment = score / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= score) {
        setAnimatedScore(score)
        clearInterval(timer)
      } else {
        setAnimatedScore(Math.floor(current))
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [score])

  const getColor = () => {
    if (score < 30) return '#10b981' // green
    if (score < 70) return '#f59e0b' // yellow
    return '#ef4444' // red
  }

  const circumference = 2 * Math.PI * 90
  const offset = circumference - (animatedScore / 100) * circumference

  return (
    <div className="relative w-48 h-48 mx-auto">
      <svg className="transform -rotate-90 w-48 h-48">
        <circle
          cx="96"
          cy="96"
          r="90"
          stroke="currentColor"
          strokeWidth="12"
          fill="transparent"
          className="text-gray-200"
        />
        <circle
          cx="96"
          cy="96"
          r="90"
          stroke={getColor()}
          strokeWidth="12"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-bold" style={{ color: getColor() }}>
          {animatedScore}
        </span>
        <span className="text-sm text-gray-500 mt-1">Risk Score</span>
      </div>
    </div>
  )
}

