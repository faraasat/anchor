// Phase 5: Social Pulses
// Ambient activity indicators for Circle members
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeEngine } from '@/contexts/ThemeEngineContext';
import { Spacing } from '@/constants/theme';

interface SocialPulseProps {
  name: string;
  avatarUrl?: string;
  isActive?: boolean;
  isFocusing?: boolean;
  size?: number;
}

export function SocialPulse({
  name,
  avatarUrl,
  isActive = false,
  isFocusing = false,
  size = 48,
}: SocialPulseProps) {
  const { theme } = useThemeEngine();
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.4);

  useEffect(() => {
    if (isActive || isFocusing) {
      // Breathing pulse animation
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.15, {
            duration: 1200,
            easing: Easing.bezier(0.4, 0, 0.6, 1),
          }),
          withTiming(1, {
            duration: 1200,
            easing: Easing.bezier(0.4, 0, 0.6, 1),
          })
        ),
        -1,
        false
      );

      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6, {
            duration: 1200,
            easing: Easing.bezier(0.4, 0, 0.6, 1),
          }),
          withTiming(0.3, {
            duration: 1200,
            easing: Easing.bezier(0.4, 0, 0.6, 1),
          })
        ),
        -1,
        false
      );
    } else {
      pulseScale.value = withTiming(1, { duration: 300 });
      pulseOpacity.value = withTiming(0, { duration: 300 });
    }
  }, [isActive, isFocusing]);

  const pulseStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulseScale.value }],
      opacity: pulseOpacity.value,
    };
  });

  const glowColor = isFocusing
    ? theme.secondary
    : isActive
    ? theme.accent
    : theme.border;

  return (
    <View style={styles.container}>
      {/* Pulsing ring */}
      {(isActive || isFocusing) && (
        <Animated.View
          style={[
            styles.pulseRing,
            {
              width: size + 16,
              height: size + 16,
              borderRadius: (size + 16) / 2,
              borderColor: glowColor,
            },
            pulseStyle,
          ]}
        />
      )}

      {/* Avatar with glow */}
      <View
        style={[
          styles.avatarContainer,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      >
        {(isActive || isFocusing) && (
          <LinearGradient
            colors={[glowColor + '40', glowColor + '00']}
            start={{ x: 0.5, y: 0.5 }}
            end={{ x: 1, y: 1 }}
            style={[
              StyleSheet.absoluteFill,
              {
                borderRadius: size / 2,
              },
            ]}
          />
        )}

        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            style={[
              styles.avatar,
              {
                width: size - 4,
                height: size - 4,
                borderRadius: (size - 4) / 2,
              },
            ]}
          />
        ) : (
          <View
            style={[
              styles.avatarPlaceholder,
              {
                width: size - 4,
                height: size - 4,
                borderRadius: (size - 4) / 2,
                backgroundColor: theme.secondary,
              },
            ]}
          >
            <Text style={[styles.avatarInitial, { fontSize: size / 2.5 }]}>
              {name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      {/* Status indicator */}
      {isFocusing && (
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: theme.secondary,
              borderColor: theme.background,
            },
          ]}
        >
          <View style={styles.focusPulse} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseRing: {
    position: 'absolute',
    borderWidth: 2,
  },
  avatarContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  statusBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  focusPulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
});
