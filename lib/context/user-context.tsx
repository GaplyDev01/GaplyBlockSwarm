'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useUser } from '@clerk/nextjs';

// Create a type for the context
interface UserContextType {
  isLoaded: boolean;
  isSignedIn: boolean;
  user: any;
}

// Create the context
const UserContext = createContext<UserContextType | undefined>(undefined);

// Create a provider component
export function UserProvider({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, user } = useUser();
  
  return (
    <UserContext.Provider value={{ isLoaded, isSignedIn, user }}>
      {children}
    </UserContext.Provider>
  );
}

// Create a hook to use the context
export function useUserContext() {
  const context = useContext(UserContext);
  
  // Return a fallback during prerendering instead of throwing an error
  if (context === undefined) {
    // This happens when the context is used outside of UserProvider
    // Instead of throwing an error, return a fallback value for SSR/static generation
    console.warn('useUserContext was used outside of UserProvider, returning fallback values');
    return {
      isLoaded: false,
      isSignedIn: false,
      user: null
    };
  }
  
  return context;
}