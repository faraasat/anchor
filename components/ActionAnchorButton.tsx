// Action Anchor Button - FAB with pinking shear (zigzag) edges
// Phase 2: Enhanced premium design resembling a physical paper tab
import React from 'react';
import { StyleSheet, Pressable, Platform, View } from 'react-native';
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
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { useTheme } from '@/hooks/useColorScheme';
import { Spacing, ZigzagEdge, Shadows } from '@/constants/theme';

interface ActionAnchorButtonProps {
  onPress: () => void;
  onLongPress?: () => void;  // Long-press for Voice Anchor
  scrollY?: SharedValue<number>;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Generate zigzag path for pinking shear effect
function generateZigzagPath(size: number, zigzagSize: number, points: number): string {
  const radius = size / 2;
  const centerX = size / 2;
  const centerY = size / 2;
  const angleStep = (2 * Math.PI) / points;

  let path = '';

  for (let i = 0; i <= points; i++) {
    const angle = i * angleStep - Math.PI / 2;
    const isOuter = i % 2 === 0;
    const r = isOuter ? radius : radius - zigzagSize;

    const x = centerX + r * Math.cos(angle);
    const y = centerY + r * Math.sin(angle);

    if (i === 0) {
      path += `M ${x} ${y}`;
    } else {
      path += ` L ${x} ${y}`;
    }
  }

  path += ' Z';
  return path;
}

export function ActionAnchorButton({ onPress, onLongPress, scrollY }: ActionAnchorButtonProps) {
  const theme = useTheme();
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  const zigzagPath = generateZigzagPath(
    ZigzagEdge.size,
    ZigzagEdge.zigzagSize,
    ZigzagEdge.points
  );

  const handlePressIn = () => {
    scale.value = withSpring(0.9, { damping: 15, stiffness: 400 });
    rotation.value = withSpring(45, { damping: 12, stiffness: 300 });

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
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

  const handleLongPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    onLongPress?.();
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
      style={[styles.container, animatedStyle]}
      onPress={handlePress}
      onLongPress={handleLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      {/* Zigzag edge shape */}
      <View style={[styles.fabShape, Shadows.lg]}>
        <Svg width={ZigzagEdge.size} height={ZigzagEdge.size} viewBox={`0 0 ${ZigzagEdge.size} ${ZigzagEdge.size}`}>
          <Defs>
            <SvgGradient id="fabGradient" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={theme.secondary} stopOpacity="1" />
              <Stop offset="1" stopColor={theme.accent} stopOpacity="1" />
            </SvgGradient>
          </Defs>
          <Path d={zigzagPath} fill="url(#fabGradient)" />
        </Svg>

        {/* Icon */}
        <View style={styles.iconContainer}>
          <Animated.View style={iconStyle}>
            <Ionicons name="add" size={28} color="#FFFFFF" />
          </Animated.View>
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: Spacing.xl,
    bottom: 90,  // Positioned above tab bar
    width: ZigzagEdge.size,
    height: ZigzagEdge.size,
  },
  fabShape: {
    width: ZigzagEdge.size,
    height: ZigzagEdge.size,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    position: 'absolute',
    width: ZigzagEdge.size,
    height: ZigzagEdge.size,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
