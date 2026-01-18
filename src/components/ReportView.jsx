import { useState } from 'react'
import RiskGauge from './RiskGauge'
import DocumentPreview from './DocumentPreview'
import StatsCards from './StatsCards'

export default function ReportView({ report, uploadedFile }) {
  const [showFullReport, setShowFullReport] = useState(false)

  const getRiskBadge = (score) => {
    if (score < 30) {
      return { label: 'Low Risk', color: 'bg-green-100 text-green-800' }
    } else if (score < 70) {
      return { label: 'Medium Risk', color: 'bg-yellow-100 text-yellow-800' }
    } else {
      return { label: 'High Risk', color: 'bg-red-100 text-red-800' }
    }
  }

  // Handle missing score field
  const score = report.score ?? 50
  const riskBadge = getRiskBadge(score)

  const downloadReport = () => {
    const dataStr = JSON.stringify(report, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `forgery-report-${Date.now()}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 max-w-4xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Analysis Report</h2>
        <button
          onClick={downloadReport}
          className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-all transform hover:scale-105 shadow-lg text-sm font-medium"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span>Download Report</span>
        </button>
      </div>

      {/* Stats Cards */}
      <StatsCards report={report} />

      {/* Risk Score with Gauge */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-8 mb-6 border border-gray-200">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Risk Assessment</h3>
            <p className="text-gray-600 mb-4">Overall document authenticity assessment</p>
            <div className="flex items-center space-x-4">
              <span className={`px-6 py-3 rounded-full text-base font-semibold shadow-md ${riskBadge.color}`}>
                {riskBadge.label}
              </span>
              <div className="text-4xl font-bold text-gray-900">{score}/100</div>
            </div>
            <div className="mt-4 w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-1000 ${
                  score < 30 ? 'bg-green-500' : score < 70 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${score}%` }}
              ></div>
            </div>
          </div>
          <div className="flex-shrink-0">
            <RiskGauge score={score} />
          </div>
        </div>
      </div>

      {/* Grad-CAM Heatmap Visualization */}
      {report.gradcam && (
        <div className="mb-6">
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-purple-200 rounded-full p-3">
                <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-purple-900">Grad-CAM Analysis</h3>
                <p className="text-sm text-purple-700">AI attention heatmap showing focus areas</p>
              </div>
            </div>
            
            <p className="text-sm text-purple-800 mb-4">
              Red/yellow regions indicate areas the AI model focused on when making its decision. 
              Brighter colors show higher attention.
            </p>
            
            <div className="bg-white rounded-lg p-4 shadow-inner">
              <img
                src={`data:image/png;base64,${report.gradcam}`}
                alt="Grad-CAM Heatmap Overlay"
                className="w-full max-w-2xl mx-auto rounded-lg shadow-lg border-4 border-white transform hover:scale-105 transition-transform duration-300"
              />
            </div>
            
            <div className="mt-4 flex items-center justify-center space-x-4 text-xs text-purple-700">
              <div className="flex items-center space-x-1">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span>High attention</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-4 h-4 bg-yellow-400 rounded"></div>
                <span>Medium</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-4 h-4 bg-blue-400 rounded"></div>
                <span>Low</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document Preview with Highlights */}
      {report.highlights && report.highlights.length > 0 && (
        <div className="mb-6">
          <DocumentPreview highlights={report.highlights} uploadedFile={uploadedFile} />
        </div>
      )}

      {/* Verdict */}
      {report.verdict && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Verdict</h3>
          <div className={`p-4 rounded-lg border-2 ${
            score < 30 ? 'border-green-200 bg-green-50' :
            score < 70 ? 'border-yellow-200 bg-yellow-50' :
            'border-red-200 bg-red-50'
          }`}>
            <p className="font-medium text-gray-900">{report.verdict}</p>
          </div>
        </div>
      )}



      {/* Highlights */}
      {report.highlights && report.highlights.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Detected Issues</h3>
          <div className="space-y-3">
            {report.highlights.map((highlight, index) => (
              <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-red-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-medium text-red-900">Page {highlight.page}</p>
                    <p className="text-sm text-red-700 mt-1">{highlight.reason}</p>
                    {highlight.bbox && (
                      <p className="text-xs text-red-600 mt-1">
                        Location: [{highlight.bbox.join(', ')}]
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}



      {/* Signature */}
      {report.signature && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Digital Signature</h3>
          <div className={`p-4 rounded-lg border-2 ${
            report.signature.valid
              ? 'border-green-200 bg-green-50'
              : 'border-red-200 bg-red-50'
          }`}>
            <div className="flex items-center space-x-2 mb-2">
              {report.signature.valid ? (
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              <span className={`font-medium ${
                report.signature.valid ? 'text-green-900' : 'text-red-900'
              }`}>
                {report.signature.valid ? 'Valid Signature' : 'Invalid Signature'}
              </span>
            </div>
            {report.signature.details && (
              <p className="text-sm text-gray-700">{report.signature.details}</p>
            )}
          </div>
        </div>
      )}

      {/* OCR Mismatch */}
      {report.ocr_mismatch && report.ocr_mismatch.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">OCR Mismatches</h3>
          <div className="space-y-2">
            {report.ocr_mismatch.map((mismatch, index) => (
              <div key={index} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-gray-600">Expected: </span>
                    <span className="text-sm font-medium text-gray-900">{mismatch.expected}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Found: </span>
                    <span className="text-sm font-medium text-red-600">{mismatch.found}</span>
                  </div>
                </div>
                <div className="mt-1">
                  <span className="text-xs text-gray-500">Confidence: </span>
                  <span className="text-xs font-medium text-gray-700">
                    {(mismatch.confidence * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 pt-6 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          {report.images_analyzed 
            ? `Analysis completed using ${report.images_analyzed} image(s) from your document.`
            : 'Analysis report generated by backend API.'}
        </p>
      </div>
    </div>
  )
}

