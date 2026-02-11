// Phase 6: Proximity Widget
// Shows nearest physical Anchor with contextual actions
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeOut, useAnimatedStyle, withSpring, useSharedValue } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useThemeEngine } from '@/contexts/ThemeEngineContext';
import { Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { WidgetService } from '@/services/WidgetService';

interface AnchorPoint {
  name: string;
  type: 'wifi' | 'bluetooth' | 'nfc' | 'location';
  distance?: number; // in meters
  actionType: 'commute' | 'focus' | 'home' | 'office';
}

interface ProximityWidgetProps {
  nearestAnchor: AnchorPoint | null;
  relevantRemindersCount?: number;
  onAction?: (actionType: string) => void;
}

const ACTION_CONFIG = {
  commute: {
    icon: 'car' as const,
    label: 'Start Commute Mode',
    route: '/commute',
    color: '#F59E0B',
  },
  focus: {
    icon: 'timer' as const,
    label: 'Start Focus Session',
    route: '/focus',
    color: '#8B5CF6',
  },
  home: {
    icon: 'home' as const,
    label: 'Home Mode',
    route: '/(tabs)',
    color: '#10B981',
  },
  office: {
    icon: 'briefcase' as const,
    label: 'Office Mode',
    route: '/(tabs)/circles',
    color: '#3B82F6',
  },
};

export function ProximityWidget({
  nearestAnchor,
  relevantRemindersCount = 0,
  onAction,
}: ProximityWidgetProps) {
  const { theme, timeOfDay } = useThemeEngine();
  const router = useRouter();
  const pulseAnim = useSharedValue(1);

  // Update widget data
  useEffect(() => {
    WidgetService.updateProximityWidget({
      nearestAnchor,
      relevantReminders: [], // Would be passed from parent
      lastUpdated: Date.now(),
    });
  }, [nearestAnchor]);

  // Pulse animation for active anchor
  useEffect(() => {
    if (nearestAnchor) {
      pulseAnim.value = withSpring(1.05, {}, () => {
        pulseAnim.value = withSpring(1);
      });
    }
  }, [nearestAnchor, pulseAnim]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));

  const handleActionPress = () => {
    if (!nearestAnchor) return;

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const config = ACTION_CONFIG[nearestAnchor.actionType];
    if (config.route) {
      router.push(config.route);
    }
    onAction?.(nearestAnchor.actionType);
  };

  if (!nearestAnchor) {
    return null; // Hide widget when no anchor nearby
  }

  const config = ACTION_CONFIG[nearestAnchor.actionType];

  // Time-of-day aware gradient
  const gradientColors: [string, string] =
    timeOfDay === 'night'
      ? ['#1A1A1A', '#2A2A2A']
      : [theme.surface, theme.background];

  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      exiting={FadeOut.duration(200)}
      style={[styles.container, Shadows.lg, animatedStyle]}
    >
      <LinearGradient
        colors={gradientColors}
        style={[
          styles.gradient,
          {
            borderWidth: 2,
            borderColor: config.color + '40',
          },
        ]}
      >
        {/* Header with Anchor Info */}
        <View style={styles.header}>
          <View style={[styles.anchorIcon, { backgroundColor: config.color + '20' }]}>
            <Ionicons name="radio" size={20} color={config.color} />
          </View>
          <View style={styles.headerContent}>
            <Text style={[styles.headerLabel, { color: theme.textMuted }]}>
              Nearby Anchor
            </Text>
            <Text style={[styles.anchorName, { color: theme.text }]}>
              {nearestAnchor.name}
            </Text>
          </View>
          {nearestAnchor.distance !== undefined && (
            <View style={styles.distanceBadge}>
              <Text style={[styles.distanceText, { color: theme.textSecondary }]}>
                {nearestAnchor.distance < 1000
                  ? `${Math.round(nearestAnchor.distance)}m`
                  : `${(nearestAnchor.distance / 1000).toFixed(1)}km`}
              </Text>
            </View>
          )}
        </View>

        {/* Relevant Reminders Count */}
        {relevantRemindersCount > 0 && (
          <View style={[styles.remindersBadge, { backgroundColor: theme.accent + '20' }]}>
            <Ionicons name="notifications" size={14} color={theme.accent} />
            <Text style={[styles.remindersText, { color: theme.accent }]}>
              {relevantRemindersCount} relevant {relevantRemindersCount === 1 ? 'task' : 'tasks'}
            </Text>
          </View>
        )}

        {/* Action Button */}
        <Pressable
          style={[styles.actionButton, { backgroundColor: config.color }]}
          onPress={handleActionPress}
        >
          <Ionicons name={config.icon} size={20} color="#FFFFFF" />
          <Text style={styles.actionText}>{config.label}</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </Pressable>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  gradient: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  anchorIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    gap: 2,
  },
  headerLabel: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.medium,
    textTransform: 'uppercase',
    letterSpacing: Typography.letterSpacing.wider,
  },
  anchorName: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.semibold,
  },
  distanceBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  distanceText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semibold,
  },
  remindersBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    alignSelf: 'flex-start',
    marginBottom: Spacing.md,
  },
  remindersText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  actionText: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
    color: '#FFFFFF',
  },
});
