// Limited Mode Banner - Shows upgrade prompt for free users
import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useColorScheme';
import { Spacing, Typography, Shadows } from '@/constants/theme';

interface LimitedModeBannerProps {
  feature: string;
  message: string;
  onUpgrade?: () => void;
}

export function LimitedModeBanner({ feature, message, onUpgrade }: LimitedModeBannerProps) {
  const theme = useTheme();
  const router = useRouter();

  const handleUpgrade = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (onUpgrade) {
      onUpgrade();
    } else {
      // Navigate to paywall or pricing screen
      console.log('Navigate to paywall');
    }
  };

  return (
    <Animated.View entering={FadeInDown.duration(300)} style={styles.container}>
      <LinearGradient
        colors={['#8B5CF6', '#6366F1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="lock-closed" size={20} color="#FFFFFF" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.title}>{feature}</Text>
            <Text style={styles.message}>{message}</Text>
          </View>
          <Pressable onPress={handleUpgrade} style={styles.button}>
            <Text style={styles.buttonText}>Upgrade</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          </Pressable>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
    borderRadius: 12,
    overflow: 'hidden',
    ...Shadows.md,
  },
  gradient: {
    padding: Spacing.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  message: {
    fontSize: Typography.size.xs,
    color: 'rgba(255,255,255,0.9)',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
  },
  buttonText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    color: '#FFFFFF',
  },
});
