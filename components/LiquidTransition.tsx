// Liquid Card Transitions - Seamless expansion animations
import React, { useEffect } from 'react';
import { StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { useWindowDimensions } from '@/hooks/useWindowDimensions';
import { Platform } from 'react-native';

interface LiquidCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  onExpand?: () => void;
  expanded?: boolean;
  style?: any;
}

export function LiquidCard({ children, onPress, onExpand, expanded = false, style }: LiquidCardProps) {
  const { width, height } = useWindowDimensions();
  const scale = useSharedValue(1);
  const borderRadius = useSharedValue(16);
  const cardWidth = useSharedValue(width - 32);
  const cardHeight = useSharedValue(120);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (expanded) {
      // Expand to full screen with liquid animation
      scale.value = withSpring(1, { damping: 15, stiffness: 100 });
      borderRadius.value = withTiming(0, { duration: 300 });
      cardWidth.value = withSpring(width, { damping: 20, stiffness: 100 });
      cardHeight.value = withSpring(height, { damping: 20, stiffness: 100 });
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      // Collapse back to card
      borderRadius.value = withTiming(16, { duration: 300 });
      cardWidth.value = withSpring(width - 32, { damping: 20, stiffness: 100 });
      cardHeight.value = withSpring(120, { damping: 20, stiffness: 100 });
    }
  }, [expanded]);

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Micro-interaction: brief scale
    scale.value = withSpring(0.98, { damping: 10 }, () => {
      scale.value = withSpring(1, { damping: 10 });
    });

    if (onPress) {
      onPress();
    }

    if (onExpand) {
      onExpand();
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    borderRadius: borderRadius.value,
    width: cardWidth.value,
    height: cardHeight.value,
    opacity: opacity.value,
  }));

  return (
    <Pressable onPress={handlePress} style={style}>
      <Animated.View style={[styles.card, animatedStyle]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

// Liquid Page Transition - For screen-to-screen navigation
interface LiquidPageTransitionProps {
  visible: boolean;
  children: React.ReactNode;
  onClose: () => void;
}

export function LiquidPageTransition({ visible, children, onClose }: LiquidPageTransitionProps) {
  const translateY = useSharedValue(height);
  const opacity = useSharedValue(0);
  const borderRadius = useSharedValue(24);

  useEffect(() => {
    if (visible) {
      // Slide up with liquid easing
      translateY.value = withSpring(0, {
        damping: 25,
        stiffness: 200,
        mass: 1,
      });
      opacity.value = withTiming(1, { duration: 200 });
      borderRadius.value = withTiming(0, { duration: 400 });

      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } else {
      // Slide down
      borderRadius.value = withTiming(24, { duration: 200 });
      translateY.value = withSpring(height, {
        damping: 25,
        stiffness: 200,
        mass: 1,
      });
      opacity.value = withTiming(0, { duration: 150 });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
    borderTopLeftRadius: borderRadius.value,
    borderTopRightRadius: borderRadius.value,
  }));

  if (!visible && translateY.value >= height) return null;

  return (
    <Animated.View style={[styles.pageContainer, animatedStyle]}>
      {children}
    </Animated.View>
  );
}

// Morphing Button - Button that morphs shape on interaction
interface MorphingButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  style?: any;
  color?: string;
}

export function MorphingButton({ children, onPress, style, color = '#3B82F6' }: MorphingButtonProps) {
  const scale = useSharedValue(1);
  const borderRadius = useSharedValue(12);
  const rotate = useSharedValue(0);

  const gesture = Gesture.Pan()
    .onBegin(() => {
      if (Platform.OS !== 'web') {
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
      }
      scale.value = withSpring(0.95, { damping: 10 });
      borderRadius.value = withSpring(20, { damping: 10 });
    })
    .onFinalize(() => {
      scale.value = withSpring(1, { damping: 10 });
      borderRadius.value = withSpring(12, { damping: 10 });
    });

  const tap = Gesture.Tap()
    .onBegin(() => {
      scale.value = withSpring(0.95, { damping: 10 });
      borderRadius.value = withSpring(20, { damping: 10 });
      rotate.value = withSpring(2, { damping: 10 });
    })
    .onFinalize(() => {
      scale.value = withSpring(1, { damping: 10 });
      borderRadius.value = withSpring(12, { damping: 10 });
      rotate.value = withSpring(0, { damping: 10 });
      if (Platform.OS !== 'web') {
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
      }
      runOnJS(onPress)();
    });

  const composed = Gesture.Race(gesture, tap);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
    borderRadius: borderRadius.value,
    backgroundColor: color,
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={[styles.morphingButton, animatedStyle, style]}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
}

// Blob Transition - Organic blob-like morph animation
interface BlobTransitionProps {
  visible: boolean;
  fromPosition: { x: number; y: number };
  children: React.ReactNode;
}

export function BlobTransition({ visible, fromPosition, children }: BlobTransitionProps) {
  const scale = useSharedValue(0);
  const translateX = useSharedValue(fromPosition.x);
  const translateY = useSharedValue(fromPosition.y);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, {
        damping: 15,
        stiffness: 100,
        mass: 1,
      });
      translateX.value = withSpring(0, { damping: 20 });
      translateY.value = withSpring(0, { damping: 20 });
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      scale.value = withSpring(0, { damping: 15 });
      opacity.value = withTiming(0, { duration: 150 });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  if (!visible && scale.value === 0) return null;

  return (
    <Animated.View style={[styles.blobContainer, animatedStyle]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  pageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  morphingButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blobContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
