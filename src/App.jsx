import { useState } from 'react'
import Header from './components/Header'
import Hero from './components/Hero'
import HowItWorks from './components/HowItWorks'
import Features from './components/Features'
import UploadCard from './components/UploadCard'
import ReportView from './components/ReportView'
import SecurityPrivacy from './components/SecurityPrivacy'
import Footer from './components/Footer'
import DemoModal from './components/DemoModal'
import Confetti from './components/Confetti'
import { config } from './config'   // ✅ backend URL

function App() {
  const [report, setReport] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [uploadedFile, setUploadedFile] = useState(null)
  const [showDemoModal, setShowDemoModal] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [error, setError] = useState(null)

  // ✅ REAL BACKEND CALL
  const handleFileUpload = async (file) => {
    setUploadedFile(file)
    setIsAnalyzing(true)
    setReport(null)
    setError(null)

    try {
      const fd = new FormData()
      fd.append("file", file)

      const endpoint = config?.API_ENDPOINT ?? "http://127.0.0.1:8001/predict"
      console.log("Uploading to backend:", endpoint)

      const res = await fetch(endpoint, {
        method: "POST",
        body: fd,
      })

      if (!res.ok) {
        const t = await res.text().catch(() => "")
        throw new Error(`Server returned ${res.status}: ${t}`)
      }

      const data = await res.json()
      console.log("Backend response:", data)

      // Map inference API response to frontend format
      const pred = data.prediction || data.result
      
      // Handle both response formats: simple_server.py (prediction) and main.py (result)
      let reportData
      if (data.prediction) {
        // Format from simple_server.py
        reportData = {
          // Convert confidence to risk score (higher confidence in forgery = higher risk)
          score: pred.class_id === 0 ? 10 : Math.round((1 - pred.confidence) * 100 + 50),
          verdict: `Detected as "${pred.class_name}" with ${(pred.confidence * 100).toFixed(1)}% confidence.`,
          confidence: pred.confidence,
          class_name: pred.class_name,
          class_id: pred.class_id,
          scores: pred.scores || [],
          
          // Add Grad-CAM
          gradcam: data.gradcam,
          gradcam_shape: data.gradcam_shape,
          
          // Keep existing fields for compatibility
          highlights: [],
          metadata: { author: "N/A", producer: "N/A", modified: null },
          signature: null,
          ocr_mismatch: [],
          images_analyzed: 1
        }
      } else if (data.result) {
        // Format from main.py
        reportData = {
          score: data.result.score || 50,
          verdict: data.result.verdict || "Analysis completed",
          confidence: data.result.confidence || 0.5,
          class_name: data.result.status || "unknown",
          class_id: 0,
          scores: [],
          
          highlights: data.result.highlights || [],
          metadata: data.result.metadata || { author: "N/A", producer: "N/A", modified: null },
          signature: data.result.signature || null,
          ocr_mismatch: data.result.ocr_mismatch || [],
          images_analyzed: data.result.images_analyzed || 1
        }
      } else {
        throw new Error("Unexpected response format from backend")
      }

      console.log("Mapped report data:", reportData)
      setReport(reportData)
      setIsAnalyzing(false)
      setShowConfetti(true)

      setTimeout(() => setShowConfetti(false), 3000)

    } catch (err) {
      console.error("Backend error:", err)
      setError(err.message)
      setIsAnalyzing(false)
    }
  }



  return (
    <div className="min-h-screen bg-white">
      <Header 
        onStartFree={() => window.scrollTo({ top: document.getElementById('upload-section')?.offsetTop - 80, behavior: 'smooth' })}
        onBookDemo={() => setShowDemoModal(true)}
      />

      <Hero 
        onStartFree={() => window.scrollTo({ top: document.getElementById('upload-section')?.offsetTop - 80, behavior: 'smooth' })} 
        onBookDemo={() => setShowDemoModal(true)} 
      />

      <HowItWorks />
      <Features />

      <div id="upload-section" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <UploadCard 
            onFileUpload={handleFileUpload}
            isAnalyzing={isAnalyzing}
            uploadedFile={uploadedFile}
          />

          {report && (
            <div className="mt-8 animate-fade-in">
              <ReportView report={report} uploadedFile={uploadedFile} error={error} />
            </div>
          )}

          {error && (
            <div className="text-red-600 text-center mt-6 font-semibold">
              Backend Error: {error}
            </div>
          )}
        </div>
      </div>

      <SecurityPrivacy />
      <Footer onBookDemo={() => setShowDemoModal(true)} />

      {showDemoModal && <DemoModal onClose={() => setShowDemoModal(false)} />}
      <Confetti show={showConfetti} />
    </div>
  )
}

export default App
