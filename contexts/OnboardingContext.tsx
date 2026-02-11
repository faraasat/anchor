// Phase 6: Onboarding Context
// Manages onboarding state and AI personality preferences
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AIPersonality } from '@/components/OnboardingFlow';

const ONBOARDING_KEY = '@anchor_onboarding';

interface OnboardingState {
  hasCompletedOnboarding: boolean;
  aiPersonality: AIPersonality | null;
  firstAnchorName: string | null;
}

interface OnboardingContextValue extends OnboardingState {
  completeOnboarding: (personality: AIPersonality, anchorName: string) => Promise<void>;
  skipOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
  updateAIPersonality: (personality: AIPersonality) => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OnboardingState>({
    hasCompletedOnboarding: false,
    aiPersonality: null,
    firstAnchorName: null,
  });

  // Load onboarding state on mount
  useEffect(() => {
    loadOnboardingState();
  }, []);

  const loadOnboardingState = async () => {
    try {
      const stored = await AsyncStorage.getItem(ONBOARDING_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setState(parsed);
      }
    } catch (err) {
      console.error('Failed to load onboarding state:', err);
    }
  };

  const saveOnboardingState = async (newState: OnboardingState) => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, JSON.stringify(newState));
      setState(newState);
    } catch (err) {
      console.error('Failed to save onboarding state:', err);
    }
  };

  const completeOnboarding = async (personality: AIPersonality, anchorName: string) => {
    await saveOnboardingState({
      hasCompletedOnboarding: true,
      aiPersonality: personality,
      firstAnchorName: anchorName,
    });
  };

  const skipOnboarding = async () => {
    await saveOnboardingState({
      hasCompletedOnboarding: true,
      aiPersonality: 'minimalist', // Default
      firstAnchorName: null,
    });
  };

  const resetOnboarding = async () => {
    await saveOnboardingState({
      hasCompletedOnboarding: false,
      aiPersonality: null,
      firstAnchorName: null,
    });
  };

  const updateAIPersonality = async (personality: AIPersonality) => {
    await saveOnboardingState({
      ...state,
      aiPersonality: personality,
    });
  };

  return (
    <OnboardingContext.Provider
      value={{
        ...state,
        completeOnboarding,
        skipOnboarding,
        resetOnboarding,
        updateAIPersonality,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
