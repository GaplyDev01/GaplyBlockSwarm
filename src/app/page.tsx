export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-12">
        <header className="flex justify-between items-center mb-16">
          <div className="text-primary font-bold text-2xl">BlockSwarms</div>
          <nav className="space-x-6 hidden md:block">
            <a href="/" className="text-foreground hover:text-primary">Home</a>
            <a href="/dashboard" className="text-foreground hover:text-primary">Dashboard</a>
            <a href="/login" className="text-foreground hover:text-primary">Login</a>
            <a href="/signup" className="bg-primary text-white px-4 py-2 rounded-md hover:brightness-110">Sign Up</a>
            <a href="/ai-chat" className="text-foreground hover:text-primary">AI Chat</a>
          </nav>
        </header>
        
        <main>
          <section className="py-20">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-5xl md:text-6xl font-bold text-primary mb-6">
                AI-Powered <span className="text-foreground">Solana</span> Trading
              </h1>
              <p className="text-lg md:text-xl mb-10 max-w-2xl mx-auto">
                Harness the power of advanced AI to analyze Solana tokens, predict market movements,
                and optimize your trading strategies.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <a href="/dashboard" className="bg-primary text-white px-6 py-3 rounded-md hover:brightness-110 flex items-center justify-center gap-2 font-bold">
                  ENTER PLATFORM →
                </a>
                <a href="/ai-chat" className="border border-primary text-primary px-6 py-3 rounded-md hover:bg-primary/10 flex items-center justify-center gap-2 font-bold">
                  AI CHAT
                </a>
              </div>
            </div>
          </section>
          
          <section className="py-20">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-3xl font-bold text-primary text-center mb-12">
                POWERED BY AI, DESIGNED FOR TRADERS
              </h2>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="bg-card/50 border border-primary/20 rounded-lg p-6 hover:border-primary/40 transition-all">
                  <h3 className="text-xl font-bold text-primary mb-3">
                    Token Analysis
                  </h3>
                  <p className="text-foreground/70">
                    Get in-depth analysis on any token with price predictions, technical indicators, and sentiment analysis.
                  </p>
                </div>
                <div className="bg-card/50 border border-primary/20 rounded-lg p-6 hover:border-primary/40 transition-all">
                  <h3 className="text-xl font-bold text-primary mb-3">
                    Trading Signals
                  </h3>
                  <p className="text-foreground/70">
                    Receive precise buy, sell, and hold signals with entry and exit points based on multiple time frames.
                  </p>
                </div>
                <div className="bg-card/50 border border-primary/20 rounded-lg p-6 hover:border-primary/40 transition-all">
                  <h3 className="text-xl font-bold text-primary mb-3">
                    AI Chat
                  </h3>
                  <p className="text-foreground/70">
                    Chat directly with specialized AI models for token analysis, market insights, and trading recommendations.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </main>
        
        <footer className="mt-20 border-t border-border pt-8 pb-16">
          <div className="text-center">
            <div className="text-primary font-bold text-xl mb-4">BlockSwarms</div>
            <p className="text-sm text-foreground/60">
              &copy; 2025 BlockSwarms. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}