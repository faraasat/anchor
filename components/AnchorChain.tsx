// Anchor Chain Component - Gamified habit visualization
import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useColorScheme';
import { Spacing, Typography } from '@/constants/theme';

interface AnchorChainProps {
  chainCount: number;
  longestChain: number;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

export function AnchorChain({
  chainCount,
  longestChain,
  size = 'medium',
  showLabel = true,
}: AnchorChainProps) {
  const theme = useTheme();
  const glowAnimation = useSharedValue(0);
  const pulseAnimation = useSharedValue(1);

  useEffect(() => {
    // Glow animation
    glowAnimation.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500 }),
        withTiming(0, { duration: 1500 })
      ),
      -1,
      false
    );

    // Pulse animation for active chains
    if (chainCount > 0) {
      pulseAnimation.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 800 }),
          withTiming(1, { duration: 800 })
        ),
        -1,
        false
      );
    }
  }, [chainCount]);

  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return { chainSize: 32, iconSize: 16, fontSize: 11 };
      case 'large':
        return { chainSize: 64, iconSize: 32, fontSize: 18 };
      default:
        return { chainSize: 48, iconSize: 24, fontSize: 14 };
    }
  };

  const config = getSizeConfig();

  const glowStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      glowAnimation.value,
      [0, 1],
      [0.3, 0.8],
      Extrapolate.CLAMP
    );

    return {
      opacity: chainCount > 0 ? opacity : 0,
    };
  });

  const pulseStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: chainCount > 0 ? pulseAnimation.value : 1 }],
    };
  });

  const getChainColor = (): [string, string] => {
    if (chainCount === 0) return ['#6B7280', '#4B5563'];
    if (chainCount < 3) return ['#F59E0B', '#D97706'];
    if (chainCount < 7) return ['#10B981', '#059669'];
    if (chainCount < 14) return ['#3B82F6', '#2563EB'];
    return ['#8B5CF6', '#7C3AED'];
  };

  const colors = getChainColor() as [string, string];

  return (
    <View style={styles.container}>
      <Animated.View style={[pulseStyle]}>
        <View style={[styles.chainWrapper, { width: config.chainSize, height: config.chainSize }]}>
          {/* Glow effect */}
          <Animated.View style={[styles.glow, glowStyle]}>
            <LinearGradient
              colors={[colors[0], colors[1], colors[0]] as const}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.glowGradient, { width: config.chainSize + 16, height: config.chainSize + 16 }]}
            />
          </Animated.View>

          {/* Chain icon */}
          <LinearGradient
            colors={colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.chain, { width: config.chainSize, height: config.chainSize, borderRadius: config.chainSize / 2 }]}
          >
            <Ionicons name="link" size={config.iconSize} color="#FFFFFF" />
          </LinearGradient>

          {/* Chain count badge */}
          {chainCount > 0 && (
            <View style={[styles.badge, { backgroundColor: theme.background }]}>
              <Text style={[styles.badgeText, { color: theme.text, fontSize: config.fontSize }]}>
                {chainCount}
              </Text>
            </View>
          )}
        </View>
      </Animated.View>

      {/* Label */}
      {showLabel && (
        <View style={styles.labelContainer}>
          <Text style={[styles.labelText, { color: theme.text }]}>
            {chainCount === 0 ? 'Start Chain' : `${chainCount} Day${chainCount !== 1 ? 's' : ''}`}
          </Text>
          {longestChain > chainCount && (
            <Text style={[styles.recordText, { color: theme.textSecondary }]}>
              Record: {longestChain}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  chainWrapper: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowGradient: {
    borderRadius: 100,
  },
  chain: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  badge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontWeight: Typography.weight.bold,
  },
  labelContainer: {
    alignItems: 'center',
    gap: 2,
  },
  labelText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
  },
  recordText: {
    fontSize: Typography.size.xs,
  },
});
