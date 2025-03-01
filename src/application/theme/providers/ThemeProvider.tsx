'use client';

import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useSettingsStore, ThemeMode } from '../../../shared/store/settings-store';

/**
 * Theme context interface
 */
interface ThemeContextType {
  theme: ThemeMode;
  highContrast: boolean;
  setTheme: (theme: ThemeMode) => void;
  setHighContrast: (highContrast: boolean) => void;
}

// Create context with default values
const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  highContrast: true,
  setTheme: () => {},
  setHighContrast: () => {},
});

// Export context hook
export const useTheme = () => useContext(ThemeContext);

/**
 * Theme provider component
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const { 
    themeMode, 
    highContrastMode,
    setThemeMode, 
    setHighContrastMode 
  } = useSettingsStore();

  // Apply theme class to document
  useEffect(() => {
    const root = document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove('light', 'dark');
    
    // Determine theme
    const computedTheme = themeMode === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : themeMode;
    
    // Apply theme class
    root.classList.add(computedTheme);
    
    // Apply high contrast mode
    if (highContrastMode) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    // Listen for system theme changes if using system theme
    if (themeMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleChange = (e: MediaQueryListEvent) => {
        root.classList.remove('light', 'dark');
        root.classList.add(e.matches ? 'dark' : 'light');
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [themeMode, highContrastMode]);

  // Provide the context values
  const contextValue: ThemeContextType = {
    theme: themeMode,
    highContrast: highContrastMode,
    setTheme: setThemeMode,
    setHighContrast: setHighContrastMode,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}