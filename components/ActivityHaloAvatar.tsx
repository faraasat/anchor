// Activity Halo Avatar - Shows member avatar with glowing halo
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
import type { ActivityHalo } from '@/types/phase8';

interface ActivityHaloAvatarProps {
  userId: string;
  avatarUrl?: string | null;
  initials?: string;
  halo?: ActivityHalo;
  size?: number;
  showHalo?: boolean;
}

export function ActivityHaloAvatar({
  userId,
  avatarUrl,
  initials = '?',
  halo,
  size = 48,
  showHalo = true,
}: ActivityHaloAvatarProps) {
  const glowScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.5);

  useEffect(() => {
    if (showHalo && halo && halo.glowIntensity > 0) {
      // Pulsing animation for active members
      glowScale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );

      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(halo.glowIntensity, {
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(halo.glowIntensity * 0.5, {
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
          })
        ),
        -1,
        false
      );
    }
  }, [halo, showHalo]);

  const haloStyle = useAnimatedStyle(() => {
    if (!showHalo || !halo) return { opacity: 0 };

    return {
      transform: [{ scale: glowScale.value }],
      opacity: glowOpacity.value,
    };
  });

  const haloColor = halo?.color || '#10B981';
  const recentlyActive = halo && halo.recentCompletionCount > 0;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Activity Halo - Glowing Ring */}
      {showHalo && recentlyActive && (
        <Animated.View style={[styles.halo, haloStyle]}>
          <View
            style={[
              styles.haloRing,
              {
                width: size + 16,
                height: size + 16,
                borderRadius: (size + 16) / 2,
                borderColor: haloColor,
                borderWidth: 3,
                shadowColor: haloColor,
              },
            ]}
          />
        </Animated.View>
      )}

      {/* Avatar */}
      <View
        style={[
          styles.avatar,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      >
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            style={[
              styles.avatarImage,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
              },
            ]}
          />
        ) : (
          <LinearGradient
            colors={[generateColor(userId, 0), generateColor(userId, 1)]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.avatarPlaceholder,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
              },
            ]}
          >
            <Text
              style={[
                styles.initialsText,
                { fontSize: size * 0.4 },
              ]}
            >
              {initials}
            </Text>
          </LinearGradient>
        )}
      </View>

      {/* Activity Badge - Small indicator for completion count */}
      {recentlyActive && halo && halo.recentCompletionCount > 0 && (
        <View
          style={[
            styles.badge,
            { backgroundColor: haloColor },
          ]}
        >
          <Text style={styles.badgeText}>
            {halo.recentCompletionCount > 9 ? '9+' : halo.recentCompletionCount}
          </Text>
        </View>
      )}
    </View>
  );
}

// Generate consistent color from userId
function generateColor(userId: string, variant: number): string {
  const colors = [
    ['#667eea', '#764ba2'],
    ['#f093fb', '#f5576c'],
    ['#4facfe', '#00f2fe'],
    ['#43e97b', '#38f9d7'],
    ['#fa709a', '#fee140'],
    ['#30cfd0', '#330867'],
  ];

  const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colorIndex = hash % colors.length;
  return colors[colorIndex][variant];
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  halo: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  haloRing: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 8,
  },
  avatar: {
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarImage: {
    resizeMode: 'cover',
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    color: '#FFFFFF',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});
