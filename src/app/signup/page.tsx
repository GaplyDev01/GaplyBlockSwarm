'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'edge';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function SignupRedirectPage() {
  const router = useRouter();

  // Redirect to login page after a brief delay
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/login');
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [router]);

  return (    <div className="min-h-screen bg-sapphire-900 overflow-hidden bg-tech-pattern">
        {/*       Background effect       */}    <div className="absolute inset-0 overflow-hidden">    <div className="absolute inset-0 bg-gradient-to-br from-sapphire-900 via-sapphire-900/90 to-sapphire-800/50" />    
        <div className="absolute w-full h-full">    
        <div className="absolute inset-0 bg-sapphire-900 opacity-90" /></div>
      </div>
        {/*       Decorative elements       */}    <div className="absolute inset-0 overflow-hidden pointer-events-none">    
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-emerald-400/0 via-emerald-400/20 to-emerald-400/0" />    
        <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-emerald-400/0 via-emerald-400/20 to-emerald-400/0" />    
        <div className="absolute top-1/3 left-0 w-full h-px bg-gradient-to-r from-emerald-400/0 via-emerald-400/20 to-emerald-400/0" /></div>
        {/*       Content       */}    <div className="relative flex flex-col items-center justify-center min-h-screen p-6">    
        <Link href="/" className="absolute top-6 left-6 text-emerald-400 hover:text-emerald-300 flex items-center gap-2">    
        <ArrowLeft size={20} />    
        <span>Back to Home</span>
        </Link>    <div className="w-full max-w-md">    
        <div className="text-center mb-8">    
        <h1 className="text-3xl font-cyber font-bold text-emerald-400">Join BlockSwarms</h1>    <p className="text-emerald-400/70 mt-2">
              Using wallet connection for authentication
            </p>
          </div>    <div className="bg-sapphire-800/50 backdrop-blur-sm border border-emerald-400/20 rounded-lg p-8 shadow-xl">    
        <div className="text-center py-4">    
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">    
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>    <h3 className="text-xl font-bold text-emerald-400 mb-4">
                Wallet-Based Authentication
              </h3>    <p className="text-emerald-400/70 mb-6">
                We've simplified authentication to use your Solana wallet directly.
                No need to create a separate account or password.
              </p>    <div className="text-sm text-emerald-400/50 mb-6 animate-pulse">
                Redirecting to wallet login...
              </div>    <Link
                href="/login"
                className="block w-full bg-emerald-400 text-sapphire-900 font-bold font-cyber px-4 py-3 rounded-md hover:bg-emerald-500 transition-colors"
              >
                CONNECT WALLET NOW
              </Link>    <div className="mt-6">    
        <Link href="/dashboard?demo=true" className="text-xs bg-amber-500/30 hover:bg-amber-500/40 text-amber-100 px-3 py-1 rounded-md">
                  Try Demo Mode Instead
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}