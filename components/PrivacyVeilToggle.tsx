// Privacy Veil Toggle - Global toggle for privacy mode
import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useColorScheme';
import { usePrivacy } from '@/contexts/PrivacyContext';
import { Spacing, Typography } from '@/constants/theme';

export function PrivacyVeilToggle() {
  const theme = useTheme();
  const { isPrivacyVeilEnabled, setPrivacyVeil } = usePrivacy();

  const handleToggle = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await setPrivacyVeil(!isPrivacyVeilEnabled);
  };

  return (
    <Pressable onPress={handleToggle} hitSlop={10} style={styles.container}>
      <Animated.View entering={FadeIn.duration(200)}>
        <Ionicons
          name={isPrivacyVeilEnabled ? 'eye-off' : 'eye-off-outline'}
          size={24}
          color={isPrivacyVeilEnabled ? theme.secondary : theme.textInverse}
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.xs,
  },
});
