'use client';

import React from 'react';
import Link from 'next/link';
import { useEffect } from 'react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (    <div className="min-h-screen bg-sapphire-900 text-emerald-400 flex flex-col items-center justify-center p-4">    
        <div className="max-w-md w-full bg-sapphire-800/50 backdrop-blur-sm border border-emerald-400/20 rounded-lg p-8 shadow-xl">    
        <h2 className="text-3xl font-cyber text-center mb-6">Application Error</h2>    <div className="rounded-md bg-red-900/20 border border-red-500/30 p-4 mb-6">    
        <p className="text-red-400/80">
            {error?.message || 'An unexpected error occurred'}
          </p>
          {error?.digest && (    <p className="text-xs mt-2 text-red-400/60">Error ID: {error.digest}</p>
          )}
        </div>    <div className="mb-6 text-emerald-400/70">    
        <p className="mb-2">
            Sorry, something went wrong. You can try one of the following:
          </p>    <ul className="list-disc list-inside text-sm space-y-1">    
        <li>Reload the page and try again</li>    <li>Clear your browser cache</li>    <li>Try the demo mode for a limited experience</li>    <li>Contact support if the problem persists</li>
          </ul>
        </div>    <div className="flex flex-col sm:flex-row gap-3">    
        <button
            onClick={() => reset()}
            className="px-4 py-2 bg-emerald-400/20 hover:bg-emerald-400/30 border border-emerald-400/30 rounded-md text-emerald-400 transition-all"
          >
            Try Again
          </button>    <Link
            href="/dashboard?demo=true"
            className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 rounded-md text-amber-400 text-center transition-all"
          >
            Demo Mode
          </Link>    <Link
            href="/"
            className="px-4 py-2 bg-sapphire-700/50 hover:bg-sapphire-700 border border-emerald-400/30 rounded-md text-emerald-400 text-center transition-all"
          >
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}