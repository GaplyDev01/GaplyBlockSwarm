'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { JoinModal } from './JoinModal';

export default function HomePage() {
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isErrorFixed, setIsErrorFixed] = useState(false);
  
  // Add function to check URL for demo mode
  const isDemoMode = typeof window !== 'undefined' && 
    new URLSearchParams(window.location.search).get('demo') === 'true';

  return (    <div className="min-h-screen bg-background text-foreground">
      {/* Demo Mode & Error Fixing Banner */}
      {!isErrorFixed && (    <div className="bg-amber-500/20 border-b border-amber-500/30 text-amber-200 py-3 px-4">    
        <div className="container mx-auto">    
        <div className="flex flex-col md:flex-row justify-between items-center gap-3">    
        <div className="flex items-center">    
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">    
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>    <line x1="12" y1="9" x2="12" y2="13"></line>    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>    <span className="font-medium">If you're experiencing client-side errors, try these options:</span>
              </div>    <div className="flex flex-wrap gap-2">    
        <Link href="/?static=true" className="text-xs bg-amber-500/30 hover:bg-amber-500/40 text-amber-100 px-3 py-1 rounded-md">
                  Static Version
                </Link>    <Link href="/dashboard?demo=true" className="text-xs bg-amber-500/30 hover:bg-amber-500/40 text-amber-100 px-3 py-1 rounded-md">
                  Dashboard Demo
                </Link>    <Link href="/ai-chat?demo=true" className="text-xs bg-amber-500/30 hover:bg-amber-500/40 text-amber-100 px-3 py-1 rounded-md">
                  AI Chat Demo
                </Link>    <button onClick={() => setIsErrorFixed(true)} className="text-xs bg-emerald-500/30 hover:bg-emerald-500/40 text-emerald-100 px-3 py-1 rounded-md">
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}    <div className="container mx-auto px-4 py-12">    
        <header className="flex justify-between items-center mb-16">    
        <div className="text-primary font-cyber text-2xl">BlockSwarms</div>    <nav className="space-x-6 hidden md:block">    
        <Link href="/" className="text-foreground hover:text-primary">Home</Link>    <Link href={isDemoMode ? "/dashboard?demo=true" : "/dashboard"} className="text-foreground hover:text-primary">Dashboard</Link>    <Link 
              href="/login" 
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:brightness-110"
            >
              Connect Wallet
            </Link>    <Link 
              href={isDemoMode ? "/ai-chat?demo=true" : "/ai-chat"} 
              className="text-foreground hover:text-primary"
            >
              AI Chat
            </Link>
          </nav>
        </header>    <main>    
        <section className="py-20">    
        <div className="max-w-3xl mx-auto text-center">    
        <h1 className="text-5xl md:text-6xl font-cyber text-primary mb-6">
                AI-Powered <span className="text-foreground">Solana</span> Trading
              </h1>    <p className="text-lg md:text-xl mb-10 max-w-2xl mx-auto">
                Harness the power of advanced AI to analyze Solana tokens, predict market movements,
                and optimize your trading strategies.
              </p>    <div className="flex flex-col sm:flex-row justify-center gap-4">    
        <Link
                  href="/login"
                  className="button-primary flex items-center justify-center gap-2 font-cyber"
                >
                  CONNECT WALLET <ArrowRight className="w-4 h-4" />
                </Link>    <button
                  onClick={() => setIsJoinModalOpen(true)}
                  className="button-outline font-cyber"
                >
                  JOIN THE SWARM
                </button>    <Link
                  href="/ai-chat"
                  className="button-outline flex items-center justify-center gap-2 font-cyber"
                >    
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">    
        <path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9"/>
                  </svg>
                  AI CHAT
                </Link>    <Link
                  href="/?demo=true"
                  className="button-outline flex items-center justify-center gap-2 font-cyber bg-amber-500/20 hover:bg-amber-500/30 text-amber-300"
                >
                  DEMO MODE
                </Link>
              </div>
            </div>
          </section>    <section className="py-20">    
        <div className="max-w-5xl mx-auto">    
        <h2 className="text-3xl font-cyber text-primary text-center mb-12">
                POWERED BY AI, DESIGNED FOR TRADERS
              </h2>    <div className="grid md:grid-cols-3 gap-8">    
        <div className="bg-card/50 backdrop-blur-sm border border-primary/20 rounded-lg p-6 hover:border-primary/40 transition-all">    
        <div className="bg-card p-4 rounded-lg inline-block mb-5">    
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">    
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                    </svg>
                  </div>    <h3 className="text-xl font-cyber text-primary mb-3">
                    Token Analysis
                  </h3>    <p className="text-foreground/70">
                    Get in-depth analysis on any token with price predictions, technical indicators, and sentiment analysis.
                  </p>
                </div>    <div className="bg-card/50 backdrop-blur-sm border border-primary/20 rounded-lg p-6 hover:border-primary/40 transition-all">    
        <div className="bg-card p-4 rounded-lg inline-block mb-5">    
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">    
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>    <h3 className="text-xl font-cyber text-primary mb-3">
                    Trading Signals
                  </h3>    <p className="text-foreground/70">
                    Receive precise buy, sell, and hold signals with entry and exit points based on multiple time frames.
                  </p>
                </div>    <div className="bg-card/50 backdrop-blur-sm border border-primary/20 rounded-lg p-6 hover:border-primary/40 transition-all">    
        <div className="bg-card p-4 rounded-lg inline-block mb-5">    
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">    
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>    <h3 className="text-xl font-cyber text-primary mb-3">
                    AI Chat
                  </h3>    <p className="text-foreground/70">
                    Chat directly with specialized AI models for token analysis, market insights, and trading recommendations.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </main>    <footer className="mt-20 border-t border-border pt-8 pb-16">    
        <div className="text-center">    
        <div className="text-primary font-cyber text-xl mb-4">BlockSwarms</div>    <p className="text-sm text-foreground/60">
              &copy; {new Date().getFullYear()} BlockSwarms. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
      
      {/* Join Modal */}
      {isJoinModalOpen && <JoinModal isOpen={isJoinModalOpen} onClose={() => setIsJoinModalOpen(false)} />}
    </div>
  );
}