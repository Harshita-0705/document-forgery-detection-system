export default function FraudLab({ onContact }) {
  return (
    <section id="fraud-lab" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Fraud Lab</h2>
            <p className="text-gray-700 mb-6 leading-relaxed">
              Our research lab continuously tracks emerging fraud trends and updates detection models 
              to stay ahead of sophisticated forgery techniques. We maintain an extensive database of 
              known fraud patterns and templates, ensuring our AI-powered system can identify even the 
              most advanced document manipulation attempts.
            </p>
            <p className="text-gray-700 mb-8 leading-relaxed">
              The Fraud Lab team regularly publishes research briefings on document fraud trends, 
              detection methodologies, and security best practices. Contact us to request access to 
              our latest research findings or to discuss your specific document verification needs.
            </p>
            <button
              onClick={onContact}
              className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              Contact our Fraud Lab / Request research briefing
            </button>
          </div>
          <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-8">
            <div className="space-y-6">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="bg-primary-100 w-10 h-10 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900">Active Research</h3>
                </div>
                <p className="text-sm text-gray-600">Continuous monitoring of fraud patterns</p>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="bg-primary-100 w-10 h-10 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900">Model Updates</h3>
                </div>
                <p className="text-sm text-gray-600">Regular updates to detection algorithms</p>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="bg-primary-100 w-10 h-10 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900">Template Database</h3>
                </div>
                <p className="text-sm text-gray-600">Extensive library of known fraud patterns</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

