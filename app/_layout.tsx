// Root Layout - App entry point with navigation setup
import { useState, useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from '@/lib/auth';
import { useColorScheme } from '@/hooks/useColorScheme';
import { AnimatedSplashScreen } from '@/components/AnimatedSplashScreen';
import { HouseholdProvider } from '@/contexts/HouseholdContext';
import { PrivacyProvider } from '@/contexts/PrivacyContext';
import { ThemeEngineProvider } from '@/contexts/ThemeEngineContext';
import { OnboardingProvider } from '@/contexts/OnboardingContext';
import { AccessibilityProvider } from '@/contexts/AccessibilityContext';
import { supabase } from '@/lib/supabase';

// Keep splash screen visible while we load
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [appIsReady, setAppIsReady] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    async function prepare() {
      try {
        // Perform any app initialization here
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  if (!appIsReady) {
    return null;
  }

  return (
    <>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <AuthProvider
        supabaseClient={supabase}
        routes={{
          login: '/auth',
          afterLogin: '/(tabs)',
        }}
      >
        <AccessibilityProvider>
          <ThemeEngineProvider>
            <OnboardingProvider>
              <PrivacyProvider>
                <HouseholdProvider>
                  <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    <Stack.Screen name="auth" options={{ headerShown: false }} />
                    <Stack.Screen name="index" options={{ headerShown: false }} />
                    <Stack.Screen name="templates" options={{ headerShown: false }} />
                    <Stack.Screen name="wellness" options={{ headerShown: false }} />
                    <Stack.Screen name="focus" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
                    <Stack.Screen name="commute" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
                  </Stack>
                </HouseholdProvider>
              </PrivacyProvider>
            </OnboardingProvider>
          </ThemeEngineProvider>
        </AccessibilityProvider>
      </AuthProvider>

      {showSplash && <AnimatedSplashScreen onComplete={handleSplashComplete} />}
    </>
  );
}
