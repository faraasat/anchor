// Lottie Success Animations - Blooming Flower & Celebration
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import LottieView from 'lottie-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { useWindowDimensions } from '@/hooks/useWindowDimensions';

interface LottieSuccessProps {
  visible: boolean;
  type: 'task-complete' | 'stack-complete' | 'goal-reached';
  onComplete: () => void;
}

// Lottie animation URLs (using free Lottie Files)
const ANIMATION_URLS = {
  'task-complete': 'https://lottie.host/c9f6a4f8-5a1a-4f1e-9f3a-3c8b9d0e6f2a/kL9X2c3d4e.json', // Blooming flower
  'stack-complete': 'https://lottie.host/b5d4c3f2-1a0b-4c5d-8e9f-7a6b5c4d3e2f/mN8Y1z2x3w.json', // Celebration burst
  'goal-reached': 'https://lottie.host/a1b2c3d4-5e6f-7g8h-9i0j-1k2l3m4n5o6p/pQ7R8s9t0u.json', // Victory stars
};

export function LottieSuccessAnimation({ visible, type, onComplete }: LottieSuccessProps) {
  const animationRef = useRef<LottieView>(null);
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Play haptic feedback
      if (Platform.OS !== 'web') {
        if (type === 'stack-complete') {
          // Strong haptic for stack completion
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setTimeout(() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          }, 200);
        } else if (type === 'goal-reached') {
          // Triple tap for goal reached
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setTimeout(() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }, 100);
          setTimeout(() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          }, 300);
        } else {
          // Light haptic for task complete
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }

      // Animate entrance
      scale.value = withSpring(1, {
        damping: 10,
        stiffness: 100,
      });
      opacity.value = withTiming(1, { duration: 200 });

      // Play Lottie animation
      animationRef.current?.play();

      // Auto-dismiss after animation
      const timeout = setTimeout(() => {
        handleDismiss();
      }, type === 'stack-complete' ? 3000 : 2000);

      return () => clearTimeout(timeout);
    } else {
      scale.value = 0;
      opacity.value = 0;
    }
  }, [visible, type]);

  const handleDismiss = () => {
    scale.value = withSequence(
      withSpring(1.1, { damping: 10 }),
      withTiming(0, { duration: 200 }, (finished) => {
        if (finished) {
          runOnJS(onComplete)();
        }
      })
    );
    opacity.value = withTiming(0, { duration: 200 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none">
      <View style={styles.overlay}>
        <Animated.View style={[styles.animationContainer, animatedStyle]}>
          {/* Fallback gradient burst for web/when Lottie fails */}
          <View style={styles.fallbackAnimation}>
            <View
              style={[
                styles.fallbackCircle,
                {
                  backgroundColor:
                    type === 'stack-complete'
                      ? '#10B981'
                      : type === 'goal-reached'
                      ? '#F59E0B'
                      : '#3B82F6',
                },
              ]}
            />
          </View>

          {/* Lottie Animation - using placeholder since we can't load external URLs easily */}
          {/* In production, download these animations and include them in assets */}
          <LottieView
            ref={animationRef}
            source={
              type === 'task-complete'
                ? require('@/assets/lottie/flower-bloom.json')
                : type === 'stack-complete'
                ? require('@/assets/lottie/celebration.json')
                : require('@/assets/lottie/victory.json')
            }
            style={styles.lottie}
            autoPlay={false}
            loop={false}
          />
        </Animated.View>
      </View>
    </Modal>
  );
}

// Inline Lottie animation for smaller contexts (e.g., in cards)
interface InlineLottieProps {
  type: 'sparkle' | 'checkmark' | 'star';
  size?: number;
  loop?: boolean;
}

export function InlineLottieAnimation({ type, size = 60, loop = true }: InlineLottieProps) {
  const animationRef = useRef<LottieView>(null);

  useEffect(() => {
    animationRef.current?.play();
  }, []);

  return (
    <View style={{ width: size, height: size }}>
      <LottieView
        ref={animationRef}
        source={
          type === 'sparkle'
            ? require('@/assets/lottie/sparkle.json')
            : type === 'checkmark'
            ? require('@/assets/lottie/checkmark.json')
            : require('@/assets/lottie/star.json')
        }
        style={{ width: size, height: size }}
        autoPlay
        loop={loop}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  animationContainer: {
    width: width * 0.6,
    height: width * 0.6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lottie: {
    width: '100%',
    height: '100%',
  },
  fallbackAnimation: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    opacity: 0.3,
  },
});
