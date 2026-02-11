// Privacy Veil - Blur sensitive content when enabled
import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { usePrivacy } from '@/contexts/PrivacyContext';
import { useColorScheme } from '@/hooks/useColorScheme';

interface PrivacyVeilProps {
  children: React.ReactNode;
  isSensitive?: boolean;
  blurIntensity?: number;
}

export function PrivacyVeil({ children, isSensitive = false, blurIntensity = 40 }: PrivacyVeilProps) {
  const { isPrivacyVeilEnabled } = usePrivacy();
  const colorScheme = useColorScheme();

  // If privacy veil is not enabled or content is not sensitive, render normally
  if (!isPrivacyVeilEnabled || !isSensitive) {
    return <>{children}</>;
  }

  // Apply blur effect
  if (Platform.OS === 'ios') {
    return (
      <View style={styles.container}>
        {children}
        <BlurView
          intensity={blurIntensity}
          tint={colorScheme === 'dark' ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
      </View>
    );
  }

  // For Android and Web, use opacity and scale to simulate blur
  return (
    <View style={styles.container}>
      {children}
      <View
        style={[
          StyleSheet.absoluteFill,
          styles.androidBlur,
          {
            backgroundColor: colorScheme === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)',
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  androidBlur: {
    backdropFilter: 'blur(10px)',
  },
});
