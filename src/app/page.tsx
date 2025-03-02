export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-4xl mx-auto border border-primary/20 rounded-lg p-8 bg-card/50">
        <h1 className="text-4xl font-bold text-primary mb-6 text-center">
          BlockSwarms - Deployment Test
        </h1>
        
        <div className="mb-8 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
          <p className="text-emerald-400 font-medium">
            ✅ Home page is loading successfully!
          </p>
          <p className="text-emerald-400/70 text-sm mt-2">
            Last Updated: {new Date().toISOString()}
          </p>
        </div>
        
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-primary mb-4">Navigation Links</h2>
          <div className="grid grid-cols-2 gap-4">
            <a href="/" className="block p-4 bg-primary/10 border border-primary/20 rounded-lg hover:bg-primary/20 text-center">
              Home
            </a>
            <a href="/dashboard" className="block p-4 bg-primary/10 border border-primary/20 rounded-lg hover:bg-primary/20 text-center">
              Dashboard
            </a>
            <a href="/login" className="block p-4 bg-primary/10 border border-primary/20 rounded-lg hover:bg-primary/20 text-center">
              Login
            </a>
            <a href="/signup" className="block p-4 bg-primary/10 border border-primary/20 rounded-lg hover:bg-primary/20 text-center">
              Sign Up
            </a>
            <a href="/ai-chat" className="block p-4 bg-primary/10 border border-primary/20 rounded-lg hover:bg-primary/20 text-center">
              AI Chat
            </a>
            <a href="/api/health" className="block p-4 bg-primary/10 border border-primary/20 rounded-lg hover:bg-primary/20 text-center">
              API Health Check
            </a>
          </div>
        </div>
        
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-primary mb-4">Troubleshooting Information</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Next.js Version: 15.0.0</li>
            <li>React Version: 18.2.0</li>
            <li>Node Environment: {process.env.NODE_ENV || 'Not detected'}</li>
            <li>Middleware Status: Updated with diagnostics</li>
            <li>Deployment Platform: Vercel</li>
            <li>Vercel Config: Updated with rewrites and fixes</li>
            <li>Build Output: .next directory</li>
            <li>Static File Status: Verified</li>
          </ul>
        </div>

        <div className="py-4 text-center text-sm text-primary/60 border-t border-primary/10 mt-8">
          BlockSwarms Deployment Test Page
        </div>
      </div>
    </div>
  );
}