// Wellness Goal Card - Collaborative wellness tracking
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useColorScheme';
import { Spacing, Typography } from '@/constants/theme';
import type { Database } from '@/types/database';

type WellnessGoal = Database['public']['Tables']['circle_wellness_goals']['Row'];

interface WellnessGoalCardProps {
  goal: WellnessGoal;
  onPress?: (goal: WellnessGoal) => void;
  index?: number;
}

export function WellnessGoalCard({ goal, onPress, index = 0 }: WellnessGoalCardProps) {
  const theme = useTheme();

  const progress = Math.min((Number(goal.current_value) / Number(goal.target_value)) * 100, 100);
  const participantCount = Array.isArray(goal.participants) ? goal.participants.length : 0;

  const gradientColors = getGradientByPeriod(goal.period);

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).springify()}
      layout={Layout.springify()}
    >
      <Pressable
        style={[styles.card, { backgroundColor: theme.surface }]}
        onPress={() => onPress?.(goal)}
        android_ripple={{ color: theme.secondary + '20' }}
      >
        {/* Icon */}
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.iconContainer}
        >
          <Text style={styles.icon}>{goal.icon || '🎯'}</Text>
        </LinearGradient>

        {/* Content */}
        <View style={styles.content}>
          <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
            {goal.name}
          </Text>
          {goal.description && (
            <Text style={[styles.description, { color: theme.textSecondary }]} numberOfLines={1}>
              {goal.description}
            </Text>
          )}

          {/* Progress */}
          <View style={styles.progressSection}>
            <View style={styles.progressBar}>
              <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
                <LinearGradient
                  colors={gradientColors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.progressFill, { width: `${progress}%` }]}
                />
              </View>
              <Text style={[styles.progressText, { color: theme.textSecondary }]}>
                {Number(goal.current_value).toLocaleString()} / {Number(goal.target_value).toLocaleString()}{' '}
                {goal.unit}
              </Text>
            </View>
          </View>

          {/* Meta */}
          <View style={styles.meta}>
            <View style={styles.metaItem}>
              <Ionicons name="people" size={14} color={theme.textSecondary} />
              <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                {participantCount} {participantCount === 1 ? 'member' : 'members'}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="calendar" size={14} color={theme.textSecondary} />
              <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                {capitalizeFirst(goal.period)}
              </Text>
            </View>
          </View>
        </View>

        {/* Progress Badge */}
        <View style={[styles.progressBadge, { backgroundColor: theme.background }]}>
          <Text style={[styles.progressPercent, { color: theme.secondary }]}>
            {Math.round(progress)}%
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function getGradientByPeriod(period: string): [string, string] {
  switch (period) {
    case 'daily':
      return ['#667eea', '#764ba2'];
    case 'weekly':
      return ['#4facfe', '#00f2fe'];
    case 'monthly':
      return ['#43e97b', '#38f9d7'];
    default:
      return ['#f093fb', '#f5576c'];
  }
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: Spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  icon: {
    fontSize: 28,
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
    marginBottom: 2,
  },
  description: {
    fontSize: Typography.size.xs,
    marginBottom: Spacing.sm,
  },
  progressSection: {
    marginBottom: Spacing.xs,
  },
  progressBar: {
    gap: Spacing.xs,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  progressText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.medium,
  },
  meta: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: Typography.size.xs,
  },
  progressBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
    height: 28,
    justifyContent: 'center',
  },
  progressPercent: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
  },
});
