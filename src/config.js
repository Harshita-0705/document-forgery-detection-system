// Configuration file for API endpoint
// To enable live API: edit API_ENDPOINT below and toggle "Enable live API (dev only)" in the app header
// src/config.js
export const config = {
  API_ENDPOINT: "http://127.0.0.1:8000/predict",  
  API_KEY: null,
}


// Example usage (commented out - do NOT execute by default):
// Sending file to server: frontend action
/*
async function analyzeDocument(file) {
  if (!config.API_ENDPOINT) {
    // Use mock analyzer
    return mockAnalyze(file);
  }
  
  const form = new FormData();
  form.append('file', file);
  
  const response = await fetch(config.API_ENDPOINT, {
    method: 'POST',
    body: form,
    headers: {
      ...(config.API_KEY && { 'Authorization': `Bearer ${config.API_KEY}` })
    }
  });
  
  if (!response.ok) {
    throw new Error('Analysis failed');
  }
  
  return await response.json();
}
*/

