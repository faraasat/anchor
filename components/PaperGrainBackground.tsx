// Paper Grain Background - Subtle texture for premium editorial feel
import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useTheme } from '@/hooks/useColorScheme';
import { PaperGrain } from '@/constants/theme';

interface PaperGrainBackgroundProps {
  children: React.ReactNode;
}

export function PaperGrainBackground({ children }: PaperGrainBackgroundProps) {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Paper grain texture overlay */}
      {Platform.OS !== 'web' && (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              opacity: PaperGrain.opacity,
              backgroundColor: theme.text,
            },
          ]}
        />
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
