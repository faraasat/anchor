// Task Completion Animation - Lottie-style checkmark animation
import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  withSpring,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/useColorScheme';
import { Animation } from '@/constants/theme';

interface CompletionAnimationProps {
  visible: boolean;
  onComplete?: () => void;
}

// Particle component to avoid hook issues
function Particle({
  index,
  visible,
  successColor,
  accentColor
}: {
  index: number;
  visible: boolean;
  successColor: string;
  accentColor: string;
}) {
  const particleOpacity = useSharedValue(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const particleScale = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      const angle = (index / 8) * Math.PI * 2;
      const distance = 60 + (index * 5);

      particleOpacity.value = withDelay(
        Animation.normal,
        withSequence(
          withTiming(1, { duration: Animation.fast }),
          withDelay(Animation.slow, withTiming(0, { duration: Animation.normal }))
        )
      );

      translateX.value = withDelay(
        Animation.normal,
        withSpring(Math.cos(angle) * distance, { damping: 15, stiffness: 200 })
      );

      translateY.value = withDelay(
        Animation.normal,
        withSpring(Math.sin(angle) * distance, { damping: 15, stiffness: 200 })
      );

      particleScale.value = withDelay(
        Animation.normal,
        withSequence(
          withSpring(1, { damping: 8, stiffness: 400 }),
          withDelay(Animation.slow, withTiming(0, { duration: Animation.normal }))
        )
      );
    } else {
      particleOpacity.value = 0;
      translateX.value = 0;
      translateY.value = 0;
      particleScale.value = 0;
    }
  }, [visible, index, particleOpacity, translateX, translateY, particleScale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: particleOpacity.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: particleScale.value },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        { backgroundColor: index % 2 === 0 ? successColor : accentColor },
        animatedStyle,
      ]}
    />
  );
}

export function CompletionAnimation({ visible, onComplete }: CompletionAnimationProps) {
  const theme = useTheme();

  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);
  const checkScale = useSharedValue(0);
  const checkOpacity = useSharedValue(0);

  const particleIndices = useMemo(() => [0, 1, 2, 3, 4, 5, 6, 7], []);

  useEffect(() => {
    if (visible) {
      // Background fade in
      opacity.value = withTiming(1, { duration: Animation.fast });

      // Main circle scale
      scale.value = withSequence(
        withSpring(1.1, { damping: 8, stiffness: 400 }),
        withSpring(1, { damping: 12, stiffness: 400 })
      );

      // Checkmark animation
      checkScale.value = withDelay(
        Animation.fast,
        withSequence(
          withSpring(1.2, { damping: 8, stiffness: 400 }),
          withSpring(1, { damping: 12, stiffness: 400 })
        )
      );
      checkOpacity.value = withDelay(Animation.fast, withTiming(1, { duration: Animation.fast }));

      // Auto dismiss
      const dismissTimeout = setTimeout(() => {
        opacity.value = withTiming(0, { duration: Animation.normal }, (finished) => {
          if (finished && onComplete) {
            runOnJS(onComplete)();
          }
        });
        scale.value = withTiming(0.8, { duration: Animation.normal });
      }, 800);

      return () => clearTimeout(dismissTimeout);
    } else {
      // Reset all values
      opacity.value = 0;
      scale.value = 0.5;
      checkScale.value = 0;
      checkOpacity.value = 0;
    }
  }, [visible, opacity, scale, checkScale, checkOpacity, onComplete]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const checkmarkStyle = useAnimatedStyle(() => ({
    opacity: checkOpacity.value,
    transform: [{ scale: checkScale.value }],
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.overlay, containerStyle]} pointerEvents="none">
      <Animated.View style={[styles.circle, { backgroundColor: theme.success }, circleStyle]}>
        {/* Checkmark */}
        <Animated.View style={[styles.checkmark, checkmarkStyle]}>
          <View style={[styles.checkShort, { backgroundColor: '#FFFFFF' }]} />
          <View style={[styles.checkLong, { backgroundColor: '#FFFFFF' }]} />
        </Animated.View>
      </Animated.View>

      {/* Particles */}
      {particleIndices.map((index) => (
        <Particle
          key={index}
          index={index}
          visible={visible}
          successColor={theme.success}
          accentColor={theme.accent}
        />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 1000,
  },
  circle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    width: 50,
    height: 50,
    position: 'relative',
  },
  checkShort: {
    position: 'absolute',
    width: 4,
    height: 18,
    borderRadius: 2,
    transform: [{ rotate: '-45deg' }],
    left: 12,
    top: 22,
  },
  checkLong: {
    position: 'absolute',
    width: 4,
    height: 30,
    borderRadius: 2,
    transform: [{ rotate: '45deg' }],
    left: 26,
    top: 12,
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
