'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import Link from 'next/link';

interface JoinModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function JoinModal({ isOpen, onClose }: JoinModalProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically send the data to your backend
    // For now, we'll just simulate a successful submission
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-sapphire-900/80 backdrop-blur-sm">    
      <div className="relative bg-sapphire-800 border border-emerald-400/30 rounded-lg shadow-xl max-w-md w-full p-6 mx-4">    
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-emerald-400/70 hover:text-emerald-400"
        >    
        <X className="w-5 h-5" />
        </button>

        {submitted ? (    <div className="text-center py-8">    
        <div className="w-16 h-16 bg-emerald-400/20 rounded-full flex items-center justify-center mx-auto mb-4">    
        <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-emerald-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >    
        <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>    <h3 className="text-2xl font-cyber text-emerald-400 mb-2">Welcome to the Swarm!</h3>    <p className="text-emerald-400/70 mb-6">
              Thank you for joining. We'll be in touch soon with more information.
            </p>    <div className="space-y-3">    
        <Link
                href="/signup"
                className="block w-full bg-emerald-400 text-sapphire-900 font-bold font-cyber px-6 py-3 rounded-md hover:bg-emerald-500 transition-colors text-center"
              >
                CREATE ACCOUNT
              </Link>    <Link
                href="/dashboard"
                className="block w-full bg-transparent border-2 border-emerald-400 text-emerald-400 font-bold font-cyber px-6 py-3 rounded-md hover:bg-emerald-400/10 transition-colors text-center"
              >
                EXPLORE PLATFORM
              </Link>
            </div>
          </div>
        ) : (
          <>    <h3 className="text-2xl font-cyber text-emerald-400 mb-2">Join the Swarm</h3>    <p className="text-emerald-400/70 mb-6">
              Sign up to receive updates, early access to new features, and exclusive trading signals.
            </p>    <form onSubmit={handleSubmit}>    
        <div className="mb-4">    
        <label htmlFor="name" className="block text-emerald-400 mb-1">
                  Name
                </label>    <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-sapphire-900/50 border border-emerald-400/30 rounded-md px-4 py-2 text-white placeholder:text-emerald-400/40 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-transparent"
                  placeholder="Your name"
                  required
                />
              </div>    <div className="mb-6">    
        <label htmlFor="email" className="block text-emerald-400 mb-1">
                  Email
                </label>    <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-sapphire-900/50 border border-emerald-400/30 rounded-md px-4 py-2 text-white placeholder:text-emerald-400/40 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-transparent"
                  placeholder="your@email.com"
                  required
                />
              </div>    <button
                type="submit"
                className="w-full bg-emerald-400 text-sapphire-900 font-bold font-cyber px-4 py-3 rounded-md hover:bg-emerald-500 transition-colors"
              >
                JOIN NOW
              </button>    <div className="mt-4 flex justify-center">    
        <Link 
                  href="/signup"
                  className="text-emerald-400 hover:text-emerald-300 text-sm underline"
                >
                  Already have an account? Sign in
                </Link>
              </div>    <p className="text-xs text-emerald-400/50 mt-4 text-center">
                By joining, you agree to our Terms of Service and Privacy Policy.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}