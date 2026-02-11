// Accessibility Context - Fluid Typography & High-Contrast Mode
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AccessibilitySettings {
  // Typography
  fontScale: number; // 1.0 = normal, up to 2.0
  lineHeightScale: number; // proportional to fontScale
  letterSpacing: number;

  // Contrast
  highContrastMode: boolean;
  reduceTransparency: boolean;

  // Motion
  reduceMotion: boolean;

  // Screen Reader
  screenReaderEnabled: boolean;

  // Touch Targets
  largerTouchTargets: boolean; // Ensures 44x44 minimum
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  setFontScale: (scale: number) => void;
  toggleHighContrast: () => void;
  toggleReduceTransparency: () => void;
  toggleReduceMotion: () => void;
  toggleLargerTouchTargets: () => void;
  getScaledSize: (baseSize: number) => number;
  getScaledLineHeight: (baseHeight: number) => number;
  getContrastColor: (baseColor: string, highContrastColor: string) => string;
  getTouchableSize: (baseSize: number) => number;
}

const STORAGE_KEY = '@anchor_accessibility';
const MIN_TOUCH_TARGET = 44;

const defaultSettings: AccessibilitySettings = {
  fontScale: 1.0,
  lineHeightScale: 1.0,
  letterSpacing: 0,
  highContrastMode: false,
  reduceTransparency: false,
  reduceMotion: false,
  screenReaderEnabled: false,
  largerTouchTargets: false,
};

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings);

  useEffect(() => {
    loadSettings();
    checkSystemSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSettings({ ...defaultSettings, ...JSON.parse(stored) });
      }
    } catch (error) {
      console.error('Error loading accessibility settings:', error);
    }
  };

  const checkSystemSettings = async () => {
    try {
      // Check if screen reader is enabled
      const screenReaderEnabled = await AccessibilityInfo.isScreenReaderEnabled();

      // Check if reduce motion is enabled (iOS only)
      if (Platform.OS === 'ios') {
        const reduceMotion = await AccessibilityInfo.isReduceMotionEnabled();
        updateSettings({ screenReaderEnabled, reduceMotion });
      } else {
        updateSettings({ screenReaderEnabled });
      }

      // Listen for screen reader changes
      AccessibilityInfo.addEventListener('screenReaderChanged', (enabled) => {
        updateSettings({ screenReaderEnabled: enabled });
      });

      // Listen for reduce motion changes (iOS)
      if (Platform.OS === 'ios') {
        AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
          updateSettings({ reduceMotion: enabled });
        });
      }
    } catch (error) {
      console.error('Error checking system accessibility settings:', error);
    }
  };

  const updateSettings = async (updates: Partial<AccessibilitySettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error('Error saving accessibility settings:', error);
    }
  };

  const setFontScale = (scale: number) => {
    // Clamp between 0.8 and 2.0
    const clampedScale = Math.max(0.8, Math.min(2.0, scale));

    // Calculate proportional line height (add 20% more spacing as text grows)
    const lineHeightScale = 1 + (clampedScale - 1) * 1.2;

    // Add letter spacing for larger text
    const letterSpacing = clampedScale > 1.2 ? (clampedScale - 1) * 0.5 : 0;

    updateSettings({
      fontScale: clampedScale,
      lineHeightScale,
      letterSpacing,
    });
  };

  const toggleHighContrast = () => {
    updateSettings({ highContrastMode: !settings.highContrastMode });
  };

  const toggleReduceTransparency = () => {
    updateSettings({ reduceTransparency: !settings.reduceTransparency });
  };

  const toggleReduceMotion = () => {
    updateSettings({ reduceMotion: !settings.reduceMotion });
  };

  const toggleLargerTouchTargets = () => {
    updateSettings({ largerTouchTargets: !settings.largerTouchTargets });
  };

  const getScaledSize = (baseSize: number): number => {
    return Math.round(baseSize * settings.fontScale);
  };

  const getScaledLineHeight = (baseHeight: number): number => {
    return Math.round(baseHeight * settings.lineHeightScale);
  };

  const getContrastColor = (baseColor: string, highContrastColor: string): string => {
    return settings.highContrastMode ? highContrastColor : baseColor;
  };

  const getTouchableSize = (baseSize: number): number => {
    if (settings.largerTouchTargets) {
      return Math.max(MIN_TOUCH_TARGET, baseSize);
    }
    return baseSize;
  };

  return (
    <AccessibilityContext.Provider
      value={{
        settings,
        setFontScale,
        toggleHighContrast,
        toggleReduceTransparency,
        toggleReduceMotion,
        toggleLargerTouchTargets,
        getScaledSize,
        getScaledLineHeight,
        getContrastColor,
        getTouchableSize,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
}

// Helper hook for accessible text
export function useAccessibleText() {
  const { settings, getScaledSize, getScaledLineHeight } = useAccessibility();

  const getTextStyle = (baseFontSize: number, baseLineHeight?: number) => ({
    fontSize: getScaledSize(baseFontSize),
    lineHeight: baseLineHeight ? getScaledLineHeight(baseLineHeight) : getScaledSize(baseFontSize * 1.5),
    letterSpacing: settings.letterSpacing,
  });

  return { getTextStyle, settings };
}

// Helper hook for accessible colors
export function useAccessibleColors() {
  const { settings, getContrastColor } = useAccessibility();

  const getColor = (baseColor: string, highContrastColor?: string) => {
    if (settings.highContrastMode && highContrastColor) {
      return highContrastColor;
    }
    return baseColor;
  };

  const getOpacity = (baseOpacity: number) => {
    if (settings.reduceTransparency) {
      return Math.min(1, baseOpacity + 0.3);
    }
    return baseOpacity;
  };

  return { getColor, getOpacity, settings };
}
