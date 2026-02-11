// Floating Action Button for Quick Add
import React from 'react';
import { StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
  Extrapolation,
  SharedValue,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/useColorScheme';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';

interface FloatingActionButtonProps {
  onPress: () => void;
  scrollY?: SharedValue<number>;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function FloatingActionButton({ onPress, scrollY }: FloatingActionButtonProps) {
  const theme = useTheme();
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  const handlePressIn = () => {
    scale.value = withSpring(0.9, { damping: 15, stiffness: 400 });
    rotation.value = withSpring(45, { damping: 12, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    rotation.value = withSpring(0, { damping: 12, stiffness: 300 });
  };

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => {
    // Hide FAB when scrolling down
    const translateY = scrollY
      ? interpolate(
          scrollY.value,
          [0, 100],
          [0, 100],
          Extrapolation.CLAMP
        )
      : 0;

    return {
      transform: [
        { scale: scale.value },
        { translateY },
      ],
    };
  });

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <AnimatedPressable
      style={[
        styles.fab,
        { backgroundColor: theme.primary },
        Shadows.lg,
        animatedStyle,
      ]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={iconStyle}>
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </Animated.View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: Spacing.xl,
    bottom: Spacing.xl,
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
