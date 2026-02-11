// Daily Briefing Card - AI-powered narrative summary
// Phase 2: Conversational intelligence display
import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useColorScheme';
import { Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import type { DailyBriefing, EveningReflection } from '@/services/DailyBriefingService';

interface DailyBriefingCardProps {
  briefing?: DailyBriefing;
  reflection?: EveningReflection;
  loading?: boolean;
}

export function DailyBriefingCard({ briefing, reflection, loading }: DailyBriefingCardProps) {
  const theme = useTheme();

  if (loading) {
    return (
      <Animated.View
        entering={FadeInDown.duration(300)}
        style={[
          styles.card,
          { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder },
          Shadows.md,
        ]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.secondary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Generating briefing...
          </Text>
        </View>
      </Animated.View>
    );
  }

  // Render morning briefing
  if (briefing) {
    return (
      <Animated.View
        entering={FadeInDown.duration(300)}
        style={[
          styles.card,
          { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder },
          Shadows.md,
        ]}
      >
        {/* AI Badge Header */}
        <View style={styles.header}>
          <LinearGradient
            colors={[theme.secondary, theme.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.aiBadge}
          >
            <Ionicons name="sparkles" size={16} color="#FFFFFF" />
          </LinearGradient>
          <Text style={[styles.headerTitle, { color: theme.text, fontFamily: Typography.family.serif }]}>
            Daily Briefing
          </Text>
          <View style={[styles.typeBadge, { backgroundColor: theme.secondary + '20' }]}>
            <Ionicons name="sunny-outline" size={14} color={theme.secondary} />
            <Text style={[styles.typeText, { color: theme.secondary }]}>Morning</Text>
          </View>
        </View>

        {/* Greeting */}
        <Text style={[styles.greeting, { color: theme.text, fontFamily: Typography.family.serif }]}>
          {briefing.greeting}
        </Text>

        {/* AI-generated narrative summary */}
        <Text style={[styles.summary, { color: theme.textSecondary, fontFamily: Typography.family.sans }]}>
          {briefing.summary}
        </Text>

        {/* Weather context */}
        {briefing.weatherContext && (
          <View style={[styles.contextChip, { backgroundColor: theme.surfaceElevated }]}>
            <Ionicons name="partly-sunny-outline" size={16} color={theme.accent} />
            <Text style={[styles.contextText, { color: theme.textSecondary }]}>
              {briefing.weatherContext}
            </Text>
          </View>
        )}

        {/* Key tasks highlight */}
        {briefing.keyTasks.length > 0 && (
          <View style={styles.keyTasks}>
            <Text style={[styles.keyTasksTitle, { color: theme.text }]}>
              Focus Today:
            </Text>
            {briefing.keyTasks.map((task, index) => (
              <View key={index} style={styles.keyTaskItem}>
                <View style={[styles.taskDot, { backgroundColor: theme.secondary }]} />
                <Text style={[styles.keyTaskText, { color: theme.textSecondary }]} numberOfLines={1}>
                  {task}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Wellness advice */}
        {briefing.wellnessAdvice && (
          <View style={[styles.adviceContainer, { backgroundColor: theme.info + '10', borderColor: theme.info + '30' }]}>
            <Ionicons name="fitness-outline" size={16} color={theme.info} />
            <Text style={[styles.adviceText, { color: theme.text }]}>
              {briefing.wellnessAdvice}
            </Text>
          </View>
        )}

        {/* Motivational close */}
        <Text style={[styles.motivational, { color: theme.secondary, fontFamily: Typography.family.serif }]}>
          {briefing.motivationalNote}
        </Text>
      </Animated.View>
    );
  }

  // Render evening reflection
  if (reflection) {
    return (
      <Animated.View
        entering={FadeInDown.duration(300)}
        style={[
          styles.card,
          { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder },
          Shadows.md,
        ]}
      >
        {/* AI Badge Header */}
        <View style={styles.header}>
          <LinearGradient
            colors={[theme.secondary, theme.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.aiBadge}
          >
            <Ionicons name="sparkles" size={16} color="#FFFFFF" />
          </LinearGradient>
          <Text style={[styles.headerTitle, { color: theme.text, fontFamily: Typography.family.serif }]}>
            Productivity Reflection
          </Text>
          <View style={[styles.typeBadge, { backgroundColor: theme.accent + '20' }]}>
            <Ionicons name="moon-outline" size={14} color={theme.accent} />
            <Text style={[styles.typeText, { color: theme.accent }]}>Evening</Text>
          </View>
        </View>

        {/* AI-generated reflection summary */}
        <Text style={[styles.summary, { color: theme.textSecondary, fontFamily: Typography.family.sans }]}>
          {reflection.summary}
        </Text>

        {/* Completion rate badge */}
        <View style={[styles.completionBadge, { backgroundColor: theme.success + '15' }]}>
          <View style={[styles.completionCircle, { borderColor: theme.success }]}>
            <Text style={[styles.completionPercent, { color: theme.success }]}>
              {reflection.completionRate}%
            </Text>
          </View>
          <Text style={[styles.completionLabel, { color: theme.textSecondary }]}>
            Completion Rate
          </Text>
        </View>

        {/* Achievements */}
        {reflection.achievements.length > 0 && (
          <View style={styles.achievements}>
            <Text style={[styles.achievementsTitle, { color: theme.text }]}>
              Today's Wins:
            </Text>
            {reflection.achievements.slice(0, 3).map((achievement, index) => (
              <View key={index} style={styles.achievementItem}>
                <Ionicons name="checkmark-circle" size={18} color={theme.success} />
                <Text style={[styles.achievementText, { color: theme.textSecondary }]} numberOfLines={1}>
                  {achievement}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Tomorrow priorities */}
        {reflection.tomorrowPriorities.length > 0 && (
          <View style={styles.tomorrowSection}>
            <Text style={[styles.tomorrowTitle, { color: theme.text }]}>
              Tomorrow's Priorities:
            </Text>
            {reflection.tomorrowPriorities.slice(0, 3).map((priority, index) => (
              <View key={index} style={styles.priorityItem}>
                <View style={[styles.priorityNumber, { backgroundColor: theme.accent + '20' }]}>
                  <Text style={[styles.priorityNumberText, { color: theme.accent }]}>
                    {index + 1}
                  </Text>
                </View>
                <Text style={[styles.priorityText, { color: theme.textSecondary }]} numberOfLines={1}>
                  {priority}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Encouragement */}
        <Text style={[styles.motivational, { color: theme.accent, fontFamily: Typography.family.serif }]}>
          {reflection.encouragement}
        </Text>
      </Animated.View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    gap: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  aiBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.semibold,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  typeText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semibold,
  },
  greeting: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    lineHeight: Typography.size.xl * 1.3,
  },
  summary: {
    fontSize: Typography.size.base,
    lineHeight: Typography.size.base * Typography.lineHeight.relaxed,
  },
  contextChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignSelf: 'flex-start',
  },
  contextText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
  },
  keyTasks: {
    gap: Spacing.sm,
  },
  keyTasksTitle: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    marginBottom: 4,
  },
  keyTaskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  taskDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  keyTaskText: {
    flex: 1,
    fontSize: Typography.size.sm,
  },
  adviceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  adviceText: {
    flex: 1,
    fontSize: Typography.size.sm,
    lineHeight: Typography.size.sm * 1.4,
  },
  motivational: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  completionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  completionCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completionPercent: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
  },
  completionLabel: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
  },
  achievements: {
    gap: Spacing.sm,
  },
  achievementsTitle: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    marginBottom: 4,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  achievementText: {
    flex: 1,
    fontSize: Typography.size.sm,
  },
  tomorrowSection: {
    gap: Spacing.sm,
  },
  tomorrowTitle: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    marginBottom: 4,
  },
  priorityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  priorityNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  priorityNumberText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
  },
  priorityText: {
    flex: 1,
    fontSize: Typography.size.sm,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.xl,
  },
  loadingText: {
    fontSize: Typography.size.sm,
  },
});
