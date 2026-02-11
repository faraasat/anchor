// Magnetic Button - Pulls toward touch with springy physics
import React from 'react';
import { StyleSheet, Dimensions, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface MagneticButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  size?: number;
  magneticStrength?: number; // 0-1, how much it pulls toward touch
  colors?: string[];
  style?: any;
}

export function MagneticButton({
  children,
  onPress,
  size = 64,
  magneticStrength = 0.3,
  colors = ['#3B82F6', '#8B5CF6'],
  style,
}: MagneticButtonProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const buttonX = useSharedValue(0);
  const buttonY = useSharedValue(0);

  const gesture = Gesture.Pan()
    .onBegin((event) => {
      if (Platform.OS !== 'web') {
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
      }

      // Calculate distance from center
      const dx = event.x - buttonX.value - size / 2;
      const dy = event.y - buttonY.value - size / 2;

      // Apply magnetic pull (scaled by strength)
      translateX.value = withSpring(dx * magneticStrength, {
        damping: 10,
        stiffness: 150,
      });
      translateY.value = withSpring(dy * magneticStrength, {
        damping: 10,
        stiffness: 150,
      });

      scale.value = withSpring(1.1, { damping: 10 });
    })
    .onUpdate((event) => {
      // Update magnetic pull based on finger position
      const dx = event.x - buttonX.value - size / 2;
      const dy = event.y - buttonY.value - size / 2;

      translateX.value = withSpring(dx * magneticStrength, {
        damping: 10,
        stiffness: 150,
      });
      translateY.value = withSpring(dy * magneticStrength, {
        damping: 10,
        stiffness: 150,
      });
    })
    .onFinalize(() => {
      // Spring back to center
      translateX.value = withSpring(0, { damping: 12, stiffness: 200 });
      translateY.value = withSpring(0, { damping: 12, stiffness: 200 });
      scale.value = withSpring(1, { damping: 12 });
    });

  const tap = Gesture.Tap()
    .onBegin(() => {
      scale.value = withSpring(0.9, { damping: 10 });
      if (Platform.OS !== 'web') {
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
      }
    })
    .onFinalize(() => {
      scale.value = withSpring(1, { damping: 10 });
      runOnJS(onPress)();
    });

  const composed = Gesture.Race(gesture, tap);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View
        style={[styles.container, { width: size, height: size }, animatedStyle, style]}
        onLayout={(event) => {
          buttonX.value = event.nativeEvent.layout.x;
          buttonY.value = event.nativeEvent.layout.y;
        }}
      >
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {children}
        </LinearGradient>
      </Animated.View>
    </GestureDetector>
  );
}

// Springy Scroll View - List with weighted, physical feel
interface SpringyScrollProps {
  children: React.ReactNode;
  onScroll?: (offset: number) => void;
}

export function SpringyScrollView({ children, onScroll }: SpringyScrollProps) {
  const scrollY = useSharedValue(0);
  const velocityY = useSharedValue(0);
  const lastScrollY = useSharedValue(0);

  const gesture = Gesture.Pan()
    .onUpdate((event) => {
      const delta = event.translationY - lastScrollY.value;
      scrollY.value += delta;
      lastScrollY.value = event.translationY;
      velocityY.value = event.velocityY;

      if (onScroll) {
        runOnJS(onScroll)(scrollY.value);
      }
    })
    .onEnd(() => {
      // Apply momentum with spring physics
      const momentumDistance = velocityY.value * 0.5;
      scrollY.value = withSpring(scrollY.value + momentumDistance, {
        damping: 20,
        stiffness: 90,
        mass: 1,
      });
      lastScrollY.value = 0;
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scrollY.value }],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={animatedStyle}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
}

// Elastic Button - Button with elastic bounce on press
interface ElasticButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  style?: any;
  backgroundColor?: string;
}

export function ElasticButton({
  children,
  onPress,
  style,
  backgroundColor = '#3B82F6',
}: ElasticButtonProps) {
  const scale = useSharedValue(1);
  const skewX = useSharedValue(0);

  const tap = Gesture.Tap()
    .onBegin(() => {
      if (Platform.OS !== 'web') {
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
      }

      // Elastic squash
      scale.value = withSpring(0.92, {
        damping: 5,
        stiffness: 300,
      });
      skewX.value = withSpring(-2, { damping: 10 });
    })
    .onFinalize(() => {
      // Elastic bounce back
      scale.value = withSpring(1, {
        damping: 8,
        stiffness: 200,
        overshootClamping: false,
      });
      skewX.value = withSpring(0, { damping: 10 });

      if (Platform.OS !== 'web') {
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
      }
      runOnJS(onPress)();
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { skewX: `${skewX.value}deg` },
    ],
  }));

  return (
    <GestureDetector gesture={tap}>
      <Animated.View style={[styles.elasticButton, { backgroundColor }, animatedStyle, style]}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
}

// Ripple Button - Button with physical ripple effect
interface RippleButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  style?: any;
  rippleColor?: string;
}

export function RippleButton({
  children,
  onPress,
  style,
  rippleColor = 'rgba(255, 255, 255, 0.3)',
}: RippleButtonProps) {
  const rippleScale = useSharedValue(0);
  const rippleOpacity = useSharedValue(0);

  const tap = Gesture.Tap()
    .onBegin(() => {
      rippleScale.value = 0;
      rippleOpacity.value = 1;

      if (Platform.OS !== 'web') {
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
      }

      // Expand ripple
      rippleScale.value = withSpring(2, {
        damping: 15,
        stiffness: 200,
      });
      rippleOpacity.value = withSpring(0, {
        damping: 15,
        stiffness: 200,
      });
    })
    .onFinalize(() => {
      runOnJS(onPress)();
    });

  const rippleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: rippleScale.value }],
    opacity: rippleOpacity.value,
  }));

  return (
    <GestureDetector gesture={tap}>
      <Animated.View style={[styles.rippleButton, style]}>
        <Animated.View
          style={[
            styles.ripple,
            { backgroundColor: rippleColor },
            rippleStyle,
          ]}
        />
        {children}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 32,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  elasticButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rippleButton: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ripple: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 9999,
  },
});
