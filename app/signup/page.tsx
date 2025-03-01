'use client';

import { SignUp } from '@clerk/nextjs';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-sapphire-900 overflow-hidden bg-tech-pattern">
      {/* Background effect */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-sapphire-900 via-sapphire-900/90 to-sapphire-800/50" />
        <div className="absolute w-full h-full">
          <div className="absolute inset-0 bg-sapphire-900 opacity-90" />
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-emerald-400/0 via-emerald-400/20 to-emerald-400/0" />
        <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-emerald-400/0 via-emerald-400/20 to-emerald-400/0" />
        <div className="absolute top-1/3 left-0 w-full h-px bg-gradient-to-r from-emerald-400/0 via-emerald-400/20 to-emerald-400/0" />
      </div>

      {/* Content */}
      <div className="relative flex flex-col items-center justify-center min-h-screen p-6">
        <Link href="/" className="absolute top-6 left-6 text-emerald-400 hover:text-emerald-300 flex items-center gap-2">
          <ArrowLeft size={20} />
          <span>Back to Home</span>
        </Link>
        
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-cyber font-bold text-emerald-400">Join BlockSwarms</h1>
            <p className="text-emerald-400/70 mt-2">
              Create your account to access AI-powered Solana trading tools
            </p>
          </div>
          
          <div className="bg-sapphire-800/50 backdrop-blur-sm border border-emerald-400/20 rounded-lg p-4 shadow-xl">
            <SignUp 
              appearance={{
                elements: {
                  card: "bg-transparent shadow-none",
                  headerTitle: "text-emerald-400 font-cyber text-xl",
                  headerSubtitle: "text-emerald-400/70",
                  socialButtonsBlockButton: "bg-sapphire-700 hover:bg-sapphire-600 text-emerald-400 border border-emerald-400/30",
                  socialButtonsBlockButtonText: "text-emerald-400 font-medium",
                  dividerLine: "bg-emerald-400/20",
                  dividerText: "text-emerald-400/50",
                  formFieldLabel: "text-emerald-400",
                  formFieldInput: "bg-sapphire-700/50 border-emerald-400/30 text-white focus:border-emerald-400 focus:ring focus:ring-emerald-400/30",
                  formButtonPrimary: "bg-emerald-400 hover:bg-emerald-500 text-sapphire-900 font-cyber",
                  footerActionLink: "text-emerald-400 hover:text-emerald-300",
                  identityPreview: "bg-sapphire-700 border-emerald-400/30",
                  identityPreviewText: "text-emerald-400",
                  identityPreviewEditButton: "text-emerald-400/80 hover:text-emerald-400",
                  formResendCodeLink: "text-emerald-400 hover:text-emerald-300",
                }
              }}
            />
            
            <div className="mt-6 text-center text-emerald-400/50 text-sm">
              <p>
                Already have an account?{' '}
                <Link href="/login" className="text-emerald-400 hover:text-emerald-300 underline">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}