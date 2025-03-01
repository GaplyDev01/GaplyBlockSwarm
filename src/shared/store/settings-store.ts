import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

/**
 * Theme modes for the application
 */
export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * Chart periods
 */
export type ChartPeriod = '1d' | '1w' | '1m' | '3m' | '1y' | 'all';

/**
 * Settings state interface
 */
interface SettingsState {
  // Theme settings
  themeMode: ThemeMode;
  highContrastMode: boolean;
  
  // Trading settings
  tradingFeePercentage: number;
  simulationMode: boolean;
  defaultChartPeriod: ChartPeriod;
  
  // Notification settings
  emailNotifications: boolean;
  pushNotifications: boolean;
  tradingSignals: boolean;
  
  // Display settings
  compactMode: boolean;
  showBalance: boolean;
  decimalPrecision: number;
  
  // Actions
  setThemeMode: (mode: ThemeMode) => void;
  setHighContrastMode: (enabled: boolean) => void;
  setSimulationMode: (enabled: boolean) => void;
  setDefaultChartPeriod: (period: ChartPeriod) => void;
  setEmailNotifications: (enabled: boolean) => void;
  setPushNotifications: (enabled: boolean) => void;
  setTradingSignals: (enabled: boolean) => void;
  setCompactMode: (enabled: boolean) => void;
  setShowBalance: (show: boolean) => void;
  setDecimalPrecision: (precision: number) => void;
  resetSettings: () => void;
}

/**
 * Default settings
 */
const defaultSettings = {
  themeMode: 'dark' as ThemeMode,
  highContrastMode: true,
  tradingFeePercentage: 0.1,
  simulationMode: true,
  defaultChartPeriod: '1w' as ChartPeriod,
  emailNotifications: true,
  pushNotifications: false,
  tradingSignals: true,
  compactMode: false,
  showBalance: true,
  decimalPrecision: 2,
};

/**
 * Settings store for application settings
 */
export const useSettingsStore = create<SettingsState>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        ...defaultSettings,
        
        // Actions
        setThemeMode: (mode) => set({ themeMode: mode }),
        
        setHighContrastMode: (enabled) => set({ highContrastMode: enabled }),
        
        setSimulationMode: (enabled) => set({ simulationMode: enabled }),
        
        setDefaultChartPeriod: (period) => set({ defaultChartPeriod: period }),
        
        setEmailNotifications: (enabled) => set({ emailNotifications: enabled }),
        
        setPushNotifications: (enabled) => set({ pushNotifications: enabled }),
        
        setTradingSignals: (enabled) => set({ tradingSignals: enabled }),
        
        setCompactMode: (enabled) => set({ compactMode: enabled }),
        
        setShowBalance: (show) => set({ showBalance: show }),
        
        setDecimalPrecision: (precision) => set({ decimalPrecision: precision }),
        
        resetSettings: () => set(defaultSettings),
      }),
      {
        name: 'settings-store',
      }
    )
  )
);