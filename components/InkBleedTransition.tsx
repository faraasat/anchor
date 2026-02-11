// Phase 5: Ink-bleed Navigation Transition
// Fluid, drawing-like transitions between screens
import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useThemeEngine } from '@/contexts/ThemeEngineContext';

interface InkBleedTransitionProps {
  active: boolean;
  onComplete?: () => void;
}

export function InkBleedTransition({ active, onComplete }: InkBleedTransitionProps) {
  const { theme } = useThemeEngine();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (active) {
      progress.value = withSequence(
        withTiming(1, {
          duration: 600,
          easing: Easing.bezier(0.65, 0, 0.35, 1),
        }),
        withTiming(0, {
          duration: 300,
          easing: Easing.bezier(0.33, 1, 0.68, 1),
        }, (finished) => {
          if (finished && onComplete) {
            runOnJS(onComplete)();
          }
        })
      );
    }
  }, [active]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: progress.value,
      transform: [{ scale: 1 - progress.value * 0.05 }],
    };
  });

  if (!active) return null;

  return (
    <Animated.View style={[styles.container, animatedStyle]} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Ink bleed effect - expanding circle with feathered edges */}
        <Path
          d="M 50 50 m -40 0 a 40 40 0 1 0 80 0 a 40 40 0 1 0 -80 0"
          fill={theme.text}
          opacity={0.08}
          scale={progress.value}
        />
        <Path
          d="M 50 50 m -30 0 a 30 30 0 1 0 60 0 a 30 30 0 1 0 -60 0"
          fill={theme.text}
          opacity={0.12}
          scale={progress.value * 1.2}
        />
        <Path
          d="M 50 50 m -20 0 a 20 20 0 1 0 40 0 a 20 20 0 1 0 -40 0"
          fill={theme.text}
          opacity={0.18}
          scale={progress.value * 1.5}
        />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    backgroundColor: 'transparent',
  },
});
