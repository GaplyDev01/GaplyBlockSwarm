// This page doesn't use any client-side features, so no need for 'use client'
// Using a simple static page for Vercel deployment testing

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-emerald-400 flex flex-col">
      {/* Header */}
      <header className="border-b border-emerald-500/20 backdrop-blur-sm p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="text-2xl font-bold text-emerald-400">BlockSwarms</div>
          <nav className="hidden md:flex space-x-6">
            <a href="/" className="text-emerald-400 hover:text-emerald-300">Home</a>
            <a href="/api/health" className="text-emerald-400 hover:text-emerald-300">API Status</a>
          </nav>
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-grow container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Hero section */}
          <section className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold text-emerald-400 mb-6">
              AI-Powered <span className="text-white">Solana</span> Trading
            </h1>
            <p className="text-lg md:text-xl mb-8 text-emerald-300/80">
              Harness the power of advanced AI to analyze Solana tokens, predict market movements,
              and optimize your trading strategies.
            </p>
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 inline-block">
              <p className="text-emerald-400">
                ✅ Deployment test successful
              </p>
              <p className="text-emerald-400/70 text-sm mt-2">
                Last Updated: {new Date().toISOString()}
              </p>
            </div>
          </section>
          
          {/* Feature boxes */}
          <section className="grid md:grid-cols-3 gap-6 mb-16">
            <div className="bg-emerald-900/20 backdrop-blur-sm border border-emerald-500/20 rounded-lg p-6">
              <h3 className="text-xl font-bold text-emerald-400 mb-3">Token Analysis</h3>
              <p className="text-emerald-300/70">
                Get in-depth analysis on any Solana token with price predictions and technical indicators.
              </p>
            </div>
            <div className="bg-emerald-900/20 backdrop-blur-sm border border-emerald-500/20 rounded-lg p-6">
              <h3 className="text-xl font-bold text-emerald-400 mb-3">Trading Signals</h3>
              <p className="text-emerald-300/70">
                Receive precise buy, sell, and hold signals with entry and exit points.
              </p>
            </div>
            <div className="bg-emerald-900/20 backdrop-blur-sm border border-emerald-500/20 rounded-lg p-6">
              <h3 className="text-xl font-bold text-emerald-400 mb-3">AI Chat</h3>
              <p className="text-emerald-300/70">
                Chat directly with AI models for token analysis and market insights.
              </p>
            </div>
          </section>
          
          {/* Deployment info */}
          <section className="bg-black/50 border border-emerald-500/20 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-emerald-400 mb-4">Deployment Status</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-semibold text-emerald-400 mb-2">System Info</h3>
                <ul className="space-y-1 text-emerald-300/70">
                  <li>Next.js Version: 15.0.0</li>
                  <li>React Version: 18.2.0</li>
                  <li>Environment: {process.env.NODE_ENV || 'development'}</li>
                  <li>Platform: Vercel</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-emerald-400 mb-2">Navigation</h3>
                <div className="grid grid-cols-2 gap-2">
                  <a href="/" className="text-emerald-400 hover:text-emerald-300 border border-emerald-500/20 rounded p-2 text-center">
                    Home
                  </a>
                  <a href="/api/health" className="text-emerald-400 hover:text-emerald-300 border border-emerald-500/20 rounded p-2 text-center">
                    API Health
                  </a>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="border-t border-emerald-500/20 py-6">
        <div className="container mx-auto px-4 text-center">
          <p className="text-emerald-400/60">
            &copy; {new Date().getFullYear()} BlockSwarms. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}