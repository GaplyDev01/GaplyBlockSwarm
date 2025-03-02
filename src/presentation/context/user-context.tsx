'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useWalletContext } from './wallet-context';
import { logger } from '@/src/shared/utils/logger';

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
  
  // Get wallet information with SSR safety
  const isServerSide = typeof window === 'undefined';
  
  // Use a default context for server-side rendering
  let walletContext = {
    isConnected: false,
    walletAddress: null
  };
  
  // Only try to access wallet context on client side
  if (!isServerSide) {
    try {
      walletContext = useWalletContext();
    } catch (error) {
      logger.error('Error accessing wallet context in UserProvider:', error);
      // Keep using the default values initialized above
    }
  }
  
  const { isConnected = false, walletAddress = null } = walletContext || {};
  
  // Check for demo mode - with better error handling and SSR support
  useEffect(() => {
    // Skip this effect on server-side
    if (typeof window === 'undefined') {
      return;
    }
    
    // Mark as loaded even if we encounter errors
    const markLoaded = () => {
      if (!isLoaded) setIsLoaded(true);
    };
    
    try {
      const urlParams = new URLSearchParams(window.location.search);
      setIsDemo(urlParams.get('demo') === 'true');
      markLoaded();
    } catch (e) {
      logger.error("Failed to check for demo mode", e);
      markLoaded();
    }
    
    // Add a small delay to ensure everything is properly initialized
    const timer = setTimeout(markLoaded, 500);
    return () => clearTimeout(timer);
  }, [isLoaded]);
  
  return (    <UserContext.Provider value={{ 
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