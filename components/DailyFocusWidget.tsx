// Phase 6: Daily Focus Widget
// In-app widget showing current task with one-tap Voice Anchor access
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useThemeEngine } from '@/contexts/ThemeEngineContext';
import { Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { Reminder } from '@/types/reminder';
import { WidgetService } from '@/services/WidgetService';

interface DailyFocusWidgetProps {
  currentTask: Reminder | null;
  completedToday: number;
  totalToday: number;
  onVoiceAnchorPress?: () => void;
  onTaskPress?: () => void;
}

export function DailyFocusWidget({
  currentTask,
  completedToday,
  totalToday,
  onVoiceAnchorPress,
  onTaskPress,
}: DailyFocusWidgetProps) {
  const { theme, timeOfDay } = useThemeEngine();
  const [isPressed, setIsPressed] = useState(false);

  // Update widget data whenever props change
  useEffect(() => {
    WidgetService.updateDailyFocusWidget({
      currentTask,
      completedToday,
      totalToday,
      lastUpdated: Date.now(),
    });
  }, [currentTask, completedToday, totalToday]);

  const handleVoicePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onVoiceAnchorPress?.();
  };

  const handleTaskPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    onTaskPress?.();
  };

  // Time-of-day gradient colors
  const gradientColors: [string, string] =
    timeOfDay === 'dawn'
      ? ['#FFB366', '#FF8C42'] // Warm peach
      : timeOfDay === 'dusk'
        ? ['#A78BFA', '#7C3AED'] // Calming lavender
        : timeOfDay === 'night'
          ? ['#1A1A1A', '#2A2A2A'] // Deep ink
          : [theme.secondary, theme.accent]; // Default teal-amber

  const completionPercentage = totalToday > 0 ? (completedToday / totalToday) * 100 : 0;

  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      exiting={FadeOut.duration(200)}
      style={[styles.container, Shadows.lg]}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="bulb" size={20} color="#FFFFFF" />
            <Text style={styles.headerTitle}>Daily Focus</Text>
          </View>
          <Pressable
            style={styles.voiceButton}
            onPress={handleVoicePress}
            onPressIn={() => setIsPressed(true)}
            onPressOut={() => setIsPressed(false)}
            hitSlop={10}
          >
            <Ionicons
              name={isPressed ? 'mic' : 'mic-outline'}
              size={22}
              color="#FFFFFF"
            />
          </Pressable>
        </View>

        {/* Current Task */}
        {currentTask ? (
          <Pressable style={styles.taskContainer} onPress={handleTaskPress}>
            <View style={styles.taskContent}>
              <Text style={styles.taskLabel}>Next Up</Text>
              <Text style={styles.taskTitle} numberOfLines={2}>
                {currentTask.title}
              </Text>
              {currentTask.dueTime && (
                <View style={styles.taskMeta}>
                  <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.taskTime}>{currentTask.dueTime}</Text>
                </View>
              )}
            </View>
            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.6)" />
          </Pressable>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle" size={32} color="rgba(255,255,255,0.6)" />
            <Text style={styles.emptyText}>All caught up!</Text>
          </View>
        )}

        {/* Progress Bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Today's Progress</Text>
            <Text style={styles.progressStats}>
              {completedToday}/{totalToday} tasks
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressBar,
                { width: `${completionPercentage}%` },
              ]}
            />
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
    borderRadius: BorderRadius['2xl'],
    overflow: 'hidden',
  },
  gradient: {
    padding: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerTitle: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
    color: '#FFFFFF',
  },
  voiceButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  taskContent: {
    flex: 1,
    gap: Spacing.xs,
  },
  taskLabel: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.medium,
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: Typography.letterSpacing.wider,
  },
  taskTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.semibold,
    color: '#FFFFFF',
    lineHeight: Typography.size.lg * Typography.lineHeight.snug,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  taskTime: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
    color: 'rgba(255,255,255,0.8)',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  emptyText: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.medium,
    color: 'rgba(255,255,255,0.8)',
  },
  progressSection: {
    gap: Spacing.sm,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
    color: 'rgba(255,255,255,0.8)',
  },
  progressStats: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    color: '#FFFFFF',
  },
  progressTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.full,
  },
});
