// Phase 6: Soft Paper Skeleton Loaders
// Premium loading states with paper-grain texture pulsing
import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeEngine } from '@/contexts/ThemeEngineContext';
import { BorderRadius, PaperGrain } from '@/constants/theme';

interface SoftPaperSkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
  variant?: 'card' | 'text' | 'circle' | 'nextup';
}

export function SoftPaperSkeleton({
  width = '100%',
  height = 20,
  borderRadius: customRadius,
  style,
  variant = 'card',
}: SoftPaperSkeletonProps) {
  const { theme } = useThemeEngine();
  const pulseAnim = useSharedValue(0);

  // Determine border radius based on variant
  const radius =
    customRadius ??
    (variant === 'circle'
      ? BorderRadius.full
      : variant === 'nextup'
        ? BorderRadius['2xl']
        : variant === 'text'
          ? BorderRadius.sm
          : BorderRadius.lg);

  useEffect(() => {
    // Smooth, slow pulse (2.5s cycle) for premium feel
    pulseAnim.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1250 }),
        withTiming(0, { duration: 1250 })
      ),
      -1,
      false
    );
  }, [pulseAnim]);

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      pulseAnim.value,
      [0, 1],
      [0.3, 0.6] // Subtle opacity variation
    );

    return {
      opacity,
    };
  });

  // Paper-grain gradient colors based on theme
  const gradientColors: readonly [string, string, string] =
    theme.timeOfDay === 'night'
      ? ['#1A1A1A', '#242424', '#1A1A1A'] // Dark mode: subtle grey pulse
      : variant === 'nextup'
        ? ['#E8E8E8', '#F2F2F2', '#E8E8E8'] // Light next-up card
        : ['#F0F0F0', '#F8F8F8', '#F0F0F0']; // Light mode: paper white

  return (
    <View style={[styles.container, { width, height, borderRadius: radius } as any, style]}>
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
        />
        {/* Paper grain texture overlay */}
        <View
          style={[
            styles.paperGrain,
            {
              opacity: PaperGrain.opacity * 2, // Slightly more visible during loading
              borderRadius: radius,
            },
          ]}
        />
      </Animated.View>
    </View>
  );
}

// Preset skeleton layouts for common UI patterns
export function NextUpSkeleton() {
  return (
    <View style={styles.nextUpContainer}>
      <SoftPaperSkeleton variant="nextup" height={120} />
    </View>
  );
}

export function ReminderCardSkeleton() {
  return (
    <View style={styles.reminderCardContainer}>
      <SoftPaperSkeleton width={12} height={12} variant="circle" />
      <View style={styles.reminderTextContainer}>
        <SoftPaperSkeleton width="60%" height={18} variant="text" />
        <SoftPaperSkeleton width="40%" height={14} variant="text" style={{ marginTop: 6 }} />
      </View>
    </View>
  );
}

export function CalendarEventSkeleton() {
  return (
    <View style={styles.calendarContainer}>
      <SoftPaperSkeleton width={4} height={60} variant="text" />
      <View style={styles.calendarTextContainer}>
        <SoftPaperSkeleton width="80%" height={16} variant="text" />
        <SoftPaperSkeleton width="50%" height={14} variant="text" style={{ marginTop: 6 }} />
      </View>
    </View>
  );
}

export function DailyBriefingSkeleton() {
  return (
    <View style={styles.briefingContainer}>
      <SoftPaperSkeleton width="100%" height={140} variant="card" />
      <View style={styles.briefingContentContainer}>
        <SoftPaperSkeleton width="70%" height={20} variant="text" style={{ marginTop: 12 }} />
        <SoftPaperSkeleton width="90%" height={14} variant="text" style={{ marginTop: 8 }} />
        <SoftPaperSkeleton width="85%" height={14} variant="text" style={{ marginTop: 6 }} />
        <SoftPaperSkeleton width="60%" height={14} variant="text" style={{ marginTop: 6 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  paperGrain: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    // SVG pattern would be applied via Image or web-specific technique
    // For native, we use subtle noise via opacity variations
  },
  nextUpContainer: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  reminderCardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
  },
  reminderTextContainer: {
    flex: 1,
  },
  calendarContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 16,
  },
  calendarTextContainer: {
    flex: 1,
  },
  briefingContainer: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  briefingContentContainer: {
    paddingHorizontal: 16,
  },
});
