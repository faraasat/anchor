// Glass-Effect Skeleton Screens - Shimmering loaders
import React, { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTheme, useColorScheme } from '@/hooks/useColorScheme';
import { Spacing, BorderRadius } from '@/constants/theme';

interface GlassSkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export function GlassSkeleton({ width = '100%', height = 20, borderRadius = 8, style }: GlassSkeletonProps) {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.ease }),
      -1,
      false
    );
  }, []);

  const shimmerStyle = useAnimatedStyle(() => {
    const translateX = interpolate(shimmer.value, [0, 1], [-200, 200]);

    return {
      transform: [{ translateX }],
    };
  });

  const shimmerColors =
    colorScheme === 'dark'
      ? ['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0)']
      : ['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.6)', 'rgba(255, 255, 255, 0)'];

  return (
    <View style={[styles.container, { width, height, borderRadius }, style]}>
      {Platform.OS === 'ios' ? (
        <BlurView
          intensity={40}
          tint={colorScheme === 'dark' ? 'dark' : 'light'}
          style={styles.blur}
        >
          <View
            style={[
              styles.glassBackground,
              {
                backgroundColor:
                  colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
              },
            ]}
          />
        </BlurView>
      ) : (
        <View
          style={[
            styles.fallbackBackground,
            {
              backgroundColor:
                colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
            },
          ]}
        />
      )}

      {/* Shimmer overlay */}
      <Animated.View style={[styles.shimmerContainer, shimmerStyle]}>
        <LinearGradient
          colors={shimmerColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.shimmer}
        />
      </Animated.View>
    </View>
  );
}

// Card Skeleton
export function GlassCardSkeleton() {
  const theme = useTheme();

  return (
    <View style={[styles.cardSkeleton, { backgroundColor: theme.cardBackground }]}>
      <GlassSkeleton width="60%" height={24} borderRadius={12} style={{ marginBottom: 12 }} />
      <GlassSkeleton width="100%" height={16} style={{ marginBottom: 8 }} />
      <GlassSkeleton width="80%" height={16} style={{ marginBottom: 8 }} />
      <View style={styles.cardFooter}>
        <GlassSkeleton width={60} height={24} borderRadius={12} />
        <GlassSkeleton width={80} height={24} borderRadius={12} />
      </View>
    </View>
  );
}

// List Item Skeleton
export function GlassListItemSkeleton() {
  const theme = useTheme();

  return (
    <View style={[styles.listItem, { borderBottomColor: theme.border }]}>
      <GlassSkeleton width={40} height={40} borderRadius={20} style={{ marginRight: 12 }} />
      <View style={{ flex: 1 }}>
        <GlassSkeleton width="70%" height={16} style={{ marginBottom: 8 }} />
        <GlassSkeleton width="50%" height={14} />
      </View>
    </View>
  );
}

// Avatar Skeleton
export function GlassAvatarSkeleton({ size = 40 }: { size?: number }) {
  return <GlassSkeleton width={size} height={size} borderRadius={size / 2} />;
}

// Text Block Skeleton
export function GlassTextBlockSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <View>
      {Array.from({ length: lines }).map((_, index) => (
        <GlassSkeleton
          key={index}
          width={index === lines - 1 ? '70%' : '100%'}
          height={14}
          style={{ marginBottom: 8 }}
        />
      ))}
    </View>
  );
}

// Full Screen Skeleton
export function GlassFullScreenSkeleton() {
  const theme = useTheme();

  return (
    <View style={[styles.fullScreen, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.headerSkeleton}>
        <GlassAvatarSkeleton size={60} />
        <GlassSkeleton width="40%" height={24} style={{ marginTop: 12 }} />
      </View>

      {/* Content */}
      <View style={styles.contentSkeleton}>
        <GlassCardSkeleton />
        <GlassCardSkeleton />
        <GlassCardSkeleton />
      </View>
    </View>
  );
}

// Pulsing Glass Circle - for button states
export function PulsingGlassCircle({ size = 60 }: { size?: number }) {
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 800, easing: Easing.ease }),
        withTiming(1, { duration: 800, easing: Easing.ease })
      ),
      -1,
      false
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: interpolate(pulse.value, [1, 1.1], [0.6, 0.3]),
  }));

  return (
    <Animated.View style={pulseStyle}>
      <GlassSkeleton width={size} height={size} borderRadius={size / 2} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
  },
  blur: {
    ...StyleSheet.absoluteFillObject,
  },
  glassBackground: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  fallbackBackground: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  shimmerContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  shimmer: {
    width: 200,
    height: '100%',
  },
  cardSkeleton: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  cardFooter: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
  },
  fullScreen: {
    flex: 1,
  },
  headerSkeleton: {
    alignItems: 'center',
    paddingTop: Spacing['4xl'],
    paddingBottom: Spacing.xl,
  },
  contentSkeleton: {
    flex: 1,
    paddingTop: Spacing.lg,
  },
});
