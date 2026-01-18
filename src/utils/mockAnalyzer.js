// Mock analyzer that simulates document analysis
// Uses inline sample reports to avoid import issues

const report1 = {
  score: 87,
  verdict: "High Risk - Significant tampering detected",
  highlights: [
    {
      page: 1,
      bbox: [120, 45, 210, 130],
      reason: "Copied patch (copy-move) detected in signature area"
    },
    {
      page: 1,
      bbox: [400, 300, 500, 380],
      reason: "Signature layer mismatch - inconsistent metadata"
    },
    {
      page: 2,
      bbox: [50, 200, 300, 250],
      reason: "Text manipulation detected - font inconsistency"
    }
  ],
  metadata: {
    author: "Microsoft Word",
    modified: "2025-11-01T12:34:56Z",
    producer: "libreoffice",
    created: "2024-10-15T08:20:30Z",
    creator: "Adobe Acrobat Pro"
  },
  signature: {
    present: true,
    valid: false,
    details: "Certificate not trusted - signature chain validation failed"
  },
  ocr_mismatch: [
    {
      expected: "John Doe",
      found: "J0hn Doe",
      confidence: 0.23,
      page: 1
    },
    {
      expected: "2024-10-15",
      found: "2024-1O-15",
      confidence: 0.15,
      page: 1
    }
  ]
}

const report2 = {
  score: 42,
  verdict: "Medium Risk - Some inconsistencies detected",
  highlights: [
    {
      page: 1,
      bbox: [150, 100, 250, 180],
      reason: "Metadata timestamp mismatch"
    },
    {
      page: 1,
      bbox: [300, 400, 450, 480],
      reason: "Slight font variation detected"
    }
  ],
  metadata: {
    author: "Google Docs",
    modified: "2025-01-15T14:22:10Z",
    producer: "Google",
    created: "2025-01-10T09:15:45Z",
    creator: "Google Docs"
  },
  signature: {
    present: true,
    valid: true,
    details: "Valid digital signature with trusted certificate"
  },
  ocr_mismatch: [
    {
      expected: "Contract Date",
      found: "Contract D@te",
      confidence: 0.65,
      page: 1
    }
  ]
}

export function mockAnalyze(file, useSample = false) {
  // Simulate random selection between two mock reports
  const reports = [report1, report2]
  const selectedReport = reports[Math.floor(Math.random() * reports.length)]
  
  // Deep clone to avoid mutating the original
  const randomizedReport = JSON.parse(JSON.stringify(selectedReport))
  
  // Add some randomization to make it feel more dynamic
  randomizedReport.score = selectedReport.score + Math.floor(Math.random() * 10) - 5 // ±5 variation
  
  // Ensure score stays within bounds
  randomizedReport.score = Math.max(0, Math.min(100, randomizedReport.score))
  
  // Update verdict based on score
  if (randomizedReport.score < 30) {
    randomizedReport.verdict = 'Low Risk - Document appears authentic'
  } else if (randomizedReport.score < 70) {
    randomizedReport.verdict = 'Medium Risk - Some inconsistencies detected'
  } else {
    randomizedReport.verdict = 'High Risk - Significant tampering detected'
  }
  
  return randomizedReport
}

