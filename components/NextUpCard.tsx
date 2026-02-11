// Next Up Hero Card - Premium floating card for the next reminder
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useTheme, useColorScheme } from '@/hooks/useColorScheme';
import { Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { Reminder, TAG_COLORS } from '@/types/reminder';

interface NextUpCardProps {
  reminder: Reminder | null;
  onPress?: () => void;
  onComplete?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function NextUpCard({ reminder, onPress, onComplete }: NextUpCardProps) {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  if (!reminder) {
    return (
      <Animated.View
        entering={FadeInDown.duration(200).springify()}
        style={[styles.container, styles.emptyContainer, { backgroundColor: theme.surface }]}
      >
        <View style={styles.emptyContent}>
          <Ionicons name="checkmark-circle-outline" size={48} color={theme.success} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>All caught up!</Text>
          <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
            No upcoming reminders for now
          </Text>
        </View>
      </Animated.View>
    );
  }

  const tagColors = colorScheme === 'dark' ? TAG_COLORS[reminder.tag].dark : TAG_COLORS[reminder.tag];

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  return (
    <AnimatedPressable
      entering={FadeInDown.duration(200).springify()}
      style={[
        animatedStyle,
        styles.container,
        { backgroundColor: theme.nextUpBackground },
        Shadows.lg,
      ]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerLabel, { color: theme.nextUpAccent }]}>Next Up</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={theme.nextUpText} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.nextUpText }]} numberOfLines={2}>
          {reminder.title}
        </Text>
        <Text style={[styles.time, { color: theme.textMuted }]}>
          Due: {formatTime(reminder.dueTime)}
        </Text>
      </View>

      {/* Tag Badge */}
      <View style={styles.footer}>
        <View style={[styles.tag, { backgroundColor: tagColors.bg }]}>
          <Text style={[styles.tagText, { color: tagColors.text }]}>{reminder.tag}</Text>
        </View>
      </View>

      {/* Pagination Dots */}
      <View style={styles.pagination}>
        <View style={[styles.dot, styles.dotActive, { backgroundColor: theme.nextUpText }]} />
        <View style={[styles.dot, { backgroundColor: theme.textMuted }]} />
        <View style={[styles.dot, { backgroundColor: theme.textMuted }]} />
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['3xl'],
  },
  emptyContent: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  emptyTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.semibold,
    marginTop: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: Typography.size.sm,
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
  headerLabel: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  content: {
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    marginBottom: Spacing.xs,
    lineHeight: Typography.size.xl * Typography.lineHeight.tight,
  },
  time: {
    fontSize: Typography.size.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tag: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  tagText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semibold,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.md,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 16,
    borderRadius: 3,
  },
});
