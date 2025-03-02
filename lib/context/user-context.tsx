'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useWalletContext } from './wallet-context';
import { logger } from '@/lib/logger';

// Create a type for the context
interface UserContextType {
  isLoaded: boolean;
  isSignedIn: boolean;
  userId: string | null;
  isDemo: boolean;
}

// Create the context
const UserContext = createContext<UserContextType>({
  isLoaded: false,
  isSignedIn: false,
  userId: null,
  isDemo: false
});

// Create a provider component
export function UserProvider({ children }: { children: ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  
  // Get wallet information
  let walletContext;
  try {
    walletContext = useWalletContext();
  } catch (error) {
    logger.error('Error accessing wallet context in UserProvider:', error);
    walletContext = {
      isConnected: false,
      walletAddress: null
    };
  }
  
  const { isConnected = false, walletAddress = null } = walletContext || {};
  
  // Check for demo mode
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        setIsDemo(urlParams.get('demo') === 'true');
        setIsLoaded(true);
      }
    } catch (e) {
      logger.error("Failed to check for demo mode", e);
      setIsLoaded(true);
    }
  }, []);
  
  return (
    <UserContext.Provider value={{ 
      isLoaded, 
      isSignedIn: isConnected || isDemo, 
      userId: walletAddress,
      isDemo
    }}>
      {children}
    </UserContext.Provider>
  );
}

// Create a hook to use the context
export function useUserContext() {
  const context = useContext(UserContext);
  
  if (context === undefined) {
    // This happens when the context is used outside of UserProvider
    // Instead of throwing an error, return a fallback value for SSR/static generation
    logger.warn('useUserContext was used outside of UserProvider, returning fallback values');
    return {
      isLoaded: false,
      isSignedIn: false,
      userId: null,
      isDemo: false
    };
  }
  
  return context;
}