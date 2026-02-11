// Phase 5: Dynamic 'Ink & Light' Theme Engine
// Ambient-aware theming that shifts based on time of day and ambient light
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { Colors, Typography } from '@/constants/theme';

// Time-based theme variants
export type TimeOfDay = 'dawn' | 'midday' | 'dusk' | 'night';

export interface InkLightTheme {
  // Base colors adjusted for time of day
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  accent: string;

  // Time-specific tints
  timeOfDay: TimeOfDay;
  ambientTint: string;

  // Adaptive typography weights
  baseFontWeight: string;
  headingFontWeight: string;

  // All standard theme colors
  [key: string]: any;
}

interface ThemeEngineContextValue {
  theme: InkLightTheme;
  timeOfDay: TimeOfDay;
  isInkBleedActive: boolean;
  triggerInkBleed: () => void;
}

const ThemeEngineContext = createContext<ThemeEngineContextValue | undefined>(undefined);

// Time-based theme tints
const TIME_TINTS = {
  dawn: {
    background: '#FFF5EB', // Warm peach tint
    ambientTint: 'rgba(255, 179, 102, 0.08)',
    lightAdjustment: 1.0,
  },
  midday: {
    background: '#FFFEF9', // Crisp high-contrast white
    ambientTint: 'rgba(255, 255, 255, 0.00)',
    lightAdjustment: 1.15, // Thicker fonts for bright conditions
  },
  dusk: {
    background: '#F5F3FF', // Calming lavender-grey
    ambientTint: 'rgba(167, 139, 250, 0.06)',
    lightAdjustment: 1.0,
  },
  night: {
    background: '#000000', // Deep Ink (OLED black)
    ambientTint: 'rgba(38, 38, 38, 0.12)',
    lightAdjustment: 0.95, // Slightly lighter for low light
  },
};

function getTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 8) return 'dawn';
  if (hour >= 8 && hour < 17) return 'midday';
  if (hour >= 17 && hour < 21) return 'dusk';
  return 'night';
}

function adjustFontWeight(baseWeight: string, adjustment: number): string {
  const weights: { [key: string]: string } = {
    '300': '400',
    '400': '500',
    '500': '600',
    '600': '700',
    '700': '800',
  };

  if (adjustment > 1.1) {
    return weights[baseWeight] || baseWeight;
  }
  return baseWeight;
}

export function ThemeEngineProvider({ children }: { children: ReactNode }) {
  const colorScheme = useColorScheme() ?? 'light';
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(getTimeOfDay());
  const [isInkBleedActive, setIsInkBleedActive] = useState(false);
  const [theme, setTheme] = useState<InkLightTheme>(() => buildTheme(colorScheme, timeOfDay));

  // Update time of day every minute
  useEffect(() => {
    const interval = setInterval(() => {
      const newTimeOfDay = getTimeOfDay();
      if (newTimeOfDay !== timeOfDay) {
        setTimeOfDay(newTimeOfDay);
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [timeOfDay]);

  // Rebuild theme when time changes
  useEffect(() => {
    setTheme(buildTheme(colorScheme, timeOfDay));
  }, [colorScheme, timeOfDay]);

  const triggerInkBleed = () => {
    setIsInkBleedActive(true);
    setTimeout(() => setIsInkBleedActive(false), 600);
  };

  return (
    <ThemeEngineContext.Provider value={{ theme, timeOfDay, isInkBleedActive, triggerInkBleed }}>
      {children}
    </ThemeEngineContext.Provider>
  );
}

function buildTheme(colorScheme: 'light' | 'dark', timeOfDay: TimeOfDay): InkLightTheme {
  const baseTheme = Colors[colorScheme];
  const timeTint = TIME_TINTS[timeOfDay];

  // Use night theme for dark mode regardless of time
  if (colorScheme === 'dark') {
    return {
      ...baseTheme,
      timeOfDay: 'night',
      ambientTint: TIME_TINTS.night.ambientTint,
      background: TIME_TINTS.night.background,
      baseFontWeight: Typography.weight.normal,
      headingFontWeight: Typography.weight.bold,
    };
  }

  // Light mode: apply time-based tints
  return {
    ...baseTheme,
    timeOfDay,
    ambientTint: timeTint.ambientTint,
    background: timeTint.background,

    // Adaptive typography - thicker in bright light (midday)
    baseFontWeight: adjustFontWeight(Typography.weight.normal, timeTint.lightAdjustment),
    headingFontWeight: adjustFontWeight(Typography.weight.bold, timeTint.lightAdjustment),
  };
}

export function useThemeEngine() {
  const context = useContext(ThemeEngineContext);
  if (context === undefined) {
    throw new Error('useThemeEngine must be used within a ThemeEngineProvider');
  }
  return context;
}

// Utility to get time-aware greeting
export function getTimeGreeting(): string {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  if (hour >= 17 && hour < 21) return 'Good evening';
  return 'Good night';
}
