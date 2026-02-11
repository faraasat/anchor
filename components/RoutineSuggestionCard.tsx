// Routine Suggestion Card - AI-detected pattern suggestions
// Phase 2: Proactive routine stack recommendations
import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useColorScheme';
import { Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import type { RoutineSuggestion } from '@/services/RoutineDetectionService';

interface RoutineSuggestionCardProps {
  suggestion: RoutineSuggestion;
  onAccept: () => void;
  onDismiss: () => void;
}

export function RoutineSuggestionCard({
  suggestion,
  onAccept,
  onDismiss,
}: RoutineSuggestionCardProps) {
  const theme = useTheme();
  const { pattern, reason, impact } = suggestion;

  const handleAccept = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    onAccept();
  };

  const handleDismiss = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onDismiss();
  };

  const frequencyIcon = pattern.frequency === 'daily' ? 'sunny' :
                       pattern.frequency === 'weekly' ? 'calendar' : 'calendar-outline';

  return (
    <Animated.View
      entering={FadeInDown.duration(300)}
      style={[
        styles.card,
        { backgroundColor: theme.cardBackground, borderColor: theme.secondary + '40' },
        Shadows.md,
      ]}
    >
      {/* Header with AI Badge */}
      <View style={styles.header}>
        <LinearGradient
          colors={[theme.secondary, theme.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.aiBadge}
        >
          <Ionicons name="sparkles" size={18} color="#FFFFFF" />
        </LinearGradient>
        <View style={styles.headerText}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Routine Detected</Text>
          <View style={styles.confidenceBadge}>
            <View style={[styles.confidenceDot, { backgroundColor: theme.success }]} />
            <Text style={[styles.confidenceText, { color: theme.textSecondary }]}>
              {Math.round(pattern.confidence * 100)}% confidence
            </Text>
          </View>
        </View>
        <Pressable onPress={handleDismiss} hitSlop={10}>
          <Ionicons name="close" size={20} color={theme.textSecondary} />
        </Pressable>
      </View>

      {/* Pattern Name */}
      <Text style={[styles.patternName, { color: theme.text, fontFamily: Typography.family.serif }]}>
        {pattern.name}
      </Text>

      {/* Frequency Badge */}
      <View style={[styles.frequencyBadge, { backgroundColor: theme.surfaceElevated }]}>
        <Ionicons name={frequencyIcon} size={16} color={theme.accent} />
        <Text style={[styles.frequencyText, { color: theme.textSecondary }]}>
          {pattern.frequency.charAt(0).toUpperCase() + pattern.frequency.slice(1)}
        </Text>
        <View style={[styles.countBadge, { backgroundColor: theme.secondary + '20' }]}>
          <Text style={[styles.countText, { color: theme.secondary }]}>
            {pattern.detectedCount}x
          </Text>
        </View>
      </View>

      {/* Tasks in routine */}
      <View style={styles.tasksContainer}>
        <Text style={[styles.tasksTitle, { color: theme.textSecondary }]}>Tasks:</Text>
        {pattern.tasks.map((task, index) => (
          <View key={index} style={styles.taskItem}>
            <View style={[styles.taskOrder, { backgroundColor: theme.secondary + '15' }]}>
              <Text style={[styles.taskOrderText, { color: theme.secondary }]}>
                {task.order}
              </Text>
            </View>
            <Text style={[styles.taskTitle, { color: theme.text }]} numberOfLines={1}>
              {task.title}
            </Text>
            <Text style={[styles.taskTime, { color: theme.textMuted, fontFamily: Typography.family.mono }]}>
              {task.typicalTime}
            </Text>
          </View>
        ))}
      </View>

      {/* Reason */}
      <View style={[styles.insightBox, { backgroundColor: theme.info + '10', borderColor: theme.info + '30' }]}>
        <Ionicons name="information-circle" size={18} color={theme.info} />
        <Text style={[styles.insightText, { color: theme.text }]}>
          {reason}
        </Text>
      </View>

      {/* Impact */}
      <Text style={[styles.impact, { color: theme.textSecondary }]}>
        💡 {impact}
      </Text>

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable
          style={[styles.dismissButton, { backgroundColor: theme.surfaceElevated }]}
          onPress={handleDismiss}
        >
          <Text style={[styles.dismissButtonText, { color: theme.textSecondary }]}>
            Not Now
          </Text>
        </Pressable>

        <Pressable
          style={[styles.acceptButton, Shadows.sm]}
          onPress={handleAccept}
        >
          <LinearGradient
            colors={[theme.secondary, theme.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.acceptGradient}
          >
            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
            <Text style={styles.acceptButtonText}>Create Routine Stack</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 2,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
    gap: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  aiBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  headerTitle: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  confidenceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  confidenceText: {
    fontSize: Typography.size.xs,
  },
  patternName: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    lineHeight: Typography.size.xl * 1.3,
  },
  frequencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignSelf: 'flex-start',
  },
  frequencyText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
  },
  countBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginLeft: Spacing.xs,
  },
  countText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
  },
  tasksContainer: {
    gap: Spacing.sm,
  },
  tasksTitle: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semibold,
    textTransform: 'uppercase',
    letterSpacing: Typography.letterSpacing.wider,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  taskOrder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskOrderText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
  },
  taskTitle: {
    flex: 1,
    fontSize: Typography.size.sm,
  },
  taskTime: {
    fontSize: Typography.size.xs,
  },
  insightBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  insightText: {
    flex: 1,
    fontSize: Typography.size.sm,
    lineHeight: Typography.size.sm * 1.4,
  },
  impact: {
    fontSize: Typography.size.sm,
    lineHeight: Typography.size.sm * 1.4,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  dismissButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  dismissButtonText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
  },
  acceptButton: {
    flex: 2,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  acceptGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  acceptButtonText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    color: '#FFFFFF',
  },
});
